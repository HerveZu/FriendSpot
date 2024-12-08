using Api.Common;
using Api.Common.Infrastructure;
using Domain.Parkings;
using Domain.ParkingSpots;
using Domain.Wallets;
using FastEndpoints;
using JetBrains.Annotations;
using Microsoft.EntityFrameworkCore;

namespace Api.Me;

[PublicAPI]
public sealed record ViewStatusResponse
{
    public required WalletStatus Wallet { get; init; }
    public required int AvailableSpots { get; init; }

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
        var currentUser = HttpContext.ToCurrentUser();
        var now = DateTimeOffset.UtcNow;

        var walletStatus = await (from wallet in dbContext.Set<Wallet>()
            select new ViewStatusResponse.WalletStatus
            {
                Credits = wallet.Credits,
                PendingCredits = wallet.PendingCredits
            }).FirstAsync(ct);

        var availableSpotsCount = await (
                from myParking in from parkingLot in dbContext.Set<ParkingSpot>()
                    where parkingLot.OwnerId == currentUser.Identity
                    join parking in dbContext.Set<Parking>() on parkingLot.ParkingId equals parking.Id
                    select parking
                join parkingLot in dbContext.Set<ParkingSpot>() on myParking.Id equals parkingLot.ParkingId
                where parkingLot.OwnerId != currentUser.Identity
                where parkingLot.Availabilities
                    .Any(availability => availability.From <= now && availability.To >= now)
                select parkingLot)
            .CountAsync(ct);
        
        await SendOkAsync(
            new ViewStatusResponse
            {
                Wallet = walletStatus,
                AvailableSpots = availableSpotsCount
            },
            ct);
    }
}
