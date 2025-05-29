using Quartz;

namespace Api.Bookings;

internal static class BookingJobsKeys
{
    public static JobKey MarkComplete(Guid bookingId)
    {
        return new JobKey(bookingId.ToString(), nameof(MarkComplete));
    }
}