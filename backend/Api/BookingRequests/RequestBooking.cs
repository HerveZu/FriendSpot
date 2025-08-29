using Api.Common;
using Api.Common.Infrastructure;
using Domain;
using Domain.Parkings;
using Domain.ParkingSpots;
using FastEndpoints;
using FluentValidation;
using JetBrains.Annotations;
using Microsoft.EntityFrameworkCore;

namespace Api.BookingRequests;

[PublicAPI]
public sealed record RequestBookingRequest
{
    public required DateTimeOffset From { get; init; }
    public required DateTimeOffset To { get; init; }
    public decimal Bonus { get; init; }

    [QueryParam]
    public bool Simulation { get; init; }
}

[PublicAPI]
public sealed record RequestBookingResponse
{
    public Guid? RequestId { get; init; }
    public required decimal UsedCredits { get; init; }
}

internal sealed class RequestBookingValidator : Validator<RequestBookingRequest>
{
    public RequestBookingValidator()
    {
        RuleFor(x => x.To).GreaterThan(x => x.From);
        RuleFor(x => x.From).GreaterThanOrEqualTo(_ => DateTimeOffset.UtcNow);
        RuleFor(x => x.Bonus).GreaterThanOrEqualTo(0);
    }
}

internal sealed class RequestBooking(AppDbContext dbContext, IUserFeatures features)
    : Endpoint<RequestBookingRequest, RequestBookingResponse>
{
    public override void Configure()
    {
        Post("/parking/requests");
    }

    public override async Task HandleAsync(RequestBookingRequest req, CancellationToken ct)
    {
        var enabledFeatures = await features.GetEnabled(ct);

        if (!enabledFeatures.Specs.CanSendRequest)
        {
            ThrowError("You cannot request a spot booking.");
            return;
        }

        var currentUser = HttpContext.ToCurrentUser();

        var usersParking = await (from parking in dbContext.Set<Parking>()
            join spot in dbContext.Set<ParkingSpot>() on parking.Id equals spot.ParkingId
            where spot.OwnerId == currentUser.Identity
            select parking).FirstOrDefaultAsync(ct);

        if (usersParking is null)
        {
            ThrowError("You must have a parking spot to request a spot booking.");
            return;
        }

        var request = usersParking.RequestBooking(currentUser.Identity, req.From, req.To, new Credits(req.Bonus));

        if (req.Simulation)
        {
            await SendOkAsync(
                new RequestBookingResponse
                {
                    UsedCredits = request.Cost
                },
                ct);
            return;
        }

        var ownerEnabledFeatures = await features.GetEnabledForUser(usersParking.OwnerId, ct);

        if (usersParking.IsLocked(ownerEnabledFeatures))
        {
            ThrowError("This parking is locked");
            return;
        }

        dbContext.Set<Parking>().Update(usersParking);
        await dbContext.SaveChangesAsync(ct);

        await SendOkAsync(
            new RequestBookingResponse
            {
                RequestId = request.Id,
                UsedCredits = request.Cost
            },
            ct);
    }
}
