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
    public Credits Price => new((decimal)Duration.TotalHours);

    private static ParkingSpotAvailability Create(DateTimeOffset from, DateTimeOffset to)
    {
        if (from >= to)
        {
            throw new BusinessException(
                "ParkingSpot.InvalidAvailabilities",
                "Availability end date should be after its start date.");
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
            throw new BusinessException(
                "ParkingSpot.InvalidAvailabilities",
                "Availability date should be in the future.");
        }

        return Create(from, to);
    }

    public static ParkingSpotAvailability Merge(ParkingSpotAvailability existing, ParkingSpotAvailability @new)
    {
        if (!existing.Overlaps(@new))
        {
            throw new BusinessException(
                "ParkingSpot.InvalidAvailabilities",
                "Cannot merge non overlapping availabilities.");
        }

        var minFrom = new[] { existing.From, @new.From }.Min();
        var maxTo = new[] { existing.To, @new.To }.Max();

        return Create(minFrom, maxTo);
    }

    public bool Overlaps(ParkingSpotAvailability other)
    {
        return From <= other.To && other.From <= To;
    }

    public IEnumerable<ParkingSpotSplitAvailability> Split(ParkingSpotBooking[] bookings)
    {
        if (bookings.Length is 0)
        {
            yield return new ParkingSpotSplitAvailability
            {
                From = From,
                To = To,
            };
            yield break;
        }

        var lastFrom = new[] { From, bookings.First().From }.Min();
        var borderMargin = TimeSpan.FromMinutes(1);

        foreach (var booking in bookings.Where(booking => booking.From > lastFrom))
        {
            var slice = new ParkingSpotSplitAvailability
            {
                From = lastFrom,
                To = booking.From - borderMargin
            };

            yield return slice;

            lastFrom = booking.From + booking.Duration + borderMargin;
        }

        if (lastFrom < To)
        {
            yield return new ParkingSpotSplitAvailability
            {
                From = lastFrom,
                To = To,
            };
        }
    }
}

public sealed record ParkingSpotSplitAvailability
{
    public required DateTimeOffset From { get; init; }
    public required DateTimeOffset To { get; init; }
}
