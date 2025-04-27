using NSubstitute.Core;

namespace Api.Tests.TestBench;

internal static class NSubstituteExtensions
{
    public static CompletionAssertion AfterHavingCompleted(
        this ConfiguredCall call,
        int onCallNumber,
        Func<CallInfo, bool> assertion)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(onCallNumber);

        var tcs = new TaskCompletionSource();
        var callCount = 0;

        call.AndDoes(
            info =>
            {
                if (++callCount != onCallNumber)
                {
                    return;
                }

                assertion(info);
                tcs.SetResult();
            });

        return new CompletionAssertion(tcs);
    }
}
