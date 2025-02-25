using Api.Common;
using Domain;
using MediatR;
using Newtonsoft.Json;
using Quartz;

namespace Api.Bookings.Common;

internal abstract class IntegrationEventHandler<THandler, TEvent>(ISchedulerFactory schedulerFactory)
    : IDomainEventHandler<TEvent>, IJob
    where TEvent : IDomainEvent
    where THandler : IntegrationEventHandler<THandler, TEvent>
{
    private const string DataKey = nameof(DataKey);

    async Task INotificationHandler<TEvent>.Handle(TEvent notification, CancellationToken cancellationToken)
    {
        var scheduler = await schedulerFactory.GetScheduler(cancellationToken);

        // quartz jobs are persisted within the scoped transaction,
        // this acts as an outbox
        await scheduler.ScheduleJob(
            JobBuilder.Create<THandler>()
                .UsingJobData(DataKey, JsonConvert.SerializeObject(notification))
                .Build(),
            TriggerBuilder.Create()
                .StartNow()
                .Build(),
            cancellationToken);
    }

    public async Task Execute(IJobExecutionContext context)
    {
        var data = JsonConvert.DeserializeObject<TEvent>(context.MergedJobDataMap.GetString(DataKey)!);

        if (data is null)
        {
            throw new InvalidOperationException("No event data found");
        }

        await HandleOutbox(data, context.CancellationToken);
    }

    protected abstract Task HandleOutbox(TEvent @event, CancellationToken cancellationToken);
}
