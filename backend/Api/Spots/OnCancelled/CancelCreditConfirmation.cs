using Api.Common;
using Api.Spots.Common;
using Domain.ParkingSpots;
using Quartz;

namespace Api.Spots.OnCancelled;

internal sealed class CancelCreditConfirmation(ISchedulerFactory schedulerFactory)
    : IDomainEventHandler<ParkingSpotCancelled>
{
    public async Task Handle(ParkingSpotCancelled notification, CancellationToken cancellationToken)
    {
        var scheduler = await schedulerFactory.GetScheduler(cancellationToken);

        await scheduler.DeleteJob(
            SpotsJobIdentity.ConfirmCredits(notification.SpotId, notification.AvailabilityId),
            cancellationToken);
    }
}
