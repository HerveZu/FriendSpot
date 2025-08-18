using Api.Common;
using Api.Common.Infrastructure;
using Domain.ParkingSpots;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace Api.Parkings;

internal sealed class LeaveSpot(AppDbContext dbContext) : EndpointWithoutRequest
{
    public override void Configure()
    {
        Delete("/@me/spot");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var currentUser = HttpContext.ToCurrentUser();

        var userSpot = await dbContext.Set<ParkingSpot>()
            .FirstOrDefaultAsync(parkingSpot => parkingSpot.OwnerId == currentUser.Identity, ct);

        if (userSpot is null)
        {
            ThrowError("No spot defined.");
            return;
        }

        userSpot.Leave();

        await dbContext.DeleteAndSaveWithEventPropagation(userSpot, ct);
    }
}
