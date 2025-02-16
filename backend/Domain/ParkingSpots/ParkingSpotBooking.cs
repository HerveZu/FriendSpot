namespace Domain.ParkingSpots;

public sealed class ParkingSpotBooking
{
    private ParkingSpotBooking(
        Guid id,
        string bookingUserId,
        DateTimeOffset from,
        DateTimeOffset to,
        BookRating? rating)
    {
        Id = id;
        BookingUserId = bookingUserId;
        From = from;
        To = to;
        Rating = rating;
    }

    public Guid Id { get; }
    public string BookingUserId { get; }
    public DateTimeOffset From { get; private set; }
    public DateTimeOffset To { get; private set; }
    public TimeSpan Duration => To - From;
    public BookRating? Rating { get; private set; }
    public Credits Cost => new((decimal)Duration.TotalHours);
    public TimeSpan FrozenFor { get; } = TimeSpan.FromHours(1);

    public static ParkingSpotBooking New(string bookingUserId, DateTimeOffset from, TimeSpan duration)
    {
        return new ParkingSpotBooking(
            Guid.CreateVersion7(from),
            bookingUserId,
            from,
            from + duration,
            null);
    }

    public void Extend(DateTimeOffset newFrom, DateTimeOffset newTo)
    {
        From = new[] { From, newFrom }.Min();
        To = new[] { To, newTo }.Max();
    }

    internal void Rate(BookRating rating)
    {
        if (DateTimeOffset.UtcNow < To)
        {
            throw new BusinessException("ParkingSpot.InvalidRating", "Cannot rate an ongoing booking");
        }

        Rating = rating;
    }
}

public enum BookRating
{
    Neutral,
    Bad,
    Good
}
