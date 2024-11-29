using Api.Common;
using Api.Common.Infrastructure;
using Domain.ParkingSpots;
using FastEndpoints;
using FluentValidation;
using JetBrains.Annotations;

namespace Api.Bookings;

[PublicAPI]
public sealed record BookSpotRequest
{
    public required Guid ParkingLotId { get; init; }
    public required DateTimeOffset From { get; init; }
    public required TimeSpan Duration { get; init; }
}

[PublicAPI]
public sealed record BookSpotResponse
{
    public required Guid BookingId { get; init; }
    public required decimal UsedCredits { get; init; }
}

internal sealed class BookSpotValidator : Validator<BookSpotRequest>
{
    public BookSpotValidator()
    {
        RuleFor(x => x.Duration).GreaterThan(TimeSpan.Zero);
        RuleFor(x => x.From).GreaterThanOrEqualTo(_ => DateTimeOffset.UtcNow);
    }
}

internal sealed class BookSpot(AppDbContext dbContext) : Endpoint<BookSpotRequest>
{
    public override void Configure()
    {
        Post("/spots/booking");
    }

    public override async Task HandleAsync(BookSpotRequest req, CancellationToken ct)
    {
        var currentUser = HttpContext.ToCurrentUser();
        var parkingSpot = await dbContext.Set<ParkingSpot>().FindAsync([req.ParkingLotId], ct);

        if (parkingSpot is null)
        {
            ThrowError("Parking lot not found");
            return;
        }

        var (booking, cost) = parkingSpot.Book(currentUser.Identity, req.From, req.Duration);

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
