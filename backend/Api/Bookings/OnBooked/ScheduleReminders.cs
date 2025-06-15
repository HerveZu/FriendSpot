using Api.Common;
using Api.Common.Infrastructure;
using Domain;
using Domain.ParkingSpots;
using Domain.Users;
using Newtonsoft.Json;
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
                    .UsingJobData(
                        RemindUser.NotificationData,
                        JsonConvert.SerializeObject(
                            new Notification
                            {
                                Title = new LocalizedString("PushNotification.Reminders.OwnerNeedsToShare.Title"),
                                Body = new LocalizedString(
                                    "PushNotification.Reminders.OwnerNeedsToShare.Body",
                                    [LocalizedArg.Date(notification.Date.From)]),
                            }))
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
                        RemindUser.NotificationData,
                        JsonConvert.SerializeObject(
                            new Notification
                            {
                                Title = new LocalizedString("PushNotification.Reminders.UsersBookingStarts.Title"),
                                Body = new LocalizedString(
                                    "PushNotification.Reminders.UsersBookingStarts.Body",
                                    [LocalizedArg.Date(notification.Date.From)]),
                            }))
                    .Build(),
                TriggerBuilder.Create()
                    .StartAtOrNow(notification.Date.From.AddMinutes(-5), notification.Date.From)
                    .Build(),
                cancellationToken),
            scheduler.ScheduleJob(
                JobBuilder.Create<RemindUser>()
                    .WithIdentity(new JobKey("remind-user-booking-ends", notification.BookingId.ToString()))
                    .UsingJobData(RemindUser.UserId, notification.UserId)
                    .UsingJobData(
                        RemindUser.NotificationData,
                        JsonConvert.SerializeObject(
                            new Notification
                            {
                                Title = new LocalizedString("PushNotification.Reminders.UsersBookingEnds.Title"),
                                Body = new LocalizedString(
                                    "PushNotification.Reminders.UsersBookingEnds.Body",
                                    [LocalizedArg.Date(notification.Date.To)]),
                            }))
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
    public const string NotificationData = nameof(NotificationData);
    public const string UserId = nameof(UserId);

    public async Task Execute(IJobExecutionContext context)
    {
        var userId = context.MergedJobDataMap.GetString(UserId);
        var notification =
            JsonConvert.DeserializeObject<Notification?>(
                context.MergedJobDataMap.GetString(NotificationData) ?? string.Empty);

        if (notification is null)
        {
            logger.LogWarning("Notification could not be deserialized, aborting...");
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
            notification.Title.Key);

        await userToRemind.PushNotification(
            notificationPushService,
            notification,
            context.CancellationToken);
    }
}
