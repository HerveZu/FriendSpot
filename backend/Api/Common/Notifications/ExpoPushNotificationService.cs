using Domain.Users;

namespace Api.Common.Notifications;

internal sealed class ExpoPushNotificationService(HttpClient httpClient) : INotificationPushService
{
    private readonly Uri _expoPushUri = new("https://exp.host/--/api/v2/push/send");

    public async Task PushToUser(User user, Notification notification, CancellationToken cancellationToken)
    {
        await Task.WhenAll(user.UserDevices.Select(device => PushToDevice(device, notification, cancellationToken)));
    }

    private async Task PushToDevice(UserDevice device, Notification notification, CancellationToken cancellationToken)
    {
        await httpClient.PostAsJsonAsync(
            _expoPushUri,
            new
            {
                To = device.ExpoPushToken,
                Sound = "default",
                notification.Title,
                notification.Body
            },
            cancellationToken);
    }
}
