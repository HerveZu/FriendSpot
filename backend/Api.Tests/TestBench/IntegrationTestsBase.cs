using Api.Common.Infrastructure;
using Api.Common.Options;
using Domain.Users;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using NSubstitute;
using Testcontainers.PostgreSql;

namespace Api.Tests.TestBench;

[TestFixture]
[FixtureLifeCycle(LifeCycle.InstancePerTestCase)]
[Parallelizable(ParallelScope.All)]
internal abstract class IntegrationTestsBase
{
    [SetUp]
    public async Task SetupEnv()
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

        ApplicationFactory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(
                builder =>
                {
                    builder.ConfigureServices(
                        services =>
                        {
                            services.AddSingleton(NotificationPushService);

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

        await SeedData();
    }

    [TearDown]
    public async Task TearDownEnv()
    {
        await _pgContainer.DisposeAsync();
        await ApplicationFactory.DisposeAsync();
    }

    protected readonly INotificationPushService NotificationPushService = Substitute.For<INotificationPushService>();

    protected WebApplicationFactory<Program> ApplicationFactory { get; private set; }
    private PostgreSqlContainer _pgContainer;

    private async Task SeedData()
    {
        using var scope = ApplicationFactory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

// can be safely disable as this is a test setup + only compile time const are used.
#pragma warning disable EF1002
        await dbContext.Database.ExecuteSqlRawAsync(
            $"""
             insert into public."User" 
             ("Identity", "Rating_Rating", "DisplayName", "PictureUrl", "IsDeleted") 
             values 
             ('{Seed.Users.ParkingAdmin}', 3, 'Parking Admin', null, false),
             ('{Seed.Users.Resident1}', 3, 'Resident 1', null, false),
             ('{Seed.Users.Resident2}', 3, 'Resident 2', null, false);

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
             select "Id", 'initial-credits-for-testing', 100, '1' from public."Wallet";

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
             """);
#pragma warning restore EF1002

        await dbContext.SaveChangesAsync();
    }
}
