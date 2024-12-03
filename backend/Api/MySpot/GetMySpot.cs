using Api.Common;
using Api.Common.Infrastructure;
using Api.MySpot.Contracts;
using Domain.Parkings;
using Domain.ParkingSpots;
using FastEndpoints;
using JetBrains.Annotations;
using Microsoft.EntityFrameworkCore;

namespace Api.MySpot;

[PublicAPI]
public sealed record GetMySpotResponse
{
    public MySpotResponse? Spot { get; init; }
}

internal sealed class GetMySpot(AppDbContext dbContext) : EndpointWithoutRequest<GetMySpotResponse>
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

        var spot = await query.FirstOrDefaultAsync(ct);

        if (spot is null)
        {
            await SendOkAsync(new GetMySpotResponse(), ct);
            return;
        }

        await SendOkAsync(
            new GetMySpotResponse
            {
                Spot = spot
            },
            ct);
    }
}
