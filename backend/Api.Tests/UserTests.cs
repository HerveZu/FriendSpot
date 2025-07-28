using System.Net.Http.Json;
using Api.Me;
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

        var previousRegister = await resident1.PostAsync(
            "/@me/register",
            JsonContent.Create(
                new RegisterUserRequest
                {
                    Device = new RegisterUserRequest.UserDevice
                    {
                        Id = "device-id",
                        ExpoPushToken = null,
                        Locale = "fr",
                        Timezone = "Europe/Paris"
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
                        Id = "device-id",
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
            """
            SELECT COUNT(*)
            FROM public."UserDevice"
            WHERE "DeviceId" = 'device-id';
            """,
            conn);

        var count = await cmd.ExecuteScalarAsync(cancellationToken);

        Assert.That(Convert.ToInt32(count), Is.EqualTo(1));
    }
}
