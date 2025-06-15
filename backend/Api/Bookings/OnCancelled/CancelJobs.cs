using Api.Common;
using Domain.ParkingSpots;
using Quartz;
using Quartz.Impl.Matchers;

namespace Api.Bookings.OnCancelled;

internal sealed class CancelJobs(ILogger<CancelJobs> logger, ISchedulerFactory schedulerFactory)
    : IDomainEventHandler<ParkingSpotBookingCancelled>
{
    public async Task Handle(ParkingSpotBookingCancelled notification, CancellationToken cancellationToken)
    {
        logger.LogInformation("Parking spot cancelled, cancelling related jobs");

        var scheduler = await schedulerFactory.GetScheduler(cancellationToken);
        var bookingJobs = await scheduler
            .GetJobKeys(GroupMatcher<JobKey>.GroupEquals(notification.BookingId.ToString()), cancellationToken);

        logger.LogInformation("Cancelling {JobCount} jobs", bookingJobs.Count);

        await scheduler.DeleteJobs(bookingJobs, cancellationToken);
    }
}
