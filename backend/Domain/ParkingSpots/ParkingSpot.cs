using Domain.Parkings;
using Domain.Users;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Domain.ParkingSpots;

public sealed record ParkingSpotAvailable : IDomainEvent
{
    public required Guid AvailabilityId { get; init; }
    public required string OwnerId { get; init; }
    public required Credits Credits { get; init; }
    public required DateTimeOffset AvailableUntil { get; init; }
}

public sealed record ParkingSpotAvailabilityCancelled : IDomainEvent
{
    public required Guid AvailabilityId { get; init; }
}

public sealed record ParkingSpotBooked : IDomainEvent
{
    public required Guid AvailabilityId { get; init; }
    public required Credits Cost { get; init; }
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
            .Where(booking => booking.From <= newBooking.To && newBooking.From <= booking.To)
            .ToArray();

        if (overlappingBookings.Any(booking => booking.BookingUserId != bookingUserId))
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
                AvailabilityId = availability.Id,
                Cost = cost
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
            _domainEvents.Register(
                new ParkingSpotAvailabilityCancelled
                {
                    AvailabilityId = overlappingAvailability.Id
                });
        }

        _availabilities.Add(mergedAvailability);

        _domainEvents.Register(
            new ParkingSpotAvailable
            {
                OwnerId = OwnerId,
                AvailabilityId = mergedAvailability.Id,
                AvailableUntil = mergedAvailability.To,
                Credits = totalCredits
            });

        return (earnedCredits, overlappingAvailabilities.Any());
    }
}

internal sealed class ParkingLotConfig : IEntityConfiguration<ParkingSpot>
{
    public void Configure(EntityTypeBuilder<ParkingSpot> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.SpotName)
            .HasMaxLength(10)
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
                availabilityBuilder.Property(x => x.Duration);
            });

        builder.OwnsMany(
            x => x.Bookings,
            bookingBuilder =>
            {
                bookingBuilder.Property(x => x.Id);
                bookingBuilder.HasOne<User>().WithMany().HasForeignKey(x => x.BookingUserId);
                bookingBuilder.Property(x => x.From);
                bookingBuilder.Property(x => x.To);
            });
    }
}
