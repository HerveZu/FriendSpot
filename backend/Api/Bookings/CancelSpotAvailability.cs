using Api.Common;
using Api.Common.Infrastructure;
using Domain.ParkingSpots;
using FastEndpoints;
using JetBrains.Annotations;
using Microsoft.EntityFrameworkCore;

namespace Api.Bookings;

[PublicAPI]
public sealed record CancelSpotAvailabilityRequest
{
    public required Guid AvailabilityId { get; init; }
}

internal sealed class CancelSpotAvailability(AppDbContext dbContext) : Endpoint<CancelSpotAvailabilityRequest>
{
    public override void Configure()
    {
        Post("/spots/availabilities/cancel");
    }

    public override async Task HandleAsync(CancelSpotAvailabilityRequest req, CancellationToken ct)
    {
        var currentUser = HttpContext.ToCurrentUser();

        var spot = await dbContext
            .Set<ParkingSpot>()
            .FirstOrDefaultAsync(spot => spot.OwnerId == currentUser.Identity, ct);

        if (spot is null)
        {
            ThrowError("No spot defined");
        }

        spot.CancelAvailability(currentUser.Identity, req.AvailabilityId);

        dbContext.Set<ParkingSpot>().Update(spot);
        await dbContext.SaveChangesAsync(ct);
    }
}