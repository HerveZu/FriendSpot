using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Domain;

public sealed class ParkingLot : IBroadcastEvents, IUserResource
{
    private readonly List<ParkingSpotAvailability> _availabilities = [];

    private ParkingLot(Guid id, string userIdentity, Guid parkingId, SpotName spotName)
    {
        Id = id;
        UserIdentity = userIdentity;
        ParkingId = parkingId;
        SpotName = spotName;
    }

    public DomainEvents DomainEvents { get; } = new();
    public Guid Id { get; init; }
    public string UserIdentity { get; }
    public Guid ParkingId { get; private set; }
    public SpotName SpotName { get; private set; }
    public IReadOnlyList<ParkingSpotAvailability> Availabilities => _availabilities.AsReadOnly();

    public static ParkingLot Define(ICurrentUser currentUser, Guid parkingId, string spotName)
    {
        return new ParkingLot(Guid.CreateVersion7(), currentUser.Identity, parkingId, new SpotName(spotName));
    }

    public void ChangeSpotName(Guid parkingId, string newSpotName)
    {
        ParkingId = parkingId;
        SpotName = new SpotName(newSpotName);
    }

    public int MakeAvailable(DateTime from, DateTime to)
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
            .Aggregate(newAvailability, (a, b) => a.Merge(b));

        var credits = (int)Math.Floor((mergedAvailability.Duration - existingDuration).TotalHours);

        foreach (var overlappingAvailability in overlappingAvailabilities)
        {
            _availabilities.Remove(overlappingAvailability);
        }

        _availabilities.Add(mergedAvailability);

        return credits;
    }
}

public sealed record SpotName
{
    public SpotName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException($"'{nameof(name)}' cannot be null or whitespace.", nameof(name));
        }

        if (name.Length > 10)
        {
            throw new ArgumentException($"'{nameof(name)}' cannot be longer than 10 characters.", nameof(name));
        }

        Name = name.ToUpper();
    }

    public string Name { get; }

    public static implicit operator string(SpotName spotName) => spotName.Name;
}

public sealed record ParkingSpotAvailability
{
    private ParkingSpotAvailability(DateTime from, DateTime to, TimeSpan duration)
    {
        From = from;
        To = to;
        Duration = duration;
    }

    public DateTime From { get; }
    public DateTime To { get; }
    public TimeSpan Duration { get; }

    public static ParkingSpotAvailability New(DateTime from, DateTime to)
    {
        if (from >= to)
        {
            throw new InvalidOperationException("Availability end date should be after its start date");
        }

        if (from < DateTime.UtcNow)
        {
            throw new InvalidOperationException("Availability date should be in the future");
        }

        return new ParkingSpotAvailability(from, to, to - from);
    }

    public ParkingSpotAvailability Merge(ParkingSpotAvailability other)
    {
        if (!other.Overlaps(this))
        {
            throw new InvalidOperationException("Availabilities dont overlap");
        }

        var minFrom = new[] { From.ToUniversalTime(), other.From.ToUniversalTime() }.Min();
        var maxTo = new[] { To.ToUniversalTime(), other.To.ToUniversalTime() }.Max();

        return New(minFrom, maxTo);
    }

    public bool Overlaps(ParkingSpotAvailability other)
    {
        return From <= other.To && other.From < To;
    }
}

internal sealed class ParkingLotConfig : IEntityConfiguration<ParkingLot>
{
    public void Configure(EntityTypeBuilder<ParkingLot> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.UserIdentity);
        builder.Property(x => x.SpotName)
            .HasMaxLength(10)
            .HasConversion(name => name.Name, name => new SpotName(name));
        builder.HasIndex(x => new { x.UserIdentity, x.SpotName }).IsUnique();
        builder.HasOne<Parking>().WithMany().HasForeignKey(x => x.ParkingId);

        builder.OwnsMany(
            x => x.Availabilities,
            availabilityBuilder =>
            {
                availabilityBuilder.Property(availability => availability.From);
                availabilityBuilder.Property(availability => availability.To);
                availabilityBuilder.Property(availability => availability.Duration);
            });
    }
}
