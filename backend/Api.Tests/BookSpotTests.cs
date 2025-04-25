using System.Net;
using System.Net.Http.Json;
using Api.Bookings;
using Api.Tests.TestBench;

namespace Api.Tests;

internal sealed class BookSpotTests : IntegrationTestsBase
{
    [Test]
    [CancelAfter(10_000)]
    public async Task BookSpot__WhenUnknownParkingSpot__ShouldBadRequest(CancellationToken cancellationToken)
    {
        var client = ApplicationFactory.UserClient(Users.Valid);

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
}
