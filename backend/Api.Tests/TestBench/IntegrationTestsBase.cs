using System.Net.Http.Headers;
using Api.Common.Options;
using Domain.Users;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using NSubstitute;
using Quartz;
using Respawn;
using Testcontainers.PostgreSql;

namespace Api.Tests.TestBench;

[TestFixture]
[Parallelizable(ParallelScope.Fixtures)]
internal abstract class IntegrationTestsBase
{
    [OneTimeSetUp]
    public async Task OneTimeSetup()
    {
        _pgContainer = new PostgreSqlBuilder()
            .WithImage("postgres:15-alpine")
            .Build();

        await _pgContainer.StartAsync();

        var inMemorySettings = new Dictionary<string, string?>
        {
            {
                $"{PostgresOptions.Section}:CONNECTION_STRING",
                _pgContainer.GetConnectionString()
            },
            {
                $"{PostgresOptions.Section}:ENABLE_SENSITIVE_DATA_LOGGING",
                "true"
            },
        };

        _applicationFactory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(
                builder =>
                {
                    builder.ConfigureTestServices(
                        services =>
                        {
                            services.AddSingleton(NotificationPushService);
                            services.AddSingleton(JobListener);
                            services.Decorate<ISchedulerFactory, SchedulerFactoryProxy>();
                        });

                    builder.ConfigureServices(
                        services =>
                        {
                            services
                                .AddAuthentication(TestAuthHandler.TestScheme)
                                .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>(
                                    TestAuthHandler.TestScheme,
                                    _ => { });
                            services
                                .AddAuthorizationBuilder()
                                .SetDefaultPolicy(
                                    new AuthorizationPolicyBuilder()
                                        .AddAuthenticationSchemes(TestAuthHandler.TestScheme)
                                        .RequireAuthenticatedUser()
                                        .Build());
                        });
                    builder.UseConfiguration(
                        new ConfigurationBuilder()
                            .AddInMemoryCollection(inMemorySettings)
                            .Build());
                });

        using var _ = _applicationFactory.CreateClient();

        await using var conn = new NpgsqlConnection(GetConnectionString());
        await conn.OpenAsync();
        _respawn = await Respawner.CreateAsync(conn, new RespawnerOptions { DbAdapter = DbAdapter.Postgres });
    }

    [SetUp]
    public async Task SetUp()
    {
        await using var conn = new NpgsqlConnection(GetConnectionString());
        await conn.OpenAsync();

        await _respawn.ResetAsync(conn);

        var command = conn.CreateCommand();

        command.CommandText =
            $"""
             insert into public."User" 
             ("Identity", "Rating_Rating", "DisplayName", "PictureUrl", "IsDeleted") 
             values 
             ('{Seed.Users.ParkingAdmin}', {Seed.Users.InitialRating}, 'Parking Admin', null, false),
             ('{Seed.Users.Resident1}', {Seed.Users.InitialRating}, 'Resident 1', null, false),
             ('{Seed.Users.Resident2}', {Seed.Users.InitialRating}, 'Resident 2', null, false);

             insert into public."UserDevice"
             ("UserIdentity", "ExpoPushToken", "DeviceId", "UniquenessNotGuaranteed") 
             values 
             ('{Seed.Users.ParkingAdmin}', null, '{Seed.Devices.ParkingAdmin}', false),
             ('{Seed.Users.Resident1}', null, '{Seed.Devices.Resident1}', false),
             ('{Seed.Users.Resident2}', null, '{Seed.Devices.Resident2}', false);

             insert into public."Wallet"
             ("Id", "UserId")
             select gen_random_uuid(), "Identity" from public."User";

             insert into public."CreditsTransaction"
             ("WalletId", "Reference", "Credits", "State") 
             select "Id", 'initial-credits-for-testing', {Seed.Users.InitialBalance}, '1' from public."Wallet";

             insert into public."Parking"
             ("Id", "Name", "Address", "OwnerId") 
             values 
             ('{Seed.Parkings.Main}', 'Main Parking', 'Main Street 123', '{Seed.Users.ParkingAdmin}');

             insert into public."ParkingSpot"
             ("Id", "ParkingId", "SpotName", "OwnerId")
             values 
             ('{Seed.Spots.Admin}', '{Seed.Parkings.Main}', 'OWNR', '{Seed.Users.ParkingAdmin}'),
             ('{Seed.Spots.Resident1}', '{Seed.Parkings.Main}', 'RESD-1', '{Seed.Users.Resident1}'),
             ('{Seed.Spots.Resident2}', '{Seed.Parkings.Main}', 'RESD-2', '{Seed.Users.Resident2}');
             """;

        await command.ExecuteNonQueryAsync();
    }

    [TearDown]
    public async Task TearDown()
    {
        // this is a dirty workaround that prevents deadlocks
        await Task.Delay(100);
    }

    [OneTimeTearDown]
    public async Task OneTimeTearDown()
    {
        await _applicationFactory.DisposeAsync();
        await _pgContainer.DisposeAsync();
    }

    protected readonly INotificationPushService NotificationPushService = Substitute.For<INotificationPushService>();
    protected QuartzJobTrackListener JobListener { get; } = new();

    private WebApplicationFactory<Program> _applicationFactory = null!;
    private PostgreSqlContainer _pgContainer = null!;
    private Respawner _respawn = null!;

    protected HttpClient UserClient(string userId)
    {
        var client = _applicationFactory.CreateClient();

        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue(TestAuthHandler.TestScheme, userId);

        return client;
    }

    protected HttpClient CreateClient()
    {
        return _applicationFactory.CreateClient();
    }

    private string GetConnectionString()
    {
        return _pgContainer.GetConnectionString() + ";Include Error Detail=true";
    }
}
