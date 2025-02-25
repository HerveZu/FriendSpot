using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Domain.Users;

public sealed record UserRegistered : IDomainEvent
{
    public required string UserId { get; init; }
}

public sealed class User : IBroadcastEvents
{
    private readonly DomainEvents _domainEvents = new();
    private readonly List<UserDevice> _userDevices = [];

    private User(string identity, UserDisplayName displayName)
    {
        Identity = identity;
        DisplayName = displayName;
    }

    public string Identity { get; init; }
    public UserDisplayName DisplayName { get; private set; }
    public string? PictureUrl { get; private set; }
    public UserRating Rating { get; init; } = null!;
    public IReadOnlyList<UserDevice> UserDevices => _userDevices.AsReadOnly();

    public IEnumerable<IDomainEvent> GetUncommittedEvents()
    {
        return _domainEvents.GetUncommittedEvents();
    }

    public void UpdateInfo(UserDisplayName displayName, string? pictureUrl)
    {
        DisplayName = displayName;
        PictureUrl = pictureUrl;
    }

    public void UpdatePictureUrl(string pictureUrl)
    {
        PictureUrl = pictureUrl;
    }

    public void RegisterDeviceIfNew(string expoToken)
    {
        var deviceAlreadyExists = _userDevices.Exists(device => device.ExpoPushToken == expoToken);

        if (!deviceAlreadyExists)
        {
            _userDevices.Add(
                new UserDevice
                {
                    ExpoPushToken = expoToken
                });
        }
    }

    public void RemoveDevice(string expoToken)
    {
        _userDevices.RemoveAll(device => device.ExpoPushToken == expoToken);
    }

    public static User Register(string identity, UserDisplayName displayName)
    {
        if (string.IsNullOrWhiteSpace(identity))
        {
            throw new BusinessException("Users.InvalidIdentity", "Cannot register null or empty identity.");
        }

        var user = new User(identity, displayName)
        {
            Rating = UserRating.Neutral()
        };

        user._domainEvents.Register(
            new UserRegistered
            {
                UserId = user.Identity
            });

        return user;
    }
}

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

    public static implicit operator string(UserDisplayName userDisplayName)
    {
        return userDisplayName.DisplayName;
    }
}

public sealed record UserDevice
{
    public required string ExpoPushToken { get; init; }
}

internal sealed class UserConfig : IEntityConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasKey(x => x.Identity);
        builder.Property(x => x.DisplayName)
            .HasMaxLength(UserDisplayName.MaxLength)
            .HasConversion(x => x.DisplayName, x => new UserDisplayName(x));
        builder.Property(x => x.PictureUrl);
        builder.OwnsMany(x => x.UserDevices);
        builder.OwnsOne(
            x => x.Rating,
            ratingBuilder => { ratingBuilder.Property(x => x.Rating); });
    }
}
