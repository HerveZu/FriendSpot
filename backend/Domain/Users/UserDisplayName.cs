namespace Domain.Users;

public sealed record UserDisplayName
{
    public const int MinLength = 2;
    public const int MaxLength = 30;

    public UserDisplayName(string displayName)
    {
        if (string.IsNullOrWhiteSpace(displayName))
        {
            throw new BusinessException("Users.InvalidDisplayName", "Cannot register null or empty display name.");
        }

        if (displayName.Length is < MinLength or > MaxLength)
        {
            throw new BusinessException("Users.InvalidDisplayName", "Cannot register display name length.");
        }

        DisplayName = displayName;
    }

    public string DisplayName { get; }

    public override string ToString()
    {
        return DisplayName;
    }

    public static implicit operator string(UserDisplayName userDisplayName)
    {
        return userDisplayName.DisplayName;
    }
}