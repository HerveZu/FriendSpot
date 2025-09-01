using Api.Common;
using Api.Common.Infrastructure;
using Domain.Users;
using Quartz;

namespace Api.Me.OnMarkedDeleted;

internal sealed class ScheduleDataDeletion(
    ILogger<ScheduleDataDeletion> logger,
    ISchedulerFactory schedulerFactory
) : IDomainEventHandler<UserMarkedDeleted>
{
    public async Task Handle(UserMarkedDeleted notification, CancellationToken cancellationToken)
    {
        logger.LogInformation("User data scheduled to be deleted ");

        var scheduler = await schedulerFactory.GetScheduler(cancellationToken);

        // schedule deletion to be executed after this transaction is committed, to allow for side effects to run first
        await scheduler.ScheduleJob(
            JobBuilder.Create<DeleteUserData>()
                .UsingJobData(DeleteUserData.UserId, notification.UserId)
                .Build(),
            TriggerBuilder.Create()
                .StartNow()
                .Build(),
            cancellationToken);
    }
}

internal sealed class DeleteUserData(ILogger<DeleteUserData> logger, AppDbContext dbContext) : IJob
{
    public const string UserId = nameof(UserId);

    public async Task Execute(IJobExecutionContext context)
    {
        var userId = context.MergedJobDataMap.GetString(UserId);

        if (userId is null)
        {
            logger.LogWarning("User id not provided, aborting...");
            return;
        }

        var user = await dbContext
            .Set<User>()
            .FindAsync([userId], context.CancellationToken);

        if (user is null)
        {
            logger.LogWarning("User with id {UserId} was not found while trying to delete data", userId);
            return;
        }

        logger.LogInformation("Deleting user with id {UserId}", userId);

        dbContext.Set<User>().Remove(user);
        await dbContext.SaveChangesAsync(context.CancellationToken);
    }
}
