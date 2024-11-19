using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Domain;

public sealed class ParkingLot
{
    private ParkingLot(Guid id, Guid parkingId, SpotName spotName)
    {
        Id = id;
        ParkingId = parkingId;
        SpotName = spotName;
    }

    public Guid Id { get; init; }
    public Guid ParkingId { get; private set; }
    public SpotName SpotName { get; private set; }

    public static ParkingLot Define(Guid parkingId, string spotName)
    {
        return new ParkingLot(Guid.CreateVersion7(), parkingId, new SpotName(spotName));
    }

    public void ChangeSpotName(Guid parkingId, string newSpotName)
    {
        ParkingId = parkingId;
        SpotName = new SpotName(newSpotName);
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

internal sealed class ParkingLotConfig : IEntityConfiguration<ParkingLot>
{
    public void Configure(EntityTypeBuilder<ParkingLot> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.SpotName)
            .HasMaxLength(10)
            .HasConversion(name => name.Name, name => new SpotName(name));
        builder.HasOne<Parking>().WithMany().HasForeignKey(x => x.ParkingId);
    }
}
