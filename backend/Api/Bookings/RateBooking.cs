using System.Diagnostics;
using Api.Common;
using Api.Common.Infrastructure;
using Domain.ParkingSpots;
using FastEndpoints;
using JetBrains.Annotations;

namespace Api.Bookings;

[PublicAPI]
public sealed record RateBookingRequest
{
    public enum Rating
    {
        Neutral,
        Bad,
        Good
    }

    public required Guid ParkingLotId { get; init; }
    public required Guid BookingId { get; init; }
    public required Rating UserRating { get; init; }
}

internal sealed class RateBooking(AppDbContext dbContext) : Endpoint<RateBookingRequest>
{
    public override void Configure()
    {
        Post("/spots/booking/rate");
    }

    public override async Task HandleAsync(RateBookingRequest req, CancellationToken ct)
    {
        var currentUser = HttpContext.ToCurrentUser();
        var parkingSpot = await dbContext.Set<ParkingSpot>().FindAsync([req.ParkingLotId], ct);

        if (parkingSpot is null)
        {
            ThrowError("Parking lot not found");
            return;
        }

        var rating = req.UserRating switch
        {
            RateBookingRequest.Rating.Neutral => BookRating.Neutral,
            RateBookingRequest.Rating.Bad => BookRating.Bad,
            RateBookingRequest.Rating.Good => BookRating.Good,
            _ => throw new UnreachableException()
        };

        parkingSpot.RateBooking(currentUser.Identity, req.BookingId, rating);

        await dbContext.SaveChangesAsync(ct);
    }
}