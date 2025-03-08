using Api.Bookings.Common;
using Api.Common.Infrastructure;
using Api.Common.Notifications;
using Domain.ParkingSpots;
using Domain.Users;
using Microsoft.EntityFrameworkCore;
using Quartz;

namespace Api.Bookings.OnCancelled;

internal sealed class PushNotification(
    ISchedulerFactory schedulerFactory,
    AppDbContext dbContext,
    INotificationPushService notificationPushService
)
    : IntegrationEventHandler<PushNotification, ParkingSpotBookingCancelled>(schedulerFactory)
{
    protected override async Task HandleOutbox(ParkingSpotBookingCancelled @event, CancellationToken cancellationToken)
    {
        var cancelledByOwner = @event.CancellingUserId == @event.OwnerId;
        var userIdThatShouldBeNotified = cancelledByOwner
            ? @event.BookingUserId
            : @event.OwnerId;

        var userMap = (await dbContext
                .Set<User>()
                .Where(
                    user => new[] { @event.BookingUserId, @event.BookingUserId, @event.CancellingUserId }.Contains(
                        user.Identity))
                .Select(
                    user => new
                    {
                        UserId = user.Identity,
                        user
                    })
                .ToArrayAsync(cancellationToken))
            .ToDictionary(user => user.UserId, user => user.user);

        await notificationPushService.PushToUser(
            userMap[userIdThatShouldBeNotified],
            new Notification
            {
                Title = "Oups !",
                Body = cancelledByOwner
                    ? $"{userMap[@event.OwnerId].DisplayName} a annulé ta réseravation."
                    : $"{userMap[@event.BookingUserId].DisplayName} n'utilisera finalement pas ton spot."
            },
            cancellationToken);
    }
}
