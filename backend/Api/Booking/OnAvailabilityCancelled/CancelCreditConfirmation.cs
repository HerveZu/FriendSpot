using Api.Booking.Common;
using Api.Common;
using Api.Common.Infrastructure;
using Domain.ParkingSpots;
using Domain.Wallets;
using Microsoft.EntityFrameworkCore;
using Quartz;

namespace Api.Booking.OnAvailabilityCancelled;

internal sealed class CancelCreditConfirmation(ISchedulerFactory schedulerFactory, AppDbContext dbContext)
    : IDomainEventHandler<ParkingSpotAvailabilityCancelled>
{
    public async Task Handle(ParkingSpotAvailabilityCancelled notification, CancellationToken cancellationToken)
    {
        var wallet = await dbContext.Set<Wallet>().FirstAsync(cancellationToken);
        wallet.CancelTransaction(notification.AvailabilityId.ToString());

        var scheduler = await schedulerFactory.GetScheduler(cancellationToken);
        await scheduler.DeleteJob(BookingJobsKeys.ConfirmCredits(notification.AvailabilityId), cancellationToken);
    }
}
