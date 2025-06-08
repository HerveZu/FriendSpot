using System.Net.Http.Json;
using Api.BookingRequests;
using Api.BookingRequests.OnBookingRequested;
using Api.Bookings;
using Api.Me;
using Api.Tests.TestBench;

namespace Api.Tests;

internal sealed class BookingRequestTests : IntegrationTestsBase
{
    [Test]
    [CancelAfter(10_000)]
    public async Task RequestBooking_ShouldTakeDeposit(CancellationToken cancellationToken)
    {
        using var resident1 = UserClient(Seed.Users.Resident1);

        var bookingRequestResult = await resident1.PostAsync(
            "/parking/requests",
            JsonContent.Create(
                new RequestBookingRequest
                {
                    From = DateTimeOffset.Now.AddHours(1),
                    To = DateTimeOffset.Now.AddHours(6),
                    Bonus = 50
                }),
            cancellationToken);

        await bookingRequestResult.AssertIsSuccessful(cancellationToken);

        var resident1ProfileResult = await resident1.GetAsync(
            "/@me",
            cancellationToken);

        var profile = await resident1ProfileResult.AssertIsSuccessful<MeResponse>(cancellationToken);

        Assert.Multiple(() =>
        {
            Assert.That(profile.Wallet.Credits, Is.EqualTo(Seed.Users.InitialBalance - (5 + 50)));
            Assert.That(profile.Wallet.PendingCredits, Is.EqualTo(0));
        });
    }

    [Test]
    [CancelAfter(10_000)]
    public async Task RequestBooking_ShouldNotImpactCreditsNorReputation_WhenWasNeverAccepted(
        CancellationToken cancellationToken)
    {
        using var resident1 = UserClient(Seed.Users.Resident1);

        var cancelBookingRequestCompletion = JobListener.WaitForJob<MarkBookingRequestExpired>();

        var now = DateTimeOffset.Now;
        var bookingRequestResult = await resident1.PostAsync(
            "/parking/requests",
            JsonContent.Create(
                new RequestBookingRequest
                {
                    From = now.AddSeconds(1),
                    To = now.AddSeconds(1).AddMicroseconds(1),
                    Bonus = 50
                }),
            cancellationToken);

        await bookingRequestResult.AssertIsSuccessful(cancellationToken);
        await cancelBookingRequestCompletion.Wait(cancellationToken);

        var resident1ProfileResult = await resident1.GetAsync(
            "/@me",
            cancellationToken);

        var profile = await resident1ProfileResult.AssertIsSuccessful<MeResponse>(cancellationToken);

        Assert.Multiple(() =>
        {
            Assert.That(profile.Wallet.Credits, Is.EqualTo(Seed.Users.InitialBalance));
            Assert.That(profile.Wallet.PendingCredits, Is.EqualTo(0));
            Assert.That(profile.Rating, Is.EqualTo(Seed.Users.InitialRating));
        });
    }

    [Test]
    [CancelAfter(10_000)]
    public async Task AcceptRequestBooking_ShouldTransferCreditsForBookingAndBonus(CancellationToken cancellationToken)
    {
        using var resident1 = UserClient(Seed.Users.Resident1);
        using var resident2 = UserClient(Seed.Users.Resident2);

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

        var now = DateTimeOffset.Now;
        var bookingRequestResult = await resident1.PostAsync(
            "/parking/requests",
            JsonContent.Create(
                new RequestBookingRequest
                {
                    From = now.AddHours(3),
                    To = now.AddHours(8),
                    Bonus = 50
                }),
            cancellationToken);

        var bookingRequest = await bookingRequestResult.AssertIsSuccessful<RequestBookingResponse>(cancellationToken);
        Assert.That(bookingRequest.RequestId, Is.Not.Null);

        var acceptRequestResult = await resident2.PostAsync(
            $"/parking/requests/{bookingRequest.RequestId.Value}/accept",
            JsonContent.Create(new object()),
            cancellationToken);

        await acceptRequestResult.AssertIsSuccessful(cancellationToken);

        var resident1ProfileResult = await resident1.GetAsync(
            "/@me",
            cancellationToken);

        var resident2ProfileResult = await resident2.GetAsync(
            "/@me",
            cancellationToken);

        var profileResident1 = await resident1ProfileResult.AssertIsSuccessful<MeResponse>(cancellationToken);
        var profileResident2 = await resident2ProfileResult.AssertIsSuccessful<MeResponse>(cancellationToken);

        const int cost = 50 + 5;

        Assert.Multiple(() =>
        {
            Assert.That(profileResident1.Wallet.Credits, Is.EqualTo(Seed.Users.InitialBalance - cost));
            Assert.That(profileResident1.Wallet.PendingCredits, Is.EqualTo(0));

            Assert.That(profileResident2.Wallet.Credits, Is.EqualTo(Seed.Users.InitialBalance));
            Assert.That(profileResident2.Wallet.PendingCredits, Is.EqualTo(cost));
        });
    }

    [Test]
    [CancelAfter(10_000)]
    public async Task AcceptRequestBooking_ShouldIncreaseUserReputation(CancellationToken cancellationToken)
    {
        using var resident1 = UserClient(Seed.Users.Resident1);
        using var resident2 = UserClient(Seed.Users.Resident2);

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

        var now = DateTimeOffset.Now;
        var bookingRequestResult = await resident1.PostAsync(
            "/parking/requests",
            JsonContent.Create(
                new RequestBookingRequest
                {
                    From = now.AddHours(3),
                    To = now.AddHours(7),
                    Bonus = 50
                }),
            cancellationToken);

        var bookingRequest = await bookingRequestResult.AssertIsSuccessful<RequestBookingResponse>(cancellationToken);
        Assert.That(bookingRequest.RequestId, Is.Not.Null);

        var acceptRequestResult = await resident2.PostAsync(
            $"/parking/requests/{bookingRequest.RequestId.Value}/accept",
            JsonContent.Create(new object()),
            cancellationToken);

        await acceptRequestResult.AssertIsSuccessful(cancellationToken);

        var resident2ProfileResult = await resident2.GetAsync(
            "/@me",
            cancellationToken);

        var profileResident2 = await resident2ProfileResult.AssertIsSuccessful<MeResponse>(cancellationToken);

        Assert.That(profileResident2.Rating, Is.EqualTo(Seed.Users.InitialRating + 0.05m));
    }

    [Test]
    [CancelAfter(10_000)]
    public async Task AcceptRequestBooking_ShouldBookSpot_WhenSpotIsAvailable(CancellationToken cancellationToken)
    {
        using var resident1 = UserClient(Seed.Users.Resident1);
        using var resident2 = UserClient(Seed.Users.Resident2);

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

        var now = DateTimeOffset.Now;
        var bookingRequestResult = await resident1.PostAsync(
            "/parking/requests",
            JsonContent.Create(
                new RequestBookingRequest
                {
                    From = now.AddHours(3),
                    To = now.AddHours(7),
                    Bonus = 50
                }),
            cancellationToken);

        var bookingRequest = await bookingRequestResult.AssertIsSuccessful<RequestBookingResponse>(cancellationToken);
        Assert.That(bookingRequest.RequestId, Is.Not.Null);

        var acceptRequestResult = await resident2.PostAsync(
            $"/parking/requests/{bookingRequest.RequestId.Value}/accept",
            JsonContent.Create(new object()),
            cancellationToken);

        await acceptRequestResult.AssertIsSuccessful(cancellationToken);

        var resident1BookingResult = await resident1.GetAsync(
            "/spots/booking",
            cancellationToken);

        var resident1Booking = await resident1BookingResult.AssertIsSuccessful<GetBookingResponse>(cancellationToken);

        Assert.That(resident1Booking.Bookings, Has.Length.EqualTo(1));
        Assert.Multiple(() =>
        {
            Assert.That(resident1Booking.Bookings[0].From, Is.EqualTo(now.AddHours(3)));
            Assert.That(resident1Booking.Bookings[0].To, Is.EqualTo(now.AddHours(7)));
            Assert.That(resident1Booking.Bookings[0].Owner.UserId, Is.EqualTo(Seed.Users.Resident2));
        });
    }

    [Test]
    [CancelAfter(10_000)]
    public async Task CancelBookingRequest_ShouldNotImpactCredits(CancellationToken cancellationToken)
    {
        using var resident1 = UserClient(Seed.Users.Resident1);

        var now = DateTimeOffset.Now;
        var bookingRequestResult = await resident1.PostAsync(
            "/parking/requests",
            JsonContent.Create(
                new RequestBookingRequest
                {
                    From = now.AddHours(1),
                    To = now.AddHours(2),
                    Bonus = 50
                }),
            cancellationToken);

        var request = await bookingRequestResult.AssertIsSuccessful<RequestBookingResponse>(cancellationToken);
        var cancelRequestResult = await resident1
            .DeleteAsync($"/parking/requests/{request.RequestId}/cancel", cancellationToken);

        await cancelRequestResult.AssertIsSuccessful(cancellationToken);

        var resident1ProfileResult = await resident1.GetAsync(
            "/@me",
            cancellationToken);

        var profile = await resident1ProfileResult.AssertIsSuccessful<MeResponse>(cancellationToken);

        Assert.Multiple(() =>
        {
            Assert.That(profile.Wallet.Credits, Is.EqualTo(Seed.Users.InitialBalance));
            Assert.That(profile.Wallet.PendingCredits, Is.EqualTo(0));
        });
    }

    [Test]
    [CancelAfter(10_000)]
    public async Task CancelBookingRequest_ShouldDecreaseReputation(CancellationToken cancellationToken)
    {
        using var resident1 = UserClient(Seed.Users.Resident1);

        var now = DateTimeOffset.Now;
        var bookingRequestResult = await resident1.PostAsync(
            "/parking/requests",
            JsonContent.Create(
                new RequestBookingRequest
                {
                    From = now.AddHours(1),
                    To = now.AddHours(2),
                    Bonus = 50
                }),
            cancellationToken);

        var request = await bookingRequestResult.AssertIsSuccessful<RequestBookingResponse>(cancellationToken);
        var cancelRequestResult = await resident1
            .DeleteAsync($"/parking/requests/{request.RequestId}/cancel", cancellationToken);

        await cancelRequestResult.AssertIsSuccessful(cancellationToken);

        var resident1ProfileResult = await resident1.GetAsync(
            "/@me",
            cancellationToken);

        var profile = await resident1ProfileResult.AssertIsSuccessful<MeResponse>(cancellationToken);

        Assert.That(profile.Rating, Is.EqualTo(Seed.Users.InitialRating - 0.2m));
    }

    [Test]
    [CancelAfter(10_000)]
    public async Task GetMyBookingRequest_ShouldReturnMyRequest_WhenNotExpired(CancellationToken cancellationToken)
    {
        using var resident1 = UserClient(Seed.Users.Resident1);

        var requestExpiredCompletion = JobListener.WaitForJob<MarkBookingRequestExpired>();

        var now = DateTimeOffset.Now;
        var bookingRequest1Result = await resident1.PostAsync(
            "/parking/requests",
            JsonContent.Create(
                new RequestBookingRequest
                {
                    From = now.AddSeconds(1),
                    To = now.AddSeconds(1).AddMicroseconds(1),
                    Bonus = 10
                }),
            cancellationToken);
        var bookingRequest2Result = await resident1.PostAsync(
            "/parking/requests",
            JsonContent.Create(
                new RequestBookingRequest
                {
                    From = now.AddHours(1),
                    To = now.AddHours(2),
                    Bonus = 50
                }),
            cancellationToken);

        await bookingRequest1Result.AssertIsSuccessful(cancellationToken);
        await bookingRequest2Result.AssertIsSuccessful(cancellationToken);

        await requestExpiredCompletion.Wait(cancellationToken);

        var getMyRequestsResult = await resident1
            .GetAsync("/parking/requests/@me", cancellationToken);

        var myBookingRequests =
            await getMyRequestsResult.AssertIsSuccessful<GetMyBookingRequestsResponse>(cancellationToken);

        Assert.That(myBookingRequests.Requests, Has.Length.EqualTo(1));
        Assert.Multiple(() =>
        {
            Assert.That(myBookingRequests.Requests[0].From, Is.EqualTo(now.AddHours(1)));
            Assert.That(myBookingRequests.Requests[0].To, Is.EqualTo(now.AddHours(2)));
            Assert.That(myBookingRequests.Requests[0].Bonus, Is.EqualTo(50));
        });
    }

    [Test]
    [CancelAfter(10_000)]
    public async Task GetAllBookingRequests_ShouldReturnOnlyOthersRequests_WhenNotExpired(
        CancellationToken cancellationToken)
    {
        using var resident1 = UserClient(Seed.Users.Resident1);
        using var resident2 = UserClient(Seed.Users.Resident2);

        var requestExpiredCompletion = JobListener.WaitForJob<MarkBookingRequestExpired>();

        var now = DateTimeOffset.Now;
        var otherBookingRequest1Result = await resident1.PostAsync(
            "/parking/requests",
            JsonContent.Create(
                new RequestBookingRequest
                {
                    From = now.AddSeconds(1),
                    To = now.AddSeconds(1).AddMicroseconds(1),
                    Bonus = 10
                }),
            cancellationToken);
        var otherBookingRequest2Result = await resident1.PostAsync(
            "/parking/requests",
            JsonContent.Create(
                new RequestBookingRequest
                {
                    From = now.AddHours(1),
                    To = now.AddHours(2),
                    Bonus = 50
                }),
            cancellationToken);

        var myBookingRequestResult = await resident2.PostAsync(
            "/parking/requests",
            JsonContent.Create(
                new RequestBookingRequest
                {
                    From = now.AddHours(4),
                    To = now.AddHours(9),
                    Bonus = 10
                }),
            cancellationToken);

        await otherBookingRequest1Result.AssertIsSuccessful(cancellationToken);
        await otherBookingRequest2Result.AssertIsSuccessful(cancellationToken);
        await myBookingRequestResult.AssertIsSuccessful(cancellationToken);

        await requestExpiredCompletion.Wait(cancellationToken);

        var getAllRequests = await resident2
            .GetAsync("/parking/requests", cancellationToken);

        var myBookingRequests =
            await getAllRequests.AssertIsSuccessful<GetAllBookingRequestsResponse>(cancellationToken);

        Assert.That(myBookingRequests.Requests, Has.Length.EqualTo(1));
        Assert.Multiple(() =>
        {
            Assert.That(myBookingRequests.Requests[0].From, Is.EqualTo(now.AddHours(1)));
            Assert.That(myBookingRequests.Requests[0].To, Is.EqualTo(now.AddHours(2)));
            Assert.That(myBookingRequests.Requests[0].Bonus, Is.EqualTo(50));
        });
    }
}
