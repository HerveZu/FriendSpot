using Api.Common;
using Api.Common.Infrastructure;
using Domain.Parkings;
using Domain.ParkingSpots;
using Microsoft.EntityFrameworkCore;

namespace Api.Parkings.OnDeleted;

internal sealed class ForceCancelAllBookings(
    AppDbContext dbContext,
    ILogger<ForceCancelAllBookings> logger
) : IDomainEventHandler<ParkingDeleted>
{
    public async Task Handle(ParkingDeleted notification, CancellationToken cancellationToken)
    {
        var spots = await dbContext.Set<ParkingSpot>()
            .Where(spot => spot.ParkingId == notification.ParkingId)
            .ToArrayAsync(cancellationToken);

        logger.LogInformation(
            "Force cancelling {SpotsCount} bookings for parking {ParkingId}",
            notification.ParkingId,
            spots.Length);

        foreach (var spot in spots)
        {
            logger.LogInformation("Cancelling {BookingCount} bookings in spot {SpotId}", spot.Bookings.Count, spot.Id);
            spot.CancelAllBookingsWithByPass();
        }

        dbContext.Set<ParkingSpot>().UpdateRange(spots);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
