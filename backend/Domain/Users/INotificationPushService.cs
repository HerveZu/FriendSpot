namespace Domain.Users;

public sealed record Notification
{
    public required string Title { get; init; }
    public required string Body { get; init; }
}

public interface INotificationPushService
{
    Task PushToDevice(UserDevice userDevice, Notification notification, CancellationToken cancellationToken);
}
