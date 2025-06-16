using Api.Common;
using Api.Common.Infrastructure;
using Domain.ParkingSpots;
using Domain.Users;

namespace Api.Bookings.OnCancelled;

internal sealed class DecreaseReputation(ILogger<DecreaseReputation> logger, AppDbContext dbContext)
    : IDomainEventHandler<ParkingSpotBookingCancelled>
{
    public async Task Handle(ParkingSpotBookingCancelled notification, CancellationToken cancellationToken)
    {
        var user = await dbContext.Set<User>().FindAsync([notification.CancellingUserId], cancellationToken);

        if (user is null)
        {
            logger.LogWarning("User {UserId} not found, aborting...", notification.CancellingUserId);
            return;
        }

        logger.LogInformation("Decreasing cancelling user's {UserId} reputation for cancelled booking", user.Identity);
        user.Rating.BadDecrease();

        dbContext.Set<User>().Update(user);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
