using Quartz;

namespace Api.Spots.Common;

internal static class SpotsJobIdentity
{
    public static JobKey ConfirmCredits(Guid spotId, Guid availabilityId)
    {
        return new JobKey(spotId.ToString() + availabilityId, nameof(ConfirmCredits));
    }
}