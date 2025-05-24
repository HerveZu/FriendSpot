using System.Globalization;
using System.Net.Http.Headers;
using Api.Common.Options;
using Domain.Users;
using Microsoft.Extensions.Localization;
using Microsoft.Extensions.Options;

namespace Api.Common.Infrastructure;

internal sealed class ExpoPushNotificationService
    : INotificationPushService
{
    private readonly Uri _expoPushUri = new("https://exp.host/--/api/v2/push/send");
    private readonly HttpClient _httpClient;
    private readonly ILogger<ExpoPushNotificationService> _logger;
    private readonly IStringLocalizer<ExpoPushNotificationService> _stringLocalizer;

    public ExpoPushNotificationService(
        HttpClient httpClient,
        IOptions<ExpoOptions> expoOptions,
        ILogger<ExpoPushNotificationService> logger,
        IStringLocalizer<ExpoPushNotificationService> stringLocalizer)
    {
        _httpClient = httpClient;
        _logger = logger;
        _stringLocalizer = stringLocalizer;

        _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            expoOptions.Value.PushNotificationToken);
    }

    public async Task PushToDevice(UserDevice device, Notification notification, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Pushing notification to device {Device}", device.DeviceId);
        var currentCulture = CultureInfo.CurrentCulture;
        var testDevice = _stringLocalizer[notification.TitleKey];
        try
        {
            CultureInfo.CurrentCulture = new CultureInfo(device.Locale);
            await _httpClient.PostAsJsonAsync(
                _expoPushUri,
                // ReSharper disable RedundantAnonymousTypePropertyName
                new
                {
                    To = device.ExpoPushToken,
                    Sound = "default",
                    Title = _stringLocalizer[notification.TitleKey],
                    Body = _stringLocalizer[notification.BodyKey]
                },
                // ReSharper enable RedundantAnonymousTypePropertyName
                cancellationToken);
        }
        catch (Exception e)
        {
            _logger.LogError(e, "Failed to push expo notification to device {DeviceId}", device.DeviceId);
        }
        finally
        {
            CultureInfo.CurrentCulture = currentCulture;
        }
    }
}
