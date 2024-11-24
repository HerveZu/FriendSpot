using Domain.Users;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Domain.Wallets;

public sealed class Wallet : IUserResource
{
    private Wallet(Guid id, string userIdentity, Credits credits)
    {
        Id = id;
        UserIdentity = userIdentity;
        Credits = credits;
    }

    public Guid Id { get; init; }
    public Credits Credits { get; private set; }
    public Credits PendingCredits { get; private set; }
    public string UserIdentity { get; }

    public static Wallet CreateInitial(string userIdentity, Credits initialCredits)
    {
        return new Wallet(Guid.CreateVersion7(), userIdentity, initialCredits);
    }

    public void ConfirmCredit(Credits credits)
    {
        if (credits.Amount > PendingCredits.Amount)
        {
            throw new InvalidOperationException("Cannot confirm your credit beyond the pending credits.");
        }

        PendingCredits -= credits;
        Credits += credits;
    }

    public void CreditPending(Credits credits)
    {
        if (credits.Amount < 0)
        {
            throw new InvalidOperationException($"Cannot credits less than zero ({credits})");
        }

        PendingCredits += credits;
    }
}

internal sealed class WalletConfig : IEntityConfiguration<Wallet>
{
    public void Configure(EntityTypeBuilder<Wallet> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.UserIdentity);
        builder.Property(x => x.Credits)
            .HasConversion(x => x.Amount, x => new Credits(x));
        builder.Property(x => x.PendingCredits)
            .HasConversion(x => x.Amount, x => new Credits(x));

        builder.HasOne<User>().WithOne().HasForeignKey<Wallet>(x => x.UserIdentity);
    }
}
