using System.Net;
using System.Net.Http.Json;
using Api.Common.Contracts;
using Api.Parkings;
using Api.Tests.TestBench;
using Domain;
using Domain.UserProducts;
using NSubstitute;

namespace Api.Tests;

internal sealed class ParkingTests : IntegrationTestsBase
{
    [Test]
    [CancelAfter(10_000)]
    public async Task CreateParking_ShouldBeValid(CancellationToken cancellationToken)
    {
        using var resident1 = UserClient(Seed.Users.Resident1);

        var createParking = await resident1.PostAsync(
            "/parking",
            JsonContent.Create(
                new CreateParkingRequest
                {
                    Address = "Test av.",
                    Name = "Test"
                }),
            cancellationToken);

        var parking = await createParking.AssertIsSuccessful<ParkingResponse>(cancellationToken);

        Assert.Multiple(() =>
        {
            Assert.That(parking.Name, Is.EqualTo("Test"));
            Assert.That(parking.Address, Is.EqualTo("Test av."));
            Assert.That(parking.Code, Does.StartWith("F-"));
            Assert.That(parking.Code, Has.Length.EqualTo(8));
        });
    }

    [Test]
    [CancelAfter(10_000)]
    public async Task CreateNeighbourhoodParking_ShouldFail_WhenNoNeighbourhoodPlan(CancellationToken cancellationToken)
    {
        using var resident1 = UserClient(Seed.Users.Resident1);

        var createParking = await resident1.PostAsync(
            "/parking",
            JsonContent.Create(
                new CreateParkingRequest
                {
                    Address = "Test av.",
                    Name = "Test",
                    Neighbourhood = true
                }),
            cancellationToken);

        await createParking.AssertIs(HttpStatusCode.BadRequest, cancellationToken);
    }

    [Test]
    [CancelAfter(10_000)]
    public async Task CreateNeighbourhoodParking_ShouldHave50MaxUsers_WhenNeighbourhoodPlanActive(
        CancellationToken cancellationToken)
    {
        UserFeatures.GetEnabled(Arg.Any<CancellationToken>())
            .ReturnsForAnyArgs(
                Task.FromResult(
                    new EnabledFeatures(
                        [UserProduct.Activate("test", Seed.Users.Resident1, Products.Neighbourhood, null)])));

        using var resident1 = UserClient(Seed.Users.Resident1);

        var createParking = await resident1.PostAsync(
            "/parking",
            JsonContent.Create(
                new CreateParkingRequest
                {
                    Address = "Test av.",
                    Name = "Test",
                    Neighbourhood = true
                }),
            cancellationToken);

        var parking = await createParking.AssertIsSuccessful<ParkingResponse>(cancellationToken);

        Assert.That(parking.MaxSpots, Is.EqualTo(50));
    }

    [Test]
    [CancelAfter(10_000)]
    public async Task CreateMultipleNeighbourhoodParking_ShouldFail_WhenNeighbourhoodPlanActive(
        CancellationToken cancellationToken)
    {
        UserFeatures.GetEnabled(Arg.Any<CancellationToken>())
            .ReturnsForAnyArgs(
                Task.FromResult(
                    new EnabledFeatures(
                        [UserProduct.Activate("test", Seed.Users.Resident1, Products.Neighbourhood, null)])));

        using var resident1 = UserClient(Seed.Users.Resident1);

        var createParking = await resident1.PostAsync(
            "/parking",
            JsonContent.Create(
                new CreateParkingRequest
                {
                    Address = "Test av.",
                    Name = "Test",
                    Neighbourhood = true
                }),
            cancellationToken);

        await createParking.AssertIsSuccessful(cancellationToken);

        var createSecondParking = await resident1.PostAsync(
            "/parking",
            JsonContent.Create(
                new CreateParkingRequest
                {
                    Address = "Test av.",
                    Name = "Test",
                    Neighbourhood = true
                }),
            cancellationToken);

        await createSecondParking.AssertIs(HttpStatusCode.BadRequest, cancellationToken);
    }

    [Test]
    [CancelAfter(10_000)]
    public async Task CreateParking_ShouldHave15MaxUsers_WhenPremiumPlanActive(CancellationToken cancellationToken)
    {
        UserFeatures.GetEnabled(Arg.Any<CancellationToken>())
            .ReturnsForAnyArgs(
                Task.FromResult(
                    new EnabledFeatures([UserProduct.Activate("test", Seed.Users.Resident1, Products.Premium, null)])));

        using var resident1 = UserClient(Seed.Users.Resident1);

        var createParking = await resident1.PostAsync(
            "/parking",
            JsonContent.Create(
                new CreateParkingRequest
                {
                    Address = "Test av.",
                    Name = "Test",
                }),
            cancellationToken);

        var parking = await createParking.AssertIsSuccessful<ParkingResponse>(cancellationToken);

        Assert.That(parking.MaxSpots, Is.EqualTo(15));
    }

    [Test]
    [CancelAfter(10_000)]
    public async Task CreateParking_ShouldHave10MaxUsers_WhenNoPlan(CancellationToken cancellationToken)
    {
        using var resident1 = UserClient(Seed.Users.Resident1);

        var createParking = await resident1.PostAsync(
            "/parking",
            JsonContent.Create(
                new CreateParkingRequest
                {
                    Address = "Test av.",
                    Name = "Test",
                }),
            cancellationToken);

        var parking = await createParking.AssertIsSuccessful<ParkingResponse>(cancellationToken);

        Assert.That(parking.MaxSpots, Is.EqualTo(10));
    }

    [Test]
    [CancelAfter(10_000)]
    public async Task SearchParking_ShouldFind_WhenSearchingByCode(CancellationToken cancellationToken)
    {
        using var resident1 = UserClient(Seed.Users.Resident1);
        using var resident2 = UserClient(Seed.Users.Resident2);

        var createParkings = await Task.WhenAll(
            resident1.PostAsync(
                "/parking",
                JsonContent.Create(
                    new CreateParkingRequest
                    {
                        Address = "Test av.",
                        Name = "Test"
                    }),
                cancellationToken),
            resident1.PostAsync(
                "/parking",
                JsonContent.Create(
                    new CreateParkingRequest
                    {
                        Address = "Test av.",
                        Name = "Test2"
                    }),
                cancellationToken));

        var createdParkings = await Task.WhenAll(
            createParkings.Select(createParking =>
                createParking.AssertIsSuccessful<ParkingResponse>(cancellationToken)));

        var parkingToSearch = createdParkings[1];

        var searchParking = await resident2.GetAsync($"/parking?search={parkingToSearch.Code}", cancellationToken);
        var parkingSearchResult = await searchParking.AssertIsSuccessful<ParkingResponse[]>(cancellationToken);

        Assert.That(parkingSearchResult, Has.Length.EqualTo(1));
        Assert.That(parkingSearchResult[0].Id, Is.EqualTo(parkingToSearch.Id));
    }
}
