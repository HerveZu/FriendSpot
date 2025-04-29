using Api.Common;
using Api.Common.Infrastructure;
using Domain.ParkingSpots;
using Domain.Users;
using Microsoft.EntityFrameworkCore;

namespace Api.Me.OnMarkedDeleted;

internal sealed class CancelAllAvailabilitiesAndBooking(
    AppDbContext dbContext,
    ILogger<CancelAllAvailabilitiesAndBooking> logger
) : IDomainEventHandler<UserMarkedDeleted>
{
    public async Task Handle(UserMarkedDeleted notification, CancellationToken cancellationToken)
    {
        var userSpot = await dbContext.Set<ParkingSpot>()
            .Where(spot => spot.OwnerId == notification.UserId)
            .FirstOrDefaultAsync(cancellationToken);

        if (userSpot is null)
        {
            logger.LogInformation("User with id {UserId} has no parking spot", notification.UserId);
            return;
        }

        var cancellableAvailabilities = userSpot.Availabilities
            .Where(availability => availability.CanCancel(notification.UserId, userSpot.Bookings))
            .ToList();

        logger.LogInformation(
            "Canceling {AvailabilityCount} availabilities and its bookings",
            cancellableAvailabilities.Count);

        cancellableAvailabilities
            .ForEach(x => userSpot.CancelAvailability(notification.UserId, x.Id));
    }
}
