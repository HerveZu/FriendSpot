using Api.Common;
using Api.Common.Infrastructure;
using Domain;
using Domain.Parkings;
using Domain.Users;
using Microsoft.EntityFrameworkCore;
using Quartz;

namespace Api.BookingRequests.OnAccepted;

internal sealed class PushNotification(
    ILogger<PushNotification> logger,
    ISchedulerFactory schedulerFactory,
    AppDbContext dbContext,
    INotificationPushService notificationPushService
)
    : IntegrationEventHandler<PushNotification, BookingRequestAccepted>(schedulerFactory)
{
    protected override async Task HandleOutbox(BookingRequestAccepted @event, CancellationToken cancellationToken)
    {
        var userIdsToFetch = new[]
        {
            @event.AcceptedByUserId,
            @event.RequesterId,
        };

        var userMap = (await dbContext
                .Set<User>()
                .Where(user => userIdsToFetch.Contains(user.Identity))
                .Select(user => new
                {
                    UserId = user.Identity,
                    user
                })
                .ToArrayAsync(cancellationToken))
            .ToDictionary(user => user.UserId, user => user.user);

        var requester = userMap.GetValueOrDefault(@event.RequesterId);

        if (requester is null)
        {
            logger.LogWarning("Requester user {UserId} not found, aborting...", @event.RequesterId);
            return;
        }

        logger.LogInformation("Pushing booking request accepted notification to user {UserId}", requester.Identity);

        await requester.PushNotification(
            notificationPushService,
            new Notification
            {
                Title = new LocalizedString("PushNotification.RequestAccepted.Title"),
                Body = new LocalizedString(
                    "PushNotification.RequestAccepted.Body",
                    [
                        LocalizedArg.String(userMap[@event.AcceptedByUserId].DisplayName),
                        LocalizedArg.Date(@event.Date.From)
                    ])
            },
            cancellationToken);
    }
}
