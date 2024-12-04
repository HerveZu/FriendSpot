using Api.Common;
using Api.Common.Infrastructure;
using Domain.ParkingSpots;
using FastEndpoints;
using JetBrains.Annotations;
using Microsoft.EntityFrameworkCore;

namespace Api.Bookings;

[PublicAPI]
public sealed record GetMyAvailabilitiesResponse
{
    public required TimeSpan TotalDuration { get; init; }
    public required Availability[] Availabilities { get; init; }

    [PublicAPI]
    public sealed record Availability
    {
        public required DateTimeOffset From { get; init; }
        public required DateTimeOffset To { get; init; }
        public required TimeSpan Duration { get; init; }
    }
}

internal sealed class GetMyAvailabilities(AppDbContext dbContext) : EndpointWithoutRequest<GetMyAvailabilitiesResponse>
{
    public override void Configure()
    {
        Get("/spots/availabilities");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var currentUser = HttpContext.ToCurrentUser();
        var now = DateTimeOffset.UtcNow;

        var availabilities = await dbContext
            .Set<ParkingSpot>()
            .Where(parkingSpot => parkingSpot.OwnerId == currentUser.Identity)
            .SelectMany(parkingSpot => parkingSpot.Availabilities)
            .Where(availability => availability.To >= now)
            .OrderBy(availability => availability.From)
            .Select(
                availability => new GetMyAvailabilitiesResponse.Availability
                {
                    From = availability.From,
                    To = availability.To,
                    Duration = availability.Duration
                })
            .ToArrayAsync(ct);

        var totalDuration = new TimeSpan(availabilities.Sum(availability => availability.Duration.Ticks));

        await SendOkAsync(
            new GetMyAvailabilitiesResponse
            {
                TotalDuration = totalDuration,
                Availabilities = availabilities
            },
            ct);
    }
}
