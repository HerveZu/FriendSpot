using Api.Bookings.Common;
using Api.Common.Infrastructure;
using Api.Common.Notifications;
using Domain.ParkingSpots;
using Domain.Users;
using Microsoft.EntityFrameworkCore;
using Quartz;

namespace Api.Bookings.OnCancelled;

internal sealed class PushNotification(
    ILogger<PushNotification> logger,
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

        var userIdsToFetch = new[]
        {
            @event.BookingUserId,
            @event.BookingUserId,
            @event.CancellingUserId
        };

        var userMap = (await dbContext
                .Set<User>()
                .Where(user => userIdsToFetch.Contains(user.Identity))
                .Select(
                    user => new
                    {
                        UserId = user.Identity,
                        user
                    })
                .ToArrayAsync(cancellationToken))
            .ToDictionary(user => user.UserId, user => user.user);

        var destinationUser = userMap.GetValueOrDefault(userIdThatShouldBeNotified);

        if (destinationUser is null)
        {
            logger.LogWarning("Destination user {UserId} not found, aborting...", userIdThatShouldBeNotified);
            return;
        }

        logger.LogInformation("Pushing booking cancelled notification to user {UserId}", destinationUser.Identity);

        await notificationPushService.PushToUser(
            destinationUser,
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
