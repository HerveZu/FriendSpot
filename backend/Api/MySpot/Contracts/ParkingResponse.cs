using Domain.Parkings;
using JetBrains.Annotations;

namespace Api.MySpot.Contracts;

[PublicAPI]
public sealed record ParkingResponse
{
    public required Guid Id { get; init; }
    public required string Name { get; init; }
    public required string Address { get; init; }
}

internal static class ParkingMapping
{
    public static ParkingResponse ToDto(this Parking parking)
    {
        return new ParkingResponse
        {
            Id = parking.Id,
            Name = parking.Name,
            Address = parking.Address
        };
    }
}