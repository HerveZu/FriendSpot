using System.Net.Http.Json;
using Api.Bookings;
using Api.Tests.TestBench;
using Domain.Users;
using NSubstitute;

namespace Api.Tests;

internal sealed class ReminderTests : IntegrationTestsBase
{
    [Test]
    [CancelAfter(10_000)]
    public async Task BeforeBookingStarts_ShouldSendNotificationToUser_WhenUserBooked(
        CancellationToken cancellationToken)
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
            .AfterHavingCompleted(info =>
                info.Arg<UserDevice>().DeviceId == Seed.Devices.Resident1
                && info.Arg<Notification>().Title.Key == "PushNotification.Reminders.UsersBookingStarts.Title");

        var makeSpotAvailable = await resident2.PostAsync(
            "/spots/availabilities",
            JsonContent.Create(
                new MakeMySpotAvailableRequest
                {
                    From = DateTimeOffset.Now.AddSeconds(1),
                    To = DateTimeOffset.Now.AddDays(2)
                }),
            cancellationToken);

        await makeSpotAvailable.AssertIsSuccessful(cancellationToken);

        var bookSpot = await resident1.PostAsync(
            $"/spots/{Seed.Spots.Resident2}/booking",
            JsonContent.Create(
                new BookSpotRequest
                {
                    From = DateTimeOffset.Now.AddSeconds(1),
                    To = DateTimeOffset.Now.AddHours(6)
                }),
            cancellationToken);

        await bookSpot.AssertIsSuccessful(cancellationToken);

        await pushToDeviceCompletion.Wait(cancellationToken);

        Assert.Pass();
    }

    [Test]
    [CancelAfter(10_000)]
    public async Task BeforeBookingStarts_ShouldSendNotificationToOwner_WhenUserBooked(
        CancellationToken cancellationToken)
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
            .AfterHavingCompleted(info =>
                info.Arg<UserDevice>().DeviceId == Seed.Devices.Resident2
                && info.Arg<Notification>().Title.Key == "PushNotification.Reminders.OwnerNeedsToShare.Title");

        var makeSpotAvailable = await resident2.PostAsync(
            "/spots/availabilities",
            JsonContent.Create(
                new MakeMySpotAvailableRequest
                {
                    From = DateTimeOffset.Now.AddSeconds(1),
                    To = DateTimeOffset.Now.AddHours(2)
                }),
            cancellationToken);

        await makeSpotAvailable.AssertIsSuccessful(cancellationToken);

        var bookSpot = await resident1.PostAsync(
            $"/spots/{Seed.Spots.Resident2}/booking",
            JsonContent.Create(
                new BookSpotRequest
                {
                    From = DateTimeOffset.Now.AddSeconds(1),
                    To = DateTimeOffset.Now.AddHours(6)
                }),
            cancellationToken);

        await bookSpot.AssertIsSuccessful(cancellationToken);

        await pushToDeviceCompletion.Wait(cancellationToken);

        Assert.Pass();
    }

    [Test]
    [CancelAfter(10_000)]
    public async Task BeforeBookingEnds_ShouldSendNotificationToUser_WhenUserBooked(CancellationToken cancellationToken)
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
            .AfterHavingCompleted(info =>
                info.Arg<UserDevice>().DeviceId == Seed.Devices.Resident1
                && info.Arg<Notification>().Title.Key == "PushNotification.Reminders.UsersBookingEnds.Title");

        var makeSpotAvailable = await resident2.PostAsync(
            "/spots/availabilities",
            JsonContent.Create(
                new MakeMySpotAvailableRequest
                {
                    From = DateTimeOffset.Now.AddSeconds(1),
                    To = DateTimeOffset.Now.AddHours(2)
                }),
            cancellationToken);

        await makeSpotAvailable.AssertIsSuccessful(cancellationToken);

        var bookSpot = await resident1.PostAsync(
            $"/spots/{Seed.Spots.Resident2}/booking",
            JsonContent.Create(
                new BookSpotRequest
                {
                    From = DateTimeOffset.Now.AddSeconds(1),
                    To = DateTimeOffset.Now.AddSeconds(1).AddMicroseconds(1)
                }),
            cancellationToken);

        await bookSpot.AssertIsSuccessful(cancellationToken);

        await pushToDeviceCompletion.Wait(cancellationToken);

        Assert.Pass();
    }
}
