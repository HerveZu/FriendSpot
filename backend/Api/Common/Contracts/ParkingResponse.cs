using Domain.Parkings;
using Domain.ParkingSpots;
using JetBrains.Annotations;

namespace Api.Common.Contracts;

[PublicAPI]
public sealed record ParkingResponse
{
    public required Guid Id { get; init; }
    public required string Code { get; init; }
    public required string Name { get; init; }
    public required string Address { get; init; }
    public required int SpotsCount { get; init; }
    public required string OwnerId { get; init; }
    public required uint MaxSpots { get; init; }
    public required bool IsFull { get; init; }
}

public static class ParkingResponseExtensions
{
    public static IQueryable<ParkingResponse> ToParkingResponse(
        this IQueryable<Parking> parkingQueryable,
        IQueryable<ParkingSpot> allSpots)
    {
        return parkingQueryable
            .Select(parking => new
            {
                parking, spotCount = allSpots
                    .Count(spot => spot.ParkingId == parking.Id),
            })
            .Select(x => new ParkingResponse
            {
                Id = x.parking.Id,
                OwnerId = x.parking.OwnerId,
                Name = x.parking.Name,
                Address = x.parking.Address,
                Code = x.parking.Code,
                SpotsCount = x.spotCount,
                IsFull = x.spotCount >= x.parking.MaxSpotCount,
                MaxSpots = x.parking.MaxSpotCount
            });
    }
}
