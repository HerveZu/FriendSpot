using System.Globalization;

namespace Domain.Users;

public sealed class UserDevice(
    string deviceId,
    string? expoPushToken,
    bool uniquenessNotGuaranteed,
    CultureInfo locale,
    TimeZoneInfo timeZone
)
{
    /// <summary>
    ///     Whether the <see cref="DeviceId" /> is truly unique.
    ///     On iOS the device id will change on every installation, this <see cref="UniquenessNotGuaranteed" /> is true.
    /// </summary>
    public bool UniquenessNotGuaranteed { get; } = uniquenessNotGuaranteed;

    public string DeviceId { get; } = deviceId;
    public string? ExpoPushToken { get; private set; } = expoPushToken;
    public CultureInfo Locale { get; private set; } = locale;
    public TimeZoneInfo TimeZone { get; private set; } = timeZone;

    public void UpdateInfo(string? token, CultureInfo locale, TimeZoneInfo timeZone)
    {
        ExpoPushToken = token;
        Locale = locale;
        TimeZone = timeZone;
    }
}
