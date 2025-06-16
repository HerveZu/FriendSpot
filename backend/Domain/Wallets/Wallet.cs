using Domain.Users;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Domain.Wallets;

public sealed class Wallet
{
    private readonly List<CreditsTransaction> _transactions = [];

    private Wallet(Guid id, string userId)
    {
        Id = id;
        UserId = userId;
    }

    public Guid Id { get; init; }
    public IReadOnlyList<CreditsTransaction> Transactions => _transactions.AsReadOnly();

    public Credits Credits => new(
        _transactions
            .Where(transaction => transaction.State is TransactionState.Confirmed)
            .Sum(transaction => transaction.Credits.Amount));

    public Credits PendingCredits => new(
        _transactions
            .Where(transaction => transaction.State is TransactionState.Pending)
            .Sum(transaction => transaction.Credits.Amount));

    public string UserId { get; }

    public static Wallet Create(string userId)
    {
        return new Wallet(Guid.CreateVersion7(), userId);
    }

    public void Charge(string reference, Credits credits)
    {
        if (credits.Amount < 0)
        {
            throw new BusinessException("Wallet.NegativeChargeAmount", "Cannot charge a negative amount.");
        }

        if (Credits < credits.Amount)
        {
            throw new BusinessException(
                "Wallet.NotEnoughCredits",
                $"Not enough credits ({Credits}), required at least {credits}.");
        }

        IdempotentTransaction(CreditsTransaction.Create(reference, -credits, TransactionState.Confirmed));
    }

    public void Cancel(string reference)
    {
        var transaction = _transactions.SingleOrDefault(transaction => transaction.Reference == reference)
                          ?? throw new BusinessException(
                              "Wallet.CannotCancel",
                              $"This transaction '{reference}' does not exist.");
        _transactions.Remove(transaction);
    }

    public void CreditConfirmed(string reference, Credits credits)
    {
        Credit(reference, credits, TransactionState.Confirmed);
    }

    public void CreditPending(string reference, Credits credits)
    {
        Credit(reference, credits, TransactionState.Pending);
    }

    public void ConfirmPending(string reference)
    {
        var transaction = _transactions.SingleOrDefault(transaction => transaction.Reference == reference)
                          ?? throw new BusinessException(
                              "Wallet.CannotConfirmPending",
                              $"This transaction '{reference}' does not exist.");

        if (transaction.State is not TransactionState.Pending)
        {
            throw new BusinessException("Wallet.CannotConfirmPending", "Transaction is not pending");
        }

        _transactions.Remove(transaction);

        Credit(reference, transaction.Credits, TransactionState.Confirmed);
    }

    private void Credit(string reference, Credits credits, TransactionState state)
    {
        if (credits.Amount < 0)
        {
            throw new BusinessException("Wallet.NegativeCreditAmount", "Cannot credit a negative amount.");
        }

        IdempotentTransaction(CreditsTransaction.Create(reference, credits, state));
    }

    private void IdempotentTransaction(CreditsTransaction newTransaction)
    {
        var existingTransaction = _transactions
            .SingleOrDefault(transaction => transaction.Reference == newTransaction.Reference);

        if (existingTransaction is not null)
        {
            _transactions.Remove(existingTransaction);
        }

        _transactions.Add(newTransaction);
    }
}

internal sealed class WalletConfig : IEntityConfiguration<Wallet>
{
    public void Configure(EntityTypeBuilder<Wallet> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.UserId);

        builder.HasOne<User>().WithOne().HasForeignKey<Wallet>(x => x.UserId);
        builder.OwnsMany(
            x => x.Transactions,
            transactionBuilder =>
            {
                transactionBuilder.Property(x => x.Reference);
                transactionBuilder.HasIndex(
                        nameof(Wallet) + nameof(Wallet.Id),
                        nameof(CreditsTransaction.Reference))
                    .IsUnique();

                transactionBuilder.Property(x => x.State);
                transactionBuilder
                    .Property(transaction => transaction.Credits)
                    .HasConversion(x => x.Amount, x => new Credits(x));
            });
    }
}
