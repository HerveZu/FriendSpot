using Api.Common;
using Api.Common.Infrastructure;
using Domain.Parkings;
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
    public required decimal Rating { get; init; }
    public required SpotStatus? Spot { get; init; }
    public required WalletStatus Wallet { get; init; }

    [PublicAPI]
    public sealed record WalletStatus
    {
        public required decimal Credits { get; init; }
        public required decimal PendingCredits { get; init; }
    }

    [PublicAPI]
    public sealed record SpotStatus
    {
        public required bool Available { get; init; }
        public required string Name { get; init; }
        public required SpotParking Parking { get; init; }
        public required SpotUser? CurrentlyUsedBy { get; init; }

        [PublicAPI]
        public sealed record SpotParking
        {
            public required Guid Id { get; init; }
            public required string Name { get; init; }
            public required string Address { get; init; }
        }

        [PublicAPI]
        public sealed record SpotUser
        {
            public required string Id { get; init; }
            public required string? PictureUrl { get; init; }
            public required string DisplayName { get; init; }
        }
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

        var now = DateTimeOffset.Now;
        var me = await (from user in dbContext.Set<User>()
            where user.Identity == currentUser.Identity
            select new MeResponse
            {
                DisplayName = user.DisplayName,
                PictureUrl = user.PictureUrl,
                Rating = user.Rating.Rating,
                Spot = dbContext.Set<ParkingSpot>()
                    .Where(spot => spot.OwnerId == user.Identity)
                    .Select(
                        spot => new MeResponse.SpotStatus
                        {
                            CurrentlyUsedBy = spot.Bookings
                                .Where(booking => now >= booking.From && booking.To >= now)
                                .Select(
                                    booking => dbContext.Set<User>()
                                        .First(bookingUser => bookingUser.Identity == booking.BookingUserId))
                                .Select(
                                    bookingUser => new MeResponse.SpotStatus.SpotUser
                                    {
                                        Id = bookingUser.Identity,
                                        DisplayName = bookingUser.DisplayName,
                                        PictureUrl = bookingUser.PictureUrl
                                    })
                                .FirstOrDefault(),
                            Available = spot.Availabilities
                                .Any(availability => now >= availability.From && availability.To >= now),
                            Name = spot.SpotName,
                            Parking = dbContext.Set<Parking>()
                                .Where(parking => parking.Id == spot.ParkingId)
                                .Select(
                                    parking => new MeResponse.SpotStatus.SpotParking
                                    {
                                        Id = parking.Id,
                                        Name = parking.Name,
                                        Address = parking.Address
                                    })
                                .First()
                        })
                    .FirstOrDefault(),
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
