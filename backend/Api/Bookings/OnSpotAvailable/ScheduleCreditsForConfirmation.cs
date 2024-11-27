using Api.Bookings.Common;
using Api.Common;
using Api.Common.Infrastructure;
using Domain;
using Domain.ParkingSpots;
using Domain.Wallets;
using Microsoft.EntityFrameworkCore;
using Quartz;

namespace Api.Bookings.OnSpotAvailable;

internal sealed class ScheduleCreditsForConfirmation(ISchedulerFactory schedulerFactory)
    : IDomainEventHandler<ParkingSpotAvailable>
{
    public async Task Handle(ParkingSpotAvailable notification, CancellationToken cancellationToken)
    {
        var scheduler = await schedulerFactory.GetScheduler(cancellationToken);

        await scheduler.ScheduleJob(
            JobBuilder.Create<ConfirmCredits>()
                .WithIdentity(BookingJobsKeys.ConfirmCredits(notification.AvailabilityId))
                .UsingJobData(ConfirmCredits.UserIdentity, notification.UserIdentity)
                .UsingJobData(ConfirmCredits.AvailabilityId, notification.AvailabilityId)
                .UsingJobData(ConfirmCredits.Credits, (double)notification.Credits.Amount)
                .Build(),
            TriggerBuilder.Create()
                .StartAt(notification.AvailableUntil)
                .Build(),
            cancellationToken);
    }
}

internal sealed class ConfirmCredits(AppDbContext dbContext) : IJob
{
    public const string UserIdentity = nameof(UserIdentity);
    public const string AvailabilityId = nameof(AvailabilityId);
    public const string Credits = nameof(Credits);

    public async Task Execute(IJobExecutionContext context)
    {
        var userId = context.MergedJobDataMap.GetString(UserIdentity);
        var credits = (decimal)context.MergedJobDataMap.GetDoubleValue(Credits);

        if (!context.MergedJobDataMap.TryGetGuidValue(AvailabilityId, out var availabilityId))
        {
            throw new InvalidOperationException("Required availability id not provided");
        }

        var wallet = await (
                from userWallet in dbContext.Set<Wallet>()
                where userWallet.UserIdentity == userId
                select userWallet)
            .FirstAsync(context.CancellationToken);

        wallet.Credit(
            availabilityId.ToString(),
            new Credits(credits),
            TransactionState.Confirmed);

        dbContext.Set<Wallet>().Update(wallet);
        await dbContext.SaveChangesAsync(context.CancellationToken);
    }
}
