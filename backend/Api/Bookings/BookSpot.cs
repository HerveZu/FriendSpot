using Api.Common;
using Api.Common.Infrastructure;
using Domain.ParkingSpots;
using FastEndpoints;
using FluentValidation;
using JetBrains.Annotations;
using Microsoft.EntityFrameworkCore;

namespace Api.Bookings;

[PublicAPI]
public sealed record BookSpotRequest
{
    public required Guid ParkingLotId { get; init; }
    public required DateTimeOffset From { get; init; }
    public required DateTimeOffset To { get; init; }

    [QueryParam]
    public bool Simulation { get; init; }
}

[PublicAPI]
public sealed record BookSpotResponse
{
    public Guid? BookingId { get; init; }
    public required decimal UsedCredits { get; init; }
}

internal sealed class BookSpotValidator : Validator<BookSpotRequest>
{
    public BookSpotValidator()
    {
        RuleFor(x => x.To).GreaterThan(x => x.From);
        RuleFor(x => x.From).GreaterThanOrEqualTo(_ => DateTimeOffset.UtcNow);
    }
}

internal sealed class BookSpot(AppDbContext dbContext) : Endpoint<BookSpotRequest, BookSpotResponse>
{
    public override void Configure()
    {
        Post("/spots/booking");
    }

    public override async Task HandleAsync(BookSpotRequest req, CancellationToken ct)
    {
        var currentUser = HttpContext.ToCurrentUser();

        var userHasParkingSpot = await dbContext
            .Set<ParkingSpot>()
            .AnyAsync(parkingLot => parkingLot.OwnerId == currentUser.Identity, ct);

        if (!userHasParkingSpot)
        {
            ThrowError("You must have a parking lot to book another spot");
            return;
        }

        var parkingSpot = await dbContext.Set<ParkingSpot>().FindAsync([req.ParkingLotId], ct);

        if (parkingSpot is null)
        {
            ThrowError("Parking lot not found");
            return;
        }

        var bookingDuration = req.To - req.From;
        var (booking, cost) = parkingSpot.Book(currentUser.Identity, req.From, bookingDuration);

        if (req.Simulation)
        {
            await SendOkAsync(
                new BookSpotResponse
                {
                    UsedCredits = cost
                },
                ct);
            return;
        }

        dbContext.Set<ParkingSpot>().Update(parkingSpot);
        await dbContext.SaveChangesAsync(ct);

        await SendOkAsync(
            new BookSpotResponse
            {
                BookingId = booking.Id,
                UsedCredits = cost
            },
            ct);
    }
}
