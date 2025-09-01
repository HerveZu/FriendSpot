using Api.Common;
using Api.Common.Infrastructure;
using Api.Parkings.OnDeleted;
using Domain.Parkings;
using Domain.ParkingSpots;
using Microsoft.EntityFrameworkCore;

namespace Api.Parkings.OnUserLeft;

internal sealed class CancelEverything(
    AppDbContext dbContext,
    ILogger<CancelEverythingInSpots> logger
) : IDomainEventHandler<ParkingUserLeft>
{
    public async Task Handle(ParkingUserLeft notification, CancellationToken cancellationToken)
    {
        var result = await (from spot in dbContext.Set<ParkingSpot>()
            join parking in dbContext.Set<Parking>() on spot.ParkingId equals parking.Id
            where spot.Id == notification.SpotId
            select new
            {
                spot, parking,
                bookedSpots = dbContext.Set<ParkingSpot>()
                    .Where(otherSpot => otherSpot.Bookings.Any(booking => booking.BookingUserId == notification.UserId))
                    .ToArray()
            }).FirstOrDefaultAsync(cancellationToken);

        if (result is null)
        {
            logger.LogWarning("Spot {SpotId} not found", notification.SpotId);
            return;
        }

        logger.LogInformation(
            "Cancelling everything from spot of user {SpotOwnerId} for parking {ParkingId}",
            result.spot.OwnerId,
            result.parking.Id);

        result.parking.CancelUserBookingRequestWithBypass(result.spot.OwnerId);
        result.spot.CancelAllWithByPass();

        logger.LogInformation(
            "Cancelling all other spots' bookings of {UserId} in {SpotCount} spots",
            result.spot.OwnerId,
            result.bookedSpots.Length);

        foreach (var bookedSpot in result.bookedSpots)
        {
            bookedSpot.CancelBookingFromUserWithBypass(notification.UserId);
        }

        dbContext.Set<Parking>().Update(result.parking);
        dbContext.Set<ParkingSpot>().Update(result.spot);

        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
