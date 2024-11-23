using Api.Common.Infrastructure;
using Domain;
using FastEndpoints;
using JetBrains.Annotations;
using Microsoft.EntityFrameworkCore;

namespace Api.Me;

[PublicAPI]
public sealed record ViewStatusResponse
{
    public required SpotStatus? Spot { get; init; }
    public required WalletStatus Wallet { get; init; }

    [PublicAPI]
    public sealed record WalletStatus
    {
        public required decimal TemporaryCredits { get; init; }
    }

    [PublicAPI]
    public sealed record SpotStatus
    {
        public required TimeSpan TotalSpotAvailability { get; init; }
        public required Availability[] Availabilities { get; init; }

        [PublicAPI]
        public sealed record Availability
        {
            public required DateTime From { get; init; }
            public required DateTime To { get; init; }
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
                TemporaryCredits = wallet.SpotTransactions
                    .Where(transaction => transaction.State == TransactionState.Pending)
                    .Sum(transaction => transaction.EarnedCredits)
            }).FirstAsync(ct);

        await SendOkAsync(
            new ViewStatusResponse
            {
                Wallet = walletStatus,
                Spot = spot
            },
            ct);
    }
}
