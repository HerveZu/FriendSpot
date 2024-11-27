using Quartz;

namespace Api.Booking.Common;

internal static class BookingJobsKeys
{
    public static JobKey ConfirmCredits(Guid availabilityId)
    {
        return new JobKey(availabilityId.ToString(), nameof(ConfirmCredits));
    }
}
