using Api.Common;
using Api.Common.Contracts;
using Api.Common.Infrastructure;
using Domain.Parkings;
using Domain.ParkingSpots;
using FastEndpoints;
using FluentValidation;
using JetBrains.Annotations;
using Microsoft.EntityFrameworkCore;

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

        var editingParking = await dbContext.Set<Parking>().FindAsync([req.ParkingId], ct);

        if (editingParking is null)
        {
            ThrowError("Parking not found");
            return;
        }

        editingParking.EditInfo(currentUser.Identity, req.Name, req.Address);
        await dbContext.SaveChangesAsync(ct);

        var parkingResponse = await dbContext
            .Set<Parking>()
            .Where(parking => editingParking.Id == parking.Id)
            .ToParkingResponse(dbContext.Set<ParkingSpot>())
            .FirstAsync(ct);

        await SendOkAsync(parkingResponse, ct);
    }
}
