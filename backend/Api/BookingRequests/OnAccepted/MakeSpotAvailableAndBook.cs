using Api.Common;
using Api.Common.Infrastructure;
using Domain.Parkings;
using Domain.ParkingSpots;
using Microsoft.EntityFrameworkCore;

namespace Api.BookingRequests.OnAccepted;

internal sealed class MakeSpotAvailableAndBook(AppDbContext dbContext, ILogger<MakeSpotAvailableAndBook> logger)
    : IDomainEventHandler<BookingRequestAccepted>
{
    public async Task Handle(BookingRequestAccepted notification, CancellationToken cancellationToken)
    {
        var request = notification.Request;

        var acceptedSpot = await (from spot in dbContext.Set<ParkingSpot>()
            where spot.OwnerId == notification.AcceptedByUserId
            select spot).FirstAsync(cancellationToken);

        logger.LogInformation(
            "Booking spot of user {UserId} after having accepted a booking request {RequestId}",
            notification.AcceptedByUserId,
            request.Id);

        logger.LogDebug("Making spot available");
        acceptedSpot.MakeAvailable(request.From, request.To);

        logger.LogDebug("Booking spot");
        acceptedSpot.Book(request.RequesterId, request.From, request.DateRange.Duration, request.Bonus);

        dbContext.Set<ParkingSpot>().Update(acceptedSpot);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
