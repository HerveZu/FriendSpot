using Api.Common;
using Api.Common.Infrastructure;
using Domain.ParkingSpots;
using Domain.Wallets;
using Microsoft.EntityFrameworkCore;

namespace Api.Bookings.OnCancelled;

internal sealed class RefundUse(AppDbContext dbContext) : IDomainEventHandler<ParkingSpotBookingCancelled>
{
    public async Task Handle(ParkingSpotBookingCancelled notification, CancellationToken cancellationToken)
    {
        var userWallet = await dbContext.Set<Wallet>()
            .Where(wallet => wallet.UserId == notification.BookingUserId)
            .IgnoreQueryFilters()
            .FirstAsync(cancellationToken);

        userWallet.CancelTransaction(notification.BookingId.ToString());

        dbContext.Set<Wallet>().Update(userWallet);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
