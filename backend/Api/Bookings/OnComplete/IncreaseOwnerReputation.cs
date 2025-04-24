using Api.Common;
using Api.Common.Infrastructure;
using Domain.ParkingSpots;
using Domain.Users;

namespace Api.Bookings.OnComplete;

internal sealed class IncreaseOwnerReputation(ILogger<IncreaseOwnerReputation> logger, AppDbContext dbContext)
    : IDomainEventHandler<ParkingSpotBookingCompleted>
{
    public async Task Handle(ParkingSpotBookingCompleted notification, CancellationToken cancellationToken)
    {
        var owner = await dbContext.Set<User>().FindAsync([notification.OwnerId], cancellationToken);

        if (owner is null)
        {
            logger.LogWarning("Owner {UserId} not found, aborting...", notification.OwnerId);
            return;
        }

        logger.LogInformation("Increasing owner's reputation for completed booking");
        owner.Rating.GoodIncrease();

        dbContext.Set<User>().Update(owner);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
