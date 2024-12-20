using Api.Common;
using Api.Common.Infrastructure;
using Domain.ParkingSpots;
using FastEndpoints;
using JetBrains.Annotations;
using Microsoft.EntityFrameworkCore;

namespace Api.Bookings;

[PublicAPI]
public sealed record GetBookingResponse
{
    public required BookingStatus[] Bookings { get; init; }

    [PublicAPI]
    public sealed record BookingStatus
    {
        public required Guid BookingId { get; init; }
        public required DateTimeOffset From { get; init; }
        public required DateTimeOffset To { get; init; }
        public required TimeSpan Duration { get; init; }
        public required BookingStatusInfo? Info { get; init; }

        [PublicAPI]
        public sealed record BookingStatusInfo
        {
            public required string OwnerId { get; init; }
            public required string SpotName { get; init; }
        }
    }
}

internal sealed class GetBooking(AppDbContext dbContext) : EndpointWithoutRequest<GetBookingResponse>
{
    public override void Configure()
    {
        Get("/spots/booking");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var currentUser = HttpContext.ToCurrentUser();
        var now = DateTimeOffset.UtcNow;

        var bookingsPerSpot = await (
                from parkingSpot in dbContext.Set<ParkingSpot>()
                select parkingSpot.Bookings
                    .Where(booking => booking.To >= now)
                    .Where(booking => booking.BookingUserId == currentUser.Identity)
                    .Select(
                        booking => new GetBookingResponse.BookingStatus
                        {
                            BookingId = booking.Id,
                            From = booking.From,
                            To = booking.To,
                            Duration = booking.Duration,
                            Info = booking.From > now
                                ? null
                                : new GetBookingResponse.BookingStatus.BookingStatusInfo
                                {
                                    OwnerId = parkingSpot.OwnerId,
                                    SpotName = parkingSpot.SpotName
                                }
                        })
            )
            .AsNoTracking()
            .ToArrayAsync(ct);

        var bookings = bookingsPerSpot
            .SelectMany(bookings => bookings)
            .ToArray();

        await SendOkAsync(
            new GetBookingResponse
            {
                Bookings = bookings
            },
            ct);
    }
}
