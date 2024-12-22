using Api.Common;
using Api.Common.Infrastructure;
using Domain.ParkingSpots;
using Domain.Wallets;
using FastEndpoints;
using JetBrains.Annotations;
using Microsoft.EntityFrameworkCore;

namespace Api.Me;

[PublicAPI]
public sealed record ViewStatusResponse
{
    public required bool HasSpot { get; init; }
    public required WalletStatus Wallet { get; init; }

    [PublicAPI]
    public sealed record WalletStatus
    {
        public required decimal Credits { get; init; }
        public required decimal PendingCredits { get; init; }
    }
}

internal sealed class ViewStatus(AppDbContext dbContext) : EndpointWithoutRequest<ViewStatusResponse>
{
    public override void Configure()
    {
        Get("/@me/status");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var user = HttpContext.ToCurrentUser();

        var walletStatus = await (from wallet in dbContext.Set<Wallet>()
            select new ViewStatusResponse.WalletStatus
            {
                Credits = wallet.Credits,
                PendingCredits = wallet.PendingCredits
            }).FirstAsync(ct);

        var hasSpot = await dbContext.Set<ParkingSpot>()
            .AnyAsync(spot => spot.OwnerId == user.Identity, ct);

        await SendOkAsync(
            new ViewStatusResponse
            {
                HasSpot = hasSpot,
                Wallet = walletStatus
            },
            ct);
    }
}
