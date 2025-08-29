using Domain.Tests.TestBench;

namespace Domain.Tests;

[TestFixture]
internal sealed class UserProductTests
{
    [Test]
    public void Active_IsFalse_WhenExpired()
    {
        var userProduct = Factory.UserProduct(
            Guid.NewGuid(),
            "test",
            "user-123",
            "product-123",
            DateTimeOffset.Now.AddDays(-1));

        Assert.That(userProduct.IsActive, Is.False);
    }

    [Test]
    public void Active_IsTrue_WhenNotExpired()
    {
        var userProduct = Factory.UserProduct(
            Guid.NewGuid(),
            "test",
            "user-123",
            "product-123",
            DateTimeOffset.Now.AddDays(1));

        Assert.That(userProduct.IsActive, Is.True);
    }

    [Test]
    [TestCase(-2)]
    [TestCase(0)]
    [TestCase(1)]
    public void CanActivateProduct_WhenAlreadyExpired(int expiresInDays)
    {
        var expiresAt = DateTimeOffset.Now.AddDays(expiresInDays);
        var userProduct = Factory.UserProduct(
            Guid.NewGuid(),
            "test",
            "user-123",
            "product-123",
            expiresAt
        );

        Assert.That(userProduct.ExpiresAt, Is.EqualTo(expiresAt));
    }

    [Test]
    public void ActivePlan_ShouldBeNull_WhenPremiumAndNeighbourhoodHaveBothExpired()
    {
        var premium = Factory.UserProduct(
            Guid.NewGuid(),
            "test",
            "user-123",
            Products.Premium,
            DateTimeOffset.Now.AddDays(-1)
        );

        var neighbourhood = Factory.UserProduct(
            Guid.NewGuid(),
            "test",
            "user-123",
            Products.Neighbourhood,
            DateTimeOffset.Now.AddDays(-1)
        );

        var features = new EnabledFeatures([premium, neighbourhood]);

        Assert.That(features.ActivePlan, Is.Null);
    }

    [Test]
    public void ActivePlan_ShouldReturnNeighbourhood_WhenPremiumAndNeighbourhoodAreActive()
    {
        var premium = Factory.UserProduct(
            Guid.NewGuid(),
            "test",
            "user-123",
            Products.Premium,
            null
        );

        var neighbourhood = Factory.UserProduct(
            Guid.NewGuid(),
            "test",
            "user-123",
            Products.Neighbourhood,
            null
        );

        var features = new EnabledFeatures([premium, neighbourhood]);

        Assert.That(features.ActivePlan, Is.Not.Null);
        Assert.That(features.ActivePlan.ProductId, Is.EqualTo(Products.Neighbourhood));
    }

    [Test]
    public void ActivePlan_ShouldReturnNeighbourhood_WhenPremiumIsActiveButNotNeighbourhood()
    {
        var premium = Factory.UserProduct(
            Guid.NewGuid(),
            "test",
            "user-123",
            Products.Premium,
            null
        );

        var neighbourhood = Factory.UserProduct(
            Guid.NewGuid(),
            "test",
            "user-123",
            Products.Neighbourhood,
            DateTimeOffset.Now.AddDays(-1)
        );

        var features = new EnabledFeatures([premium, neighbourhood]);

        Assert.That(features.ActivePlan, Is.Not.Null);
        Assert.That(features.ActivePlan.ProductId, Is.EqualTo(Products.Premium));
    }
}
