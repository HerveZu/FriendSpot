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
public sealed record CreateParkingRequest
{
    public required string Name { get; init; }
    public required string Address { get; init; }
    public bool Neighbourhood { get; init; }
}

internal sealed class CreateParkingValidator : Validator<CreateParkingRequest>
{
    public CreateParkingValidator()
    {
        RuleFor(x => x.Name).NotEmpty();
        RuleFor(x => x.Address).NotEmpty();
    }
}

internal sealed class CreateParking(ILogger<CreateParking> logger, AppDbContext dbContext, IUserFeatures features)
    : Endpoint<CreateParkingRequest, ParkingResponse>
{
    public override void Configure()
    {
        Post("/parking");
    }

    public override async Task HandleAsync(CreateParkingRequest req, CancellationToken ct)
    {
        var enabledFeatures = await features.GetEnabled(ct);

        var currentUser = HttpContext.ToCurrentUser();
        var neighbourhoodGroupCount = await dbContext.Set<Parking>()
            .Where(x => x.OwnerId == currentUser.Identity)
            .CountAsync(x => x.IsNeighbourhood, ct);

        if (req.Neighbourhood && neighbourhoodGroupCount >= enabledFeatures.Specs.MaxNeighbourhoodGroups)
        {
            ThrowError("You have reached the maximum number of neighbourhood groups");
            return;
        }

        logger.LogInformation("Creating new parking {Request}", req);
        var newParking = req.Neighbourhood
            ? Parking.CreateNeighbourhood(
                currentUser.Identity,
                req.Name,
                req.Address,
                enabledFeatures.Specs.MaxSpotPerNeighbourhoodGroup)
            : Parking.Create(currentUser.Identity, req.Name, req.Address, enabledFeatures.Specs.MaxSpotPerGroup);

        dbContext.Set<Parking>().Add(newParking);
        await dbContext.SaveChangesAsync(ct);

        var parkingResponse = await dbContext
            .Set<Parking>()
            .Where(parking => newParking.Id == parking.Id)
            .ToParkingResponse(dbContext.Set<ParkingSpot>())
            .FirstAsync(ct);

        await SendOkAsync(parkingResponse, ct);
    }
}
