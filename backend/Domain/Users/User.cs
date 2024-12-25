using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Domain.Users;

public sealed record UserRegistered : IDomainEvent
{
    public required string UserId { get; init; }
}

public sealed class User : IBroadcastEvents
{
    private readonly DomainEvents _domainEvents = new();

    private User(string identity)
    {
        Identity = identity;
    }

    public string Identity { get; init; }

    public IEnumerable<IDomainEvent> GetUncommittedEvents()
    {
        return _domainEvents.GetUncommittedEvents();
    }

    public static User Register(string identity)
    {
        if (string.IsNullOrWhiteSpace(identity))
        {
            throw new BusinessException("Users.InvalidIdentity", "Cannot register null or empty identity.");
        }

        var user = new User(identity);

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
    }
}
