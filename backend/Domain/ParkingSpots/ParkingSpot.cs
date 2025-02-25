using Domain.Parkings;
using Domain.Users;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Domain.ParkingSpots;

public sealed record ParkingSpotBooked : IDomainEvent
{
    public required Guid SpotId { get; init; }
    public required Guid BookingId { get; init; }
    public required Credits Cost { get; init; }
    public required DateTimeOffset BookedUntil { get; init; }
    public required string OwnerId { get; init; }
    public required string UserId { get; init; }
}

public sealed record ParkingSpotBookingRated : IDomainEvent
{
    public required string OwnerId { get; init; }
    public required BookRating Rating { get; init; }
}

public sealed record ParkingSpotBookingCancelled : IDomainEvent
{
    public required Guid BookingId { get; init; }
    public required string BookingUserId { get; init; }
    public required string OwnerId { get; init; }
}

public sealed record ParkingSpotBookingCompleted : IDomainEvent
{
    public required Guid BookingId { get; init; }
    public required string OwnerId { get; init; }
}

public sealed class ParkingSpot : IBroadcastEvents
{
    private readonly List<ParkingSpotAvailability> _availabilities = [];
    private readonly List<ParkingSpotBooking> _bookings = [];
    private readonly DomainEvents _domainEvents = new();

    private ParkingSpot(Guid id, string ownerId, Guid parkingId, SpotName spotName)
    {
        Id = id;
        OwnerId = ownerId;
        ParkingId = parkingId;
        SpotName = spotName;
    }

    public Guid Id { get; init; }
    public Guid ParkingId { get; private set; }
    public SpotName SpotName { get; private set; }
    public string OwnerId { get; }
    public IReadOnlyList<ParkingSpotAvailability> Availabilities => _availabilities.AsReadOnly();
    public IReadOnlyList<ParkingSpotBooking> Bookings => _bookings.AsReadOnly();

    public IEnumerable<IDomainEvent> GetUncommittedEvents()
    {
        return _domainEvents.GetUncommittedEvents();
    }

    public static ParkingSpot Define(string ownerId, Guid parkingId, string spotName)
    {
        return new ParkingSpot(Guid.CreateVersion7(), ownerId, parkingId, new SpotName(spotName));
    }

    public void ChangeSpotName(Guid parkingId, string newSpotName)
    {
        ParkingId = parkingId;
        SpotName = new SpotName(newSpotName);
    }

    public (ParkingSpotBooking Booking, Credits cost) Book(
        string bookingUserId,
        DateTimeOffset from,
        TimeSpan duration)
    {
        if (bookingUserId == OwnerId)
        {
            throw new BusinessException("ParkingSpot.InvalidBooking", "Cannot book your own spot.");
        }

        if (from < DateTimeOffset.UtcNow)
        {
            throw new BusinessException("ParkingSpot.InvalidBooking", "Cannot book spot in the past.");
        }

        if (duration <= TimeSpan.Zero)
        {
            throw new BusinessException("ParkingSpot.InvalidBooking", "Booking duration must be positive.");
        }

        var until = from + duration;

        var availability = Availabilities
            .FirstOrDefault(availability => availability.From <= from && availability.To >= until);

        if (availability is null)
        {
            throw new BusinessException("ParkingSpot.NoAvailability", "This parking spot has no availability.");
        }

        var newBooking = ParkingSpotBooking.New(bookingUserId, from, duration);

        var overlappingBookings = _bookings
            .Where(booking => booking.BookingUserId != bookingUserId)
            .Where(booking => booking.From <= newBooking.To && newBooking.From <= booking.To)
            .ToArray();

        if (overlappingBookings.Length is not 0)
        {
            throw new BusinessException("ParkingSpot.NoAvailability", "This spot has already been booked.");
        }

        foreach (var overlappingBooking in overlappingBookings)
        {
            newBooking.Extend(overlappingBooking.From, overlappingBooking.To);
            _bookings.Remove(overlappingBooking);
        }

        _bookings.Add(newBooking);

        var alreadyBookedCost = new Credits(overlappingBookings.Sum(booking => booking.Cost));
        var cost = newBooking.Cost - alreadyBookedCost;

        _domainEvents.Register(
            new ParkingSpotBooked
            {
                SpotId = Id,
                BookingId = newBooking.Id,
                Cost = cost,
                BookedUntil = newBooking.To,
                UserId = newBooking.BookingUserId,
                OwnerId = OwnerId
            });

        return (newBooking, cost);
    }

    public (Credits credits, bool overlaps) MakeAvailable(DateTimeOffset from, DateTimeOffset to)
    {
        var newAvailability = ParkingSpotAvailability.New(from, to);
        var overlappingAvailabilities = Availabilities
            .Where(other => newAvailability.Overlaps(other))
            .ToArray();

        var mergedAvailability = overlappingAvailabilities
            .Aggregate(newAvailability, ParkingSpotAvailability.Merge);

        var alreadyEarnedCredits = new Credits(
            overlappingAvailabilities
                .Sum(availability => availability.Price));

        var totalCredits = mergedAvailability.Price;
        var earnedCredits = totalCredits - alreadyEarnedCredits;

        foreach (var overlappingAvailability in overlappingAvailabilities)
        {
            _availabilities.Remove(overlappingAvailability);
        }

        _availabilities.Add(mergedAvailability);

        return (earnedCredits, overlappingAvailabilities.Any());
    }

    public void RateBooking(string ratingUserId, Guid bookingId, BookRating rating)
    {
        var booking = _bookings.FirstOrDefault(booking => booking.Id == bookingId)
                      ?? throw new BusinessException("ParkingSpot.BookingNotFound", "Booking not found");

        if (ratingUserId != booking.BookingUserId)
        {
            throw new BusinessException("ParkingSpot.InvalidRating", "Cannot rate another person's booking");
        }

        if (booking.Rating is not null)
        {
            throw new BusinessException("ParkingSpot.InvalidRating", "This booking has already been rated");
        }

        booking.Rate(rating);

        _domainEvents.Register(
            new ParkingSpotBookingRated
            {
                OwnerId = OwnerId,
                Rating = rating
            });
    }

    public void CancelBooking(string cancelingUserId, Guid bookingId)
    {
        var booking = _bookings.FirstOrDefault(booking => booking.Id == bookingId);

        if (booking is null)
        {
            throw new BusinessException("ParkingSpot.BookingNotFound", "Booking not found");
        }

        var allowedToCancel = new[] { OwnerId, booking.BookingUserId };
        if (!allowedToCancel.Contains(cancelingUserId))
        {
            throw new BusinessException("ParkingSpot.InvalidCancelling", "Cannot cancel booking");
        }

        if (booking.To - DateTimeOffset.UtcNow < booking.FrozenFor)
        {
            throw new BusinessException(
                "ParkingSpot.InvalidCancelling",
                $"Booking can only be cancelled at least {booking.FrozenFor} before it becomes active");
        }

        _bookings.Remove(booking);
        _domainEvents.Register(
            new ParkingSpotBookingCancelled
            {
                BookingUserId = booking.BookingUserId,
                BookingId = booking.Id,
                OwnerId = OwnerId
            });
    }

    public void MarkBookingComplete(Guid bookingId)
    {
        var booking = _bookings.FirstOrDefault(booking => booking.Id == bookingId);

        if (booking is null)
        {
            throw new BusinessException("ParkingSpot.BookingNotFound", "Booking not found");
        }

        _domainEvents.Register(
            new ParkingSpotBookingCompleted
            {
                BookingId = booking.Id,
                OwnerId = OwnerId
            });
    }
}

internal sealed class ParkingLotConfig : IEntityConfiguration<ParkingSpot>
{
    public void Configure(EntityTypeBuilder<ParkingSpot> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.SpotName)
            .HasMaxLength(SpotName.MaxLength)
            .HasConversion(name => name.Name, name => new SpotName(name));
        builder.HasIndex(x => new { x.OwnerId, x.SpotName }).IsUnique();

        builder.HasOne<Parking>().WithMany().HasForeignKey(x => x.ParkingId);
        builder.HasOne<User>().WithOne().HasForeignKey<ParkingSpot>(x => x.OwnerId);

        builder.OwnsMany(
            x => x.Availabilities,
            availabilityBuilder =>
            {
                availabilityBuilder.Property(x => x.Id);
                availabilityBuilder.Property(x => x.From);
                availabilityBuilder.Property(x => x.To);
            });

        builder.OwnsMany(
            x => x.Bookings,
            bookingBuilder =>
            {
                bookingBuilder.Property(x => x.Id);
                bookingBuilder.HasOne<User>().WithMany().HasForeignKey(x => x.BookingUserId);
                bookingBuilder.Property(x => x.From);
                bookingBuilder.Property(x => x.To);
                bookingBuilder.Property(x => x.Rating);
            });
    }
}
