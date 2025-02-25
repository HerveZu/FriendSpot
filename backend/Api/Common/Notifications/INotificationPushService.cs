using Domain.Users;

namespace Api.Common.Notifications;

public sealed record Notification
{
    public required string Title { get; init; }
    public required string Body { get; init; }
}

internal interface INotificationPushService
{
    Task PushToUser(User user, Notification notification, CancellationToken cancellationToken);
}