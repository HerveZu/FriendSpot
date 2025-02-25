using Api.Bookings.Common;
using Api.Common.Infrastructure;
using Api.Common.Notifications;
using Domain.ParkingSpots;
using Domain.Users;
using Quartz;

namespace Api.Bookings.OnCancelled;

internal sealed class PushNotificationToOwner(
    ISchedulerFactory schedulerFactory,
    AppDbContext dbContext,
    INotificationPushService notificationPushService
)
    : IntegrationEventHandler<PushNotificationToOwner, ParkingSpotBookingCancelled>(schedulerFactory)
{
    protected override async Task HandleOutbox(ParkingSpotBookingCancelled @event, CancellationToken cancellationToken)
    {
        var user = await dbContext.Set<User>().FindAsync([@event.BookingUserId], cancellationToken);
        var owner = await dbContext.Set<User>().FindAsync([@event.OwnerId], cancellationToken);

        if (owner is null || user is null)
        {
            return;
        }

        await notificationPushService.PushToUser(
            owner,
            new Notification
            {
                Title = "Oups !",
                Body = $"{user.DisplayName} n'utilisera finalement pas ton spot."
            },
            cancellationToken);
    }
}
