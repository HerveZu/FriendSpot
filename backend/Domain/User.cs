using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Domain;

public sealed record UserRegistered : IDomainEvent
{
    public required string UserIdentity { get; init; }
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
        var user = new User(identity);

        user._domainEvents.Register(
            new UserRegistered
            {
                UserIdentity = user.Identity
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