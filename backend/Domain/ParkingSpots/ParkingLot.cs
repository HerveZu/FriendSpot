using Domain.Parkings;
using Domain.Users;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Domain.ParkingSpots;

public sealed record ParkingSpotAvailable : IDomainEvent
{
    public required Guid AvailabilityId { get; init; }
    public required string UserIdentity { get; init; }
    public required Credits Credits { get; init; }
    public required DateTimeOffset AvailableUntil { get; init; }
}

public sealed record ParkingSpotAvailabilityCancelled : IDomainEvent
{
    public required Guid AvailabilityId { get; init; }
}

public sealed class ParkingLot : IBroadcastEvents, IUserResource
{
    private readonly List<ParkingSpotAvailability> _availabilities = [];
    private readonly DomainEvents _domainEvents = new();

    private ParkingLot(Guid id, string userIdentity, Guid parkingId, SpotName spotName)
    {
        Id = id;
        UserIdentity = userIdentity;
        ParkingId = parkingId;
        SpotName = spotName;
    }

    public Guid Id { get; init; }
    public Guid ParkingId { get; private set; }
    public SpotName SpotName { get; private set; }
    public IReadOnlyList<ParkingSpotAvailability> Availabilities => _availabilities.AsReadOnly();

    public IEnumerable<IDomainEvent> GetUncommittedEvents()
    {
        return _domainEvents.GetUncommittedEvents();
    }

    public string UserIdentity { get; }

    public static ParkingLot Define(string userIdentity, Guid parkingId, string spotName)
    {
        return new ParkingLot(Guid.CreateVersion7(), userIdentity, parkingId, new SpotName(spotName));
    }

    public void ChangeSpotName(Guid parkingId, string newSpotName)
    {
        ParkingId = parkingId;
        SpotName = new SpotName(newSpotName);
    }

    public Credits MakeAvailable(DateTimeOffset from, DateTimeOffset to)
    {
        var newAvailability = ParkingSpotAvailability.New(from, to);
        var overlappingAvailabilities = Availabilities
            .Where(other => newAvailability.Overlaps(other))
            .ToArray();

        var existingDuration = overlappingAvailabilities.Any()
            ? overlappingAvailabilities.Max(availability => availability.To)
              - overlappingAvailabilities.Min(availability => availability.From)
            : TimeSpan.Zero;

        var mergedAvailability = overlappingAvailabilities
            .Aggregate(newAvailability, ParkingSpotAvailability.Merge);

        var totalCredits = new Credits((decimal)mergedAvailability.Duration.TotalHours);
        var earnedCredits = new Credits((decimal)(mergedAvailability.Duration - existingDuration).TotalHours);

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
                UserIdentity = UserIdentity,
                AvailabilityId = mergedAvailability.Id,
                AvailableUntil = mergedAvailability.To,
                Credits = totalCredits
            });

        return earnedCredits;
    }
}

internal sealed class ParkingLotConfig : IEntityConfiguration<ParkingLot>
{
    public void Configure(EntityTypeBuilder<ParkingLot> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.SpotName)
            .HasMaxLength(10)
            .HasConversion(name => name.Name, name => new SpotName(name));
        builder.HasIndex(x => new { x.UserIdentity, x.SpotName }).IsUnique();

        builder.HasOne<Parking>().WithMany().HasForeignKey(x => x.ParkingId);
        builder.HasOne<User>().WithOne().HasForeignKey<ParkingLot>(x => x.UserIdentity);

        builder.OwnsMany(
            x => x.Availabilities,
            availabilityBuilder =>
            {
                availabilityBuilder.WithOwner().HasPrincipalKey(x => x.Id);
                availabilityBuilder.Property(x => x.Id);
                availabilityBuilder.Property(x => x.From);
                availabilityBuilder.Property(x => x.To);
                availabilityBuilder.Property(x => x.Duration);
            });
    }
}
