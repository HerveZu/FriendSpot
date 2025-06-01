using System.Net.Http.Json;
using Api.Bookings;
using Api.Bookings.OnBooked;
using Api.Me;
using Api.Tests.TestBench;
using Domain.Users;
using NSubstitute;

namespace Api.Tests;

internal sealed class SpotBookingTests : IntegrationTestsBase
{
    [Test]
    [CancelAfter(10_000)]
    public async Task BookSpot_ShouldSendNotificationToOwner_WhenUserBooked(CancellationToken cancellationToken)
    {
        using var resident1 = UserClient(Seed.Users.Resident1);
        using var resident2 = UserClient(Seed.Users.Resident2);

        var pushToDeviceCompletion = NotificationPushService
            .PushToDevice(
                Arg.Any<UserDevice>(),
                Arg.Any<Notification>(),
                Arg.Any<CancellationToken>()
            )
            .ReturnsForAnyArgs(Task.CompletedTask)
            .AfterHavingCompleted(info => info.Arg<UserDevice>().DeviceId == Seed.Devices.Resident2);

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
            $"/spots/{Seed.Spots.Resident2}/booking",
            JsonContent.Create(
                new BookSpotRequest
                {
                    From = DateTimeOffset.Now.AddHours(2),
                    To = DateTimeOffset.Now.AddHours(6)
                }),
            cancellationToken);

        await bookSpot.AssertIsSuccessful(cancellationToken);

        await pushToDeviceCompletion.Wait(cancellationToken);
    }

    [Test]
    [CancelAfter(10_000)]
    public async Task BookSpot_ShouldAddPendingCredits_WhenUserBooked(CancellationToken cancellationToken)
    {
        using var resident1 = UserClient(Seed.Users.Resident1);
        using var resident2 = UserClient(Seed.Users.Resident2);

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
            $"/spots/{Seed.Spots.Resident2}/booking",
            JsonContent.Create(
                new BookSpotRequest
                {
                    From = DateTimeOffset.Now.AddHours(2),
                    To = DateTimeOffset.Now.AddHours(6)
                }),
            cancellationToken);

        await bookSpot.AssertIsSuccessful(cancellationToken);

        var resident2Profile = await resident2.GetAsync(
            "/@me",
            cancellationToken);

        var resident2ProfileResponse = await resident2Profile.AssertIsSuccessful<MeResponse>(cancellationToken);

        Assert.That(resident2ProfileResponse.Wallet.PendingCredits, Is.EqualTo(4));
    }

    [Test]
    [CancelAfter(10_000)]
    public async Task SpotBookingCompletes_ShouldIncreaseOwnersReputation(CancellationToken cancellationToken)
    {
        using var resident1 = UserClient(Seed.Users.Resident1);
        using var resident2 = UserClient(Seed.Users.Resident2);

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

        var now = DateTimeOffset.Now;
        var bookSpot = await resident1.PostAsync(
            $"/spots/{Seed.Spots.Resident2}/booking",
            JsonContent.Create(
                new BookSpotRequest
                {
                    From = now.AddSeconds(1),
                    To = now.AddSeconds(1).AddMicroseconds(1)
                }),
            cancellationToken);

        await bookSpot.AssertIsSuccessful(cancellationToken);

        await bookingCompleteCompletion.Wait(cancellationToken);

        var resident2Profile = await resident2.GetAsync(
            "/@me",
            cancellationToken);

        var resident2ProfileResponse = await resident2Profile.AssertIsSuccessful<MeResponse>(cancellationToken);

        Assert.That(resident2ProfileResponse, Is.Not.Null);
        Assert.That(resident2ProfileResponse.Rating, Is.EqualTo(Seed.Users.InitialRating + 0.2m));
    }

    [Test]
    [CancelAfter(10_000)]
    public async Task SpotBookingCompletes_ShouldConfirmPendingCredits(CancellationToken cancellationToken)
    {
        using var resident1 = UserClient(Seed.Users.Resident1);
        using var resident2 = UserClient(Seed.Users.Resident2);

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

        var now = DateTimeOffset.Now;
        var bookSpot = await resident1.PostAsync(
            $"/spots/{Seed.Spots.Resident2}/booking",
            JsonContent.Create(
                new BookSpotRequest
                {
                    From = now.AddSeconds(1),
                    To = now.AddSeconds(1).AddMicroseconds(1)
                }),
            cancellationToken);

        await bookSpot.AssertIsSuccessful(cancellationToken);

        await bookingCompleteCompletion.Wait(cancellationToken);

        var resident2Profile = await resident2.GetAsync(
            "/@me",
            cancellationToken);

        var resident2ProfileResponse = await resident2Profile.AssertIsSuccessful<MeResponse>(cancellationToken);

        Assert.That(resident2ProfileResponse.Wallet.Credits, Is.EqualTo(Seed.Users.InitialBalance + 1));
    }
}