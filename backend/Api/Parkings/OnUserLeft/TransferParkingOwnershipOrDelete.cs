using Api.Common;
using Api.Common.Infrastructure;
using Domain.Parkings;
using Domain.ParkingSpots;
using Microsoft.EntityFrameworkCore;

namespace Api.Parkings.OnUserLeft;

internal sealed class TransferParkingOwnershipOrDelete(
    ILogger<TransferParkingOwnershipOrDelete> logger,
    AppDbContext dbContext
) : IDomainEventHandler<ParkingUserLeft>
{
    public async Task Handle(ParkingUserLeft notification, CancellationToken cancellationToken)
    {
        var leftParking = await (from parking in dbContext.Set<Parking>()
            join spot in dbContext.Set<ParkingSpot>() on parking.Id equals spot.ParkingId into spots
            where parking.Id == notification.LeftParkingId
            select new
            {
                Parking = parking,
                OtherUserIds = spots.Where(spot => spot.OwnerId != notification.UserId).Select(spot => spot.OwnerId)
            }).FirstOrDefaultAsync(cancellationToken);

        if (leftParking is null)
        {
            logger.LogWarning("The left parking {ParkingId} was not found", notification.LeftParkingId);
            return;
        }

        if (leftParking.Parking.OwnerId != notification.UserId)
        {
            logger.LogInformation("User that has left the parking is not the owner, ignoring...");
            return;
        }

        var newOwnerId = leftParking.OtherUserIds.FirstOrDefault();

        if (newOwnerId is null)
        {
            logger.LogInformation(
                "No one is using this parking {ParkingId} anymore, deleting...",
                leftParking.Parking.Id);
            leftParking.Parking.Delete(notification.UserId);
            await dbContext.DeleteAndSaveWithEventPropagation(leftParking.Parking, cancellationToken);
            return;
        }

        logger.LogInformation(
            "Transferring ownership of parking {ParkingId} to user {NewOwnerId}",
            leftParking.Parking.Id,
            newOwnerId);
        leftParking.Parking.TransferOwnership(newOwnerId);

        dbContext.Set<Parking>().Update(leftParking.Parking);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
