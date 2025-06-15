namespace Api.Tests.TestBench;

internal sealed class CompletionAssertion(TaskCompletionSource tcs)
{
    public async Task Wait(CancellationToken cancellationToken = default)
    {
        cancellationToken.Register(_ => tcs.TrySetCanceled(cancellationToken), null);
        await tcs.Task;
    }
}