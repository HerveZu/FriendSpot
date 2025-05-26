using Api.Common;
using Api.Common.Infrastructure;
using Domain;
using Domain.Parkings;
using Domain.ParkingSpots;
using FastEndpoints;
using FluentValidation;
using JetBrains.Annotations;
using Microsoft.EntityFrameworkCore;

namespace Api.Spots;

[PublicAPI]
public sealed record RequestSpotRequest
{
    public required DateTimeOffset From { get; init; }
    public required DateTimeOffset To { get; init; }
    public decimal Bonus { get; init; }

    [QueryParam]
    public bool Simulation { get; init; }
}

[PublicAPI]
public sealed record RequestSpotResponse
{
    public Guid? RequestId { get; init; }
    public required decimal UsedCredits { get; init; }
}

internal sealed class RequestSpotValidator : Validator<RequestSpotRequest>
{
    public RequestSpotValidator()
    {
        RuleFor(x => x.To).GreaterThan(x => x.From);
        RuleFor(x => x.From).GreaterThanOrEqualTo(_ => DateTimeOffset.UtcNow);
        RuleFor(x => x.Bonus).GreaterThanOrEqualTo(0);
    }
}

internal sealed class RequestSpot(AppDbContext dbContext) : Endpoint<RequestSpotRequest, RequestSpotResponse>
{
    public override void Configure()
    {
        Post("/parking/requests");
    }

    public override async Task HandleAsync(RequestSpotRequest req, CancellationToken ct)
    {
        var currentUser = HttpContext.ToCurrentUser();

        var usersParkingSpot = await dbContext
            .Set<ParkingSpot>()
            .FirstOrDefaultAsync(
                parkingLot => parkingLot.OwnerId == currentUser.Identity,
                ct);

        if (usersParkingSpot is null)
        {
            ThrowError("You must have a parking lot to request a spot booking.");
            return;
        }

        var parking = await dbContext
            .Set<Parking>()
            .SingleAsync(parking => parking.Id == usersParkingSpot.ParkingId, ct);

        var request = parking.RequestBooking(currentUser.Identity, req.From, req.To, new Credits(req.Bonus));

        if (req.Simulation)
        {
            await SendOkAsync(
                new RequestSpotResponse
                {
                    UsedCredits = request.Cost
                },
                ct);
            return;
        }

        dbContext.Set<Parking>().Update(parking);
        await dbContext.SaveChangesAsync(ct);

        await SendOkAsync(
            new RequestSpotResponse
            {
                RequestId = request.Id,
                UsedCredits = request.Cost
            },
            ct);
    }
}
