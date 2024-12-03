using JetBrains.Annotations;

namespace Api.MySpot.Contracts;

[PublicAPI]
public sealed record MySpotResponse
{
    public required string LotName { get; init; }
    public required ParkingResponse Parking { get; init; }
}