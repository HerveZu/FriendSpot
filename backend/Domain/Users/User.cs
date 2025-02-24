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

    private User(string identity, string displayName)
    {
        Identity = identity;
        DisplayName = displayName;
    }

    public string Identity { get; init; }
    public string DisplayName { get; private set; }
    public string? PictureUrl { get; private set; }
    public UserRating Rating { get; init; } = null!;
    public IReadOnlyList<UserDevice> UserDevices => _userDevices.AsReadOnly();

    public IEnumerable<IDomainEvent> GetUncommittedEvents()
    {
        return _domainEvents.GetUncommittedEvents();
    }

    public void UpdateInfo(string displayName, string? pictureUrl)
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

    public static User Register(string identity, string displayName)
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

public sealed record UserDevice
{
    public required string ExpoPushToken { get; init; }
}

internal sealed class UserConfig : IEntityConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasKey(x => x.Identity);
        builder.Property(x => x.DisplayName);
        builder.Property(x => x.PictureUrl);
        builder.OwnsMany(x => x.UserDevices);
        builder.OwnsOne(
            x => x.Rating,
            ratingBuilder => { ratingBuilder.Property(x => x.Rating); });
    }
}
