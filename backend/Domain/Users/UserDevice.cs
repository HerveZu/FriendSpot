namespace Domain.Users;

public sealed record UserDevice
{
    public required string ExpoPushToken { get; init; }
}