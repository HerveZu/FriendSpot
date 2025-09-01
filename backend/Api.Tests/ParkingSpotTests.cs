using System.Net.Http.Json;
using Api.BookingRequests;
using Api.Bookings;
using Api.Common.Contracts;
using Api.Me;
using Api.Parkings;
using Api.Tests.TestBench;
using Domain;
using Domain.UserProducts;
using Npgsql;
using NSubstitute;

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
    public async Task LeaveParking_ShouldDeleteTheParking_WhenLeftEmpty(CancellationToken cancellationToken)
    {
        using var user = UserClient(Seed.Users.Resident1);

        var createParking = await user.PostAsync(
            "/parking",
            JsonContent.Create(
                new CreateParkingRequest
                {
                    Address = "Test",
                    Name = "Test"
                }),
            cancellationToken);

        var parkingWithOneUserOnly = await createParking.AssertIsSuccessful<ParkingResponse>(cancellationToken);

        var joinParking = await user.PutAsync(
            "/@me/spot",
            JsonContent.Create(
                new DefineMySpotRequest
                {
                    ParkingId = parkingWithOneUserOnly.Id,
                    LotName = "test"
                }),
            cancellationToken);

        await joinParking.AssertIsSuccessful(cancellationToken);

        var leaveParking = await user.DeleteAsync(
            "/@me/spot",
            cancellationToken);
        await leaveParking.AssertIsSuccessful(cancellationToken);

        await using var conn = new NpgsqlConnection(PgContainer.GetConnectionString());
        await conn.OpenAsync(cancellationToken);

        await using var cmd = new NpgsqlCommand(
            $"""
             SELECT count(*)
             FROM public."Parking"
             WHERE "Id" = '{parkingWithOneUserOnly.Id}'
             """,
            conn);

        var count = await cmd.ExecuteScalarAsync(cancellationToken);

        Assert.That(Convert.ToInt32(count), Is.EqualTo(0));
    }

    [Test]
    [CancelAfter(10_000)]
    public async Task LeaveParking_ShouldTransferOwnershipToOtherUser_WhenOwnerHasLeft(
        CancellationToken cancellationToken)
    {
        using var user = UserClient(Seed.Users.ParkingAdmin);

        var leaveParking = await user.DeleteAsync(
            "/@me/spot",
            cancellationToken);
        await leaveParking.AssertIsSuccessful(cancellationToken);

        await using var conn = new NpgsqlConnection(PgContainer.GetConnectionString());
        await conn.OpenAsync(cancellationToken);

        await using var cmd = new NpgsqlCommand(
            $"""
             SELECT "OwnerId"
             FROM public."Parking"
             WHERE "Id" = '{Seed.Parkings.Main}'
             """,
            conn);

        var ownerId = await cmd.ExecuteScalarAsync(cancellationToken);

        Assert.That(Convert.ToString(ownerId), Is.Not.EqualTo(Seed.Users.ParkingAdmin));
    }

    [Test]
    [CancelAfter(10_000)]
    public async Task LeaveParking_ShouldNotTransferOwnershipToUser_WhenOtherUserHasLeft(
        CancellationToken cancellationToken)
    {
        using var user = UserClient(Seed.Users.Resident1);

        var leaveParking = await user.DeleteAsync(
            "/@me/spot",
            cancellationToken);
        await leaveParking.AssertIsSuccessful(cancellationToken);

        await using var conn = new NpgsqlConnection(PgContainer.GetConnectionString());
        await conn.OpenAsync(cancellationToken);

        await using var cmd = new NpgsqlCommand(
            $"""
             SELECT "OwnerId"
             FROM public."Parking"
             WHERE "Id" = '{Seed.Parkings.Main}'
             """,
            conn);

        var ownerId = await cmd.ExecuteScalarAsync(cancellationToken);

        Assert.That(Convert.ToString(ownerId), Is.EqualTo(Seed.Users.ParkingAdmin));
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

    [Test]
    [CancelAfter(10_000)]
    public async Task LeaveParking_ShouldCancelBookingsAndAvailabilitiesAndRequests(CancellationToken cancellationToken)
    {
        UserFeatures.GetEnabled(Arg.Any<CancellationToken>())
            .ReturnsForAnyArgs(
                Task.FromResult(
                    new EnabledFeatures([UserProduct.Activate("test", Seed.Users.Resident1, Products.Premium, null)])));

        using var resident1 = UserClient(Seed.Users.Resident1);
        using var resident2 = UserClient(Seed.Users.Resident2);

        var makeSpotAvailableResident1 = await resident1.PostAsync(
            "/spots/availabilities",
            JsonContent.Create(
                new MakeMySpotAvailableRequest
                {
                    From = DateTimeOffset.Now.AddHours(1),
                    To = DateTimeOffset.Now.AddDays(2)
                }),
            cancellationToken);

        await makeSpotAvailableResident1.AssertIsSuccessful(cancellationToken);

        var makeSpotAvailableResident2 = await resident2.PostAsync(
            "/spots/availabilities",
            JsonContent.Create(
                new MakeMySpotAvailableRequest
                {
                    From = DateTimeOffset.Now.AddHours(1),
                    To = DateTimeOffset.Now.AddDays(2)
                }),
            cancellationToken);

        await makeSpotAvailableResident2.AssertIsSuccessful(cancellationToken);

        var bookSpotResident1 = await resident1.PostAsync(
            $"/spots/{Seed.Spots.Resident2}/booking",
            JsonContent.Create(
                new BookSpotRequest
                {
                    From = DateTimeOffset.Now.AddHours(2),
                    To = DateTimeOffset.Now.AddHours(6)
                }),
            cancellationToken);

        await bookSpotResident1.AssertIsSuccessful(cancellationToken);

        var bookSpotResident2 = await resident2.PostAsync(
            $"/spots/{Seed.Spots.Resident1}/booking",
            JsonContent.Create(
                new BookSpotRequest
                {
                    From = DateTimeOffset.Now.AddHours(2),
                    To = DateTimeOffset.Now.AddHours(6)
                }),
            cancellationToken);

        await bookSpotResident2.AssertIsSuccessful(cancellationToken);

        var requestSpot = await resident1.PostAsync(
            "/parking/requests",
            JsonContent.Create(
                new RequestBookingRequest
                {
                    From = DateTimeOffset.Now.AddDays(5),
                    To = DateTimeOffset.Now.AddDays(6)
                }),
            cancellationToken);

        await requestSpot.AssertIsSuccessful(cancellationToken);

        var leaveParking = await resident1.DeleteAsync(
            "/@me/spot",
            cancellationToken);
        await leaveParking.AssertIsSuccessful(cancellationToken);

        var getProfileResident1 = await resident1.GetAsync("/@me", cancellationToken);
        var profileResident1 = await getProfileResident1.AssertIsSuccessful<MeResponse>(cancellationToken);

        var getProfileResident2 = await resident2.GetAsync("/@me", cancellationToken);
        var profileResident2 = await getProfileResident2.AssertIsSuccessful<MeResponse>(cancellationToken);

        var getResident1Booking = await resident2.GetAsync("/spots/booking", cancellationToken);
        var resident1Bookings = await getResident1Booking.AssertIsSuccessful<GetBookingResponse>(cancellationToken);

        var getResident1Availabilities = await resident1.GetAsync("/spots/availabilities", cancellationToken);
        var resident1Availabilities =
            await getResident1Availabilities.AssertIsSuccessful<GetMyAvailabilitiesResponse>(cancellationToken);

        var getResident2Availabilities = await resident2.GetAsync("/spots/availabilities", cancellationToken);
        var resident2Availabilities =
            await getResident2Availabilities.AssertIsSuccessful<GetMyAvailabilitiesResponse>(cancellationToken);

        var getResident1Requests = await resident1.GetAsync("/parking/requests/@me", cancellationToken);
        var resident1Requests =
            await getResident1Requests.AssertIsSuccessful<GetMyBookingRequestsResponse>(cancellationToken);

        Assert.Multiple(() =>
        {
            Assert.That(resident1Bookings.Bookings, Is.Empty);
            Assert.That(resident1Requests.Requests, Is.Empty);

            Assert.That(resident1Availabilities.Availabilities, Is.Empty);
            Assert.That(resident2Availabilities.Availabilities, Has.Length.EqualTo(1));
            Assert.That(resident2Availabilities.Availabilities[0].Bookings, Is.Empty);

            // credits will be refunded when canceled

            Assert.That(profileResident1.Wallet.Credits, Is.EqualTo(Seed.Users.InitialBalance));
            Assert.That(profileResident1.Wallet.PendingCredits, Is.EqualTo(0));

            Assert.That(profileResident2.Wallet.Credits, Is.EqualTo(Seed.Users.InitialBalance));
            Assert.That(profileResident2.Wallet.PendingCredits, Is.EqualTo(0));
        });
    }

    [Test]
    [CancelAfter(10_000)]
    public async Task DeleteUser_ShouldCancelBookingsAndAvailabilitiesAndRequests(CancellationToken cancellationToken)
    {
        UserFeatures.GetEnabled(Arg.Any<CancellationToken>())
            .ReturnsForAnyArgs(
                Task.FromResult(
                    new EnabledFeatures([UserProduct.Activate("test", Seed.Users.Resident1, Products.Premium, null)])));

        using var resident1 = UserClient(Seed.Users.Resident1);
        using var resident2 = UserClient(Seed.Users.Resident2);

        var makeSpotAvailableResident1 = await resident1.PostAsync(
            "/spots/availabilities",
            JsonContent.Create(
                new MakeMySpotAvailableRequest
                {
                    From = DateTimeOffset.Now.AddHours(1),
                    To = DateTimeOffset.Now.AddDays(2)
                }),
            cancellationToken);

        await makeSpotAvailableResident1.AssertIsSuccessful(cancellationToken);

        var makeSpotAvailableResident2 = await resident2.PostAsync(
            "/spots/availabilities",
            JsonContent.Create(
                new MakeMySpotAvailableRequest
                {
                    From = DateTimeOffset.Now.AddHours(1),
                    To = DateTimeOffset.Now.AddDays(2)
                }),
            cancellationToken);

        await makeSpotAvailableResident2.AssertIsSuccessful(cancellationToken);

        var bookSpotResident1 = await resident1.PostAsync(
            $"/spots/{Seed.Spots.Resident2}/booking",
            JsonContent.Create(
                new BookSpotRequest
                {
                    From = DateTimeOffset.Now.AddHours(2),
                    To = DateTimeOffset.Now.AddHours(6)
                }),
            cancellationToken);

        await bookSpotResident1.AssertIsSuccessful(cancellationToken);

        var bookSpotResident2 = await resident2.PostAsync(
            $"/spots/{Seed.Spots.Resident1}/booking",
            JsonContent.Create(
                new BookSpotRequest
                {
                    From = DateTimeOffset.Now.AddHours(2),
                    To = DateTimeOffset.Now.AddHours(6)
                }),
            cancellationToken);

        await bookSpotResident2.AssertIsSuccessful(cancellationToken);

        var requestSpot = await resident1.PostAsync(
            "/parking/requests",
            JsonContent.Create(
                new RequestBookingRequest
                {
                    From = DateTimeOffset.Now.AddDays(5),
                    To = DateTimeOffset.Now.AddDays(6)
                }),
            cancellationToken);

        await requestSpot.AssertIsSuccessful(cancellationToken);

        var deleteUser = await resident1.DeleteAsync(
            "/@me",
            cancellationToken);
        await deleteUser.AssertIsSuccessful(cancellationToken);

        var getProfileResident2 = await resident2.GetAsync("/@me", cancellationToken);
        var profileResident2 = await getProfileResident2.AssertIsSuccessful<MeResponse>(cancellationToken);

        var getResident2Availabilities = await resident2.GetAsync("/spots/availabilities", cancellationToken);
        var resident2Availabilities =
            await getResident2Availabilities.AssertIsSuccessful<GetMyAvailabilitiesResponse>(cancellationToken);

        Assert.Multiple(() =>
        {
            Assert.That(resident2Availabilities.Availabilities, Has.Length.EqualTo(1));
            Assert.That(resident2Availabilities.Availabilities[0].Bookings, Is.Empty);

            // credits will be refunded when canceled

            Assert.That(profileResident2.Wallet.Credits, Is.EqualTo(Seed.Users.InitialBalance));
            Assert.That(profileResident2.Wallet.PendingCredits, Is.EqualTo(0));
        });
    }
}
