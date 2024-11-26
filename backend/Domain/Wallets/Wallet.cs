using Domain.Users;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Domain.Wallets;

public sealed class Wallet : IUserResource
{
    private readonly List<CreditsTransaction> _transactions = [];

    private Wallet(Guid id, string userIdentity)
    {
        Id = id;
        UserIdentity = userIdentity;
    }

    public Guid Id { get; init; }
    public string UserIdentity { get; }
    public IReadOnlyList<CreditsTransaction> Transactions => _transactions.AsReadOnly();

    public Credits Credits => new(
        _transactions
            .Where(transaction => transaction.State is TransactionState.Confirmed)
            .Sum(transaction => transaction.Credits.Amount));

    public Credits PendingCredits => new(
        _transactions
            .Where(transaction => transaction.State is TransactionState.Pending)
            .Sum(transaction => transaction.Credits.Amount));

    public static Wallet Create(string userIdentity)
    {
        return new Wallet(Guid.CreateVersion7(), userIdentity);
    }

    public void IdempotentTransaction(CreditsTransaction newTransaction)
    {
        if (!newTransaction.HasAnyEffect)
        {
            return;
        }

        var existingTransaction = _transactions
            .FirstOrDefault(transaction => transaction.Reference == newTransaction.Reference);

        if (existingTransaction is not null)
        {
            _transactions.Remove(existingTransaction);
        }

        _transactions.Add(newTransaction);
    }

    public void CancelTransaction(string reference)
    {
        var transaction = _transactions.FirstOrDefault(transaction => transaction.Reference == reference);

        if (transaction is null)
        {
            return;
        }

        _transactions.Remove(transaction);
    }
}

internal sealed class WalletConfig : IEntityConfiguration<Wallet>
{
    public void Configure(EntityTypeBuilder<Wallet> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.UserIdentity);

        builder.HasOne<User>().WithOne().HasForeignKey<Wallet>(x => x.UserIdentity);
        builder.OwnsMany(
            x => x.Transactions,
            transactionBuilder =>
            {
                transactionBuilder.Property(x => x.Reference);
                transactionBuilder.HasIndex(x => x.Reference).IsUnique();

                transactionBuilder.Property(x => x.State);
                transactionBuilder
                    .Property(transaction => transaction.Credits)
                    .HasConversion(x => x.Amount, x => new Credits(x));
            });
    }
}