using Api.Common;
using Api.Common.Infrastructure;
using Domain.Parkings;
using Domain.Users;

namespace Api.BookingRequests.OnCancelledByUser;

internal sealed class DecreaseReputation(AppDbContext dbContext, ILogger<DecreaseReputation> logger)
    : IDomainEventHandler<BookingRequestCancelled>
{
    public async Task Handle(BookingRequestCancelled notification, CancellationToken cancellationToken)
    {
        var user = await dbContext
            .Set<User>()
            .FindAsync([notification.CancelledByUserId], cancellationToken);

        if (user is null)
        {
            logger.LogWarning("User with id {UserId} not found, aborting...", notification.CancelledByUserId);
            return;
        }

        user.Rating.BadDecrease();

        dbContext.Set<User>().Update(user);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}