using Api.Common.Infrastructure;
using Domain;
using FastEndpoints;
using FluentValidation;
using JetBrains.Annotations;
using Microsoft.EntityFrameworkCore;

namespace Api.MySpot;

[PublicAPI]
public sealed record MakeSpotAvailableRequest
{
    public required DateTime From { get; init; }
    public required DateTime To { get; init; }
}

[PublicAPI]
public sealed record MakeSpotAvailableResponse
{
    public required decimal EarnedCredits { get; init; }
}

internal sealed class MakeSpotAvailableValidator : Validator<MakeSpotAvailableRequest>
{
    public MakeSpotAvailableValidator()
    {
        RuleFor(x => x.To).GreaterThan(x => x.From);
        RuleFor(x => x.From).GreaterThanOrEqualTo(DateTime.UtcNow);
    }
}

internal sealed class MakeSpotAvailable(AppDbContext dbContext)
    : Endpoint<MakeSpotAvailableRequest, MakeSpotAvailableResponse>
{
    public override void Configure()
    {
        Post("/@me/spot/availability");
    }

    public override async Task HandleAsync(MakeSpotAvailableRequest req, CancellationToken ct)
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
            new MakeSpotAvailableResponse
            {
                EarnedCredits = earnedCredits
            },
            ct);
    }
}
