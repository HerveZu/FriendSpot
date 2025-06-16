using Api.Common;
using Api.Common.Infrastructure;
using Domain.ParkingSpots;
using Domain.Users;
using Microsoft.EntityFrameworkCore;
using Quartz;

namespace Api.Me.OnMarkedDeleted;

internal sealed class ScheduleDataDeletion(
    AppDbContext dbContext,
    ILogger<ScheduleDataDeletion> logger,
    ISchedulerFactory schedulerFactory
) : IDomainEventHandler<UserMarkedDeleted>
{
    public async Task Handle(UserMarkedDeleted notification, CancellationToken cancellationToken)
    {
        var userSpot = await dbContext.Set<ParkingSpot>()
            .Where(spot => spot.OwnerId == notification.UserId)
            .FirstOrDefaultAsync(cancellationToken);

        var lastNotCancellableAvailability = userSpot?.Availabilities
            .Where(availability => !availability.CanCancel(notification.UserId, userSpot.Bookings))
            .MaxBy(availability => availability.To);

        var now = DateTimeOffset.Now;

        // we will trigger the data deletion only when the last availability that can't be canceled right away is over,
        // as this action should not impact 'frozen' bookings
        var scheduleDeletionAt = lastNotCancellableAvailability?.To ?? now;

        logger.LogInformation("User data will be deleted on the date {DeletionDate}", scheduleDeletionAt);

        var scheduler = await schedulerFactory.GetScheduler(cancellationToken);

        await scheduler.ScheduleJob(
            JobBuilder.Create<DeleteUserData>()
                .UsingJobData(DeleteUserData.UserId, notification.UserId)
                .Build(),
            TriggerBuilder.Create()
                .StartAtOrNow(scheduleDeletionAt)
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

        if (!user.IsDeleted)
        {
            logger.LogWarning("User with id {UserId} is not marked as deleted, aborting...", userId);
            return;
        }

        logger.LogInformation("Deleting user with id {UserId}", userId);

        dbContext.Set<User>().Remove(user);
        await dbContext.SaveChangesAsync(context.CancellationToken);
    }
}
