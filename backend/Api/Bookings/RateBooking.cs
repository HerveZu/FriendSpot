using System.Diagnostics;
using Api.Common;
using Api.Common.Infrastructure;
using Domain.ParkingSpots;
using FastEndpoints;
using FluentValidation;
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

    public Guid ParkingLotId { get; init; } // required makes deserialization fail
    public Guid BookingId { get; init; } // required makes deserialization fail
    public required Rating UserRating { get; init; }
}

internal sealed class RateBookingValidator : Validator<RateBookingRequest>
{
    public RateBookingValidator()
    {
        RuleFor(x => x.BookingId).NotEmpty();
        RuleFor(x => x.BookingId).NotEmpty();
    }
}

internal sealed class RateBooking(AppDbContext dbContext) : Endpoint<RateBookingRequest>
{
    public override void Configure()
    {
        Post("/spots/{ParkingLotId:guid}/booking/{BookingId:guid}/rate");
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