using Api.Common;
using Api.Common.Contracts;
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
    public required string Id { get; init; }
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
        public required string Name { get; init; }
        public required ParkingResponse Parking { get; init; }
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
                    Id = user.Identity,
                    DisplayName = user.DisplayName,
                    PictureUrl = user.PictureUrl,
                    Rating = user.Rating.Rating,
                    BookingToRate = dbContext.Set<ParkingSpot>()
                        .SelectMany(spot => spot.Bookings
                            .Where(booking => booking.BookingUserId == user.Identity)
                            .Where(booking => booking.To < now)
                            .Select(booking => new { booking, spotId = spot.Id }))
                        .OrderByDescending(x => x.booking.To)
                        .Take(1)
                        .Where(x => x.booking.Rating == null)
                        .Select(x => new MeResponse.Booking
                        {
                            Id = x.booking.Id,
                            ParkingLotId = x.spotId
                        })
                        .FirstOrDefault(),
                    Spot = (from spot in dbContext.Set<ParkingSpot>()
                        join parking in dbContext.Set<Parking>().ToParkingResponse(dbContext.Set<ParkingSpot>())
                            on spot.ParkingId equals parking.Id
                        where spot.OwnerId == user.Identity
                        select new MeResponse.SpotStatus
                        {
                            Id = spot.Id,
                            Name = spot.SpotName,
                            Parking = parking
                        }).FirstOrDefault(),
                    Wallet = dbContext.Set<Wallet>()
                        .Where(wallet => wallet.UserId == currentUser.Identity)
                        .Select(wallet => new MeResponse.WalletStatus
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
