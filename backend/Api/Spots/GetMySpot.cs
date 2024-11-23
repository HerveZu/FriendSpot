using Api.Common.Infrastructure;
using Api.Spots.Contracts;
using Domain;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace Api.Spots;

internal sealed class GetMySpot(AppDbContext dbContext) : EndpointWithoutRequest<MySpotResponse>
{
    public override void Configure()
    {
        Get("/@me/spot");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var query = from parkingLot in dbContext.Set<ParkingLot>()
            join parking in dbContext.Set<Parking>() on parkingLot.ParkingId equals parking.Id
            select new MySpotResponse
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
