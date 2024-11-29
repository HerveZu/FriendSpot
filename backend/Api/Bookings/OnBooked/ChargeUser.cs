using Api.Common;
using Api.Common.Infrastructure;
using Domain.ParkingSpots;
using Domain.Wallets;
using Microsoft.EntityFrameworkCore;

namespace Api.Bookings.OnBooked;

internal sealed class ChargeUser(AppDbContext dbContext) : IDomainEventHandler<ParkingSpotBooked>
{
    public async Task Handle(ParkingSpotBooked notification, CancellationToken cancellationToken)
    {
        var wallet = await dbContext.Set<Wallet>().FirstAsync(cancellationToken);

        wallet.Charge(
            notification.AvailabilityId.ToString(),
            notification.Cost);

        dbContext.Set<Wallet>().Update(wallet);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
