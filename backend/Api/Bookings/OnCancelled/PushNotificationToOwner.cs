using Api.Common;
using Api.Common.Infrastructure;
using Api.Common.Notifications;
using Domain.ParkingSpots;
using Domain.Users;

namespace Api.Bookings.OnCancelled;

internal sealed class PushNotificationToOwner(AppDbContext dbContext, INotificationPushService notificationPushService)
    : IDomainEventHandler<ParkingSpotBookingCancelled>
{
    public async Task Handle(ParkingSpotBookingCancelled @event, CancellationToken cancellationToken)
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
