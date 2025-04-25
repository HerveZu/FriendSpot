using Api.Common.Infrastructure;
using Api.Common.Options;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
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
             ('{Seed.Users.SpotOwner}', 3, 'Parking Owner User', null, false),
             ('{Seed.Users.Other}', 3, 'Other User', null, false);

             insert into public."Wallet"
             ("Id", "UserId")
             select gen_random_uuid(), "Identity" from public."User";

             insert into public."Parking"
             ("Id", "Name", "Address", "OwnerId") 
             values 
             ('{Seed.Parkings.Main}', 'Main Parking', 'Main Street 123', '{Seed.Users.SpotOwner}');

             insert into public."ParkingSpot"
             ("Id", "ParkingId", "SpotName", "OwnerId")
             values 
             ('{Seed.Spots.Main}', '{Seed.Parkings.Main}', 'Main Spot', '{Seed.Users.SpotOwner}');
             """);
#pragma warning restore EF1002

        await dbContext.SaveChangesAsync();
    }
}
