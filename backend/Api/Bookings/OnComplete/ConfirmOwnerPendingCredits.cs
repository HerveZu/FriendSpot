using Api.Common;
using Api.Common.Infrastructure;
using Domain.ParkingSpots;
using Domain.Wallets;
using Microsoft.EntityFrameworkCore;

namespace Api.Bookings.OnComplete;

internal sealed class ConfirmOwnerPendingCredits(
    ILogger<ConfirmOwnerPendingCredits> logger,
    AppDbContext dbContext
) : IDomainEventHandler<ParkingSpotBookingCompleted>
{
    public async Task Handle(ParkingSpotBookingCompleted notification, CancellationToken cancellationToken)
    {
        logger.LogInformation(
            "Confirming owner {OwnerId} pending credits after booking marked complete",
            notification.OwnerId);

        var transactionReference = notification.BookingId.ToString();

        var ownerWallet = await dbContext
            .Set<Wallet>()
            .FirstAsync(wallet => wallet.UserId == notification.OwnerId, cancellationToken);

        ownerWallet.ConfirmPending(transactionReference);

        dbContext.Set<Wallet>().Update(ownerWallet);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
