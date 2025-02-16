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
    public required Booking? BookingToRate { get; init; }

    [PublicAPI]
    public sealed record Booking
    {
        public required Guid ParkingLotId { get; init; }
        public required Guid Id { get; init; }
    }

    [PublicAPI]
    public sealed record WalletStatus
    {
        public required decimal Credits { get; init; }
        public required decimal PendingCredits { get; init; }
    }

    [PublicAPI]
    public sealed record SpotStatus
    {
        public required Guid Id { get; init; }
        public required bool CurrentlyAvailable { get; init; }
        public required DateTimeOffset? NextAvailability { get; init; }
        public required DateTimeOffset? NextUse { get; init; }
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
            public required DateTimeOffset UsingUntil { get; init; }
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
                    BookingToRate = dbContext.Set<ParkingSpot>()
                        .SelectMany(
                            spot => spot.Bookings
                                .Where(booking => booking.BookingUserId == user.Identity)
                                .Where(booking => booking.To < now)
                                .Select(booking => new { booking, spotId = spot.Id }))
                        .OrderByDescending(x => x.booking.To)
                        .Take(1)
                        .Where(x => x.booking.Rating == null)
                        .Select(
                            x => new MeResponse.Booking
                            {
                                Id = x.booking.Id,
                                ParkingLotId = x.spotId
                            })
                        .FirstOrDefault(),
                    Spot = dbContext.Set<ParkingSpot>()
                        .Where(spot => spot.OwnerId == user.Identity)
                        .Select(
                            spot => new MeResponse.SpotStatus
                            {
                                Id = spot.Id,
                                CurrentlyUsedBy = spot.Bookings
                                    .Where(booking => now >= booking.From && booking.To >= now)
                                    .Select(
                                        booking => new
                                        {
                                            Booking = booking,
                                            User = dbContext
                                                .Set<User>()
                                                .First(bookingUser => bookingUser.Identity == booking.BookingUserId)
                                        })
                                    .Select(
                                        x => new MeResponse.SpotStatus.SpotUser
                                        {
                                            Id = x.User.Identity,
                                            DisplayName = x.User.DisplayName,
                                            PictureUrl = x.User.PictureUrl,
                                            UsingUntil = x.Booking.To
                                        })
                                    .FirstOrDefault(),
                                CurrentlyAvailable = spot.Availabilities
                                    .Any(availability => now >= availability.From && availability.To >= now),
                                NextAvailability = spot.Availabilities
                                    .Where(availability => availability.From > now)
                                    .Select(availability => availability.From)
                                    .Order()
                                    .First(),
                                NextUse = spot.Bookings
                                    .Where(booking => booking.From > now)
                                    .Select(booking => booking.From)
                                    .Order()
                                    .First(),
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
                        .Where(wallet => wallet.UserId == currentUser.Identity)
                        .Select(
                            wallet => new MeResponse.WalletStatus
                            {
                                Credits = wallet.Credits,
                                PendingCredits = wallet.PendingCredits
                            })
                        .First()
                })
            .AsNoTracking()
            .AsSplitQuery()
            .FirstAsync(ct);

        await SendOkAsync(me, ct);
    }
}
