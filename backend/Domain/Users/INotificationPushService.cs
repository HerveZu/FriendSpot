namespace Domain.Users;

public sealed record Notification
{
    public required string TitleKey { get; init; }
    public required string BodyKey { get; init; }
}

public interface INotificationPushService
{
    Task PushToDevice(UserDevice userDevice, Notification notification, CancellationToken cancellationToken);
}
