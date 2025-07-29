using System.Net.Http.Json;
using Api.Parkings;
using Api.Parkings.Contracts;
using Api.Tests.TestBench;

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
            Assert.That(parking.Code, Does.StartWith("P-"));
            Assert.That(parking.Code, Has.Length.EqualTo(8));
        });
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
