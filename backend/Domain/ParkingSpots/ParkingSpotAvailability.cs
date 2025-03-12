namespace Domain.ParkingSpots;

public sealed class ParkingSpotAvailability
{
    private ParkingSpotAvailability(
        Guid id,
        DateTimeOffset from,
        DateTimeOffset to)
    {
        Id = id;
        From = from;
        To = to;
    }

    public Guid Id { get; }
    public DateTimeOffset From { get; }
    public DateTimeOffset To { get; }
    public TimeSpan Duration => To - From;
    public Credits Price => new((decimal)Duration.TotalHours);

    private static ParkingSpotAvailability CreateValid(DateTimeOffset from, DateTimeOffset to)
    {
        if (from >= to)
        {
            throw new BusinessException(
                "ParkingSpot.InvalidAvailabilities",
                "Availability end date should be after its start date.");
        }

        return new ParkingSpotAvailability(Guid.CreateVersion7(from), from, to);
    }

    public static ParkingSpotAvailability New(DateTimeOffset from, DateTimeOffset to)
    {
        if (from < DateTimeOffset.UtcNow)
        {
            throw new BusinessException(
                "ParkingSpot.InvalidAvailabilities",
                "Availability date should be in the future.");
        }

        return CreateValid(from, to);
    }

    public static ParkingSpotAvailability Merge(ParkingSpotAvailability existing, ParkingSpotAvailability @new)
    {
        if (!existing.Overlaps(@new.From, @new.To))
        {
            throw new BusinessException(
                "ParkingSpot.InvalidAvailabilities",
                "Cannot merge non overlapping availabilities.");
        }

        var minFrom = new[] { existing.From, @new.From }.Min();
        var maxTo = new[] { existing.To, @new.To }.Max();

        return CreateValid(minFrom, maxTo);
    }

    public bool Overlaps(DateTimeOffset from, DateTimeOffset to)
    {
        return From <= to && from <= To;
    }

    public bool CanCancel(string userId, IEnumerable<ParkingSpotBooking> withBookings)
    {
        return withBookings
            .Where(booking => Overlaps(booking.From, booking.To))
            .All(booking => booking.CanCancel(userId));
    }

    public ParkingSpotAvailability[] Split(ParkingSpotBooking[] bookings)
    {
        if (bookings.Length is 0)
        {
            return [CreateValid(From, To)];
        }

        var availabilities = new Stack<ParkingSpotAvailability>();

        var availableSince = new[] { From, bookings.First().From }.Min();
        var borderMargin = TimeSpan.FromMinutes(1);

        foreach (var booking in bookings)
        {
            var notAvailableFrom = booking.From - borderMargin;
            var notAvailableTo = booking.From + booking.Duration + borderMargin;

            if (notAvailableFrom > availableSince)
            {
                availabilities.Push(CreateValid(availableSince, notAvailableFrom));
            }

            availableSince = notAvailableTo;
        }

        if (availableSince < To)
        {
            availabilities.Push(CreateValid(availableSince, To));
        }

        return availabilities.ToArray();
    }
}
