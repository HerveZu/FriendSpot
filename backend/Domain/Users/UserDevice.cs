namespace Domain.Users;

public sealed record UserDevice
{
    public required string DeviceId { get; init; }
    public required string? ExpoPushToken { get; init; }
}
