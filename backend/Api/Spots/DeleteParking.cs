using Api.Common;
using Api.Common.Infrastructure;
using Domain.Parkings;
using FastEndpoints;
using JetBrains.Annotations;

namespace Api.Spots;

[PublicAPI]
public sealed record DeleteParkingRequest
{
    public Guid ParkingId { get; init; } // required makes deserialization fail
}

internal sealed class DeleteParking(AppDbContext dbContext, ILogger<DeleteParking> logger)
    : Endpoint<DeleteParkingRequest>
{
    public override void Configure()
    {
        Delete("/parking/{parkingId}");
    }

    public override async Task HandleAsync(DeleteParkingRequest req, CancellationToken ct)
    {
        var currentUser = HttpContext.ToCurrentUser();
        var parking = await dbContext.Set<Parking>().FindAsync([req.ParkingId], ct);

        if (parking is null)
        {
            ThrowError("Parking not found");
            return;
        }

        logger.LogInformation("Deleting parking {ParkingId}", parking.Id);

        parking.Delete(currentUser.Identity);
        dbContext.Set<Parking>().Remove(parking);

        await dbContext.SaveChangesAsync(ct);
    }
}
