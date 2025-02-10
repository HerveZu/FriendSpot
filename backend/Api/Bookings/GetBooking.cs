using Api.Common;
using Api.Common.Infrastructure;
using Domain.ParkingSpots;
using Domain.Users;
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
        public required Guid Id { get; init; }
        public required DateTimeOffset From { get; init; }
        public required DateTimeOffset To { get; init; }
        public required TimeSpan Duration { get; init; }
        public required SpotOwner Owner { get; init; }
        public required ParkingLotStatus ParkingLot { get; init; }

        [PublicAPI]
        public sealed record ParkingLotStatus
        {
            public required Guid Id { get; init; }
            public required string? Name { get; init; }
        }

        [PublicAPI]
        public sealed record SpotOwner
        {
            public required string UserId { get; init; }
            public required string DisplayName { get; init; }
            public required string? PictureUrl { get; init; }
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
                            Id = booking.Id,
                            From = booking.From,
                            To = booking.To,
                            Duration = booking.Duration,
                            Owner = dbContext.Set<User>()
                                .Where(user => user.Identity == parkingSpot.OwnerId)
                                .Select(
                                    owner => new GetBookingResponse.BookingStatus.SpotOwner
                                    {
                                        UserId = owner.Identity,
                                        DisplayName = owner.DisplayName,
                                        PictureUrl = owner.PictureUrl
                                    })
                                .First(),
                            ParkingLot = new GetBookingResponse.BookingStatus.ParkingLotStatus
                            {
                                Id = parkingSpot.Id,
                                Name = booking.From > now
                                    ? null
                                    : (string?)parkingSpot.SpotName
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
