using Api.Common;
using Api.Common.Infrastructure;
using Domain.Parkings;
using Domain.Wallets;
using Microsoft.EntityFrameworkCore;

namespace Api.BookingRequests.OnBookingRequested;

internal sealed class TakeDeposit(AppDbContext dbContext, ILogger<TakeDeposit> logger)
    : IDomainEventHandler<BookingRequested>
{
    public async Task Handle(BookingRequested notification, CancellationToken cancellationToken)
    {
        var request = notification.Request;

        var requesterWallet = await dbContext
            .Set<Wallet>()
            .FirstAsync(wallet => wallet.UserId == request.RequesterId, cancellationToken);

        logger.LogInformation(
            "Taking a deposit from user {UserId} of {Amount} credits for the booking request",
            request.RequesterId,
            request.Cost);

        requesterWallet.Charge(request.Id.ToString(), request.Cost);

        dbContext.Set<Wallet>().Update(requesterWallet);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}