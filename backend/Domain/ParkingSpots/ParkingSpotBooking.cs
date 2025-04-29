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
        DateRange = new DateTimeOffsetRange(from, to);
        Rating = rating;
    }

    public Guid Id { get; }
    public string BookingUserId { get; }
    public DateTimeOffsetRange DateRange { get; private set; }
    public DateTimeOffset From => DateRange.From;
    public DateTimeOffset To => DateRange.To;
    public TimeSpan Duration => DateRange.Duration;
    public BookRating? Rating { get; private set; }
    public Credits Cost => new((decimal)Math.Max(1, Duration.TotalHours));
    public bool HasNotExpiredNow => To > DateTimeOffset.Now;

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
        DateRange = DateRange.Extend(newFrom, newTo);
    }

    public bool CanCancel(string userId)
    {
        var now = DateTimeOffset.UtcNow;
        var hasAlreadyEnded = To < now;

        if (hasAlreadyEnded)
        {
            return false;
        }

        var frozenFor = userId == BookingUserId
            ? TimeSpan.Zero
            : TimeSpan.FromHours(2);

        var bookingIsActiveIn = From - now;

        return bookingIsActiveIn > frozenFor;
    }

    internal void Rate(BookRating rating)
    {
        if (Rating is not null)
        {
            throw new BusinessException("ParkingSpot.InvalidRating", "Cannot rate a booking twice");
        }

        if (HasNotExpiredNow)
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
