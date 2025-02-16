using Api.Common;
using Api.Common.Infrastructure;
using Domain.ParkingSpots;
using Domain.Users;
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
        public required SpotOwner Owner { get; init; }

        [PublicAPI]
        public sealed record SpotOwner
        {
            public required string DisplayName { get; init; }
            public required decimal Rating { get; init; }
        }
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

        var parkingSpot = await dbContext
            .Set<ParkingSpot>()
            .FirstOrDefaultAsync(parkingLot => parkingLot.OwnerId == currentUser.Identity, ct);

        if (parkingSpot is null)
        {
            ThrowError("You must have a parking spot to search for available spots");
            return;
        }

        var availableSpots = await (
                from parkingLot in dbContext.Set<ParkingSpot>()
                where parkingLot.OwnerId != currentUser.Identity
                where parkingLot.ParkingId == parkingSpot.ParkingId
                join owner in dbContext.Set<User>() on parkingLot.OwnerId equals owner.Identity
                select parkingLot.Availabilities
                    .Where(availability => availability.From <= req.From && availability.To >= req.To)
                    .Where(
                        availability => !parkingLot.Bookings
                            .Any(booking => booking.From <= req.To && req.From <= booking.To))
                    .Select(
                        availability => new SearchSpotsResponse.AvailableSpot
                        {
                            Owner = new SearchSpotsResponse.AvailableSpot.SpotOwner
                            {
                                DisplayName = owner.DisplayName,
                                Rating = owner.Rating.Rating
                            },
                            ParkingLotId = parkingLot.Id
                        }))
            .SelectMany(availabilities => availabilities)
            .AsNoTracking()
            .ToArrayAsync(ct);

        await SendOkAsync(
            new SearchSpotsResponse
            {
                AvailableSpots = availableSpots
            },
            ct);
    }
}
