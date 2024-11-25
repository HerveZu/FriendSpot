using Quartz;

namespace Api.Spots.Common;

internal static class SpotJobsKeys
{
    public static JobKey ConfirmCredits(Guid availabilityId)
    {
        return new JobKey(availabilityId.ToString(), nameof(ConfirmCredits));
    }
}