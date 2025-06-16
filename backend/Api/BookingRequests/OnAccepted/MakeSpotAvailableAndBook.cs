using Api.Common;
using Api.Common.Infrastructure;
using Domain.Parkings;
using Domain.ParkingSpots;
using Microsoft.EntityFrameworkCore;

namespace Api.BookingRequests.OnAccepted;

internal sealed class MakeSpotAvailableAndBook(AppDbContext dbContext, ILogger<MakeSpotAvailableAndBook> logger)
    : IDomainEventHandler<BookingRequestAccepted>
{
    public async Task Handle(BookingRequestAccepted @event, CancellationToken cancellationToken)
    {
        var acceptedSpot = await (from spot in dbContext.Set<ParkingSpot>()
            where spot.OwnerId == @event.AcceptedByUserId
            select spot).FirstAsync(cancellationToken);

        logger.LogInformation(
            "Booking spot of user {UserId} after having accepted a booking request {RequestId}",
            @event.AcceptedByUserId,
            @event.RequestId);

        logger.LogDebug("Making spot available");
        acceptedSpot.MakeAvailable(@event.Date.From, @event.Date.To);

        logger.LogDebug("Booking spot");
        acceptedSpot.Book(@event.RequesterId, @event.Date.From, @event.Date.Duration, @event.Bonus);

        dbContext.Set<ParkingSpot>().Update(acceptedSpot);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
