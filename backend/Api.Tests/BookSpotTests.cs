using System.Net;
using System.Net.Http.Json;
using Api.Bookings;
using Api.Tests.TestBench;

namespace Api.Tests;

internal sealed class BookSpotTests : IntegrationTestsBase
{
    [Test]
    [CancelAfter(10_000)]
    public async Task BookSpot_WhenUnknownParkingSpot_ShouldBadRequest(CancellationToken cancellationToken)
    {
        var client = ApplicationFactory.UserClient(Seed.Users.SpotOwner);

        var apiResponse = await client.PostAsync(
            "/spots/booking",
            JsonContent.Create(
                new BookSpotRequest
                {
                    ParkingLotId = Guid.NewGuid(),
                    From = DateTimeOffset.Now.AddHours(1),
                    To = DateTimeOffset.Now.AddDays(1)
                }),
            cancellationToken);

        await apiResponse.AssertIs(HttpStatusCode.BadRequest);
    }

    [Test]
    [CancelAfter(10_000)]
    public async Task BookSpot_WhenDateInPast_ShouldBadRequest(CancellationToken cancellationToken)
    {
        var client = ApplicationFactory.UserClient(Seed.Users.Other);

        var apiResponse = await client.PostAsync(
            "/spots/booking",
            JsonContent.Create(
                new BookSpotRequest
                {
                    ParkingLotId = Seed.Spots.Main,
                    From = DateTimeOffset.Now.AddHours(-1),
                    To = DateTimeOffset.Now.AddDays(1)
                }),
            cancellationToken);

        await apiResponse.AssertIs(HttpStatusCode.BadRequest);
    }

    [Test]
    [CancelAfter(10_000)]
    public async Task BookSpot_WhenUserIsOwner_ShouldBadRequest(CancellationToken cancellationToken)
    {
        var client = ApplicationFactory.UserClient(Seed.Users.SpotOwner);

        var apiResponse = await client.PostAsync(
            "/spots/booking",
            JsonContent.Create(
                new BookSpotRequest
                {
                    ParkingLotId = Seed.Spots.Main,
                    From = DateTimeOffset.Now.AddHours(1),
                    To = DateTimeOffset.Now.AddDays(1)
                }),
            cancellationToken);

        await apiResponse.AssertIs(HttpStatusCode.BadRequest);
    }
}
