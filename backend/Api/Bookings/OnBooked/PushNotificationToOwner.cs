using Api.Common;
using Api.Common.Infrastructure;
using Api.Common.Notifications;
using Domain.ParkingSpots;
using Domain.Users;

namespace Api.Bookings.OnBooked;

internal sealed class PushNotificationToOwner(AppDbContext dbContext, INotificationPushService notificationPushService)
    : IDomainEventHandler<ParkingSpotBooked>
{
    public async Task Handle(ParkingSpotBooked @event, CancellationToken cancellationToken)
    {
        var user = await dbContext.Set<User>().FindAsync([@event.UserId], cancellationToken);
        var owner = await dbContext.Set<User>().FindAsync([@event.OwnerId], cancellationToken);

        if (owner is null || user is null)
        {
            return;
        }

        await notificationPushService.PushToUser(
            owner,
            new Notification
            {
                Title = "Nouvelle réservation !",
                Body = $"{user.DisplayName} a réservé ton spot."
            },
            cancellationToken);
    }
}
