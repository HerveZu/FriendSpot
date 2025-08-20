using System.Net.Http.Json;
using Api.Bookings;
using Api.Me;
using Api.Parkings;
using Api.Tests.TestBench;

namespace Api.Tests;

internal sealed class ParkingSpotTests : IntegrationTestsBase
{
    [Test]
    [CancelAfter(10_000)]
    public async Task LeaveParkingSpot_ShouldCancelAllBookings(CancellationToken cancellationToken)
    {
        using var user1 = UserClient(Seed.Users.Resident1);
        using var user2 = UserClient(Seed.Users.Resident2);

        var makeSpotAvailable = await user1.PostAsync(
            "/spots/availabilities",
            JsonContent.Create(
                new MakeMySpotAvailableRequest
                {
                    From = DateTimeOffset.Now.AddHours(1),
                    To = DateTimeOffset.Now.AddDays(2)
                }),
            cancellationToken);

        await makeSpotAvailable.AssertIsSuccessful(cancellationToken);

        var bookSpotCancellable = await user2.PostAsync(
            $"/spots/{Seed.Spots.Resident1}/booking",
            JsonContent.Create(
                new BookSpotRequest
                {
                    From = DateTimeOffset.Now.AddHours(4),
                    To = DateTimeOffset.Now.AddHours(6)
                }),
            cancellationToken);

        await bookSpotCancellable.AssertIsSuccessful(cancellationToken);

        var leaveParking = await user1.DeleteAsync(
            "/@me/spot",
            cancellationToken);
        await leaveParking.AssertIsSuccessful(cancellationToken);

        var getBooking = await user2.GetAsync("/spots/booking", cancellationToken);
        var bookings = await getBooking.AssertIsSuccessful<GetBookingResponse>(cancellationToken);

        Assert.That(bookings.Bookings, Is.Empty);
    }

    [Test]
    [CancelAfter(10_000)]
    public async Task LeaveParking_ShouldDeleteUserSpot(CancellationToken cancellationToken)
    {
        using var user = UserClient(Seed.Users.Resident1);

        var leaveParking = await user.DeleteAsync(
            "/@me/spot",
            cancellationToken);
        await leaveParking.AssertIsSuccessful(cancellationToken);

        var getMe = await user.GetAsync("/@me", cancellationToken);
        var userProfile = await getMe.AssertIsSuccessful<MeResponse>(cancellationToken);

        Assert.That(userProfile.Spot, Is.Null);
    }

    [Test]
    [CancelAfter(10_000)]
    public async Task DefineParkingSpot_ShouldCancelAllBookings_WhenChangingParking(CancellationToken cancellationToken)
    {
        using var user1 = UserClient(Seed.Users.Resident1);
        using var user2 = UserClient(Seed.Users.Resident2);

        var makeSpotAvailable = await user1.PostAsync(
            "/spots/availabilities",
            JsonContent.Create(
                new MakeMySpotAvailableRequest
                {
                    From = DateTimeOffset.Now.AddHours(1),
                    To = DateTimeOffset.Now.AddDays(2)
                }),
            cancellationToken);

        await makeSpotAvailable.AssertIsSuccessful(cancellationToken);

        var bookSpotCancellable = await user2.PostAsync(
            $"/spots/{Seed.Spots.Resident1}/booking",
            JsonContent.Create(
                new BookSpotRequest
                {
                    From = DateTimeOffset.Now.AddHours(4),
                    To = DateTimeOffset.Now.AddHours(6)
                }),
            cancellationToken);

        await bookSpotCancellable.AssertIsSuccessful(cancellationToken);

        var changeParking = await user1.PutAsync(
            "/@me/spot",
            JsonContent.Create(
                new DefineMySpotRequest
                {
                    ParkingId = Seed.Parkings.Other,
                    LotName = "Test"
                }),
            cancellationToken);
        await changeParking.AssertIsSuccessful(cancellationToken);

        var getBooking = await user2.GetAsync("/spots/booking", cancellationToken);
        var bookings = await getBooking.AssertIsSuccessful<GetBookingResponse>(cancellationToken);

        Assert.That(bookings.Bookings, Is.Empty);
    }

    [Test]
    [CancelAfter(10_000)]
    public async Task DefineParkingSpot_ShouldNotCancelAnyBooking_WhenSameParking(CancellationToken cancellationToken)
    {
        using var user1 = UserClient(Seed.Users.Resident1);
        using var user2 = UserClient(Seed.Users.Resident2);

        var makeSpotAvailable = await user1.PostAsync(
            "/spots/availabilities",
            JsonContent.Create(
                new MakeMySpotAvailableRequest
                {
                    From = DateTimeOffset.Now.AddHours(1),
                    To = DateTimeOffset.Now.AddDays(2)
                }),
            cancellationToken);

        await makeSpotAvailable.AssertIsSuccessful(cancellationToken);

        var bookSpotCancellable = await user2.PostAsync(
            $"/spots/{Seed.Spots.Resident1}/booking",
            JsonContent.Create(
                new BookSpotRequest
                {
                    From = DateTimeOffset.Now.AddHours(4),
                    To = DateTimeOffset.Now.AddHours(6)
                }),
            cancellationToken);

        await bookSpotCancellable.AssertIsSuccessful(cancellationToken);

        var changeParking = await user1.PutAsync(
            "/@me/spot",
            JsonContent.Create(
                new DefineMySpotRequest
                {
                    ParkingId = Seed.Parkings.Main,
                    LotName = "Test"
                }),
            cancellationToken);
        await changeParking.AssertIsSuccessful(cancellationToken);

        var getBooking = await user2.GetAsync("/spots/booking", cancellationToken);
        var bookings = await getBooking.AssertIsSuccessful<GetBookingResponse>(cancellationToken);

        Assert.That(bookings.Bookings, Has.Length.EqualTo(1));
    }
}
