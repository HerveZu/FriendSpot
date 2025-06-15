using Api.Common;
using Api.Common.Infrastructure;
using Domain.Parkings;
using Domain.Wallets;
using Microsoft.EntityFrameworkCore;

namespace Api.BookingRequests.OnBookingRequested;

internal sealed class TakeDeposit(AppDbContext dbContext, ILogger<TakeDeposit> logger)
    : IDomainEventHandler<BookingRequested>
{
    public async Task Handle(BookingRequested @event, CancellationToken cancellationToken)
    {
        var requesterWallet = await dbContext
            .Set<Wallet>()
            .FirstAsync(wallet => wallet.UserId == @event.RequesterId, cancellationToken);

        logger.LogInformation(
            "Taking a deposit from user {UserId} of {Amount} credits for the booking request",
            @event.RequesterId,
            @event.Cost);

        requesterWallet.Charge(@event.RequestId.ToString(), @event.Cost);

        dbContext.Set<Wallet>().Update(requesterWallet);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
