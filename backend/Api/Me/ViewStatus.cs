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
    public required BookingStatus[] Bookings { get; init; }

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

    [PublicAPI]
    public sealed record BookingStatus
    {
        public required Guid BookingId { get; init; }
        public required DateTimeOffset From { get; init; }
        public required TimeSpan Duration { get; init; }
        public required BookingStatusInfo? Info { get; init; }

        [PublicAPI]
        public sealed record BookingStatusInfo
        {
            public required string OwnerId { get; init; }
            public required string SpotName { get; init; }
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

        var spot = await dbContext.Set<ParkingSpot>()
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

        var bookingsPerSpot = await (
                from parkingSpot in dbContext.Set<ParkingSpot>()
                select parkingSpot.Bookings
                    .Where(booking => booking.From >= now)
                    .Where(booking => booking.BookingUserId == currentUser.Identity)
                    .Select(
                        booking => new ViewStatusResponse.BookingStatus
                        {
                            BookingId = booking.Id,
                            From = booking.From,
                            Duration = booking.Duration,
                            Info = booking.From > now
                                ? null
                                : new ViewStatusResponse.BookingStatus.BookingStatusInfo
                                {
                                    OwnerId = parkingSpot.OwnerId,
                                    SpotName = parkingSpot.SpotName
                                }
                        })
            )
            .AsNoTracking()
            .ToArrayAsync(ct);

        var bookings = bookingsPerSpot
            .SelectMany(bookings => bookings)
            .ToArray();

        await SendOkAsync(
            new ViewStatusResponse
            {
                AvailableSpots = availableSpotsCount,
                Bookings = bookings,
                Wallet = walletStatus,
                Spot = spot
            },
            ct);
    }
}
