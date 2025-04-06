using System.Net.Http.Headers;
using Api.Common.Options;
using Domain.Users;
using Microsoft.Extensions.Options;

namespace Api.Common.Notifications;

internal sealed class ExpoPushNotificationService
    : INotificationPushService
{
    private readonly Uri _expoPushUri = new("https://exp.host/--/api/v2/push/send");
    private readonly HttpClient _httpClient;
    private readonly ILogger<ExpoPushNotificationService> _logger;

    public ExpoPushNotificationService(
        HttpClient httpClient,
        IOptions<ExpoOptions> expoOptions,
        ILogger<ExpoPushNotificationService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;

        _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            expoOptions.Value.PushNotificationToken);
    }

    public async Task PushToUser(User user, Notification notification, CancellationToken cancellationToken)
    {
        await Task.WhenAll(user.UserDevices.Select(device => PushToDevice(device, notification, cancellationToken)));
    }

    private async Task PushToDevice(UserDevice device, Notification notification, CancellationToken cancellationToken)
    {
        try
        {
            await _httpClient.PostAsJsonAsync(
                _expoPushUri,
                // ReSharper disable RedundantAnonymousTypePropertyName
                new
                {
                    To = device.ExpoPushToken,
                    Sound = "default",
                    Title = notification.Title,
                    Body = notification.Body
                },
                // ReSharper enable RedundantAnonymousTypePropertyName
                cancellationToken);
        }
        catch (Exception e)
        {
            _logger.LogError(e, "Failed to push expo notification to device {DeviceId}", device.DeviceId);
        }
    }
}