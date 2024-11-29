using Api.Common;
using Api.Common.Infrastructure;
using Api.Spots.Contracts;
using Domain.Parkings;
using Domain.ParkingSpots;
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
        var currentUser = HttpContext.ToCurrentUser();

        var query = from parkingSpot in dbContext.Set<ParkingSpot>()
            where parkingSpot.OwnerId == currentUser.Identity
            join parking in dbContext.Set<Parking>() on parkingSpot.ParkingId equals parking.Id
            select new MySpotResponse
            {
                LotName = parkingSpot.SpotName,
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
