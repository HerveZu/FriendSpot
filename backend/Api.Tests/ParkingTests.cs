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
        using var client = UserClient(Seed.Users.Resident1);

        var apiResponse = await client.PostAsync(
            "/parking",
            JsonContent.Create(
                new CreateParkingRequest
                {
                    Address = "Test av.",
                    Name = "Test"
                }),
            cancellationToken);

        var parking = await apiResponse.AssertIsSuccessful<ParkingResponse>(cancellationToken);

        Assert.Multiple(() =>
        {
            Assert.That(parking.Name, Is.EqualTo("Test"));
            Assert.That(parking.Address, Is.EqualTo("Test av."));
            Assert.That(parking.Code, Does.StartWith("P-"));
            Assert.That(parking.Code, Has.Length.EqualTo(8));
        });
    }
}
