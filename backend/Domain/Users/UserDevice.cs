namespace Domain.Users;

public sealed class UserDevice(string deviceId, string? expoPushToken)
{
    public string DeviceId { get; } = deviceId;
    public string? ExpoPushToken { get; private set; } = expoPushToken;

    public void UpdatePushToken(string? token)
    {
        ExpoPushToken = token;
    }
}
