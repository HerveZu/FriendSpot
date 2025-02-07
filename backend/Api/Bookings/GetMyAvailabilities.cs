using Api.Common;
using Api.Common.Infrastructure;
using Domain.ParkingSpots;
using FastEndpoints;
using JetBrains.Annotations;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Bookings;

[PublicAPI]
public sealed record GetMyAvailabilitiesRequest
{
    [FromQuery]
    public required DateTimeOffset From { get; init; }

    [FromQuery]
    public DateTimeOffset? To { get; init; }
}

[PublicAPI]
public sealed record GetMyAvailabilitiesResponse
{
    public required TimeSpan TotalDuration { get; init; }
    public required Availability[] Availabilities { get; init; }

    [PublicAPI]
    public sealed record Availability
    {
        public required Guid Id { get; init; }
        public required DateTimeOffset From { get; init; }
        public required DateTimeOffset To { get; init; }
        public required TimeSpan Duration { get; init; }
    }
}

internal sealed class GetMyAvailabilities(AppDbContext dbContext)
    : Endpoint<GetMyAvailabilitiesRequest, GetMyAvailabilitiesResponse>
{
    public override void Configure()
    {
        Get("/spots/availabilities");
    }

    public override async Task HandleAsync(GetMyAvailabilitiesRequest req, CancellationToken ct)
    {
        var currentUser = HttpContext.ToCurrentUser();

        var availabilities = await dbContext
            .Set<ParkingSpot>()
            .Where(parkingSpot => parkingSpot.OwnerId == currentUser.Identity)
            .SelectMany(parkingSpot => parkingSpot.Availabilities)
            .Where(availability => availability.To >= req.From && (req.To == null || availability.From <= req.To))
            .OrderBy(availability => availability.From)
            .Select(
                availability => new GetMyAvailabilitiesResponse.Availability
                {
                    Id = availability.Id,
                    From = availability.From,
                    To = availability.To,
                    Duration = availability.Duration
                })
            .AsNoTracking()
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
