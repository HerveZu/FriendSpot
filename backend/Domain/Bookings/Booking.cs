using Domain.ParkingSpots;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Domain.Bookings;

public sealed class Booking : IUserResource
{
    private Booking(Guid id, string userIdentity, DateTimeOffset from, DateTimeOffset to)
    {
        Id = id;
        UserIdentity = userIdentity;
        From = from;
        To = to;
    }

    public Guid Id { get; }
    public string UserIdentity { get; }
    public Guid ParkingLotId { get; init; }
    public DateTimeOffset From { get; private set; }
    public DateTimeOffset To { get; private set; }
    public TimeSpan Duration => To - From;

    public static Booking Book(string userIdentity, Guid parkingLotId, DateTimeOffset from, TimeSpan duration)
    {
        return new Booking(Guid.CreateVersion7(), userIdentity, from, from + duration)
        {
            ParkingLotId = parkingLotId
        };
    }

    public void Extend(DateTimeOffset newFrom, DateTimeOffset newTo)
    {
        From = new[] { From, newFrom }.Min();
        To = new[] { To, newTo }.Max();
    }
}

internal sealed class BookingConfig : IEntityConfiguration<Booking>
{
    public void Configure(EntityTypeBuilder<Booking> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.UserIdentity);
        builder.Property(x => x.From);
        builder.Property(x => x.To);
        builder.HasOne<ParkingLot>().WithMany().HasForeignKey(x => x.ParkingLotId);
    }
}
