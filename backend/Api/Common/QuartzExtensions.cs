using Quartz;

namespace Api.Common;

internal static class QuartzExtensions
{
    public static TriggerBuilder StartAtOrNow(
        this TriggerBuilder builder,
        DateTimeOffset startAt,
        DateTimeOffset? endAt = null)
    {
        return startAt <= DateTimeOffset.Now
            ? builder.StartNow().EndAt(DateTimeOffset.Now.AddSeconds(1))
            : builder.StartAt(startAt).EndAt(endAt);
    }
}
