using Domain.Users;
using JetBrains.Annotations;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Domain.Parkings;

public sealed class Parking
{
    private Parking(Guid id, string ownerId, ParkingName name, ParkingAddress address)
    {
        Id = id;
        OwnerId = ownerId;
        Name = name;
        Address = address;
    }

    public Guid Id { get; }
    public string OwnerId { get; private set; }
    public ParkingName Name { get; private set; }
    public ParkingAddress Address { get; private set; }

    public static Parking Create(string ownerId, string name, string address)
    {
        return new Parking(Guid.CreateVersion7(), ownerId, new ParkingName(name), new ParkingAddress(address));
    }

    public void SwitchOwnership(string newOwnerId)
    {
        OwnerId = newOwnerId;
    }

    public void EditInfo([UsedImplicitly] string updatingUserId, string newName, string newAddress)
    {
        if (updatingUserId != OwnerId)
        {
            throw new BusinessException("Parking.InvalidEdit", "Only the owner can edit the parking info.");
        }

        Name = new ParkingName(newName);
        Address = new ParkingAddress(newAddress);
    }
}

internal sealed class ParkingConfig : IEntityConfiguration<Parking>
{
    public void Configure(EntityTypeBuilder<Parking> builder)
    {
        builder.HasKey(x => x.Id);
        builder.HasOne<User>().WithMany().HasForeignKey(x => x.OwnerId);

        builder
            .Property(x => x.Name)
            .HasConversion<string>(x => x.Name, x => new ParkingName(x))
            .HasMaxLength(ParkingName.MaxLength);

        builder
            .Property(x => x.Address)
            .HasConversion<string>(x => x.Address, x => new ParkingAddress(x))
            .HasMaxLength(ParkingAddress.MaxLength);
    }
}
