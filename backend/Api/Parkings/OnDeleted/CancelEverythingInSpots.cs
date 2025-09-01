using Api.Common;
using Api.Common.Infrastructure;
using Domain.Parkings;
using Domain.ParkingSpots;
using Microsoft.EntityFrameworkCore;

namespace Api.Parkings.OnDeleted;

internal sealed class CancelEverythingInSpots(
    AppDbContext dbContext,
    ILogger<CancelEverythingInSpots> logger
) : IDomainEventHandler<ParkingDeleted>
{
    public async Task Handle(ParkingDeleted notification, CancellationToken cancellationToken)
    {
        var spots = await dbContext.Set<ParkingSpot>()
            .Where(spot => spot.ParkingId == notification.ParkingId)
            .ToArrayAsync(cancellationToken);

        logger.LogInformation(
            "Canceling everything for {SpotsCount} spots in parking {ParkingId}",
            spots.Length,
            notification.ParkingId);

        foreach (var spot in spots)
        {
            logger.LogInformation("Cancelling {BookingCount} bookings in spot {SpotId}", spot.Bookings.Count, spot.Id);
            spot.CancelAllWithByPass();
        }

        dbContext.Set<ParkingSpot>().UpdateRange(spots);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
