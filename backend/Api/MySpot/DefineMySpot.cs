using Api.Common;
using Api.Common.Infrastructure;
using Api.MySpot.Contracts;
using Domain;
using FastEndpoints;
using FluentValidation;
using JetBrains.Annotations;
using Microsoft.EntityFrameworkCore;

namespace Api.MySpot;

[PublicAPI]
public sealed record DefineMySpotRequest
{
    public required Guid ParkingId { get; init; }
    public required string LotName { get; init; }
}

internal sealed class DefineMySpotValidator : Validator<DefineMySpotRequest>
{
    public DefineMySpotValidator()
    {
        RuleFor(x => x.LotName).MaximumLength(10);
    }
}

internal sealed class DefineMySpot(AppDbContext dbContext)
    : Endpoint<DefineMySpotRequest, MySpotResponse>
{
    public override void Configure()
    {
        Put("/@me/spot");
    }

    public override async Task HandleAsync(DefineMySpotRequest req, CancellationToken ct)
    {
        var parking = await dbContext.Set<Parking>().FindAsync([req.ParkingId], ct);

        if (parking is null)
        {
            ThrowError("Parking not found");
            return;
        }

        var parkingLot = await dbContext.Set<ParkingLot>()
            .FirstOrDefaultAsync(cancellationToken: ct);

        if (parkingLot is null)
        {
            parkingLot = ParkingLot.Define(HttpContext.ToUser(), req.ParkingId, req.LotName);
            await dbContext.Set<ParkingLot>().AddAsync(parkingLot, ct);
        }
        else
        {
            parkingLot.ChangeSpotName(req.ParkingId, req.LotName);
            dbContext.Set<ParkingLot>().Update(parkingLot);
        }

        await dbContext.SaveChangesAsync(ct);

        await SendOkAsync(
            new MySpotResponse
            {
                LotName = parkingLot.SpotName,
                Parking = parking.ToDto()
            },
            ct);
    }
}
