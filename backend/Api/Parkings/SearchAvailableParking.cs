using Api.Common;
using Api.Common.Contracts;
using Api.Common.Infrastructure;
using Domain.Parkings;
using Domain.ParkingSpots;
using FastEndpoints;
using JetBrains.Annotations;
using Microsoft.EntityFrameworkCore;

namespace Api.Parkings;

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
            matchingParking = matchingParking.Where(parking =>
                // ReSharper disable once EntityFramework.ClientSideDbFunctionCall
                EF.Functions.ILike(parking.Name, $"%{search}%")
                // ReSharper disable once EntityFramework.ClientSideDbFunctionCall
                || EF.Functions.ILike(parking.Address, $"%{search}%")
#pragma warning disable CA1862
                || parking.Code == search.ToUpperInvariant());
#pragma warning restore CA1862
        }

        if (req.OwnedOnly)
        {
            matchingParking = matchingParking.Where(parking => parking.OwnerId == currentUser.Identity);
        }

        var availableParking = await matchingParking
            .ToParkingResponse(dbContext.Set<ParkingSpot>())
            .OrderByDescending(parking => parking.SpotsCount)
            .ToArrayAsync(ct);

        await SendOkAsync(availableParking, ct);
    }
}
