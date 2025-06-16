using Quartz;

namespace Api.Common;

internal static class QuartzExtensions
{
    public static TriggerBuilder StartAtOrNow(
        this TriggerBuilder builder,
        DateTimeOffset startAt,
        DateTimeOffset? endAt = null)
    {
        if (startAt > DateTimeOffset.Now)
        {
            return builder.StartAt(startAt).EndAt(endAt);
        }

        var safeNow = DateTimeOffset.Now.AddMinutes(1);
        return builder.StartNow().EndAt(endAt > safeNow ? endAt : safeNow);
    }
}
