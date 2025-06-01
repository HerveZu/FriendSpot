using Api.Common;
using Api.Common.Infrastructure;
using Domain.Parkings;
using Domain.ParkingSpots;
using FastEndpoints;
using FluentValidation;
using JetBrains.Annotations;
using Microsoft.EntityFrameworkCore;

namespace Api.BookingRequests;

[PublicAPI]
public sealed record CancelRequestRequest
{
    public required Guid RequestId { get; init; }
}

internal sealed class CancelRequestValidator : Validator<CancelRequestRequest>
{
    public CancelRequestValidator()
    {
        RuleFor(x => x.RequestId).NotEmpty();
    }
}

internal sealed class CancelRequest(AppDbContext dbContext, ILogger<CancelRequest> logger)
    : Endpoint<CancelRequestRequest>
{
    public override void Configure()
    {
        Delete("/parking/requests/{RequestId:guid}/cancel");
    }

    public override async Task HandleAsync(CancelRequestRequest req, CancellationToken ct)
    {
        var currentUser = HttpContext.ToCurrentUser();

        var usersParking = await (from parking in dbContext.Set<Parking>()
            join spot in dbContext.Set<ParkingSpot>() on parking.Id equals spot.ParkingId
            where spot.OwnerId == currentUser.Identity
            select parking).FirstOrDefaultAsync(ct);

        if (usersParking is null)
        {
            ThrowError("You must have a parking spot to cancel a spot booking request.");
            return;
        }

        logger.LogInformation("Cancelling booking request {RequestId}", req.RequestId);
        usersParking.CancelBookingRequest(currentUser.Identity, req.RequestId);

        dbContext.Set<Parking>().Update(usersParking);
        await dbContext.SaveChangesAsync(ct);
    }
}