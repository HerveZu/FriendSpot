namespace Domain.ParkingSpots;

public sealed class ParkingSpotAvailability
{
    private ParkingSpotAvailability(
        Guid id,
        DateTimeOffset from,
        DateTimeOffset to,
        TimeSpan duration)
    {
        Id = id;
        From = from;
        To = to;
        Duration = duration;
    }

    public Guid Id { get; }
    public DateTimeOffset From { get; }
    public DateTimeOffset To { get; }
    public TimeSpan Duration { get; }

    private static ParkingSpotAvailability Create(DateTimeOffset from, DateTimeOffset to)
    {
        if (from >= to)
        {
            throw new InvalidOperationException("Availability end date should be after its start date");
        }

        var duration = to - from;
        return new ParkingSpotAvailability(
            Guid.CreateVersion7(from),
            from,
            to,
            duration);
    }

    public static ParkingSpotAvailability New(DateTimeOffset from, DateTimeOffset to)
    {
        if (from < DateTimeOffset.UtcNow)
        {
            throw new InvalidOperationException("Availability date should be in the future");
        }

        return Create(from, to);
    }

    public static ParkingSpotAvailability Merge(ParkingSpotAvailability a, ParkingSpotAvailability b)
    {
        if (!a.Overlaps(b))
        {
            throw new InvalidOperationException("Cannot merge non overlapping availabilities");
        }

        var minFrom = new[] { a.From, b.From }.Min();
        var maxTo = new[] { a.To, b.To }.Max();

        return Create(minFrom, maxTo);
    }

    public bool Overlaps(ParkingSpotAvailability other)
    {
        return From <= other.To && other.From <= To;
    }
}