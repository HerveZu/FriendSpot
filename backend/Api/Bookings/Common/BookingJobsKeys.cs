using Quartz;

namespace Api.Bookings.Common;

internal static class BookingJobsKeys
{
    public static JobKey ConfirmCredits(Guid availabilityId)
    {
        return new JobKey(availabilityId.ToString(), nameof(ConfirmCredits));
    }
}
