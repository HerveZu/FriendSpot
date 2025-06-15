using Api.Common;
using Api.Common.Infrastructure;
using Domain.Parkings;
using Domain.Wallets;
using Microsoft.EntityFrameworkCore;

namespace Api.BookingRequests.OnExpired;

internal sealed class ReturnDeposit(AppDbContext dbContext, ILogger<ReturnDeposit> logger)
    : IDomainEventHandler<BookingRequestExpired>
{
    public async Task Handle(BookingRequestExpired @event, CancellationToken cancellationToken)
    {
        var requesterWallet = await dbContext
            .Set<Wallet>()
            .FirstAsync(wallet => wallet.UserId == @event.RequesterId, cancellationToken);

        logger.LogInformation("Returning deposit for requester {UserId}", @event.RequesterId);
        requesterWallet.Cancel(@event.RequestId.ToString());

        dbContext.Set<Wallet>().Update(requesterWallet);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
