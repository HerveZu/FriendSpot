using System.Net.Http.Headers;
using System.Resources;
using Api.Common.Options;
using Domain.Users;
using Microsoft.Extensions.Options;

namespace Api.Common.Infrastructure;

internal sealed class ExpoPushNotificationService
    : INotificationPushService
{
    private readonly Uri _expoPushUri = new("https://exp.host/--/api/v2/push/send");
    private readonly HttpClient _httpClient;
    private readonly ILogger<ExpoPushNotificationService> _logger;
    private readonly ResourceManager _resourceManager;

    public ExpoPushNotificationService(
        HttpClient httpClient,
        IOptions<ExpoOptions> expoOptions,
        ILogger<ExpoPushNotificationService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        _resourceManager = new ResourceManager(
            "Api.Resources.NotificationResources",
            typeof(NotificationResources).Assembly);

        _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            expoOptions.Value.PushNotificationToken);
    }

    public async Task PushToDevice(UserDevice device, Notification notification, CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "Pushing notification to device {Device} using locale {Locale}",
            device.DeviceId,
            device.Locale);

        try
        {
            await _httpClient.PostAsJsonAsync(
                _expoPushUri,
                new
                {
                    To = device.ExpoPushToken,
                    Sound = "default",
                    Title = notification.Title.Translate(_resourceManager, device.Locale, device.TimeZone),
                    Body = notification.Body.Translate(_resourceManager, device.Locale, device.TimeZone)
                },
                cancellationToken);
        }
        catch (Exception e)
        {
            _logger.LogError(e, "Failed to push expo notification to device {DeviceId}", device.DeviceId);
        }
    }
}
