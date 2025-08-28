using Domain.Users;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Domain.UserProducts;

public sealed class UserProduct : IAggregateRoot
{
    private readonly DomainEvents _domainEvents = new();

    private UserProduct(Guid id, string transactionId, string userId, string productId, DateTimeOffset? expiresAt)
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
    public bool IsActive => ExpiresAt is null || ExpiresAt > DateTimeOffset.UtcNow;

    public IEnumerable<IDomainEvent> GetUncommittedEvents()
    {
        return _domainEvents.GetUncommittedEvents();
    }

    public static UserProduct Activate(
        string transactionId,
        string userId,
        string productId,
        DateTimeOffset? expiresAt)
    {
        return new UserProduct(Guid.CreateVersion7(), transactionId, userId, productId, expiresAt);
    }
}

internal sealed class UserProductConfig : IEntityConfiguration<UserProduct>
{
    public void Configure(EntityTypeBuilder<UserProduct> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.TransactionId);
        builder.HasIndex(x => x.TransactionId).IsUnique();

        builder.Property(x => x.ProductId);
        builder.Property(x => x.ExpiresAt);
        builder.HasOne<User>().WithMany().HasForeignKey(x => x.UserId);
    }
}