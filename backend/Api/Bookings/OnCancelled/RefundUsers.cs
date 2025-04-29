using Api.Common;
using Api.Common.Infrastructure;
using Domain.ParkingSpots;
using Domain.Wallets;
using Microsoft.EntityFrameworkCore;

namespace Api.Bookings.OnCancelled;

internal sealed class RefundUsers(ILogger<RefundUsers> logger, AppDbContext dbContext)
    : IDomainEventHandler<ParkingSpotBookingCancelled>
{
    public async Task Handle(ParkingSpotBookingCancelled notification, CancellationToken cancellationToken)
    {
        var transactionReference = notification.BookingId.ToString();

        logger.LogInformation(
            "Refund user {UserId} with transaction reference {TransactionReference}",
            notification.BookingUserId,
            transactionReference);

        var ownerWallet = await dbContext
            .Set<Wallet>()
            .FirstAsync(wallet => wallet.UserId == notification.OwnerId, cancellationToken);

        var userWallet = await dbContext
            .Set<Wallet>()
            .FirstAsync(wallet => wallet.UserId == notification.BookingUserId, cancellationToken);

        ownerWallet.Cancel(transactionReference);
        userWallet.Cancel(transactionReference);

        dbContext.Set<Wallet>().UpdateRange(userWallet, ownerWallet);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}