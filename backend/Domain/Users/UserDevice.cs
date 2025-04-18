namespace Domain.Users;

public sealed class UserDevice(string deviceId, string? expoPushToken, bool uniquenessNotGuaranteed)
{
    /// <summary>
    ///     Whether the <see cref="DeviceId" /> is truly unique.
    ///     On iOS the device id will change on every installation, this <see cref="UniquenessNotGuaranteed" /> is true.
    /// </summary>
    public bool UniquenessNotGuaranteed { get; } = uniquenessNotGuaranteed;

    public string DeviceId { get; } = deviceId;
    public string? ExpoPushToken { get; private set; } = expoPushToken;

    public void UpdatePushToken(string? token)
    {
        ExpoPushToken = token;
    }
}
