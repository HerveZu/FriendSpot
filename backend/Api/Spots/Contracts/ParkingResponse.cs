using JetBrains.Annotations;

namespace Api.Spots.Contracts;

[PublicAPI]
public sealed record ParkingResponse
{
    public required Guid Id { get; init; }
    public required string Name { get; init; }
    public required string Address { get; init; }
    public required int SpotsCount { get; init; }
    public required string OwnerId { get; init; }
}
