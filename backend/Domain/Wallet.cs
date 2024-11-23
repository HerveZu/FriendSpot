using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Domain;

public sealed class Wallet : IUserResource
{
    private readonly List<SpotTransaction> _spotTransactions = [];

    private Wallet(Guid id, string userIdentity, Credits credits)
    {
        Id = id;
        UserIdentity = userIdentity;
        Credits = credits;
    }

    public Guid Id { get; init; }
    public Credits Credits { get; }
    public IReadOnlyList<SpotTransaction> SpotTransactions => _spotTransactions.AsReadOnly();
    public string UserIdentity { get; }

    public static Wallet CreateInitial(string userIdentity, Credits initialCredits)
    {
        return new Wallet(Guid.CreateVersion7(), userIdentity, initialCredits);
    }

    public void NewSpotTransaction(SpotTransaction transaction)
    {
        _spotTransactions.Add(transaction);
    }
}

public sealed class SpotTransaction
{
    private SpotTransaction(Credits earnedCredits, TransactionState state)
    {
        EarnedCredits = earnedCredits;
        State = state;
    }

    public Credits EarnedCredits { get; }
    public TransactionState State { get; }

    public static SpotTransaction FromSpotAvailable(Credits earnedCredits)
    {
        return new SpotTransaction(earnedCredits, TransactionState.Pending);
    }
}

public enum TransactionState
{
    Pending
}

internal sealed class WalletConfig : IEntityConfiguration<Wallet>
{
    public void Configure(EntityTypeBuilder<Wallet> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.UserIdentity);
        builder.Property(x => x.Credits)
            .HasConversion(x => x.Amount, x => new Credits(x));

        builder.HasOne<User>().WithOne().HasForeignKey<Wallet>(x => x.UserIdentity);

        builder.OwnsMany(
            x => x.SpotTransactions,
            transactionBuilder =>
            {
                transactionBuilder.Property(x => x.EarnedCredits)
                    .HasConversion(x => x.Amount, x => new Credits(x));
                transactionBuilder.Property(x => x.State);
            });
    }
}