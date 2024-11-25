using Api.Common;
using Api.Common.Infrastructure;
using Api.Spots.Common;
using Domain.ParkingSpots;
using Domain.Wallets;
using Microsoft.EntityFrameworkCore;
using Quartz;

namespace Api.Spots.OnCancelled;

internal sealed class CancelCreditConfirmation(ISchedulerFactory schedulerFactory, AppDbContext dbContext)
    : IDomainEventHandler<ParkingSpotCancelled>
{
    public async Task Handle(ParkingSpotCancelled notification, CancellationToken cancellationToken)
    {
        var wallet = await dbContext.Set<Wallet>().FirstAsync(cancellationToken);
        wallet.CancelTransaction(notification.AvailabilityId.ToString());

        var scheduler = await schedulerFactory.GetScheduler(cancellationToken);
        await scheduler.DeleteJob(SpotJobsKeys.ConfirmCredits(notification.AvailabilityId), cancellationToken);
    }
}
