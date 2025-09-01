using Api.Common;
using Api.Common.Infrastructure;
using Api.Parkings.OnDeleted;
using Domain.Parkings;
using Domain.ParkingSpots;
using Microsoft.EntityFrameworkCore;

namespace Api.Parkings.OnUserLeft;

internal sealed class CancelSpotBookingsAndAvailabilitiesAndRequests(
    AppDbContext dbContext,
    ILogger<ForceCancelAllBookings> logger
) : IDomainEventHandler<ParkingUserLeft>
{
    public async Task Handle(ParkingUserLeft notification, CancellationToken cancellationToken)
    {
        var result = await (from spot in dbContext.Set<ParkingSpot>()
            join parking in dbContext.Set<Parking>() on spot.ParkingId equals parking.Id
            where spot.Id == notification.SpotId
            select new { spot, parking }).FirstOrDefaultAsync(cancellationToken);

        if (result is null)
        {
            logger.LogWarning("Spot {SpotId} not found", notification.SpotId);
            return;
        }

        logger.LogInformation(
            "Cancelling {BookingCount} bookings for spot {SpotId}",
            result.spot.Bookings.Count,
            result.spot.Id);
        result.spot.CancelAllBookingsWithByPass();

        logger.LogInformation(
            "Cancelling all requests from {SpotOwnerId} for parking {ParkingId}",
            result.spot.OwnerId,
            result.parking.Id);
        result.parking.CancelUserBookingRequestWithBypass(result.spot.OwnerId);

        dbContext.Set<Parking>().Update(result.parking);
        dbContext.Set<ParkingSpot>().Update(result.spot);

        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
