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

    public void AcknowledgeDevice(string id, string? expoToken)
    {
        var device = _userDevices.FirstOrDefault(device => device.DeviceId == id);

        if (device is null)
        {
            _userDevices.Add(new UserDevice(id, expoToken));
            return;
        }

        device.UpdatePushToken(expoToken);
    }

    public void RemoveDevice(string deviceId)
    {
        _userDevices.RemoveAll(device => device.DeviceId == deviceId);
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

internal sealed class UserConfig : IEntityConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasKey(x => x.Identity);
        builder.Property(x => x.DisplayName)
            .HasMaxLength(UserDisplayName.MaxLength)
            .HasConversion(x => x.DisplayName, x => new UserDisplayName(x));
        builder.Property(x => x.PictureUrl);
        builder.OwnsMany(
            x => x.UserDevices,
            deviceBuilder =>
            {
                deviceBuilder.HasIndex(x => x.DeviceId).IsUnique();
                deviceBuilder.Property(x => x.DeviceId);
                deviceBuilder.Property(x => x.ExpoPushToken);
            });
        builder.OwnsOne(
            x => x.Rating,
            ratingBuilder => { ratingBuilder.Property(x => x.Rating); });
    }
}
