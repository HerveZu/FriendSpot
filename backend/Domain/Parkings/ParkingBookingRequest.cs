namespace Domain.Parkings;

public sealed class ParkingBookingRequest
{
    private ParkingBookingRequest(
        Guid id,
        DateTimeOffset from,
        DateTimeOffset to,
        Credits bonus,
        string requesterId)
    {
        Id = id;
        DateRange = new DateTimeOffsetRange(from, to);
        Bonus = bonus;
        RequesterId = requesterId;
    }

    public Guid Id { get; }
    public DateTimeOffsetRange DateRange { get; }
    public DateTimeOffset From => DateRange.From;
    public DateTimeOffset To => DateRange.To;
    public Credits Bonus { get; }
    public string RequesterId { get; }
    public Credits Cost => Bonus + new Credits((decimal)Math.Max(1, DateRange.Duration.TotalHours));

    public static ParkingBookingRequest New(
        string requesterId,
        DateTimeOffset from,
        DateTimeOffset to,
        Credits bonus)
    {
        if (from < DateTimeOffset.UtcNow)
        {
            throw new BusinessException(
                "ParkingBookingRequest.Invalid",
                "Booking start date should be in the future.");
        }

        if (from >= to)
        {
            throw new BusinessException(
                "ParkingBookingRequest.Invalid",
                "Booking duration must be greater than zero.");
        }

        if (bonus.Amount < 0)
        {
            throw new BusinessException("ParkingBookingRequest.Invalid", "Booking request's bonus cannot be negative.");
        }

        return new ParkingBookingRequest(Guid.CreateVersion7(), from, to, bonus, requesterId);
    }
}
