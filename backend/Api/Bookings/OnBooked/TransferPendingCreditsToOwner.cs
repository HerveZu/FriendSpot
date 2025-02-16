using Api.Common;
using Api.Common.Infrastructure;
using Domain.ParkingSpots;
using Domain.Wallets;
using Microsoft.EntityFrameworkCore;

namespace Api.Bookings.OnBooked;

internal sealed class TransferPendingCreditsToOwner(
    ILogger<TransferPendingCreditsToOwner> logger,
    AppDbContext dbContext
)
    : IDomainEventHandler<ParkingSpotBooked>
{
    public async Task Handle(ParkingSpotBooked notification, CancellationToken cancellationToken)
    {
        var transactionReference = notification.BookingId.ToString();

        logger.LogInformation(
            "Transfer pending credits to owner {OwnerId} from user {UserId} with transaction reference {TransactionReference}",
            notification.OwnerId,
            notification.UserId,
            transactionReference);

        var ownerWallet = await dbContext
            .Set<Wallet>()
            .FirstAsync(wallet => wallet.UserId == notification.OwnerId, cancellationToken);

        var userWallet = await dbContext
            .Set<Wallet>()
            .FirstAsync(wallet => wallet.UserId == notification.UserId, cancellationToken);

        userWallet.Charge(transactionReference, notification.Cost);
        ownerWallet.CreditPending(transactionReference, notification.Cost);

        dbContext.Set<Wallet>().UpdateRange(userWallet, ownerWallet);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
