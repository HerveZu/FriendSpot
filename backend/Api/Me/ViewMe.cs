using Api.Common;
using Api.Common.Infrastructure;
using Domain.ParkingSpots;
using Domain.Users;
using Domain.Wallets;
using FastEndpoints;
using JetBrains.Annotations;
using Microsoft.EntityFrameworkCore;

namespace Api.Me;

[PublicAPI]
public sealed record MeResponse
{
    public required string DisplayName { get; init; }
    public required string? PictureUrl { get; init; }
    public required bool HasSpot { get; init; }
    public required WalletStatus Wallet { get; init; }

    [PublicAPI]
    public sealed record WalletStatus
    {
        public required decimal Credits { get; init; }
        public required decimal PendingCredits { get; init; }
    }
}

internal sealed class ViewStatus(AppDbContext dbContext) : EndpointWithoutRequest<MeResponse>
{
    public override void Configure()
    {
        Get("/@me");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var currentUser = HttpContext.ToCurrentUser();

        var me = await (from user in dbContext.Set<User>()
            where user.Identity == currentUser.Identity
            select new MeResponse
            {
                DisplayName = user.DisplayName,
                PictureUrl = user.PictureUrl,
                HasSpot = dbContext.Set<ParkingSpot>().Any(spot => spot.OwnerId == user.Identity),
                Wallet = dbContext.Set<Wallet>()
                    .Select(
                        wallet => new MeResponse.WalletStatus
                        {
                            Credits = wallet.Credits,
                            PendingCredits = wallet.PendingCredits
                        })
                    .First()
            }).FirstAsync(ct);

        await SendOkAsync(me, ct);
    }
}
