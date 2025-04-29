namespace Domain.Users;

public sealed record UserDisplayName
{
    public const int MinLength = 2;
    public const int MaxLength = 30;

    public UserDisplayName(string displayName)
    {
        if (string.IsNullOrWhiteSpace(displayName))
        {
            throw new ArgumentException("Cannot register null or empty display name.", nameof(displayName));
        }

        if (displayName.Length is < MinLength or > MaxLength)
        {
            throw new ArgumentException("Cannot register display name length.", nameof(displayName));
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
