using Api.Common;
using Api.Common.Infrastructure;
using Domain.Parkings;
using Domain.ParkingSpots;
using FastEndpoints;
using FluentValidation;
using JetBrains.Annotations;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Bookings;

[PublicAPI]
public sealed record SearchSpotsRequest
{
    [FromQuery]
    public required DateTimeOffset From { get; init; }

    [FromQuery]
    public required DateTimeOffset To { get; init; }
}

[PublicAPI]
public sealed record SearchSpotsResponse
{
    public required AvailableSpot[] AvailableSpots { get; init; }

    [PublicAPI]
    public sealed record AvailableSpot
    {
        public required Guid ParkingLotId { get; init; }
        public required DateTimeOffset From { get; init; }
        public required DateTimeOffset Until { get; init; }
    }
}

internal sealed class SearchSpotsValidator : Validator<SearchSpotsRequest>
{
    public SearchSpotsValidator()
    {
        RuleFor(x => x.To).GreaterThan(x => x.From);
    }
}

internal sealed class SearchSpots(AppDbContext dbContext) : Endpoint<SearchSpotsRequest, SearchSpotsResponse>
{
    public override void Configure()
    {
        Get("/spots");
    }

    public override async Task HandleAsync(SearchSpotsRequest req, CancellationToken ct)
    {
        var currentUser = HttpContext.ToCurrentUser();

        var availableSpots = await (
                from myParking in from parkingLot in dbContext.Set<ParkingSpot>()
                    where parkingLot.OwnerId == currentUser.Identity
                    join parking in dbContext.Set<Parking>() on parkingLot.ParkingId equals parking.Id
                    select parking
                join parkingLot in dbContext.Set<ParkingSpot>() on myParking.Id equals parkingLot.ParkingId
                where parkingLot.OwnerId != currentUser.Identity
                select parkingLot.Availabilities
                    .Where(availability => availability.From <= req.From && availability.To >= req.To)
                    .Where(
                        availability => !parkingLot.Bookings
                            .Any(booking => booking.From <= req.To && req.From <= booking.To))
                    .Select(
                        availability => new SearchSpotsResponse.AvailableSpot
                        {
                            ParkingLotId = parkingLot.Id,
                            // we don't show that the spot was available in the past
                            From = req.From,
                            Until = req.To
                        }))
            .SelectMany(availabilities => availabilities)
            .ToArrayAsync(ct);

        await SendOkAsync(
            new SearchSpotsResponse
            {
                AvailableSpots = availableSpots
            },
            ct);
    }
}
