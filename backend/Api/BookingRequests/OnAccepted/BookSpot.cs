using Api.Common;
using Api.Common.Infrastructure;
using Domain.Parkings;
using Domain.ParkingSpots;
using Microsoft.EntityFrameworkCore;

namespace Api.BookingRequests.OnAccepted;

internal sealed class BookSpot(AppDbContext dbContext, ILogger<BookSpot> logger)
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

        acceptedSpot.Book(request.RequesterId, request.From, request.DateRange.Duration, request.Bonus);

        dbContext.Set<ParkingSpot>().Update(acceptedSpot);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
