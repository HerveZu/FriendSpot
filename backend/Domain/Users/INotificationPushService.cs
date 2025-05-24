namespace Domain.Users;

public sealed record Notification
{
    public required LocalizedString Title { get; init; }
    public required LocalizedString Body { get; init; }
}

public interface INotificationPushService
{
    Task PushToDevice(UserDevice userDevice, Notification notification, CancellationToken cancellationToken);
}
