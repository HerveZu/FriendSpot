using System.Net;
using System.Net.Http.Json;
using Api.Bookings;
using Api.Tests.TestBench;
using Domain.Users;
using NSubstitute;

namespace Api.Tests;

internal sealed class CancelBookingTests : IntegrationTestsBase
{
    [Test]
    [CancelAfter(60_000)]
    public async Task CancelBooking_ShouldReturnOk(CancellationToken cancellationToken)
    {
        var resident1 = ApplicationFactory.UserClient(Seed.Users.Resident1);
        var resident2 = ApplicationFactory.UserClient(Seed.Users.Resident2);

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
        NotificationPushService.ClearReceivedCalls();

        var cancelSpot = await resident1.PostAsync(
            "/spots/booking",
            JsonContent.Create(
                new CancelBookingRequest
                {
                    ParkingLotId = Seed.Spots.Resident2,
                    BookingId = bookSpotResponse!.BookingId!.Value
                }),
            cancellationToken);

        await cancelSpot.AssertIs(HttpStatusCode.OK, cancellationToken);
    }

    [Test]
    [CancelAfter(60_000)]
    public async Task CancelBooking_ShouldSendNotificationToOwnerOnlyOnce_WhenUserCancelled(
        CancellationToken cancellationToken)
    {
        var resident1 = ApplicationFactory.UserClient(Seed.Users.Resident1);
        var resident2 = ApplicationFactory.UserClient(Seed.Users.Resident2);

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
        NotificationPushService.ClearReceivedCalls();

        var cancelSpot = await resident1.PostAsync(
            "/spots/booking",
            JsonContent.Create(
                new CancelBookingRequest
                {
                    ParkingLotId = Seed.Spots.Resident2,
                    BookingId = bookSpotResponse!.BookingId!.Value
                }),
            cancellationToken);

        await cancelSpot.AssertIsSuccessful(cancellationToken);

        await NotificationPushService.Received(1)
            .PushToDevice(
                Arg.Is<UserDevice>(device => device.DeviceId == Seed.Devices.Resident2),
                Arg.Any<Notification>(),
                Arg.Any<CancellationToken>());
    }

    [Test]
    [CancelAfter(60_000)]
    public async Task CancelBooking_ShouldSendNotificationToUserOnlyOnce_WhenOwnerCancelled(
        CancellationToken cancellationToken)
    {
        var resident1 = ApplicationFactory.UserClient(Seed.Users.Resident1);
        var resident2 = ApplicationFactory.UserClient(Seed.Users.Resident2);

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
        NotificationPushService.ClearReceivedCalls();

        var cancelSpot = await resident2.PostAsync(
            "/spots/booking",
            JsonContent.Create(
                new CancelBookingRequest
                {
                    ParkingLotId = Seed.Spots.Resident2,
                    BookingId = bookSpotResponse!.BookingId!.Value
                }),
            cancellationToken);

        await cancelSpot.AssertIsSuccessful(cancellationToken);

        await NotificationPushService.Received(1)
            .PushToDevice(
                Arg.Is<UserDevice>(device => device.DeviceId == Seed.Devices.Resident1),
                Arg.Any<Notification>(),
                Arg.Any<CancellationToken>());
    }
}
