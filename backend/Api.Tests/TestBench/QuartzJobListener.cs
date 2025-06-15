using Quartz;
using Quartz.Listener;

namespace Api.Tests.TestBench;

internal sealed class QuartzJobListener : JobListenerSupport, ITestJobListener
{
    private readonly Dictionary<string, List<TaskCompletionSource>> _jobTcs = new();

    public override string Name => "Test Job Listener";

    public override Task JobWasExecuted(
        IJobExecutionContext context,
        JobExecutionException? jobException,
        CancellationToken cancellationToken = new())
    {
        var jobType = context.JobInstance.GetType();
        var joyKey = jobType.FullName ?? jobType.Name;

        var tcsList = _jobTcs.GetValueOrDefault(joyKey);

        if (tcsList is null || tcsList.Count is 0)
        {
            return Task.CompletedTask;
        }

        if (jobException is not null)
        {
            tcsList.ForEach(tcs => tcs.SetException(jobException));
            return Task.CompletedTask;
        }

        tcsList.ForEach(tcs => tcs.TrySetResult());
        _jobTcs.Remove(joyKey);

        return Task.CompletedTask;
    }

    public void Reset()
    {
        _jobTcs.Clear();
    }

    public CompletionAssertion WaitForJob<TJob>()
        where TJob : IJob
    {
        var tcs = new TaskCompletionSource();
        var jobType = typeof(TJob);
        var joyKey = jobType.FullName ?? jobType.Name;

        var tcsList = _jobTcs.GetValueOrDefault(joyKey, []);
        tcsList.Add(tcs);
        _jobTcs[joyKey] = tcsList;

        return new CompletionAssertion(tcs);
    }
}
