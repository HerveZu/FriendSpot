using Api.Common.Infrastructure;
using Api.MySpot.Contracts;
using Domain;
using FastEndpoints;
using JetBrains.Annotations;
using Microsoft.EntityFrameworkCore;

namespace Api.MySpot;

[PublicAPI]
public sealed record GetMySpotResponse
{
    public required string LotName {get; init; }
    public required ParkingResponse Parking {get; init; }
}

internal sealed class GetMySpot(AppDbContext dbContext) : EndpointWithoutRequest<GetMySpotResponse>
{
    public override void Configure()
    {
        Get("/@me/spot");
        AllowAnonymous();
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var query = from parkingLot in dbContext.Set<ParkingLot>()
            join parking in dbContext.Set<Parking>() on parkingLot.ParkingId equals parking.Id
            select new GetMySpotResponse
            {
                LotName = parkingLot.SpotName,
                Parking = parking.ToDto()
            };

        var result = await query.FirstOrDefaultAsync(ct);

        if (result is null)
        {
            await SendNoContentAsync(ct);
            return;
        }

        await SendOkAsync(result, ct);
    }
}
