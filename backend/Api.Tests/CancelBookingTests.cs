using System.Net;
using System.Net.Http.Json;
using Api.Bookings;
using Api.Me;
using Api.Tests.TestBench;
using Domain.Users;
using NSubstitute;

namespace Api.Tests;

internal sealed class CancelBookingTests : IntegrationTestsBase
{
    [Test]
    [CancelAfter(10_000)]
    public async Task CancelBooking_ShouldReturnNoContent(CancellationToken cancellationToken)
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
            "/spots/booking",
            JsonContent.Create(
                new BookSpotRequest
                {
                    ParkingLotId = Seed.Spots.Resident2,
                    From = DateTimeOffset.Now.AddHours(2),
                    To = DateTimeOffset.Now.AddHours(6)
                }),
            cancellationToken);

        var bookSpotResponse = await bookSpot.AssertIsSuccessful<BookSpotResponse>(cancellationToken);
        Assert.That(bookSpotResponse.BookingId, Is.Not.Null);

        var cancelSpot = await resident1.PostAsync(
            "/spots/booking/cancel",
            JsonContent.Create(
                new CancelBookingRequest
                {
                    ParkingLotId = Seed.Spots.Resident2,
                    BookingId = bookSpotResponse.BookingId.Value
                }),
            cancellationToken);

        await cancelSpot.AssertIs(HttpStatusCode.NoContent, cancellationToken);
    }

    [Test]
    [CancelAfter(10_000)]
    public async Task CancelBooking_ShouldSendNotificationToOwner_WhenUserCancelled(CancellationToken cancellationToken)
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
            "/spots/booking",
            JsonContent.Create(
                new BookSpotRequest
                {
                    ParkingLotId = Seed.Spots.Resident2,
                    From = DateTimeOffset.Now.AddHours(2),
                    To = DateTimeOffset.Now.AddHours(6)
                }),
            cancellationToken);

        var bookSpotResponse = await bookSpot.AssertIsSuccessful<BookSpotResponse>(cancellationToken);
        Assert.That(bookSpotResponse.BookingId, Is.Not.Null);

        var cancelSpot = await resident1.PostAsync(
            "/spots/booking/cancel",
            JsonContent.Create(
                new CancelBookingRequest
                {
                    ParkingLotId = Seed.Spots.Resident2,
                    BookingId = bookSpotResponse.BookingId.Value
                }),
            cancellationToken);

        await cancelSpot.AssertIsSuccessful(cancellationToken);

        await pushToDeviceCompletion.Assert(cancellationToken);
    }

    [Test]
    [CancelAfter(10_000)]
    public async Task CancelBooking_ShouldSendNotificationToUser_WhenOwnerCancelled(CancellationToken cancellationToken)
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
            .AfterHavingCompleted(info => info.Arg<UserDevice>().DeviceId == Seed.Devices.Resident1);

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

        var bookSpotResponse = await bookSpot.AssertIsSuccessful<BookSpotResponse>(cancellationToken);

        Assert.That(bookSpotResponse.BookingId, Is.Not.Null);

        var cancelSpot = await resident2.PostAsync(
            "/spots/booking/cancel",
            JsonContent.Create(
                new CancelBookingRequest
                {
                    ParkingLotId = Seed.Spots.Resident2,
                    BookingId = bookSpotResponse.BookingId.Value
                }),
            cancellationToken);

        await cancelSpot.AssertIsSuccessful(cancellationToken);

        await pushToDeviceCompletion.Assert(cancellationToken);
    }

    [Test]
    [CancelAfter(10_000)]
    public async Task CancelBooking_ShouldRefundUser(CancellationToken cancellationToken)
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
            "/spots/booking",
            JsonContent.Create(
                new BookSpotRequest
                {
                    ParkingLotId = Seed.Spots.Resident2,
                    From = DateTimeOffset.Now.AddHours(2),
                    To = DateTimeOffset.Now.AddHours(6)
                }),
            cancellationToken);

        var bookSpotResponse = await bookSpot.AssertIsSuccessful<BookSpotResponse>(cancellationToken);
        Assert.That(bookSpotResponse.BookingId, Is.Not.Null);

        var cancelSpot = await resident1.PostAsync(
            "/spots/booking/cancel",
            JsonContent.Create(
                new CancelBookingRequest
                {
                    ParkingLotId = Seed.Spots.Resident2,
                    BookingId = bookSpotResponse.BookingId.Value
                }),
            cancellationToken);

        await cancelSpot.AssertIsSuccessful(cancellationToken);

        var resident1ProfileResult = await resident1.GetAsync(
            "/@me",
            cancellationToken);

        var resident2ProfileResult = await resident2.GetAsync(
            "/@me",
            cancellationToken);

        var profileResident1 = await resident1ProfileResult.AssertIsSuccessful<MeResponse>(cancellationToken);
        var profileResident2 = await resident2ProfileResult.AssertIsSuccessful<MeResponse>(cancellationToken);

        Assert.Multiple(
            () =>
            {
                Assert.That(profileResident1.Wallet.Credits, Is.EqualTo(Seed.Users.InitialBalance));
                Assert.That(profileResident1.Wallet.PendingCredits, Is.EqualTo(0));

                Assert.That(profileResident2.Wallet.Credits, Is.EqualTo(Seed.Users.InitialBalance));
                Assert.That(profileResident2.Wallet.PendingCredits, Is.EqualTo(0));
            });
    }

    [Test]
    [CancelAfter(10_000)]
    public async Task CancelBooking_ShouldDecreaseUserReputation_WhenOwnerCancelled(CancellationToken cancellationToken)
    {
        using var resident1 = UserClient(Seed.Users.Resident1);
        using var resident2 = UserClient(Seed.Users.Resident2);

        var makeSpotAvailable = await resident1.PostAsync(
            "/spots/availabilities",
            JsonContent.Create(
                new MakeMySpotAvailableRequest
                {
                    From = DateTimeOffset.Now.AddHours(1),
                    To = DateTimeOffset.Now.AddDays(2)
                }),
            cancellationToken);

        await makeSpotAvailable.AssertIsSuccessful(cancellationToken);

        var bookSpot = await resident2.PostAsync(
            "/spots/booking",
            JsonContent.Create(
                new BookSpotRequest
                {
                    ParkingLotId = Seed.Spots.Resident1,
                    From = DateTimeOffset.Now.AddHours(2),
                    To = DateTimeOffset.Now.AddHours(6)
                }),
            cancellationToken);

        var bookSpotResponse = await bookSpot.AssertIsSuccessful<BookSpotResponse>(cancellationToken);
        Assert.That(bookSpotResponse.BookingId, Is.Not.Null);

        var cancelSpot = await resident2.PostAsync(
            "/spots/booking/cancel",
            JsonContent.Create(
                new CancelBookingRequest
                {
                    ParkingLotId = Seed.Spots.Resident1,
                    BookingId = bookSpotResponse.BookingId.Value
                }),
            cancellationToken);

        await cancelSpot.AssertIsSuccessful(cancellationToken);

        var resident2ProfileResult = await resident2.GetAsync(
            "/@me",
            cancellationToken);

        var profileResident2 = await resident2ProfileResult.AssertIsSuccessful<MeResponse>(cancellationToken);

        Assert.That(profileResident2.Rating, Is.EqualTo(Seed.Users.InitialRating - 0.2m));
    }

    [Test]
    [CancelAfter(10_000)]
    public async Task CancelBooking_ShouldDecreaseUserReputation_WhenUserCancelled(CancellationToken cancellationToken)
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
            "/spots/booking",
            JsonContent.Create(
                new BookSpotRequest
                {
                    ParkingLotId = Seed.Spots.Resident2,
                    From = DateTimeOffset.Now.AddHours(2),
                    To = DateTimeOffset.Now.AddHours(6)
                }),
            cancellationToken);

        var bookSpotResponse = await bookSpot.AssertIsSuccessful<BookSpotResponse>(cancellationToken);
        Assert.That(bookSpotResponse.BookingId, Is.Not.Null);

        var cancelSpot = await resident1.PostAsync(
            "/spots/booking/cancel",
            JsonContent.Create(
                new CancelBookingRequest
                {
                    ParkingLotId = Seed.Spots.Resident2,
                    BookingId = bookSpotResponse.BookingId.Value
                }),
            cancellationToken);

        await cancelSpot.AssertIsSuccessful(cancellationToken);

        var resident1ProfileResult = await resident1.GetAsync(
            "/@me",
            cancellationToken);

        var profileResident1 = await resident1ProfileResult.AssertIsSuccessful<MeResponse>(cancellationToken);

        Assert.That(profileResident1.Rating, Is.EqualTo(Seed.Users.InitialRating - 0.2m));
    }
}
