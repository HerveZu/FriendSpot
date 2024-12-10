using System.Security.Claims;
using System.Text.Json.Serialization;
using Api;
using Api.Common;
using Api.Common.Infrastructure;
using Api.Common.Options;
using DotNetEnv;
using FastEndpoints;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Quartz;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// other environments should not contain .env files
if (builder.Environment.IsDevelopment())
{
    Env.Load(".env");
}

builder.Configuration
    .AddEnvironmentVariables()
    .Build();

builder.Services
    .ConfigureAndValidate<PostgresOptions>()
    .ConfigureAndValidate<CorsOptions>()
    .AddScoped<IStartupService, MigrateDb>()
    .AddMediatR(
        x => { x.RegisterServicesFromAssemblyContaining<Program>(); })
    .AddDbContext<AppDbContext>()
    .AddQuartz(
        x =>
        {
            var postgresOptions = builder.Configuration.GetOptions<PostgresOptions>();

            x.UsePersistentStore(
                options =>
                {
                    options.UseNewtonsoftJsonSerializer();
                    options.UseClustering();
                    options.UsePostgres(
                        postgres =>
                        {
                            postgres.ConnectionString = postgresOptions.ConnectionString;
                            postgres.TablePrefix = "quartz.qrtz_";
                        });
                });
        })
    .AddQuartzHostedService(x => x.WaitForJobsToComplete = true)
    .AddFastEndpoints()
    .AddOpenApi()
    .AddCors()
    .ConfigureHttpJsonOptions(
        options => { options.SerializerOptions.Converters.Add(new JsonStringEnumConverter()); });

builder.Services
    .AddAuthorization()
    .AddAuthentication(
        options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
    .AddJwtBearer(
        options =>
        {
            options.Authority = "https://friendspot-app.eu.auth0.com/";
            options.Audience = "https://friendspot.me";
            options.TokenValidationParameters = new TokenValidationParameters
            {
                NameClaimType = ClaimTypes.NameIdentifier
            };
        });

builder.Host
    .UseSerilog(
        (_, _, loggerConfiguration) =>
        {
            loggerConfiguration
                .Enrich.FromLogContext()
                .WriteTo.Console();
        }
    );

var app = builder.Build();

using (var startupScope = app.Services.CreateScope())
{
    var startupServices = startupScope.ServiceProvider.GetServices<IStartupService>();
    await Task.WhenAll(startupServices.Select(service => service.Run()));
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors(
    options =>
    {
        var cors = options
            .AllowAnyHeader()
            .AllowAnyMethod();

        if (app.Environment.IsDevelopment())
        {
            cors.AllowAnyOrigin();
            return;
        }

        var corsOptions = app.Services.GetRequiredService<IOptions<CorsOptions>>();
        cors.SetIsOriginAllowed(corsOptions.Value.AllowedOrigins.Contains);
    });

app
    .UseHttpsRedirection()
    .UseAuthentication()
    .UseAuthorization()
    .UseFastEndpoints(
        config => config.Endpoints.Configurator = ep =>
        {
            ep.Options(
                routeBuilder => routeBuilder
                    .AddEndpointFilter<RunInTransaction>()
                    .AddEndpointFilter<EnsureUserExists>());
        });

await app.RunAsync();
