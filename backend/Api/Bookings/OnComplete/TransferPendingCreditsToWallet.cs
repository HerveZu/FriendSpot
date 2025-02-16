using Api.Common;
using Api.Common.Infrastructure;
using Domain.ParkingSpots;
using Domain.Wallets;
using Microsoft.EntityFrameworkCore;

namespace Api.Bookings.OnComplete;

internal sealed class TransferPendingCreditsToWallet(
    ILogger<TransferPendingCreditsToWallet> logger,
    AppDbContext dbContext
) : IDomainEventHandler<ParkingSpotBookingCompleted>
{
    public async Task Handle(ParkingSpotBookingCompleted notification, CancellationToken cancellationToken)
    {
        logger.LogInformation(
            "Transfer pending credits to user {UserId} after booking marked complete",
            notification.OwnerId);

        var transactionReference = notification.BookingId.ToString();

        var userWallet = await dbContext
            .Set<Wallet>()
            .FirstAsync(wallet => wallet.UserId == notification.OwnerId, cancellationToken);

        userWallet.ConfirmPending(transactionReference);

        dbContext.Set<Wallet>().Update(userWallet);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
