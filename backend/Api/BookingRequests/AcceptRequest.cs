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
public sealed record AcceptRequestRequest
{
    public Guid RequestId { get; init; } // required makes deserialization fail
}

internal sealed class AcceptRequestValidator : Validator<AcceptRequestRequest>
{
    public AcceptRequestValidator()
    {
        RuleFor(x => x.RequestId).NotEmpty();
    }
}

internal sealed class AcceptRequest(AppDbContext dbContext, ILogger<AcceptRequest> logger)
    : Endpoint<AcceptRequestRequest>
{
    public override void Configure()
    {
        Post("/parking/requests/{RequestId:guid}/accept");
    }

    public override async Task HandleAsync(AcceptRequestRequest req, CancellationToken ct)
    {
        var currentUser = HttpContext.ToCurrentUser();

        var usersParking = await (from parking in dbContext.Set<Parking>()
            join spot in dbContext.Set<ParkingSpot>() on parking.Id equals spot.ParkingId
            where spot.OwnerId == currentUser.Identity
            select parking).FirstOrDefaultAsync(ct);

        if (usersParking is null)
        {
            ThrowError("You must have a parking spot to accept a spot booking request.");
            return;
        }

        logger.LogInformation("Accepting booking request {RequestId}", req.RequestId);
        usersParking.AcceptBookingRequest(currentUser.Identity, req.RequestId);

        dbContext.Set<Parking>().Update(usersParking);
        await dbContext.SaveChangesAsync(ct);
    }
}
