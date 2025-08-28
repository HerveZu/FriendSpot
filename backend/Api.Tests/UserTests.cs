using System.Net.Http.Json;
using Api.Common.Contracts;
using Api.Me;
using Api.Parkings;
using Api.Tests.TestBench;
using Npgsql;

namespace Api.Tests;

internal sealed class UserTests : IntegrationTestsBase
{
    [Test]
    [CancelAfter(10_000)]
    public async Task ViewMe_ShouldReturnCurrentUser(CancellationToken cancellationToken)
    {
        using var client = UserClient(Seed.Users.Resident1);

        var meResult = await client.GetAsync(
            "/@me",
            cancellationToken);

        var me = await meResult.AssertIsSuccessful<MeResponse>(cancellationToken);

        Assert.Multiple(() =>
        {
            Assert.That(me.Id, Is.EqualTo(Seed.Users.Resident1));
            Assert.That(me.Rating, Is.EqualTo(Seed.Users.InitialRating));
            Assert.That(me.Wallet.Credits, Is.EqualTo(Seed.Users.InitialBalance));
            Assert.That(me.Wallet.PendingCredits, Is.EqualTo(0));
        });

        Assert.That(me.Spot, Is.Not.Null);
        Assert.Multiple(() => { Assert.That(me.Spot.Id, Is.EqualTo(Seed.Spots.Resident1)); });
    }

    [Test]
    [CancelAfter(10_000)]
    public async Task RegisterOnNewAccount_ShouldDeletePreviouslyRegisteredDevice__WhenSameDeviceId(
        CancellationToken cancellationToken)
    {
        using var resident1 = UserClient(Seed.Users.Resident1);
        using var resident2 = UserClient(Seed.Users.Resident2);
        const string deviceId = "device-id";

        var previousRegister = await resident1.PostAsync(
            "/@me/register",
            JsonContent.Create(
                new RegisterUserRequest
                {
                    Device = new RegisterUserRequest.UserDevice
                    {
                        Id = deviceId,
                        ExpoPushToken = null,
                        Locale = "fr"
                    },
                    DisplayName = "resident1",
                    PictureUrl = null
                }),
            cancellationToken);

        await previousRegister.AssertIsSuccessful(cancellationToken);

        var newRegister = await resident2.PostAsync(
            "/@me/register",
            JsonContent.Create(
                new RegisterUserRequest
                {
                    Device = new RegisterUserRequest.UserDevice
                    {
                        Id = deviceId,
                        ExpoPushToken = null,
                        Locale = "en"
                    },
                    DisplayName = "resident2",
                    PictureUrl = null
                }),
            cancellationToken);

        await newRegister.AssertIsSuccessful(cancellationToken);

        await using var conn = new NpgsqlConnection(PgContainer.GetConnectionString());
        await conn.OpenAsync(cancellationToken);

        await using var cmd = new NpgsqlCommand(
            $"""
             SELECT COUNT(*)
             FROM public."UserDevice"
             WHERE "DeviceId" = '{deviceId}';
             """,
            conn);

        var count = await cmd.ExecuteScalarAsync(cancellationToken);

        Assert.That(Convert.ToInt32(count), Is.EqualTo(1));
    }

    [Test]
    [CancelAfter(10_000)]
    public async Task RegisterOnExistingAccount_ShouldUpdateDevice__WhenSameDeviceId(
        CancellationToken cancellationToken)
    {
        using var existingUser = UserClient(Seed.Users.Resident1);
        const string deviceId = "device-id";

        var previousRegister = await existingUser.PostAsync(
            "/@me/register",
            JsonContent.Create(
                new RegisterUserRequest
                {
                    Device = new RegisterUserRequest.UserDevice
                    {
                        Id = deviceId,
                        ExpoPushToken = null,
                        Locale = "fr",
                        Timezone = "Europe/Paris",
                        UniquenessNotGuaranteed = true
                    },
                    DisplayName = "user",
                    PictureUrl = null
                }),
            cancellationToken);

        await previousRegister.AssertIsSuccessful(cancellationToken);

        var newRegister = await existingUser.PostAsync(
            "/@me/register",
            JsonContent.Create(
                new RegisterUserRequest
                {
                    Device = new RegisterUserRequest.UserDevice
                    {
                        Id = deviceId,
                        ExpoPushToken = null,
                        Locale = "CH-de",
                        Timezone = "Europe/Zurich",
                        UniquenessNotGuaranteed = true
                    },
                    DisplayName = "user2",
                    PictureUrl = null
                }),
            cancellationToken);

        await newRegister.AssertIsSuccessful(cancellationToken);

        await using var conn = new NpgsqlConnection(PgContainer.GetConnectionString());
        await conn.OpenAsync(cancellationToken);

        await using var cmd = new NpgsqlCommand(
            $"""
             SELECT count(*)
             FROM public."UserDevice"
             WHERE "DeviceId" = '{deviceId}' and "TimeZone" = 'Europe/Zurich' and "Locale" = 'ch-DE';
             """,
            conn);

        var count = await cmd.ExecuteScalarAsync(cancellationToken);

        Assert.That(Convert.ToInt32(count), Is.EqualTo(1));
    }

    [Test]
    [CancelAfter(10_000)]
    public async Task DeleteUser_ShouldDeleteOwnedParking_WhenLeftEmpty(CancellationToken cancellationToken)
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

        var deleteUser = await user.DeleteAsync(
            "/@me",
            cancellationToken);
        await deleteUser.AssertIsSuccessful(cancellationToken);

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

        var deleteUser = await user.DeleteAsync(
            "/@me",
            cancellationToken);
        await deleteUser.AssertIsSuccessful(cancellationToken);

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
}
