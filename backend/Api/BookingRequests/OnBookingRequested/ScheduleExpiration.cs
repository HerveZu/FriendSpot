using Api.Common;
using Api.Common.Infrastructure;
using Domain.Parkings;
using Quartz;

namespace Api.BookingRequests.OnBookingRequested;

internal sealed class ScheduleExpiration(ISchedulerFactory schedulerFactory)
    : IDomainEventHandler<BookingRequested>
{
    public async Task Handle(BookingRequested notification, CancellationToken cancellationToken)
    {
        var scheduler = await schedulerFactory.GetScheduler(cancellationToken);

        await scheduler.ScheduleJob(
            JobBuilder.Create<MarkBookingRequestExpired>()
                .WithIdentity(new JobKey("schedule-expiration", notification.RequestId.ToString()))
                .UsingJobData(MarkBookingRequestExpired.ParkingId, notification.ParkingId)
                .UsingJobData(MarkBookingRequestExpired.RequestId, notification.RequestId)
                .Build(),
            TriggerBuilder.Create()
                .StartAtOrNow(notification.Date.From)
                .Build(),
            cancellationToken);
    }
}

internal sealed class MarkBookingRequestExpired(
    ILogger<MarkBookingRequestExpired> logger,
    AppDbContext dbContext
) : IJob
{
    public const string ParkingId = nameof(ParkingId);
    public const string RequestId = nameof(RequestId);

    public async Task Execute(IJobExecutionContext context)
    {
        var parkingId = context.MergedJobDataMap.GetGuidValue(ParkingId);
        var requestId = context.MergedJobDataMap.GetGuidValue(RequestId);

        var parking = await dbContext
            .Set<Parking>()
            .FindAsync([parkingId], context.CancellationToken);

        if (parking is null)
        {
            logger.LogWarning("Parking with id {SpotId} was not found", parkingId);
            return;
        }

        logger.LogInformation("Trying to mark booking request expired {RequestId}", requestId);
        parking.TryMarkBookingRequestExpired(requestId);

        dbContext.Set<Parking>().Update(parking);
        await dbContext.SaveChangesAsync(context.CancellationToken);
    }
}
