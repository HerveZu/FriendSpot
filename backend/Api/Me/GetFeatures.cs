using Api.Common;
using Api.Common.Infrastructure;
using Domain;
using Domain.Parkings;
using Domain.ParkingSpots;
using FastEndpoints;
using JetBrains.Annotations;
using Microsoft.EntityFrameworkCore;

namespace Api.Me;

[PublicAPI]
public sealed record AppFeatures
{
    public required bool IsPremium { get; init; }
    public required AppPlans Plans { get; init; }
    public required SubscriptionSpecs Baseline { get; init; }
    public required SubscriptionSpecs Active { get; init; }
    public required bool CurrentParkingIsLocked { get; init; }

    [PublicAPI]
    public sealed record AppPlans
    {
        public required Plan Premium { get; init; }
        public required Plan Neighbourhood { get; init; }

        [PublicAPI]
        public sealed record Plan
        {
            public required string ProductId { get; init; }
            public required SubscriptionSpecs Specs { get; init; }
        }
    }

    [PublicAPI]
    public sealed record SubscriptionSpecs
    {
        public required bool CanSendRequest { get; init; }
        public required TimeSpan MaxBookInAdvanceTime { get; init; }
        public required uint MaxSpotPerGroup { get; init; }
        public required uint MaxSpotPerNeighbourhoodGroup { get; init; }
        public required uint AvailableNeighbourhoodGroups { get; init; }
        public required uint MaxNeighbourhoodGroups { get; init; }
    }
}

internal static class ParkingResponseExtensions
{
    public static AppFeatures.SubscriptionSpecs ToSubscriptionSpecs(
        this ISubscriptionSpecs specs,
        int totalOwnedNeighbourhoodGroups)
    {
        return new AppFeatures.SubscriptionSpecs
        {
            CanSendRequest = specs.CanSendRequest,
            MaxBookInAdvanceTime = specs.MaxBookInAdvanceTime,
            MaxSpotPerGroup = specs.MaxSpotPerGroup,
            MaxSpotPerNeighbourhoodGroup = specs.MaxSpotPerNeighbourhoodGroup,
            MaxNeighbourhoodGroups = specs.MaxNeighbourhoodGroups,
            AvailableNeighbourhoodGroups = (uint)Math.Max(
                0,
                specs.MaxNeighbourhoodGroups - totalOwnedNeighbourhoodGroups),
        };
    }
}

internal sealed class GetFeatures(AppDbContext dbContext, IUserFeatures features) : EndpointWithoutRequest<AppFeatures>
{
    public override void Configure()
    {
        Get("/@me/features");
    }

    public override async Task<AppFeatures> ExecuteAsync(CancellationToken ct)
    {
        var currentUser = HttpContext.ToCurrentUser();
        var enabledFeatures = await features.GetEnabled(ct);

        var totalOwnedNeighbourhoodGroups = await dbContext.Set<Parking>()
            .Where(x => x.OwnerId == currentUser.Identity)
            .CountAsync(x => x.IsNeighbourhood, ct);

        var currentParking = await (from parking in dbContext.Set<Parking>()
            join spot in dbContext.Set<ParkingSpot>() on parking.Id equals spot.ParkingId
            where spot.OwnerId == currentUser.Identity
            select parking).FirstOrDefaultAsync(ct);

        var currentParkingIsLocked = false;

        // ReSharper disable once InvertIf
        if (currentParking is not null)
        {
            var ownerFeatures = await features.GetEnabledForUser(currentParking.OwnerId, ct);
            currentParkingIsLocked = currentParking.IsLocked(ownerFeatures);
        }

        return new AppFeatures
        {
            IsPremium = enabledFeatures.Specs is PremiumPlanSpecs,
            Plans = new AppFeatures.AppPlans
            {
                Premium = new AppFeatures.AppPlans.Plan
                {
                    ProductId = Plans.Premium,
                    Specs = new PremiumPlanSpecs().ToSubscriptionSpecs(totalOwnedNeighbourhoodGroups)
                },
                Neighbourhood = new AppFeatures.AppPlans.Plan
                {
                    ProductId = Plans.Neighbourhood,
                    Specs = new NeighbourhoodPlanSpecs().ToSubscriptionSpecs(totalOwnedNeighbourhoodGroups)
                },
            },
            Baseline = enabledFeatures.DefaultSpecs.ToSubscriptionSpecs(totalOwnedNeighbourhoodGroups),
            Active = enabledFeatures.Specs.ToSubscriptionSpecs(totalOwnedNeighbourhoodGroups),
            CurrentParkingIsLocked = currentParkingIsLocked,
        };
    }
}
