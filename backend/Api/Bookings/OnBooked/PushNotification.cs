using Api.Common;
using Api.Common.Infrastructure;
using Domain;
using Domain.ParkingSpots;
using Domain.Users;
using Quartz;

namespace Api.Bookings.OnBooked;

internal sealed class PushNotification(
    ISchedulerFactory schedulerFactory,
    AppDbContext dbContext,
    INotificationPushService notificationPushService
)
    : IntegrationEventHandler<PushNotification, ParkingSpotBooked>(schedulerFactory)
{
    protected override async Task HandleOutbox(ParkingSpotBooked @event, CancellationToken cancellationToken)
    {
        var user = await dbContext.Set<User>().FindAsync([@event.UserId], cancellationToken);
        var owner = await dbContext.Set<User>().FindAsync([@event.OwnerId], cancellationToken);

        if (owner is null || user is null)
        {
            return;
        }

        await owner.PushNotification(
            notificationPushService,
            new Notification
            {
                Title = new LocalizedString("PushNotification.Booking.Title"),
                Body = new LocalizedString(
                    "PushNotification.Booking.Body",
                    [
                        LocalizedArg.String(user.DisplayName),
                        LocalizedArg.Date(@event.Date.From),
                    ]),
            },
            cancellationToken);
    }
}