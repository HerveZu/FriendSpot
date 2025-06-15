using Api.Common;
using Domain.Parkings;
using Quartz;

namespace Api.BookingRequests.OnAccepted;

internal sealed class CancelMarkRequestExpired(
    ILogger<CancelMarkRequestExpired> logger,
    ISchedulerFactory schedulerFactory
)
    : IDomainEventHandler<BookingRequestAccepted>
{
    public async Task Handle(BookingRequestAccepted notification, CancellationToken cancellationToken)
    {
        logger.LogInformation("Booking request accepted, cancelling request expiration.");

        var scheduler = await schedulerFactory.GetScheduler(cancellationToken);
        await scheduler.DeleteJob(
            BookingRequestJobsKeys.MarkRequestExpired(notification.RequestId),
            cancellationToken);
    }
}