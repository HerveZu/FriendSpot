using System.Net.Http.Headers;
using System.Net.Http.Json;
using Api.Common.Options;
using Api.Me;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
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

        await RegisterUsers();
    }

    [TearDown]
    public async Task TearDownEnv()
    {
        await _pgContainer.DisposeAsync();
        await ApplicationFactory.DisposeAsync();
    }

    protected WebApplicationFactory<Program> ApplicationFactory { get; private set; }
    private PostgreSqlContainer _pgContainer;

    private async Task RegisterUsers()
    {
        var client = ApplicationFactory.CreateClient();

        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue(TestAuthHandler.TestScheme, Users.Valid);

        var result = await client.PostAsync(
            "/@me/register",
            JsonContent.Create(
                new RegisterUserRequest
                {
                    DisplayName = "Test User",
                    Device = new RegisterUserRequest.UserDevice
                    {
                        Id = "grille-pain-3000",
                        ExpoPushToken = null,
                        UniquenessNotGuaranteed = true
                    },
                    PictureUrl = null
                }));

        await result.AssertIsSuccessful();
        var registeredUser = await result.Content.ReadFromJsonAsync<RegisterUserResponse>();

        Assert.That(registeredUser, Is.Not.Null);
    }
}
