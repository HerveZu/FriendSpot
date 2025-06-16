using Api.Common;
using Api.Common.Infrastructure;
using Domain;
using Domain.ParkingSpots;
using Domain.Users;
using Quartz;

namespace Api.Bookings.OnBooked;

internal sealed class ScheduleReminders(ISchedulerFactory schedulerFactory, ILogger<ScheduleReminders> logger)
    : IDomainEventHandler<ParkingSpotBooked>
{
    public async Task Handle(ParkingSpotBooked notification, CancellationToken cancellationToken)
    {
        var scheduler = await schedulerFactory.GetScheduler(cancellationToken);

        logger.LogInformation("Schedule reminders for parking spot");

        await Task.WhenAll(
            scheduler.ScheduleJob(
                JobBuilder.Create<RemindUser>()
                    .WithIdentity(new JobKey("remind-owner-to-share", notification.BookingId.ToString()))
                    .UsingJobData(RemindUser.UserId, notification.OwnerId)
                    .UsingJobData(RemindUser.NotificationTitleKey, "PushNotification.Reminders.OwnerNeedsToShare.Title")
                    .UsingJobData(RemindUser.NotificationBodyKey, "PushNotification.Reminders.OwnerNeedsToShare.Body")
                    .UsingJobData(RemindUser.NotificationDateArg, notification.Date.From.ToString("O"))
                    .Build(),
                TriggerBuilder.Create()
                    .StartAtOrNow(notification.Date.From.AddMinutes(-30), notification.Date.From)
                    .Build(),
                cancellationToken),
            scheduler.ScheduleJob(
                JobBuilder.Create<RemindUser>()
                    .WithIdentity(new JobKey("remind-user-booking-starts", notification.BookingId.ToString()))
                    .UsingJobData(RemindUser.UserId, notification.UserId)
                    .UsingJobData(
                        RemindUser.NotificationTitleKey,
                        "PushNotification.Reminders.UsersBookingStarts.Title")
                    .UsingJobData(RemindUser.NotificationBodyKey, "PushNotification.Reminders.UsersBookingStarts.Body")
                    .UsingJobData(RemindUser.NotificationDateArg, notification.Date.From.ToString("O"))
                    .Build(),
                TriggerBuilder.Create()
                    .StartAtOrNow(notification.Date.From.AddMinutes(-5), notification.Date.From)
                    .Build(),
                cancellationToken),
            scheduler.ScheduleJob(
                JobBuilder.Create<RemindUser>()
                    .WithIdentity(new JobKey("remind-user-booking-ends", notification.BookingId.ToString()))
                    .UsingJobData(RemindUser.UserId, notification.UserId)
                    .UsingJobData(RemindUser.NotificationTitleKey, "PushNotification.Reminders.UsersBookingEnds.Title")
                    .UsingJobData(RemindUser.NotificationBodyKey, "PushNotification.Reminders.UsersBookingEnds.Body")
                    .UsingJobData(RemindUser.NotificationDateArg, notification.Date.To.ToString("O"))
                    .Build(),
                TriggerBuilder.Create()
                    .StartAtOrNow(
                        notification.Date.From.AddMinutes(notification.Date.Duration.TotalMinutes * .85),
                        // this reminder has value even when the booking is over
                        notification.Date.To.AddMinutes(15))
                    .Build(),
                cancellationToken));
    }
}

internal sealed class RemindUser(
    ILogger<MarkBookingComplete> logger,
    AppDbContext dbContext,
    INotificationPushService notificationPushService
) : IJob
{
    public const string NotificationTitleKey = nameof(NotificationTitleKey);
    public const string NotificationBodyKey = nameof(NotificationBodyKey);
    public const string NotificationDateArg = nameof(NotificationDateArg);
    public const string UserId = nameof(UserId);

    public async Task Execute(IJobExecutionContext context)
    {
        var userId = context.MergedJobDataMap.GetString(UserId);
        var notificationTitleKey = context.MergedJobDataMap.GetString(NotificationTitleKey);
        var notificationBodyKey = context.MergedJobDataMap.GetString(NotificationBodyKey);
        var notificationDateArg = context.MergedJobDataMap.GetDateTimeOffsetValue(NotificationDateArg);

        if (notificationTitleKey is null || notificationBodyKey is null)
        {
            logger.LogWarning("Missing notification title or body, aborting...");
            return;
        }

        var userToRemind = await dbContext
            .Set<User>()
            .FindAsync([userId], context.CancellationToken);

        if (userToRemind is null)
        {
            logger.LogWarning("User to remind is null, aborting...");
            return;
        }

        logger.LogInformation(
            "Reminding user {UserId} with notification {Notification}",
            userToRemind.Identity,
            notificationTitleKey);

        await userToRemind.PushNotification(
            notificationPushService,
            new Notification
            {
                Title = new LocalizedString(notificationTitleKey),
                Body = new LocalizedString(notificationBodyKey, [LocalizedArg.Date(notificationDateArg)])
            },
            context.CancellationToken);
    }
}
