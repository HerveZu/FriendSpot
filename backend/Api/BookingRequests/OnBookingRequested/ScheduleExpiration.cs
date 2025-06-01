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
                .WithIdentity(BookingRequestJobsKeys.MarkRequestExpired(notification.Request.Id))
                .UsingJobData(MarkBookingRequestExpired.ParkingId, notification.Parking.Id)
                .UsingJobData(MarkBookingRequestExpired.RequestId, notification.Request.Id)
                .Build(),
            TriggerBuilder.Create()
                .StartAt(notification.Request.From)
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

        logger.LogInformation("Marking booking request expired {RequestId}", requestId);
        parking.MarkBookingRequestExpired(requestId);

        dbContext.Set<Parking>().Update(parking);
        await dbContext.SaveChangesAsync();
    }
}
