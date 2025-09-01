using Api.Common;
using Api.Common.Infrastructure;
using Domain.Parkings;
using Domain.ParkingSpots;
using Domain.Users;
using Microsoft.EntityFrameworkCore;

namespace Api.Me.OnMarkedDeleted;

internal sealed class CancelEverything(
    AppDbContext dbContext,
    ILogger<CancelEverything> logger
) : IDomainEventHandler<UserMarkedDeleted>
{
    public async Task Handle(UserMarkedDeleted notification, CancellationToken cancellationToken)
    {
        var user = await dbContext.Set<User>().FindAsync([notification.UserId], cancellationToken);

        if (user is null)
        {
            logger.LogWarning("User with id {UserId} not found, aborting...", notification.UserId);
            return;
        }

        var result = await (from spot in dbContext.Set<ParkingSpot>()
            join parking in dbContext.Set<Parking>() on spot.ParkingId equals parking.Id
            where spot.OwnerId == user.Identity
            select new
            {
                spot, parking, bookedSpots = dbContext.Set<ParkingSpot>()
                    .Where(otherSpot => otherSpot.Bookings.Any(booking => booking.BookingUserId == notification.UserId))
                    .ToArray()
            }).FirstOrDefaultAsync(cancellationToken);

        if (result is null)
        {
            logger.LogInformation("User with id {UserId} has not spot", notification.UserId);
            return;
        }

        logger.LogInformation(
            "Cancelling everything from spot of user {SpotOwnerId} for parking {ParkingId}",
            result.spot.OwnerId,
            result.parking.Id);

        result.parking.CancelUserBookingRequestWithBypass(notification.UserId);
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
