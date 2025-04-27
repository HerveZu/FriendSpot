using System.Net;
using System.Net.Http.Json;
using Api.Bookings;
using Api.Bookings.OnBooked;
using Api.Me;
using Api.Tests.TestBench;
using Domain.Users;
using NSubstitute;

namespace Api.Tests;

internal sealed class BookSpotTests : IntegrationTestsBase
{
    [Test]
    [CancelAfter(60_000)]
    public async Task BookSpot_ShouldReturnOk(CancellationToken cancellationToken)
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

        await bookSpot.AssertIs(HttpStatusCode.OK, cancellationToken);
    }

    [Test]
    [CancelAfter(60_000)]
    public async Task BookSpot_ShouldSendNotificationToOwner_WhenUserBooked(CancellationToken cancellationToken)
    {
        using var resident1 = ApplicationFactory.UserClient(Seed.Users.Resident1);
        using var resident2 = ApplicationFactory.UserClient(Seed.Users.Resident2);

        var pushToDeviceCompletion = NotificationPushService
            .PushToDevice(
                Arg.Any<UserDevice>(),
                Arg.Any<Notification>(),
                Arg.Any<CancellationToken>()
            )
            .ReturnsForAnyArgs(Task.CompletedTask)
            .AfterHavingCompleted(1, info => info.Arg<UserDevice>().DeviceId == Seed.Devices.Resident2);

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

        await pushToDeviceCompletion.Assert(cancellationToken);
    }

    [Test]
    [CancelAfter(60_000)]
    public async Task BookSpot_ShouldAddPendingCredits_WhenUserBooked(CancellationToken cancellationToken)
    {
        using var resident1 = ApplicationFactory.UserClient(Seed.Users.Resident1);
        using var resident2 = ApplicationFactory.UserClient(Seed.Users.Resident2);

        var pushToDeviceCompletion = NotificationPushService
            .PushToDevice(
                Arg.Any<UserDevice>(),
                Arg.Any<Notification>(),
                Arg.Any<CancellationToken>()
            )
            .ReturnsForAnyArgs(Task.CompletedTask)
            .AfterHavingCompleted(1, info => info.Arg<UserDevice>().DeviceId == Seed.Devices.Resident2);

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

        await pushToDeviceCompletion.Assert(cancellationToken);

        var resident2Profile = await resident2.GetAsync(
            "/@me",
            cancellationToken);

        await resident2Profile.AssertIsSuccessful(cancellationToken);
        var resident2ProfileResponse = await resident2Profile.Content.ReadFromJsonAsync<MeResponse>(cancellationToken);

        Assert.That(resident2ProfileResponse, Is.Not.Null);
        Assert.That(resident2ProfileResponse.Wallet.PendingCredits, Is.EqualTo(4));
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

    [Test]
    [CancelAfter(60_000)]
    public async Task SpotBookingCompletes_ShouldIncreaseConfirmPendingCredits(CancellationToken cancellationToken)
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
        Assert.That(resident2ProfileResponse.Wallet.Credits, Is.EqualTo(Seed.Users.InitialBalance + 1));
    }
}
