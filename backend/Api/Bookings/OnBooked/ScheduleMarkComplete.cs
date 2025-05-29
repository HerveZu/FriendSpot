using Api.Common;
using Api.Common.Infrastructure;
using Domain.ParkingSpots;
using Quartz;

namespace Api.Bookings.OnBooked;

internal sealed class ScheduleMarkComplete(ISchedulerFactory schedulerFactory)
    : IDomainEventHandler<ParkingSpotBooked>
{
    public async Task Handle(ParkingSpotBooked notification, CancellationToken cancellationToken)
    {
        var scheduler = await schedulerFactory.GetScheduler(cancellationToken);

        await scheduler.ScheduleJob(
            JobBuilder.Create<MarkBookingComplete>()
                .WithIdentity(BookingJobsKeys.MarkComplete(notification.BookingId))
                .UsingJobData(MarkBookingComplete.SpotId, notification.SpotId)
                .UsingJobData(MarkBookingComplete.BookingId, notification.BookingId)
                .Build(),
            TriggerBuilder.Create()
                .StartAt(notification.BookedUntil)
                .Build(),
            cancellationToken);
    }
}

internal sealed class MarkBookingComplete(ILogger<MarkBookingComplete> logger, AppDbContext dbContext) : IJob
{
    public const string BookingId = nameof(BookingId);
    public const string SpotId = nameof(SpotId);

    public async Task Execute(IJobExecutionContext context)
    {
        var spotId = context.MergedJobDataMap.GetGuidValue(SpotId);
        var bookingId = context.MergedJobDataMap.GetGuidValue(BookingId);

        var spot = await dbContext
            .Set<ParkingSpot>()
            .FindAsync([spotId], context.CancellationToken);

        if (spot is null)
        {
            logger.LogWarning("Parking spot with id {SpotId} was not found to mark complete", spotId);
            return;
        }

        logger.LogInformation("Marking booking with id {BookingId} complete", bookingId);
        spot.MarkBookingComplete(bookingId);

        dbContext.Set<ParkingSpot>().Update(spot);
        await dbContext.SaveChangesAsync();
    }
}