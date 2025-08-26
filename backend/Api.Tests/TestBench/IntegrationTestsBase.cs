using System.Net.Http.Headers;
using Api.Common;
using Api.Common.Infrastructure;
using Api.Common.Options;
using Domain;
using Domain.Users;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using NSubstitute;
using NSubstitute.ClearExtensions;
using Quartz;
using Respawn;
using Testcontainers.PostgreSql;

namespace Api.Tests.TestBench;

[TestFixture]
[Parallelizable(ParallelScope.None)]
internal abstract class IntegrationTestsBase
{
    [OneTimeSetUp]
    public async Task OneTimeSetup()
    {
        PgContainer = new PostgreSqlBuilder()
            .WithImage("postgres:15-alpine")
            .Build();

        await PgContainer.StartAsync();

        var inMemorySettings = new Dictionary<string, string?>
        {
            {
                $"{PostgresOptions.Section}:CONNECTION_STRING",
                PgContainer.GetConnectionString()
            },
            {
                $"{PostgresOptions.Section}:ENABLE_SENSITIVE_DATA_LOGGING",
                "true"
            },
            {
                $"{AppOptions.Section}:BUNDLE_ID",
                "com.friendspot.test"
            },
            {
                $"{AppOptions.Section}:SANDBOX_PURCHASES",
                "true"
            },
        };

        _applicationFactory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.ConfigureTestServices(services =>
                {
                    services.AddSingleton(NotificationPushService);
                    services.AddQuartz(x => { x.InterruptJobsOnShutdown = true; });
                    services.AddSingleton<ITestJobListener[]>([JobListener]);
                    services.Decorate<ISchedulerFactory, CustomListenersSchedulerFactory>();
                    services.AddSingleton(UserFeatures);
                });

                builder.ConfigureServices(services =>
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

        await using (var scope = _applicationFactory.Services.CreateAsyncScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await dbContext.Database.MigrateAsync();
        }

        await using var conn = new NpgsqlConnection(GetConnectionString());
        await conn.OpenAsync();
        _respawn = await Respawner.CreateAsync(
            conn,
            new RespawnerOptions { DbAdapter = DbAdapter.Postgres, SchemasToInclude = ["public"] });
    }

    [SetUp]
    public async Task SetUp()
    {
        UserFeatures.GetEnabled(Arg.Any<CancellationToken>())
            .ReturnsForAnyArgs(Task.FromResult(new EnabledFeatures([])));

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
             ('{Seed.Users.OtherParkingAdmin}', {Seed.Users.InitialRating}, 'Other Parking Admin', null, false),
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
             ('{Seed.Parkings.Main}', 'Main Parking', 'Main Street 123', '{Seed.Users.ParkingAdmin}'),
             ('{Seed.Parkings.Other}', 'Other Parking', 'Other Street 123', '{Seed.Users.OtherParkingAdmin}');

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
        var schedulerFactory =
            (CustomListenersSchedulerFactory)_applicationFactory.Services.GetRequiredService<ISchedulerFactory>();
        await schedulerFactory.Reset();
        NotificationPushService.ClearSubstitute();
        UserFeatures.ClearSubstitute();
    }

    [OneTimeTearDown]
    public async Task OneTimeTearDown()
    {
        await _applicationFactory.DisposeAsync();
        await PgContainer.DisposeAsync();
    }

    protected readonly INotificationPushService NotificationPushService = Substitute.For<INotificationPushService>();
    protected readonly IUserFeatures UserFeatures = Substitute.For<IUserFeatures>();
    protected QuartzJobListener JobListener { get; } = new();

    protected PostgreSqlContainer PgContainer { get; private set; }
    private Respawner _respawn;
    private WebApplicationFactory<Program> _applicationFactory;

    /// <summary>
    ///     Represents the minimum safe time delta used in tests to account for timing precision differences across multiple
    ///     systems.
    ///     Ensures that edge case validations and time-sensitive operations in tests are conducted reliably.
    /// </summary>
    protected readonly TimeSpan MinSafeDelta = TimeSpan.FromMilliseconds(1);

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
        return PgContainer.GetConnectionString() + ";Include Error Detail=true";
    }
}
