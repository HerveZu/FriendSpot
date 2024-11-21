using System.Security.Claims;
using System.Text.Json.Serialization;
using Api;
using Api.Common.Infrastructure;
using Api.Common.Options;
using DotNetEnv;
using FastEndpoints;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
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
    .AddScoped<IStartupService, MigrateDb>()
    .AddDbContext<AppDbContext>()
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
    app.UseCors(options => options.AllowAnyOrigin());
    app.MapOpenApi();
}

app
    .UseHttpsRedirection()
    .UseAuthentication()
    .UseAuthorization()
    .UseFastEndpoints();

await app.RunAsync();
