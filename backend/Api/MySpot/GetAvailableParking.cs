using Api.Common.Infrastructure;
using Api.MySpot.Contracts;
using Domain;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace Api.MySpot;

internal sealed class GetAvailableParking(AppDbContext dbContext) : EndpointWithoutRequest
{
    public override void Configure()
    {
        Get("/parking");
        AllowAnonymous();
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var availableParking = await dbContext
            .Set<Parking>()
            .OrderBy(parking => parking.Name)
            .Select(parking => parking.ToDto())
            .ToArrayAsync(ct);

        await SendOkAsync(availableParking, ct);
    }
}
