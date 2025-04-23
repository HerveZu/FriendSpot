using Api.Common;
using Api.Common.Infrastructure;
using Domain.Parkings;
using Domain.ParkingSpots;
using Microsoft.EntityFrameworkCore;

namespace Api.Spots.OnParkingDeleted;

internal sealed class CancelAllBookings(
    AppDbContext dbContext,
    ILogger<CancelAllBookings> logger
) : IDomainEventHandler<ParkingDeleted>
{
    public async Task Handle(ParkingDeleted notification, CancellationToken cancellationToken)
    {
        var spots = await dbContext.Set<ParkingSpot>()
            .Where(spot => spot.ParkingId == notification.ParkingId)
            .ToArrayAsync(cancellationToken);

        logger.LogInformation("Cancelling {SpotsCount} bookings", spots.Length);

        foreach (var spot in spots)
        {
            logger.LogInformation("Cancelling {BookingCount} bookings in spot {SpotId}", spot.Bookings.Count, spot.Id);
            spot.CancelAllBookingsWithByPass();
        }

        dbContext.Set<ParkingSpot>().UpdateRange(spots);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
