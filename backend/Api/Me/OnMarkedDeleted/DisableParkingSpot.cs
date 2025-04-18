using Api.Common;
using Api.Common.Infrastructure;
using Domain.ParkingSpots;
using Domain.Users;
using Microsoft.EntityFrameworkCore;

namespace Api.Me.OnMarkedDeleted;

internal sealed class DisableParkingSpot(AppDbContext dbContext, ILogger<DisableParkingSpot> logger)
    : IDomainEventHandler<UserMarkedDeleted>
{
    public async Task Handle(UserMarkedDeleted notification, CancellationToken cancellationToken)
    {
        logger.LogInformation("Disabling parking spot of marked deleted user {UserId}", notification.UserId);

        var userSpot = await dbContext
            .Set<ParkingSpot>()
            .FirstOrDefaultAsync(spot => spot.OwnerId == notification.UserId, cancellationToken);

        if (userSpot is null)
        {
            logger.LogInformation("User has no parking spot to disable");
            return;
        }

        userSpot.Disable();
        logger.LogInformation("Parking spot of user {UserId} has been disabled", notification.UserId);

        dbContext.Set<ParkingSpot>().Update(userSpot);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
