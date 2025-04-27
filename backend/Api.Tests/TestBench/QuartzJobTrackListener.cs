using System.Collections.Immutable;
using Quartz;
using Quartz.Listener;

namespace Api.Tests.TestBench;

internal sealed class QuartzJobTrackListener : JobListenerSupport
{
    private readonly Dictionary<Type, List<TaskCompletionSource>> _jobTcs = new();

    public override string Name => "Test Job Listener";

    public override Task JobWasExecuted(
        IJobExecutionContext context,
        JobExecutionException? jobException,
        CancellationToken cancellationToken = new())
    {
        var jobType = context.JobInstance.GetType();
        var tcsList = _jobTcs.GetValueOrDefault(jobType);

        if (tcsList is null || tcsList.Count is 0)
        {
            return Task.CompletedTask;
        }

        if (jobException is not null)
        {
            tcsList.ForEach(tcs => tcs.SetException(jobException));
            return Task.CompletedTask;
        }

        tcsList.ForEach(tcs => tcs.SetResult());

        return Task.CompletedTask;
    }

    public CompletionAssertion WaitForJob<TJob>()
        where TJob : IJob
    {
        var tcs = new TaskCompletionSource();
        var jobType = typeof(TJob);

        var tcsList = _jobTcs.GetValueOrDefault(jobType, []);
        tcsList.Add(tcs);
        _jobTcs[jobType] = tcsList;

        return new CompletionAssertion(tcs);
    }
}

internal sealed class SchedulerFactoryProxy(
    ISchedulerFactory schedulerFactory,
    QuartzJobTrackListener quartzJobTrackListener
) : ISchedulerFactory
{
    public async Task<IReadOnlyList<IScheduler>> GetAllSchedulers(CancellationToken cancellationToken = new())
    {
        return (await schedulerFactory.GetAllSchedulers(cancellationToken)).Select(InjectListeners).ToImmutableList();
    }

    public async Task<IScheduler> GetScheduler(CancellationToken cancellationToken = new())
    {
        return InjectListeners(await schedulerFactory.GetScheduler(cancellationToken));
    }

    public async Task<IScheduler?> GetScheduler(string schedName, CancellationToken cancellationToken = new())
    {
        var scheduler = await schedulerFactory.GetScheduler(schedName, cancellationToken);

        return scheduler is null ? null : InjectListeners(scheduler);
    }

    private IScheduler InjectListeners(IScheduler scheduler)
    {
        scheduler.ListenerManager.AddJobListener(quartzJobTrackListener);

        return scheduler;
    }
}
