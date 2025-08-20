using Api.Common;
using Api.Common.Infrastructure;
using Api.Parkings.OnDeleted;
using Domain.ParkingSpots;
using Microsoft.EntityFrameworkCore;

namespace Api.Parkings.OnSpotLeft;

internal sealed class CancelSpotBookings(
    AppDbContext dbContext,
    ILogger<ForceCancelAllBookings> logger
) : IDomainEventHandler<ParkingSpotLeft>
{
    public async Task Handle(ParkingSpotLeft notification, CancellationToken cancellationToken)
    {
        var userSpot = await dbContext.Set<ParkingSpot>()
            .FirstOrDefaultAsync(spot => spot.Id == notification.SpotId, cancellationToken);

        if (userSpot is null)
        {
            logger.LogWarning("Spot {SpotId} not found", notification.SpotId);
            return;
        }

        logger.LogInformation(
            "Cancelling {BookingCount} bookings for spot {SpotId}",
            userSpot.Bookings.Count,
            userSpot.Id);
        userSpot.CancelAllBookingsWithByPass();

        dbContext.Set<ParkingSpot>().Update(userSpot);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
