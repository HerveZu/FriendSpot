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
public sealed record GetSuggestedSpotsRequest
{
    [FromQuery]
    public required DateTimeOffset From { get; init; }

    [FromQuery]
    public required DateTimeOffset To { get; init; }
}

[PublicAPI]
public sealed record GetSuggestedSpotsResponse
{
    public required SpotSuggestion[] Suggestions { get; init; }

    [PublicAPI]
    public sealed record SpotSuggestion
    {
        public required Guid ParkingLotId { get; init; }
        public required SpotOwner Owner { get; init; }
        public required DateTimeOffset From { get; init; }
        public required DateTimeOffset To { get; init; }
        public TimeSpan Duration => To - From;

        [PublicAPI]
        public sealed record SpotOwner
        {
            public required string DisplayName { get; init; }
            public required string? PictureUrl { get; init; }
            public required decimal Rating { get; init; }
        }
    }
}

internal sealed class GetSuggestedSpotsValidator : Validator<GetSuggestedSpotsRequest>
{
    public GetSuggestedSpotsValidator()
    {
        RuleFor(x => x.To).GreaterThan(x => x.From);
    }
}

internal sealed class GetSuggestedSpots(AppDbContext dbContext)
    : Endpoint<GetSuggestedSpotsRequest, GetSuggestedSpotsResponse>
{
    public override void Configure()
    {
        Get("/spots/suggested");
    }

    public override async Task HandleAsync(GetSuggestedSpotsRequest req, CancellationToken ct)
    {
        var currentUser = HttpContext.ToCurrentUser();

        var parkingSpot = await dbContext
            .Set<ParkingSpot>()
            .FirstOrDefaultAsync(parkingLot => parkingLot.OwnerId == currentUser.Identity, ct);

        if (parkingSpot is null)
        {
            ThrowError("You must have a spot to get suggested spots");
            return;
        }

        var availabilities = await (
                from parkingLot in dbContext.Set<ParkingSpot>()
                where !parkingLot.Disabled
                where parkingLot.OwnerId != currentUser.Identity
                where parkingLot.ParkingId == parkingSpot.ParkingId
                join owner in dbContext.Set<User>() on parkingLot.OwnerId equals owner.Identity
                select parkingLot.Availabilities
                    .Where(availability => req.From <= availability.To && availability.To >= req.To)
                    .Select(
                        availability => new
                        {
                            Owner = new GetSuggestedSpotsResponse.SpotSuggestion.SpotOwner
                            {
                                DisplayName = owner.DisplayName,
                                PictureUrl = owner.PictureUrl,
                                Rating = owner.Rating.Rating
                            },
                            OrderedBookings = parkingLot.Bookings
                                .Where(booking => booking.From <= availability.To && availability.From <= booking.To)
                                .OrderBy(booking => booking.From)
                                .ToArray(),
                            ParkingLotId = parkingLot.Id,
                            Availability = availability
                        }))
            .SelectMany(availabilities => availabilities)
            .AsNoTracking()
            .ToArrayAsync(ct);

        var suggestions = availabilities
            .SelectMany(
                x => x.Availability.Split(x.OrderedBookings)
                    .Select(
                        slice => new GetSuggestedSpotsResponse.SpotSuggestion
                        {
                            From = slice.From,
                            To = slice.To,
                            Owner = x.Owner,
                            ParkingLotId = x.ParkingLotId
                        }))
            .Where(suggestion => suggestion.To >= req.From && suggestion.From <= req.To)
            .Where(suggestion => suggestion.To - new[] { req.From, suggestion.From }.Max() > TimeSpan.FromHours(1))
            .OrderByDescending(suggestion => suggestion.Owner.Rating)
            .ToArray();

        await SendOkAsync(
            new GetSuggestedSpotsResponse
            {
                Suggestions = suggestions
            },
            ct);
    }
}
