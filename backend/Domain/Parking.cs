using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Domain;

public sealed class Parking
{
    private Parking(Guid id, string name, string address)
    {
        Id = id;
        Name = name;
        Address = address;
    }

    public Guid Id { get; init; }
    public string Name { get; init; }
    public string Address { get; init; }
}

internal sealed class ParkingConfig : IEntityConfiguration<Parking>
{
    public void Configure(EntityTypeBuilder<Parking> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Name).HasMaxLength(50);
        builder.Property(x => x.Address).HasMaxLength(100);
    }
}
