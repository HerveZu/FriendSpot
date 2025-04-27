using System.Net.Http.Json;
using Api.Bookings;
using Api.Bookings.OnBooked;
using Api.Me;
using Api.Tests.TestBench;

namespace Api.Tests;

internal sealed class RatingTests : IntegrationTestsBase
{
    [Test]
    [CancelAfter(60_000)]
    public async Task CancelBooking_ShouldDecreaseReputation_WhenCancelledByOwner(CancellationToken cancellationToken)
    {
        using var resident1 = ApplicationFactory.UserClient(Seed.Users.Resident1);
        using var resident2 = ApplicationFactory.UserClient(Seed.Users.Resident2);

        var makeSpotAvailable = await resident2.PostAsync(
            "/spots/availabilities",
            JsonContent.Create(
                new MakeMySpotAvailableRequest
                {
                    From = DateTimeOffset.Now.AddHours(1),
                    To = DateTimeOffset.Now.AddDays(3)
                }),
            cancellationToken);

        await makeSpotAvailable.AssertIsSuccessful(cancellationToken);

        var bookSpot = await resident1.PostAsync(
            "/spots/booking",
            JsonContent.Create(
                new BookSpotRequest
                {
                    ParkingLotId = Seed.Spots.Resident2,
                    From = DateTimeOffset.Now.AddHours(24),
                    To = DateTimeOffset.Now.AddHours(26)
                }),
            cancellationToken);

        await bookSpot.AssertIsSuccessful(cancellationToken);
        var bookSpotResponse = await bookSpot.Content.ReadFromJsonAsync<BookSpotResponse>(cancellationToken);

        Assert.That(bookSpotResponse, Is.Not.Null);

        var cancelSpot = await resident2.PostAsync(
            "/spots/booking/cancel",
            JsonContent.Create(
                new CancelBookingRequest
                {
                    ParkingLotId = Seed.Spots.Resident2,
                    BookingId = bookSpotResponse!.BookingId!.Value
                }),
            cancellationToken);

        await cancelSpot.AssertIsSuccessful(cancellationToken);

        var resident2Profile = await resident2.GetAsync(
            "/@me",
            cancellationToken);

        await resident2Profile.AssertIsSuccessful(cancellationToken);
        var resident2ProfileResponse = await bookSpot.Content.ReadFromJsonAsync<MeResponse>(cancellationToken);

        Assert.That(resident2ProfileResponse, Is.Not.Null);
        Assert.That(resident2ProfileResponse.Rating, Is.EqualTo(Seed.Users.InitialRating - 0.2m));
    }

    [Test]
    [CancelAfter(60_000)]
    public async Task CancelBooking_ShouldNotImpactReputation_WhenCancelledByUser(CancellationToken cancellationToken)
    {
        using var resident1 = ApplicationFactory.UserClient(Seed.Users.Resident1);
        using var resident2 = ApplicationFactory.UserClient(Seed.Users.Resident2);

        var makeSpotAvailable = await resident2.PostAsync(
            "/spots/availabilities",
            JsonContent.Create(
                new MakeMySpotAvailableRequest
                {
                    From = DateTimeOffset.Now.AddHours(1),
                    To = DateTimeOffset.Now.AddDays(2)
                }),
            cancellationToken);

        await makeSpotAvailable.AssertIsSuccessful(cancellationToken);

        var bookSpot = await resident1.PostAsync(
            "/spots/booking",
            JsonContent.Create(
                new BookSpotRequest
                {
                    ParkingLotId = Seed.Spots.Resident2,
                    From = DateTimeOffset.Now.AddHours(2),
                    To = DateTimeOffset.Now.AddHours(6)
                }),
            cancellationToken);

        await bookSpot.AssertIsSuccessful(cancellationToken);
        var bookSpotResponse = await bookSpot.Content.ReadFromJsonAsync<BookSpotResponse>(cancellationToken);

        Assert.That(bookSpotResponse, Is.Not.Null);

        var cancelSpot = await resident1.PostAsync(
            "/spots/booking/cancel",
            JsonContent.Create(
                new CancelBookingRequest
                {
                    ParkingLotId = Seed.Spots.Resident2,
                    BookingId = bookSpotResponse!.BookingId!.Value
                }),
            cancellationToken);

        await cancelSpot.AssertIsSuccessful(cancellationToken);

        var resident2Profile = await resident2.GetAsync(
            "/@me",
            cancellationToken);

        await resident2Profile.AssertIsSuccessful(cancellationToken);
        var resident2ProfileResponse = await bookSpot.Content.ReadFromJsonAsync<MeResponse>(cancellationToken);

        Assert.That(resident2ProfileResponse, Is.Not.Null);
        Assert.That(resident2ProfileResponse.Rating, Is.EqualTo(Seed.Users.InitialRating));
    }


    [Test]
    [CancelAfter(60_000)]
    public async Task SpotBookingCompletes_ShouldIncreaseOwnersReputation(CancellationToken cancellationToken)
    {
        using var resident1 = ApplicationFactory.UserClient(Seed.Users.Resident1);
        using var resident2 = ApplicationFactory.UserClient(Seed.Users.Resident2);

        var bookingCompleteCompletion = JobListener.WaitForJob<MarkBookingComplete>();

        var makeSpotAvailable = await resident2.PostAsync(
            "/spots/availabilities",
            JsonContent.Create(
                new MakeMySpotAvailableRequest
                {
                    From = DateTimeOffset.Now.AddSeconds(1),
                    To = DateTimeOffset.Now.AddHours(1)
                }),
            cancellationToken);

        await makeSpotAvailable.AssertIsSuccessful(cancellationToken);

        var bookSpot = await resident1.PostAsync(
            "/spots/booking",
            JsonContent.Create(
                new BookSpotRequest
                {
                    ParkingLotId = Seed.Spots.Resident2,
                    From = DateTimeOffset.Now.AddSeconds(1),
                    To = DateTimeOffset.Now.AddSeconds(5),
                }),
            cancellationToken);

        await bookSpot.AssertIsSuccessful(cancellationToken);

        await bookingCompleteCompletion.Assert(cancellationToken);

        var resident2Profile = await resident2.GetAsync(
            "/@me",
            cancellationToken);

        await resident2Profile.AssertIsSuccessful(cancellationToken);
        var resident2ProfileResponse = await resident2Profile.Content.ReadFromJsonAsync<MeResponse>(cancellationToken);

        Assert.That(resident2ProfileResponse, Is.Not.Null);
        Assert.That(resident2ProfileResponse.Rating, Is.EqualTo(Seed.Users.InitialRating + 0.2m));
    }
}
