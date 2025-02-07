using Api.Common.Infrastructure;
using Domain.ParkingSpots;
using Domain.Users;
using FastEndpoints;
using JetBrains.Annotations;
using Microsoft.EntityFrameworkCore;

namespace Api.Bookings;

[PublicAPI]
public sealed record GetAvailabilityDetailsRequest
{
    [BindFrom("parkingLotId")]
    public required Guid ParkingLotId { get; init; }

    [BindFrom("availabilityId")]
    public required Guid AvailabilityId { get; init; }
}

[PublicAPI]
public sealed record GetAvailabilityDetailsResponse
{
    public required Booking[] Bookings { get; init; }

    [PublicAPI]
    public sealed record Booking
    {
        public required Guid Id { get; init; }
        public required DateTimeOffset From { get; init; }
        public required DateTimeOffset To { get; init; }
        public required TimeSpan Duration { get; init; }
        public required BookingUser BookedBy { get; init; }

        [PublicAPI]
        public sealed record BookingUser
        {
            public required string Id { get; init; }
            public required string? PictureUrl { get; init; }
            public required string DisplayName { get; init; }
        }
    }
}

internal sealed class GetAvailabilityDetails(AppDbContext dbContext)
    : Endpoint<GetAvailabilityDetailsRequest, GetAvailabilityDetailsResponse>
{
    public override void Configure()
    {
        Get("/spots/{parkingLotId}/availabilities/{availabilityId}");
    }

    public override async Task HandleAsync(GetAvailabilityDetailsRequest req, CancellationToken ct)
    {
        var now = DateTimeOffset.UtcNow;

        var spotResponse = await (
                from spot in dbContext.Set<ParkingSpot>()
                where spot.Id == req.ParkingLotId
                select spot.Availabilities
                    .Where(availability => availability.Id == req.AvailabilityId)
                    .Select(
                        availability => new GetAvailabilityDetailsResponse
                        {
                            Bookings = spot.Bookings
                                .Where(booking => booking.From >= availability.From && booking.To <= availability.To)
                                .Where(booking => booking.To >= now)
                                .Select(
                                    booking => new GetAvailabilityDetailsResponse.Booking
                                    {
                                        Id = booking.Id,
                                        From = booking.From,
                                        To = booking.To,
                                        Duration = booking.Duration,
                                        BookedBy = dbContext.Set<User>()
                                            .Where(user => user.Identity == booking.BookingUserId)
                                            .Select(
                                                user => new GetAvailabilityDetailsResponse.Booking.BookingUser
                                                {
                                                    Id = user.Identity,
                                                    DisplayName = user.DisplayName,
                                                    PictureUrl = user.PictureUrl
                                                })
                                            .First()
                                    })
                                .ToArray()
                        })).AsNoTracking()
            .FirstOrDefaultAsync(ct);

        if (spotResponse is null)
        {
            ThrowError("Could not find spot");
            return;
        }

        var details = spotResponse.SingleOrDefault();

        if (details is null)
        {
            ThrowError("Could not find availability");
            return;
        }

        await SendOkAsync(details, ct);
    }
}
