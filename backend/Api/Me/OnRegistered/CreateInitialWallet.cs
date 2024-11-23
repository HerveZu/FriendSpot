using Api.Common;
using Api.Common.Infrastructure;
using Domain;

namespace Api.Me.OnRegistered;

internal sealed class CreateInitialWallet(AppDbContext dbContext) : IDomainEventHandler<UserRegistered>
{
    public async Task Handle(UserRegistered notification, CancellationToken ct)
    {
        var wallet = Domain.Wallet.CreateInitial(notification.UserIdentity, new Credits(10));

        await dbContext.Set<Domain.Wallet>().AddAsync(wallet, ct);
        await dbContext.SaveChangesAsync(ct);
    }
}
