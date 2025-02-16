using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Domain.Users;

public sealed record UserRegistered : IDomainEvent
{
    public required string UserId { get; init; }
}

public sealed class User : IBroadcastEvents
{
    private readonly DomainEvents _domainEvents = new();

    private User(string identity, string displayName)
    {
        Identity = identity;
        DisplayName = displayName;
    }

    public string Identity { get; init; }
    public string DisplayName { get; private set; }
    public string? PictureUrl { get; private set; }
    public UserRating Rating { get; init; } = null!;

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

internal sealed class UserConfig : IEntityConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasKey(x => x.Identity);
        builder.Property(x => x.DisplayName);
        builder.Property(x => x.PictureUrl);
        builder.OwnsOne(
            x => x.Rating,
            ratingBuilder => { ratingBuilder.Property(x => x.Rating); });
    }
}
