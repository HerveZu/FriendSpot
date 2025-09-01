using System.Net;
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

internal sealed class ParkingTests : IntegrationTestsBase
{
    [Test]
    [CancelAfter(10_000)]
    public async Task CreateParking_ShouldBeValid(CancellationToken cancellationToken)
    {
        using var resident1 = UserClient(Seed.Users.Resident1);

        var createParking = await resident1.PostAsync(
            "/parking",
            JsonContent.Create(
                new CreateParkingRequest
                {
                    Address = "Test av.",
                    Name = "Test"
                }),
            cancellationToken);

        var parking = await createParking.AssertIsSuccessful<ParkingResponse>(cancellationToken);

        Assert.Multiple(() =>
        {
            Assert.That(parking.Name, Is.EqualTo("Test"));
            Assert.That(parking.Address, Is.EqualTo("Test av."));
            Assert.That(parking.Code, Does.StartWith("F-"));
            Assert.That(parking.Code, Has.Length.EqualTo(8));
        });
    }

    [Test]
    [CancelAfter(10_000)]
    public async Task CreateNeighbourhoodParking_ShouldFail_WhenNoNeighbourhoodPlan(CancellationToken cancellationToken)
    {
        using var resident1 = UserClient(Seed.Users.Resident1);

        var createParking = await resident1.PostAsync(
            "/parking",
            JsonContent.Create(
                new CreateParkingRequest
                {
                    Address = "Test av.",
                    Name = "Test",
                    Neighbourhood = true
                }),
            cancellationToken);

        await createParking.AssertIs(HttpStatusCode.BadRequest, cancellationToken);
    }

    [Test]
    [CancelAfter(10_000)]
    public async Task CreateNeighbourhoodParking_ShouldHave50MaxUsers_WhenNeighbourhoodPlanActive(
        CancellationToken cancellationToken)
    {
        UserFeatures.GetEnabled(Arg.Any<CancellationToken>())
            .ReturnsForAnyArgs(
                Task.FromResult(
                    new EnabledFeatures(
                        [UserProduct.Activate("test", Seed.Users.Resident1, Products.Neighbourhood, null)])));

        using var resident1 = UserClient(Seed.Users.Resident1);

        var createParking = await resident1.PostAsync(
            "/parking",
            JsonContent.Create(
                new CreateParkingRequest
                {
                    Address = "Test av.",
                    Name = "Test",
                    Neighbourhood = true
                }),
            cancellationToken);

        var parking = await createParking.AssertIsSuccessful<ParkingResponse>(cancellationToken);

        Assert.That(parking.MaxSpots, Is.EqualTo(50));
    }

    [Test]
    [CancelAfter(10_000)]
    public async Task CreateMultipleNeighbourhoodParking_ShouldFail_WhenNeighbourhoodPlanActive(
        CancellationToken cancellationToken)
    {
        UserFeatures.GetEnabled(Arg.Any<CancellationToken>())
            .ReturnsForAnyArgs(
                Task.FromResult(
                    new EnabledFeatures(
                        [UserProduct.Activate("test", Seed.Users.Resident1, Products.Neighbourhood, null)])));

        using var resident1 = UserClient(Seed.Users.Resident1);

        var createParking = await resident1.PostAsync(
            "/parking",
            JsonContent.Create(
                new CreateParkingRequest
                {
                    Address = "Test av.",
                    Name = "Test",
                    Neighbourhood = true
                }),
            cancellationToken);

        await createParking.AssertIsSuccessful(cancellationToken);

        var createSecondParking = await resident1.PostAsync(
            "/parking",
            JsonContent.Create(
                new CreateParkingRequest
                {
                    Address = "Test av.",
                    Name = "Test",
                    Neighbourhood = true
                }),
            cancellationToken);

        await createSecondParking.AssertIs(HttpStatusCode.BadRequest, cancellationToken);
    }

    [Test]
    [CancelAfter(10_000)]
    public async Task CreateParking_ShouldHave15MaxUsers_WhenPremiumPlanActive(CancellationToken cancellationToken)
    {
        UserFeatures.GetEnabled(Arg.Any<CancellationToken>())
            .ReturnsForAnyArgs(
                Task.FromResult(
                    new EnabledFeatures([UserProduct.Activate("test", Seed.Users.Resident1, Products.Premium, null)])));

        using var resident1 = UserClient(Seed.Users.Resident1);

        var createParking = await resident1.PostAsync(
            "/parking",
            JsonContent.Create(
                new CreateParkingRequest
                {
                    Address = "Test av.",
                    Name = "Test",
                }),
            cancellationToken);

        var parking = await createParking.AssertIsSuccessful<ParkingResponse>(cancellationToken);

        Assert.That(parking.MaxSpots, Is.EqualTo(15));
    }

    [Test]
    [CancelAfter(10_000)]
    public async Task CreateParking_ShouldHave10MaxUsers_WhenNoPlan(CancellationToken cancellationToken)
    {
        using var resident1 = UserClient(Seed.Users.Resident1);

        var createParking = await resident1.PostAsync(
            "/parking",
            JsonContent.Create(
                new CreateParkingRequest
                {
                    Address = "Test av.",
                    Name = "Test",
                }),
            cancellationToken);

        var parking = await createParking.AssertIsSuccessful<ParkingResponse>(cancellationToken);

        Assert.That(parking.MaxSpots, Is.EqualTo(10));
    }

    [Test]
    [CancelAfter(10_000)]
    public async Task SearchParking_ShouldFind_WhenSearchingByCode(CancellationToken cancellationToken)
    {
        using var resident1 = UserClient(Seed.Users.Resident1);
        using var resident2 = UserClient(Seed.Users.Resident2);

        var createParkings = await Task.WhenAll(
            resident1.PostAsync(
                "/parking",
                JsonContent.Create(
                    new CreateParkingRequest
                    {
                        Address = "Test av.",
                        Name = "Test"
                    }),
                cancellationToken),
            resident1.PostAsync(
                "/parking",
                JsonContent.Create(
                    new CreateParkingRequest
                    {
                        Address = "Test av.",
                        Name = "Test2"
                    }),
                cancellationToken));

        var createdParkings = await Task.WhenAll(
            createParkings.Select(createParking =>
                createParking.AssertIsSuccessful<ParkingResponse>(cancellationToken)));

        var parkingToSearch = createdParkings[1];

        var searchParking = await resident2.GetAsync($"/parking?search={parkingToSearch.Code}", cancellationToken);
        var parkingSearchResult = await searchParking.AssertIsSuccessful<ParkingResponse[]>(cancellationToken);

        Assert.That(parkingSearchResult, Has.Length.EqualTo(1));
        Assert.That(parkingSearchResult[0].Id, Is.EqualTo(parkingToSearch.Id));
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
    public async Task LeaveParking_ShouldCancelBookingsAndAvailabilitiesAndRequests(CancellationToken cancellationToken)
    {
        UserFeatures.GetEnabled(Arg.Any<CancellationToken>())
            .ReturnsForAnyArgs(
                Task.FromResult(
                    new EnabledFeatures([UserProduct.Activate("test", Seed.Users.Resident1, Products.Premium, null)])));


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
            $"/spots/{Seed.Spots.Resident1}/booking",
            JsonContent.Create(
                new BookSpotRequest
                {
                    From = DateTimeOffset.Now.AddHours(2),
                    To = DateTimeOffset.Now.AddHours(6)
                }),
            cancellationToken);

        await bookSpot.AssertIsSuccessful(cancellationToken);

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

        var getBooking = await resident2.GetAsync("/spots/booking", cancellationToken);
        var bookings = await getBooking.AssertIsSuccessful<GetBookingResponse>(cancellationToken);

        var getAvailabilities = await resident1.GetAsync("/spots/availabilities", cancellationToken);
        var availabilities = await getAvailabilities.AssertIsSuccessful<GetMyAvailabilitiesResponse>(cancellationToken);

        var getRequests = await resident1.GetAsync("/parking/requests/@me", cancellationToken);
        var requests = await getRequests.AssertIsSuccessful<GetMyBookingRequestsResponse>(cancellationToken);

        Assert.Multiple(() =>
        {
            Assert.That(bookings.Bookings, Is.Empty);
            Assert.That(availabilities.Availabilities, Is.Empty);
            Assert.That(requests.Requests, Is.Empty);

            // credits will be refunded when canceled

            Assert.That(profileResident1.Wallet.Credits, Is.EqualTo(Seed.Users.InitialBalance));
            Assert.That(profileResident1.Wallet.PendingCredits, Is.EqualTo(0));

            Assert.That(profileResident2.Wallet.Credits, Is.EqualTo(Seed.Users.InitialBalance));
            Assert.That(profileResident2.Wallet.PendingCredits, Is.EqualTo(0));
        });
    }
}
