using System.Diagnostics;
using Api.Common;
using Api.Common.Infrastructure;
using Domain.ParkingSpots;
using Domain.Users;
using Microsoft.EntityFrameworkCore;

namespace Api.Bookings.OnRated;

internal sealed class AdjustOwnersReputation(AppDbContext dbContext) : IDomainEventHandler<ParkingSpotBookingRated>
{
    public async Task Handle(ParkingSpotBookingRated notification, CancellationToken cancellationToken)
    {
        if (notification.Rating is BookRating.Neutral)
        {
            return;
        }

        var owner = await dbContext.Set<User>()
            .FirstAsync(user => user.Identity == notification.OwnerId, cancellationToken);

        switch (notification.Rating)
        {
            case BookRating.Bad:
                owner.Rating.BadDecrease();
                break;
            case BookRating.Good:
                owner.Rating.GoodIncrease();
                break;
            case BookRating.Neutral:
                owner.Rating.NeutralIncrease();
                break;
            default:
                throw new UnreachableException();
        }
    }
}