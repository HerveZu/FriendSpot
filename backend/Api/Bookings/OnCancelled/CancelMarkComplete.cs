using Api.Common;
using Domain.ParkingSpots;
using Quartz;

namespace Api.Bookings.OnCancelled;

internal sealed class CancelMarkComplete(ILogger<CancelMarkComplete> logger, ISchedulerFactory schedulerFactory)
    : IDomainEventHandler<ParkingSpotBookingCancelled>
{
    public async Task Handle(ParkingSpotBookingCancelled notification, CancellationToken cancellationToken)
    {
        logger.LogInformation("Parking spot cancelled, cancelling mark complete job");

        var scheduler = await schedulerFactory.GetScheduler(cancellationToken);
        await scheduler.DeleteJob(BookingJobsKeys.MarkComplete(notification.BookingId), cancellationToken);
    }
}