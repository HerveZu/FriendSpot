using Api.Common;
using Api.Common.Infrastructure;
using Domain;
using Domain.Users;
using Domain.Wallets;

namespace Api.Me.OnRegistered;

internal sealed class CreateInitialWallet(AppDbContext dbContext) : IDomainEventHandler<UserRegistered>
{
    public async Task Handle(UserRegistered notification, CancellationToken ct)
    {
        var wallet = Wallet.Create(notification.UserIdentity);
        wallet.Credit(notification.UserIdentity, new Credits(10), TransactionState.Confirmed);

        await dbContext.Set<Wallet>().AddAsync(wallet, ct);
        await dbContext.SaveChangesAsync(ct);
    }
}
