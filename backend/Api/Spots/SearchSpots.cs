using Api.Common;
using Api.Common.Infrastructure;
using Domain.Parkings;
using Domain.ParkingSpots;
using FastEndpoints;
using JetBrains.Annotations;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Spots;

[PublicAPI]
public sealed record SearchSpotsRequest
{
    [FromQuery]
    public required DateTimeOffset From { get; init; }

    [FromQuery]
    public required TimeSpan MinDuration { get; init; }
}

[PublicAPI]
public sealed record SearchSpotsResponse
{
    public required AvailableSpot[] AvailableSpots { get; init; }

    [PublicAPI]
    public sealed record AvailableSpot
    {
        public required Guid ParkingLotId { get; init; }
        public required string UserId { get; init; }
        public required DateTimeOffset From { get; init; }
        public required DateTimeOffset Until { get; init; }
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
        var until = req.From + req.MinDuration;

        var availableSpots = await (
                from myParking in from parkingLot in dbContext.Set<ParkingLot>()
                    where parkingLot.UserIdentity == currentUser.Identity
                    join parking in dbContext.Set<Parking>() on parkingLot.ParkingId equals parking.Id
                    select parking
                join parkingLot in dbContext.Set<ParkingLot>() on myParking.Id equals parkingLot.ParkingId
                where parkingLot.UserIdentity != currentUser.Identity
                where parkingLot.Availabilities.Any(
                    availability => availability.From <= req.From && availability.To >= until)
                select parkingLot.Availabilities
                    .Where(availability => availability.From <= req.From && availability.To >= until)
                    .Select(
                        availability => new SearchSpotsResponse.AvailableSpot
                        {
                            ParkingLotId = parkingLot.Id,
                            UserId = parkingLot.UserIdentity,
                            From = availability.From,
                            Until = availability.To
                        })
                    .First())
            .IgnoreQueryFilters()
            .ToArrayAsync(ct);

        await SendOkAsync(
            new SearchSpotsResponse
            {
                AvailableSpots = availableSpots
            },
            ct);
    }
}
