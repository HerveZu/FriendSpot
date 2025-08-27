using Domain.UserProducts;

namespace Domain;

public static class Plans
{
    public const string Premium = "com.friendspot.sub.premium";
    public const string Neighbourhood = "com.friendspot.sub.neighbourhood";
}

public sealed class EnabledFeatures
{
    private static readonly SubscriptionPlan[] _plans =
    [
        new(Plans.Premium, new PremiumPlanSpecs()),
        new(Plans.Neighbourhood, new NeighbourhoodPlanSpecs())
    ];

    public EnabledFeatures(UserProduct[] userProducts)
    {
        var activeProducts = userProducts.Where(x => x.IsActive);

        ActivePlan = activeProducts
            .Select(product => _plans.SingleOrDefault(plan => plan.ProductId == product.ProductId))
            .OrderByDescending(x => x?.Specs.Precedence ?? int.MinValue)
            .FirstOrDefault();

        Specs = ActivePlan?.Specs ?? DefaultSpecs;
    }

    public FreePlanSpecs DefaultSpecs { get; } = new();
    public SubscriptionPlan? ActivePlan { get; }
    public ISubscriptionSpecs Specs { get; }
}

public sealed record SubscriptionPlan(string ProductId, ISubscriptionSpecs Specs);

public interface ISubscriptionSpecs
{
    int Precedence { get; }
    bool CanSendRequest { get; }
    TimeSpan MaxBookInAdvanceTime { get; }
    uint MaxSpotPerGroup { get; }
    uint MaxSpotPerNeighbourhoodGroup { get; }
    uint MaxNeighbourhoodGroups { get; }
}

public record FreePlanSpecs : ISubscriptionSpecs
{
    public virtual int Precedence => 0;
    public virtual bool CanSendRequest => false;
    public virtual TimeSpan MaxBookInAdvanceTime => TimeSpan.FromDays(3);
    public virtual uint MaxSpotPerGroup => 10;
    public virtual uint MaxSpotPerNeighbourhoodGroup => 0;
    public virtual uint MaxNeighbourhoodGroups => 0;
}

public record PremiumPlanSpecs : FreePlanSpecs
{
    public override int Precedence => 1;
    public override bool CanSendRequest => true;
    public override TimeSpan MaxBookInAdvanceTime => TimeSpan.MaxValue;
    public override uint MaxSpotPerGroup => 15;
}

public record NeighbourhoodPlanSpecs : PremiumPlanSpecs
{
    public override int Precedence => 2;
    public override uint MaxNeighbourhoodGroups => 1u;
    public override uint MaxSpotPerNeighbourhoodGroup => 50u;
}
