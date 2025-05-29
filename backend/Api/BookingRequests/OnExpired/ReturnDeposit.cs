using Api.Common;
using Api.Common.Infrastructure;
using Domain.Parkings;
using Domain.Wallets;
using Microsoft.EntityFrameworkCore;

namespace Api.BookingRequests.OnExpired;

internal sealed class ReturnDeposit(AppDbContext dbContext, ILogger<ReturnDeposit> logger)
    : IDomainEventHandler<BookingRequestExpired>
{
    public async Task Handle(BookingRequestExpired notification, CancellationToken cancellationToken)
    {
        var request = notification.Request;

        var requesterWallet = await dbContext
            .Set<Wallet>()
            .FirstAsync(wallet => wallet.UserId == request.RequesterId, cancellationToken);

        logger.LogInformation("Returning deposit for requester {UserId}", request.RequesterId);
        requesterWallet.Cancel(request.Id.ToString());

        dbContext.Set<Wallet>().Update(requesterWallet);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
