using Api.Common.Infrastructure;
using Api.MySpot.Contracts;
using Domain.Parkings;
using FastEndpoints;
using JetBrains.Annotations;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.MySpot;

[PublicAPI]
public sealed record SearchAvailableParkingRequest
{
    [FromQuery]
    public string? Search { get; init; }
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

        if (!string.IsNullOrWhiteSpace(search))
        {
            matchingParking = matchingParking.Where(
                parking =>
                    EF.Functions.ILike(parking.Name.ToLower(), $"%{search}%")
                    || EF.Functions.ILike(parking.Address.ToLower(), $"%{search}%"));
        }

        var availableParking = await matchingParking
            .OrderBy(parking => parking.Name)
            .Select(parking => parking.ToDto())
            .ToArrayAsync(ct);

        await SendOkAsync(availableParking, ct);
    }
}
