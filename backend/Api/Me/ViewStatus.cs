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
    public required SpotStatus? Spot { get; init; }
    public required WalletStatus Wallet { get; init; }
    public required int AvailableSpots { get; init; }

    [PublicAPI]
    public sealed record WalletStatus
    {
        public required decimal Credits { get; init; }
        public required decimal PendingCredits { get; init; }
    }

    [PublicAPI]
    public sealed record SpotStatus
    {
        public required TimeSpan TotalSpotAvailability { get; init; }
        public required Availability[] Availabilities { get; init; }

        [PublicAPI]
        public sealed record Availability
        {
            public required DateTimeOffset From { get; init; }
            public required DateTimeOffset To { get; init; }
            public required TimeSpan Duration { get; init; }
        }
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

        var spot = await dbContext.Set<ParkingLot>()
            .Select(
                parkingLot => new ViewStatusResponse.SpotStatus
                {
                    TotalSpotAvailability = TimeSpan.FromSeconds(
                        parkingLot.Availabilities.Sum(availability => availability.Duration.TotalSeconds)),
                    Availabilities = parkingLot.Availabilities
                        .Select(
                            availability => new ViewStatusResponse.SpotStatus.Availability
                            {
                                From = availability.From,
                                To = availability.To,
                                Duration = availability.Duration
                            })
                        .ToArray()
                })
            .FirstOrDefaultAsync(ct);

        var walletStatus = await (from wallet in dbContext.Set<Wallet>()
            select new ViewStatusResponse.WalletStatus
            {
                Credits = wallet.Credits,
                PendingCredits = wallet.PendingCredits
            }).FirstAsync(ct);

        var availableSpotsCount = await (
                from myParking in from parkingLot in dbContext.Set<ParkingLot>()
                    where parkingLot.UserIdentity == currentUser.Identity
                    join parking in dbContext.Set<Parking>() on parkingLot.ParkingId equals parking.Id
                    select parking
                join parkingLot in dbContext.Set<ParkingLot>() on myParking.Id equals parkingLot.ParkingId
                where parkingLot.UserIdentity != currentUser.Identity
                select new
                {
                    Count = (from availability in parkingLot.Availabilities
                        where availability.From <= now && availability.To >= now
                        select availability).Count()
                })
            .IgnoreQueryFilters()
            .SumAsync(x => x.Count, ct);

        await SendOkAsync(
            new ViewStatusResponse
            {
                AvailableSpots = availableSpotsCount,
                Wallet = walletStatus,
                Spot = spot
            },
            ct);
    }
}