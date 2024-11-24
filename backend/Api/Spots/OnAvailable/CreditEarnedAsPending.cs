using Api.Common;
using Api.Common.Infrastructure;
using Domain.ParkingSpots;
using Domain.Wallets;
using Microsoft.EntityFrameworkCore;

namespace Api.Spots.OnAvailable;

internal sealed class CreditEarnedAsPending(AppDbContext dbContext) : IDomainEventHandler<ParkingSpotAvailable>
{
    public async Task Handle(ParkingSpotAvailable notification, CancellationToken cancellationToken)
    {
        var wallet = await dbContext.Set<Wallet>().FirstAsync(cancellationToken);
        wallet.CreditPending(notification.EarnedCredits);

        dbContext.Set<Wallet>().Update(wallet);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
