using Api.Common;
using Api.Common.Infrastructure;
using Domain.Users;

namespace Api.Me.OnMarkedDeleted;

internal sealed class RemoveAllDevices(AppDbContext dbContext, ILogger<RemoveAllDevices> logger)
    : IDomainEventHandler<UserMarkedDeleted>
{
    public async Task Handle(UserMarkedDeleted notification, CancellationToken cancellationToken)
    {
        var user = await dbContext.Set<User>()
            .FindAsync([notification.UserId], cancellationToken);

        if (user is null)
        {
            logger.LogWarning("User not found with id {UserId}", notification.UserId);
            return;
        }

        logger.LogInformation("Removing all devices of user with id {UserId}", notification.UserId);
        user.RemoveAllDevices();

        dbContext.Set<User>().Update(user);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
