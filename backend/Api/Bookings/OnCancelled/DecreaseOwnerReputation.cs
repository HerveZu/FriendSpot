using Api.Common;
using Api.Common.Infrastructure;
using Domain.ParkingSpots;
using Domain.Users;

namespace Api.Bookings.OnCancelled;

internal sealed class DecreaseOwnerReputation(ILogger<DecreaseOwnerReputation> logger, AppDbContext dbContext)
    : IDomainEventHandler<ParkingSpotBookingCancelled>
{
    public async Task Handle(ParkingSpotBookingCancelled notification, CancellationToken cancellationToken)
    {
        var owner = await dbContext.Set<User>().FindAsync([notification.OwnerId], cancellationToken);

        if (owner is null)
        {
            logger.LogWarning("Owner {UserId} not found, aborting...", notification.OwnerId);
            return;
        }

        logger.LogInformation("Decreasing owner's reputation for cancelled booking");
        owner.Rating.BadDecrease();

        dbContext.Set<User>().Update(owner);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
