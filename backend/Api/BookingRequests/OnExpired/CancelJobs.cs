using Api.Common;
using Domain.Parkings;
using Quartz;
using Quartz.Impl.Matchers;

namespace Api.BookingRequests.OnExpired;

internal sealed class CancelJobs(ILogger<CancelJobs> logger, ISchedulerFactory schedulerFactory)
    : IDomainEventHandler<BookingRequestExpired>
{
    public async Task Handle(BookingRequestExpired notification, CancellationToken cancellationToken)
    {
        logger.LogInformation("Parking request has expired, cancelling related jobs");

        var scheduler = await schedulerFactory.GetScheduler(cancellationToken);
        var bookingJobs = await scheduler
            .GetJobKeys(GroupMatcher<JobKey>.GroupEquals(notification.RequestId.ToString()), cancellationToken);
        await scheduler.DeleteJobs(bookingJobs, cancellationToken);
    }
}
