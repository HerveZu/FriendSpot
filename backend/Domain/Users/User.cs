using System.Globalization;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Domain.Users;

public sealed record UserRegistered : IDomainEvent
{
    public required string UserId { get; init; }
}

public sealed record UserMarkedDeleted : IDomainEvent
{
    public required string UserId { get; init; }
}

public sealed class User : IAggregateRoot
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

        user._domainEvents.RegisterNext(
            new UserRegistered
            {
                UserId = user.Identity
            });

        return user;
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

    public void AcknowledgeDevice(
        string id,
        string? expoToken,
        bool uniquenessNotGuaranteed,
        CultureInfo locale,
        TimeZoneInfo timezone)
    {
        var device = _userDevices.FirstOrDefault(device => device.DeviceId == id);

        if (device is not null)
        {
            device.UpdateInfo(expoToken, locale, timezone);
            return;
        }

        // as many device ids can represent the same physical device,
        // we have to delete all devices that might conflict (when: uniquenessNotGuaranteed)

        // To prevent duplicate devices, we need to remove all potential duplicated devices
        if (uniquenessNotGuaranteed)
        {
            _userDevices.RemoveAll(exitingDevice => exitingDevice.UniquenessNotGuaranteed);
        }

        _userDevices.Add(new UserDevice(id, expoToken, uniquenessNotGuaranteed, locale, timezone));
    }

    public void RemoveDevice(string deviceId)
    {
        _userDevices.RemoveAll(device => device.DeviceId == deviceId);
    }

    public void RemoveAllDevices()
    {
        _userDevices.Clear();
    }

    public void MarkDeleted()
    {
        _domainEvents.RegisterNext(
            new UserMarkedDeleted
            {
                UserId = Identity
            });
    }

    public async Task PushNotification(
        INotificationPushService notificationPushService,
        Notification notification,
        CancellationToken cancellationToken)
    {
        await Task.WhenAll(
            UserDevices.Select(device =>
                notificationPushService.PushToDevice(device, notification, cancellationToken)));
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
                // not a pk as the device might be deleted and created again in the same transaction
                // when transferring the device to someone else
                deviceBuilder.Property(x => x.DeviceId);
                deviceBuilder.HasIndex(x => x.DeviceId).IsUnique();

                deviceBuilder.Property(x => x.UniquenessNotGuaranteed);
                deviceBuilder.Property(x => x.ExpoPushToken);
                deviceBuilder
                    .Property(x => x.Locale)
                    .HasConversion(x => x.Name, x => new CultureInfo(x));
                deviceBuilder
                    .Property(x => x.TimeZone)
                    .HasConversion(x => x.Id, x => TimeZoneInfo.FindSystemTimeZoneById(x));
            });
        builder.OwnsOne(
            x => x.Rating,
            ratingBuilder => { ratingBuilder.Property(x => x.Rating); });

        // we don't filter deleted users as other users might need to see the user's profile
    }
}
