using Api.Common.Infrastructure;
using Domain;
using FastEndpoints;
using FluentValidation;
using JetBrains.Annotations;
using Microsoft.EntityFrameworkCore;

namespace Api.Spots;

[PublicAPI]
public sealed record MakeMySpotAvailableRequest
{
    public required DateTime From { get; init; }
    public required DateTime To { get; init; }
}

[PublicAPI]
public sealed record MakeMySpotAvailableResponse
{
    public required decimal EarnedCredits { get; init; }
}

internal sealed class MakeMySpotAvailableValidator : Validator<MakeMySpotAvailableRequest>
{
    public MakeMySpotAvailableValidator()
    {
        RuleFor(x => x.To).GreaterThan(x => x.From);
        RuleFor(x => x.From).GreaterThanOrEqualTo(DateTime.UtcNow);
    }
}

internal sealed class MakeMySpotAvailable(AppDbContext dbContext)
    : Endpoint<MakeMySpotAvailableRequest, MakeMySpotAvailableResponse>
{
    public override void Configure()
    {
        Post("/@me/spot/availability");
    }

    public override async Task HandleAsync(MakeMySpotAvailableRequest req, CancellationToken ct)
    {
        var parkingLot = await dbContext.Set<ParkingLot>().FirstOrDefaultAsync(ct);

        if (parkingLot is null)
        {
            ThrowError("No spot defined");
            return;
        }

        var earnedCredits = parkingLot.MakeAvailable(req.From, req.To);

        dbContext.Set<ParkingLot>().Update(parkingLot);
        await dbContext.SaveChangesAsync(ct);

        await SendOkAsync(
            new MakeMySpotAvailableResponse
            {
                EarnedCredits = earnedCredits
            },
            ct);
    }
}
