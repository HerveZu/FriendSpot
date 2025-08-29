using Api.Common;
using Api.Common.Infrastructure;
using Domain.Parkings;
using Domain.ParkingSpots;
using Domain.Users;
using Microsoft.EntityFrameworkCore;

namespace Api.Me.OnMarkedDeleted;

internal sealed class TransferOwnedParkingsOwnershipOrDelete(
    AppDbContext dbContext,
    ILogger<TransferOwnedParkingsOwnershipOrDelete> logger
)
    : IDomainEventHandler<UserMarkedDeleted>
{
    public async Task Handle(UserMarkedDeleted notification, CancellationToken cancellationToken)
    {
        var ownedParkings = await (from parking in dbContext.Set<Parking>()
                where parking.OwnerId == notification.UserId
                select new
                {
                    Parking = parking,
                    OtherUserIds = (from spot in dbContext.Set<ParkingSpot>()
                        where parking.Id == spot.ParkingId
                        join user in dbContext.Set<User>() on spot.OwnerId equals user.Identity
                        where user.Identity != notification.UserId
                        select user.Identity).ToArray()
                })
            .ToArrayAsync(cancellationToken);

        logger.LogInformation(
            "Switching {ParkingCount} parkings ownership from former owner {FormerOwnerId}",
            ownedParkings.Length,
            notification.UserId);

        var toRemove = new List<Parking>();
        var toUpdate = new List<Parking>();

        foreach (var ownedParking in ownedParkings)
        {
            var newOwnerId = ownedParking.OtherUserIds.FirstOrDefault();

            if (newOwnerId is null)
            {
                logger.LogInformation(
                    "No one is using this parking {ParkingId}, deleting...",
                    ownedParking.Parking.Id);
                ownedParking.Parking.Delete(notification.UserId);
                toRemove.Add(ownedParking.Parking);
                continue;
            }

            logger.LogInformation(
                "Transferring parking {ParkingId} ownership to randomly picked user {NewOwnerId}",
                ownedParking.Parking.Id,
                newOwnerId);
            ownedParking.Parking.TransferOwnership(newOwnerId);
            toUpdate.Add(ownedParking.Parking);
        }

        dbContext.Set<Parking>().UpdateRange(toUpdate);
        await dbContext.SaveChangesAsync(cancellationToken);

        await dbContext.DeleteAndSaveRangeWithEventPropagation(toRemove.ToArray(), cancellationToken);
    }
}
