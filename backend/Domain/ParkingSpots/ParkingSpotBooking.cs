namespace Domain.ParkingSpots;

public sealed class ParkingSpotBooking
{
    private ParkingSpotBooking(Guid id, string bookingUserId, DateTimeOffset from, DateTimeOffset to)
    {
        Id = id;
        BookingUserId = bookingUserId;
        From = from;
        To = to;
    }

    public Guid Id { get; }
    public string BookingUserId { get; }
    public DateTimeOffset From { get; private set; }
    public DateTimeOffset To { get; private set; }
    public TimeSpan Duration => To - From;
    public Credits Cost => new((decimal)Duration.TotalHours);

    public static ParkingSpotBooking New(string bookingUserId, DateTimeOffset from, TimeSpan duration)
    {
        return new ParkingSpotBooking(Guid.CreateVersion7(from), bookingUserId, from, from + duration);
    }

    public void Extend(DateTimeOffset newFrom, DateTimeOffset newTo)
    {
        From = new[] { From, newFrom }.Min();
        To = new[] { To, newTo }.Max();
    }
}
