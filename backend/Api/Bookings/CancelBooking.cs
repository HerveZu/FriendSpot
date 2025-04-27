using Api.Common;
using Api.Common.Infrastructure;
using Domain.ParkingSpots;
using FastEndpoints;
using JetBrains.Annotations;

namespace Api.Bookings;

[PublicAPI]
public sealed record CancelBookingRequest
{
    public required Guid ParkingLotId { get; init; }
    public required Guid BookingId { get; init; }
}

internal sealed class CancelBooking(AppDbContext dbContext) : Endpoint<CancelBookingRequest>
{
    public override void Configure()
    {
        Post("/spots/booking/cancel");
    }

    public override async Task HandleAsync(CancelBookingRequest req, CancellationToken ct)
    {
        var spot = await dbContext.Set<ParkingSpot>().FindAsync([req.ParkingLotId], ct);
        var currentUser = HttpContext.ToCurrentUser();

        if (spot is null)
        {
            ThrowError("Spot not found");
            return;
        }

        spot.CancelBooking(currentUser.Identity, req.BookingId);

        dbContext.Set<ParkingSpot>().Update(spot);
        await dbContext.SaveChangesAsync(ct);
    }
}
