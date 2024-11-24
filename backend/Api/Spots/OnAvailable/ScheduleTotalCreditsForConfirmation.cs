using Api.Common;
using Api.Common.Infrastructure;
using Api.Spots.Common;
using Domain;
using Domain.ParkingSpots;
using Domain.Wallets;
using Microsoft.EntityFrameworkCore;
using Quartz;

namespace Api.Spots.OnAvailable;

internal sealed class ScheduleTotalCreditsForConfirmation(ISchedulerFactory schedulerFactory)
    : IDomainEventHandler<ParkingSpotAvailable>
{
    public async Task Handle(ParkingSpotAvailable notification, CancellationToken cancellationToken)
    {
        var scheduler = await schedulerFactory.GetScheduler(cancellationToken);

        await scheduler.ScheduleJob(
            JobBuilder.Create<ConfirmCredits>()
                .WithIdentity(SpotsJobIdentity.ConfirmCredits(notification.SpotId, notification.AvailabilityId))
                .UsingJobData(ConfirmCredits.UserIdentity, notification.UserIdentity)
                .UsingJobData(ConfirmCredits.Credits, (double)notification.TotalCredits.Amount)
                .Build(),
            TriggerBuilder.Create()
                .StartAt(notification.AvailableUntil)
                .WithSimpleSchedule(
                    x => x
                        .WithIntervalInSeconds(30)
                        .WithRepeatCount(2))
                .Build(),
            cancellationToken);
    }
}

internal sealed class ConfirmCredits(AppDbContext dbContext) : IJob
{
    public const string UserIdentity = nameof(UserIdentity);
    public const string Credits = nameof(Credits);

    public async Task Execute(IJobExecutionContext context)
    {
        var userId = context.MergedJobDataMap.GetString(UserIdentity);
        var credits = (decimal)context.MergedJobDataMap.GetDoubleValue(Credits);

        var wallet = await (
                from userWallet in dbContext.Set<Wallet>()
                where userWallet.UserIdentity == userId
                select userWallet)
            .FirstAsync(context.CancellationToken);

        wallet.ConfirmCredit(new Credits(credits));

        dbContext.Set<Wallet>().Update(wallet);
        await dbContext.SaveChangesAsync(context.CancellationToken);
    }
}
