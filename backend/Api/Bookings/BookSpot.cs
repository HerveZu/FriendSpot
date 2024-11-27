using Api.Common;
using Api.Common.Infrastructure;
using Domain.Bookings;
using Domain.ParkingSpots;
using Domain.Wallets;
using FastEndpoints;
using JetBrains.Annotations;
using Microsoft.EntityFrameworkCore;

namespace Api.Bookings;

[PublicAPI]
public sealed record BookSpotRequest
{
    public required Guid ParkingLotId { get; init; }
    public required DateTimeOffset From { get; init; }
    public required TimeSpan Duration { get; init; }
}

[PublicAPI]
public sealed record BookSpotResponse
{
    public required Guid BookingId { get; init; }
    public required decimal UsedCredits { get; init; }
}

internal sealed class BookSpot(AppDbContext dbContext) : Endpoint<BookSpotRequest>
{
    public override void Configure()
    {
        Post("/spots/booking");
    }

    public override async Task HandleAsync(BookSpotRequest req, CancellationToken ct)
    {
        var currentUser = HttpContext.ToCurrentUser();

        var parkingLot = await dbContext.Set<ParkingLot>()
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(parkingLot => parkingLot.Id == req.ParkingLotId, ct);

        if (parkingLot is null)
        {
            ThrowError("Parking lot not found");
            return;
        }

        if (parkingLot.UserIdentity == currentUser.Identity)
        {
            ThrowError("Cannot book own parking lot");
            return;
        }

        var until = req.From + req.Duration;
        var availability = parkingLot.Availabilities
            .FirstOrDefault(availability => availability.From <= req.From && availability.To >= until);

        if (availability is null)
        {
            ThrowError($"This parking spot has no availability from {req.From} to {until}");
            return;
        }

        var newBooking = Booking.Book(currentUser.Identity, parkingLot.Id, req.From, req.Duration);

        var overlappingBookings = await dbContext.Set<Booking>()
            .Where(booking => booking.ParkingLotId == req.ParkingLotId)
            .Where(booking => booking.From <= newBooking.To && newBooking.From <= booking.To)
            .ToArrayAsync(ct);

        foreach (var overlappingBooking in overlappingBookings)
        {
            newBooking.Extend(overlappingBooking.From, overlappingBooking.To);
        }

        var alreadyBookedDuration = new TimeSpan(overlappingBookings.Sum(booking => booking.Duration.Ticks));

        var wallet = await dbContext.Set<Wallet>().FirstAsync(ct);
        var price = availability.Price(req.Duration - alreadyBookedDuration);

        if (wallet.Credits < price)
        {
            ThrowError($"Not enough credits ({wallet.Credits}), required at least {price}");
            return;
        }

        wallet.Charge(availability.Id.ToString(), price);

        dbContext.Set<Booking>().Add(newBooking);
        dbContext.Set<Booking>().RemoveRange(overlappingBookings);
        dbContext.Set<Wallet>().Update(wallet);

        await dbContext.SaveChangesAsync(ct);

        await SendOkAsync(
            new BookSpotResponse
            {
                BookingId = newBooking.Id,
                UsedCredits = price
            },
            ct);
    }
}
