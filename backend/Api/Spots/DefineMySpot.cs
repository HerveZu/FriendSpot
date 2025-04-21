using Api.Common;
using Api.Common.Infrastructure;
using Domain.Parkings;
using Domain.ParkingSpots;
using FastEndpoints;
using FluentValidation;
using JetBrains.Annotations;
using Microsoft.EntityFrameworkCore;

namespace Api.Spots;

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
        RuleFor(x => x.LotName)
            .NotEmpty()
            .MaximumLength(SpotName.MaxLength);
    }
}

internal sealed class DefineMySpot(AppDbContext dbContext) : Endpoint<DefineMySpotRequest>
{
    public override void Configure()
    {
        Put("/@me/spot");
    }

    public override async Task HandleAsync(DefineMySpotRequest req, CancellationToken ct)
    {
        var currentUser = HttpContext.ToCurrentUser();
        var parking = await dbContext.Set<Parking>().FindAsync([req.ParkingId], ct);

        if (parking is null)
        {
            ThrowError("Parking not found");
            return;
        }

        var parkingSpot = await dbContext.Set<ParkingSpot>()
            .FirstOrDefaultAsync(parkingSpot => parkingSpot.OwnerId == currentUser.Identity, ct);

        if (parkingSpot is null)
        {
            parkingSpot = ParkingSpot.Define(HttpContext.ToCurrentUser().Identity, req.ParkingId, req.LotName);
            await dbContext.Set<ParkingSpot>().AddAsync(parkingSpot, ct);
        }
        else
        {
            parkingSpot.ChangeSpotName(req.ParkingId, req.LotName);
            dbContext.Set<ParkingSpot>().Update(parkingSpot);
        }

        await dbContext.SaveChangesAsync(ct);
    }
}
