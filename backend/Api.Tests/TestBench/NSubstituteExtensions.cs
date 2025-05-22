using NSubstitute.Core;

namespace Api.Tests.TestBench;

internal static class NSubstituteExtensions
{
    public static CompletionAssertion AfterHavingCompleted(
        this ConfiguredCall call,
        Func<CallInfo, bool> assertion)
    {
        var tcs = new TaskCompletionSource();

        call.AndDoes(
            info =>
            {
                if (assertion(info))
                {
                    tcs.SetResult();
                }
            });

        return new CompletionAssertion(tcs);
    }
}
