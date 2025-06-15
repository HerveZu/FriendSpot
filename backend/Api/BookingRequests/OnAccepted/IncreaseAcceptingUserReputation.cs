using Api.Common;
using Api.Common.Infrastructure;
using Domain.Parkings;
using Domain.Users;

namespace Api.BookingRequests.OnAccepted;

internal sealed class IncreaseAcceptingUserReputation(
    ILogger<IncreaseAcceptingUserReputation> logger,
    AppDbContext dbContext
)
    : IDomainEventHandler<BookingRequestAccepted>
{
    public async Task Handle(BookingRequestAccepted notification, CancellationToken cancellationToken)
    {
        var acceptingUser = await dbContext.Set<User>().FindAsync([notification.AcceptedByUserId], cancellationToken);

        if (acceptingUser is null)
        {
            logger.LogWarning("User {UserId} not found, aborting...", notification.AcceptedByUserId);
            return;
        }

        logger.LogInformation("Increasing accepting user's reputation for accepting booking request.");
        acceptingUser.Rating.NeutralIncrease();

        dbContext.Set<User>().Update(acceptingUser);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
