using Api.Common;
using Api.Common.Infrastructure;
using Api.Parkings.Contracts;
using Domain.Parkings;
using Domain.ParkingSpots;
using FastEndpoints;
using FluentValidation;
using JetBrains.Annotations;

namespace Api.Parkings;

[PublicAPI]
public sealed record EditParkingInfoRequest
{
    public Guid ParkingId { get; init; } // required makes deserialization fail
    public required string Name { get; init; }
    public required string Address { get; init; }
}

internal sealed class EditParkingInfoValidator : Validator<EditParkingInfoRequest>
{
    public EditParkingInfoValidator()
    {
        RuleFor(x => x.Name).NotEmpty();
        RuleFor(x => x.Address).NotEmpty();
    }
}

internal sealed class EditParkingInfo(ILogger<EditParkingInfo> logger, AppDbContext dbContext)
    : Endpoint<EditParkingInfoRequest, ParkingResponse>
{
    public override void Configure()
    {
        Put("/parking/{ParkingId:guid}");
    }

    public override async Task HandleAsync(EditParkingInfoRequest req, CancellationToken ct)
    {
        var currentUser = HttpContext.ToCurrentUser();

        logger.LogInformation(
            "Updating parking {ParkingId} with new name {Name} and new address {Address}",
            req.ParkingId,
            req.Name,
            req.Address);

        var parking = await dbContext.Set<Parking>().FindAsync([req.ParkingId], ct);

        if (parking is null)
        {
            ThrowError("Parking not found");
            return;
        }

        parking.EditInfo(currentUser.Identity, req.Name, req.Address);
        await dbContext.SaveChangesAsync(ct);

        await SendOkAsync(
            new ParkingResponse
            {
                Id = parking.Id,
                Name = parking.Name,
                Code = parking.Code.Value,
                Address = parking.Address,
                SpotsCount = dbContext
                    .Set<ParkingSpot>()
                    .Count(spot => spot.ParkingId == parking.Id),
                OwnerId = parking.OwnerId
            },
            ct);
    }
}
