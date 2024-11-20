using Api.Common.Infrastructure;
using Api.MySpot.Contracts;
using Domain;
using FastEndpoints;
using JetBrains.Annotations;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.MySpot;

[PublicAPI]
public sealed record GetAvailableParkingRequest
{
    [FromQuery]
    public string? Search { get; init; }
}

internal sealed class GetAvailableParking(AppDbContext dbContext) : Endpoint<GetAvailableParkingRequest>
{
    public override void Configure()
    {
        Get("/parking");
        AllowAnonymous();
    }

    public override async Task HandleAsync(GetAvailableParkingRequest req, CancellationToken ct)
    {
        var matchingParking = dbContext.Set<Parking>().AsQueryable();
        var search = req.Search?.ToLowerInvariant();

        if (!string.IsNullOrWhiteSpace(search))
        {
            matchingParking = matchingParking.Where(
                parking =>
                    EF.Functions.ILike(parking.Name, $"%{search}%")
                    || EF.Functions.ILike(parking.Address, $"%{search}%"));
        }

        var availableParking = await matchingParking
            .OrderBy(parking => parking.Name)
            .Select(parking => parking.ToDto())
            .ToArrayAsync(ct);

        await SendOkAsync(availableParking, ct);
    }
}
