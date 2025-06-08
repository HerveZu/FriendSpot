using Api.Common;
using Api.Common.Infrastructure;
using Domain.Parkings;
using Domain.ParkingSpots;
using FastEndpoints;
using JetBrains.Annotations;
using Microsoft.EntityFrameworkCore;

namespace Api.BookingRequests;

[PublicAPI]
public sealed record GetAllBookingRequestsResponse
{
    public required BookingRequest[] Requests { get; init; }

    [PublicAPI]
    public sealed record BookingRequest
    {
        public required Guid Id { get; init; }
        public required DateTimeOffset From { get; init; }
        public required DateTimeOffset To { get; init; }
        public required TimeSpan Duration { get; init; }
        public required decimal Bonus { get; init; }
    }
}

internal sealed class GetAllBookingRequests(AppDbContext dbContext, ILogger<GetAllBookingRequests> logger)
    : EndpointWithoutRequest<GetAllBookingRequestsResponse>
{
    public override void Configure()
    {
        Get("/parking/requests");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var currentUser = HttpContext.ToCurrentUser();
        var now = DateTimeOffset.Now;

        var userBookingRequests = (await (
            from parkingSpot in dbContext.Set<ParkingSpot>()
            join parking in dbContext.Set<Parking>() on parkingSpot.ParkingId equals parking.Id
            where parkingSpot.OwnerId == currentUser.Identity
            select parking.BookingRequests
                .Where(request => request.AcceptedByUserId == null)
                .Where(request => request.RequesterId != currentUser.Identity)
                .Where(request => request.From > now)
                .OrderBy(request => request.From)
                .Select(request => new GetAllBookingRequestsResponse.BookingRequest
                {
                    Id = request.Id,
                    From = request.From,
                    To = request.To,
                    Duration = request.Duration,
                    Bonus = request.Bonus,
                }))
            .AsNoTracking()
            .FirstOrDefaultAsync(ct))?
            .ToArray();

        if (userBookingRequests is null)
        {
            ThrowError("No parking spot defined");
            return;
        }

        logger.LogInformation("Retrieved all bookings requests");

        await SendOkAsync(
            new GetAllBookingRequestsResponse
            {
                Requests = userBookingRequests
            },
            ct);
    }
}