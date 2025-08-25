using Domain.Users;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Domain.UserProducts;

public sealed class UserProducts : IAggregateRoot
{
    private readonly DomainEvents _domainEvents = new();

    private UserProducts(Guid id, string transactionId, string userId, string productId, DateTimeOffset? expiresAt)
    {
        Id = id;
        TransactionId = transactionId;
        UserId = userId;
        ProductId = productId;
        ExpiresAt = expiresAt;
    }

    public Guid Id { get; init; }
    public string TransactionId { get; init; }
    public string UserId { get; init; }
    public string ProductId { get; }
    public DateTimeOffset? ExpiresAt { get; }

    public IEnumerable<IDomainEvent> GetUncommittedEvents()
    {
        return _domainEvents.GetUncommittedEvents();
    }

    public static UserProducts Activate(
        string transactionId,
        string userId,
        string productId,
        DateTimeOffset? expiresAt)
    {
        return new UserProducts(Guid.CreateVersion7(), transactionId, userId, productId, expiresAt);
    }
}

internal sealed class UserProductConfig : IEntityConfiguration<UserProducts>
{
    public void Configure(EntityTypeBuilder<UserProducts> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.TransactionId);
        builder.HasIndex(x => x.TransactionId).IsUnique();
        ;
        builder.Property(x => x.ProductId);
        builder.Property(x => x.ExpiresAt);
        builder.HasOne<User>().WithMany().HasForeignKey(x => x.UserId);
    }
}
