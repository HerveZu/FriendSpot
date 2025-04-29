using System.Security.Claims;
using System.Text.Json.Serialization;
using Api;
using Api.Common;
using Api.Common.Infrastructure;
using Api.Common.Notifications;
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
    .ConfigureAndValidate<S3Options>()
    .ConfigureAndValidate<CorsOptions>()
    .ConfigureAndValidate<ExpoOptions>()
    .AddHttpClient()
    .AddScoped<INotificationPushService, ExpoPushNotificationService>()
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
            options.Authority = "https://securetoken.google.com/friendspot-app";
            options.Audience = "friendspot-app";
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
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
            ep.PreProcessor<EnsureUserExists>(Order.After);
            ep.PostProcessor<ReturnBusinessErrors>(Order.Before);

            ep.Options(
                routeBuilder => routeBuilder
                    .AddEndpointFilter<RunInTransaction>());
        });

await app.RunAsync();