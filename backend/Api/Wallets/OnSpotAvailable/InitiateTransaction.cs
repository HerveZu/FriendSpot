using Api.Common;
using Api.Common.Infrastructure;
using Domain;
using Microsoft.EntityFrameworkCore;

namespace Api.Wallets.OnSpotAvailable;

internal sealed class InitiateTransaction(AppDbContext dbContext) : IDomainEventHandler<ParkingSpotAvailable>
{
    public async Task Handle(ParkingSpotAvailable notification, CancellationToken ct)
    {
        if (notification.EarnedCredits.None)
        {
            return;
        }

        var wallet = await dbContext.Set<Wallet>().FirstAsync(ct);
        wallet.NewSpotTransaction(SpotTransaction.FromSpotAvailable(notification.EarnedCredits));

        dbContext.Set<Wallet>().Update(wallet);
        await dbContext.SaveChangesAsync(ct);
    }
}