using Api.Common;
using Api.Common.Infrastructure;
using Domain.ParkingSpots;
using Domain.Users;
using FastEndpoints;
using JetBrains.Annotations;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Bookings;

[PublicAPI]
public sealed record GetMyAvailabilitiesRequest
{
    [FromQuery]
    public required DateTimeOffset From { get; init; }
}

[PublicAPI]
public sealed record GetMyAvailabilitiesResponse
{
    public required TimeSpan TotalDuration { get; init; }
    public required Availability[] Availabilities { get; init; }

    [PublicAPI]
    public sealed record Availability
    {
        public required Guid Id { get; init; }
        public required DateTimeOffset From { get; init; }
        public required DateTimeOffset To { get; init; }
        public required TimeSpan Duration { get; init; }
        public required Booking[] Bookings { get; init; }
        public required bool CanCancel { get; init; }

        [PublicAPI]
        public sealed record Booking
        {
            public required Guid Id { get; init; }
            public required DateTimeOffset From { get; init; }
            public required DateTimeOffset To { get; init; }
            public required TimeSpan Duration { get; init; }
            public required BookingUser BookedBy { get; init; }
            public required bool CanCancel { get; init; }

            [PublicAPI]
            public sealed record BookingUser
            {
                public required string Id { get; init; }
                public required string? PictureUrl { get; init; }
                public required string DisplayName { get; init; }
            }
        }
    }
}

internal sealed class GetMyAvailabilities(AppDbContext dbContext)
    : Endpoint<GetMyAvailabilitiesRequest, GetMyAvailabilitiesResponse>
{
    public override void Configure()
    {
        Get("/spots/availabilities");
    }

    public override async Task HandleAsync(GetMyAvailabilitiesRequest req, CancellationToken ct)
    {
        var currentUser = HttpContext.ToCurrentUser();

        var availabilities = await (
                from parkingSpot in dbContext.Set<ParkingSpot>()
                where parkingSpot.OwnerId == currentUser.Identity
                select parkingSpot.Availabilities
                    .Where(availability => availability.To >= req.From)
                    .OrderBy(availability => availability.From)
                    .Select(
                        availability => new
                        {
                            Availability = availability,
                            Bookings = parkingSpot.Bookings
                                .Where(booking => booking.From >= availability.From && booking.To <= availability.To)
                                .Where(booking => booking.To >= req.From)
                                .Select(
                                    booking => new
                                    {
                                        Booking = booking,
                                        BookedBy = dbContext.Set<User>()
                                            .Where(user => user.Identity == booking.BookingUserId)
                                            .Select(
                                                user => new GetMyAvailabilitiesResponse.Availability.Booking.BookingUser
                                                {
                                                    Id = user.Identity,
                                                    DisplayName = user.DisplayName,
                                                    PictureUrl = user.PictureUrl
                                                })
                                            .First()
                                    })
                                .ToArray()
                        })
                    .ToArray())
            .AsNoTracking()
            .FirstOrDefaultAsync(ct) ?? [];

        var totalDuration = new TimeSpan(availabilities.Sum(x => x.Availability.Duration.Ticks));

        await SendOkAsync(
            new GetMyAvailabilitiesResponse
            {
                TotalDuration = totalDuration,
                Availabilities = availabilities
                    .Select(
                        x => new GetMyAvailabilitiesResponse.Availability
                        {
                            Id = x.Availability.Id,
                            From = x.Availability.From,
                            To = x.Availability.To,
                            Duration = x.Availability.Duration,
                            Bookings = x.Bookings
                                .Select(
                                    y => new GetMyAvailabilitiesResponse.Availability.Booking
                                    {
                                        Id = y.Booking.Id,
                                        From = y.Booking.From,
                                        To = y.Booking.To,
                                        Duration = y.Booking.Duration,
                                        BookedBy = y.BookedBy,
                                        CanCancel = y.Booking.CanCancel(currentUser.Identity)
                                    })
                                .ToArray(),
                            CanCancel = x.Availability.CanCancel(
                                currentUser.Identity,
                                x.Bookings.Select(y => y.Booking))
                        })
                    .ToArray()
            },
            ct);
    }
}
