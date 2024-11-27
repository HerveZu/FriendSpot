using Api.Common;
using Api.Common.Infrastructure;
using Domain.ParkingSpots;
using Domain.Wallets;
using Microsoft.EntityFrameworkCore;

namespace Api.Bookings.OnSpotAvailable;

internal sealed class CreditAsPending(AppDbContext dbContext) : IDomainEventHandler<ParkingSpotAvailable>
{
    public async Task Handle(ParkingSpotAvailable notification, CancellationToken cancellationToken)
    {
        var wallet = await dbContext.Set<Wallet>().FirstAsync(cancellationToken);

        wallet.Credit(
            notification.AvailabilityId.ToString(),
            notification.Credits,
            TransactionState.Pending);

        dbContext.Set<Wallet>().Update(wallet);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
