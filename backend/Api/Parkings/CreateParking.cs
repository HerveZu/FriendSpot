using Api.Common;
using Api.Common.Infrastructure;
using Api.Parkings.Contracts;
using Domain.Parkings;
using FastEndpoints;
using FluentValidation;
using JetBrains.Annotations;

namespace Api.Parkings;

[PublicAPI]
public sealed record CreateParkingRequest
{
    public required string Name { get; init; }
    public required string Address { get; init; }
}

internal sealed class CreateParkingValidator : Validator<CreateParkingRequest>
{
    public CreateParkingValidator()
    {
        RuleFor(x => x.Name).NotEmpty();
        RuleFor(x => x.Address).NotEmpty();
    }
}

internal sealed class CreateParking(ILogger<CreateParking> logger, AppDbContext dbContext)
    : Endpoint<CreateParkingRequest, ParkingResponse>
{
    public override void Configure()
    {
        Post("/parking");
    }

    public override async Task HandleAsync(CreateParkingRequest req, CancellationToken ct)
    {
        var currentUser = HttpContext.ToCurrentUser();

        logger.LogInformation("Creating new parking with name {Name} and address {Address}", req.Name, req.Address);
        var parking = Parking.Create(currentUser.Identity, req.Name, req.Address);

        dbContext.Set<Parking>().Add(parking);
        await dbContext.SaveChangesAsync(ct);

        await SendOkAsync(
            new ParkingResponse
            {
                Id = parking.Id,
                Name = parking.Name,
                Code = parking.Code,
                Address = parking.Address,
                SpotsCount = 0,
                OwnerId = parking.OwnerId
            },
            ct);
    }
}
