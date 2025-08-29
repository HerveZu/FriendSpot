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
    public required bool IsNeighbourhood { get; init; }
    public required AppPlans Plans { get; init; }
    public required SubscriptionSpecs Baseline { get; init; }
    public required SubscriptionSpecs Active { get; init; }
    public required bool CurrentParkingIsLocked { get; init; }
    public required AppPlan? Plan { get; init; }

    [PublicAPI]
    public sealed record AppPlans
    {
        public required AppPlan Premium { get; init; }
        public required AppPlan Neighbourhood { get; init; }
    }

    [PublicAPI]
    public sealed record AppPlan
    {
        public required string ProductId { get; init; }
        public required SubscriptionSpecs Specs { get; init; }
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
            IsNeighbourhood = enabledFeatures.Specs is NeighbourhoodPlanSpecs,
            Plan = enabledFeatures.ActivePlan is null
                ? null
                : new AppFeatures.AppPlan
                {
                    ProductId = enabledFeatures.ActivePlan.ProductId,
                    Specs = enabledFeatures.ActivePlan.Specs.ToSubscriptionSpecs(totalOwnedNeighbourhoodGroups)
                },
            Plans = new AppFeatures.AppPlans
            {
                Premium = new AppFeatures.AppPlan
                {
                    ProductId = Products.Premium,
                    Specs = new PremiumPlanSpecs().ToSubscriptionSpecs(totalOwnedNeighbourhoodGroups)
                },
                Neighbourhood = new AppFeatures.AppPlan
                {
                    ProductId = Products.Neighbourhood,
                    Specs = new NeighbourhoodPlanSpecs().ToSubscriptionSpecs(totalOwnedNeighbourhoodGroups)
                },
            },
            Baseline = enabledFeatures.DefaultSpecs.ToSubscriptionSpecs(totalOwnedNeighbourhoodGroups),
            Active = enabledFeatures.Specs.ToSubscriptionSpecs(totalOwnedNeighbourhoodGroups),
            CurrentParkingIsLocked = currentParkingIsLocked,
        };
    }
}
