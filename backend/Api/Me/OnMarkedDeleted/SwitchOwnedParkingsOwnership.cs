using Api.Common;
using Api.Common.Infrastructure;
using Domain.Parkings;
using Domain.ParkingSpots;
using Domain.Users;
using Microsoft.EntityFrameworkCore;

namespace Api.Me.OnMarkedDeleted;

internal sealed class SwitchOwnedParkingsOwnership(AppDbContext dbContext, ILogger<SwitchOwnedParkingsOwnership> logger)
    : IDomainEventHandler<UserMarkedDeleted>
{
    public async Task Handle(UserMarkedDeleted notification, CancellationToken cancellationToken)
    {
        var ownedParkings = await (from parking in dbContext.Set<Parking>()
                where parking.OwnerId == notification.UserId
                select new
                {
                    Parking = parking,
                    UserIds = (from spot in dbContext.Set<ParkingSpot>()
                        where parking.Id == spot.ParkingId
                        join user in dbContext.Set<User>() on spot.OwnerId equals user.Identity
                        select user.Identity).ToArray()
                })
            .ToArrayAsync(cancellationToken);

        logger.LogInformation(
            "Switching {ParkingCount} parkings ownership from former owner {FormerOwnerId}",
            ownedParkings.Length,
            notification.UserId);

        foreach (var ownedParking in ownedParkings)
        {
            var newOwnerId = ownedParking.UserIds.FirstOrDefault();

            if (newOwnerId is null)
            {
                logger.LogInformation(
                    "No one is using this parking {ParkingId}, deleting...",
                    ownedParking.Parking.Id);
                dbContext.Set<Parking>().Remove(ownedParking.Parking);
                continue;
            }

            logger.LogInformation(
                "Switching parking {ParkingId} ownership to randomly picked user {NewOwnerId}",
                ownedParking.Parking.Id,
                newOwnerId);
            ownedParking.Parking.SwitchOwnership(newOwnerId);
            dbContext.Set<Parking>().Update(ownedParking.Parking);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
