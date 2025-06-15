using System.Collections.Immutable;
using Quartz;

namespace Api.Tests.TestBench;

internal interface ITestJobListener : IJobListener
{
    void Reset();
}

internal sealed class CustomListenersSchedulerFactory(
    ISchedulerFactory schedulerFactory,
    ITestJobListener[] jobListeners
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
        foreach (var jobListener in jobListeners)
        {
            scheduler.ListenerManager.AddJobListener(jobListener);
        }

        return scheduler;
    }

    public async Task Reset()
    {
        foreach (var jobListener in jobListeners)
        {
            jobListener.Reset();
        }

        var schedulers = await schedulerFactory.GetAllSchedulers();

        // don't know why async / await is required inside the .Select() method otherwise test fail
        await Task.WhenAll(schedulers.Select(async scheduler => await scheduler.Clear()));
    }
}
