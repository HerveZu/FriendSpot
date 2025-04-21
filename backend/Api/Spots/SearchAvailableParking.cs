using Api.Common;
using Api.Common.Infrastructure;
using Api.Spots.Contracts;
using Domain.Parkings;
using Domain.ParkingSpots;
using FastEndpoints;
using JetBrains.Annotations;
using Microsoft.EntityFrameworkCore;

namespace Api.Spots;

[PublicAPI]
public sealed record SearchAvailableParkingRequest
{
    public string? Search { get; init; }
    public bool OwnedOnly { get; init; }
}

internal sealed class SearchAvailableParking(AppDbContext dbContext)
    : Endpoint<SearchAvailableParkingRequest, ParkingResponse[]>
{
    public override void Configure()
    {
        Get("/parking");
    }

    public override async Task HandleAsync(SearchAvailableParkingRequest req, CancellationToken ct)
    {
        var matchingParking = dbContext.Set<Parking>().AsQueryable();
        var search = req.Search?.ToLowerInvariant();
        var currentUser = HttpContext.ToCurrentUser();

        if (!string.IsNullOrWhiteSpace(search))
        {
            matchingParking = matchingParking.Where(
                parking =>
                    // ReSharper disable once EntityFramework.ClientSideDbFunctionCall
                    EF.Functions.ILike(parking.Name, $"%{search}%")
                    // ReSharper disable once EntityFramework.ClientSideDbFunctionCall
                    || EF.Functions.ILike(parking.Address, $"%{search}%"));
        }

        if (req.OwnedOnly)
        {
            matchingParking = matchingParking.Where(parking => parking.OwnerId == currentUser.Identity);
        }

        var availableParking = await matchingParking
            .Select(
                parking => new ParkingResponse
                {
                    Id = parking.Id,
                    Name = parking.Name,
                    Address = parking.Address,
                    SpotsCount = dbContext
                        .Set<ParkingSpot>()
                        .Count(spot => spot.ParkingId == parking.Id),
                    OwnerId = parking.OwnerId
                })
            .OrderByDescending(parking => parking.SpotsCount)
            .ToArrayAsync(ct);

        await SendOkAsync(availableParking, ct);
    }
}
