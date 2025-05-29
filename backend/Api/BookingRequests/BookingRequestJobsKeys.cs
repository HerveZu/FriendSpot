using Quartz;

namespace Api.BookingRequests;

internal static class BookingRequestJobsKeys
{
    public static JobKey MarkRequestExpired(Guid requestId)
    {
        return new JobKey(requestId.ToString(), nameof(MarkRequestExpired));
    }
}