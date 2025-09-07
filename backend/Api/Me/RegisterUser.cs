using System.Globalization;
using Api.Common;
using Api.Common.Infrastructure;
using Domain.Users;
using FastEndpoints;
using FluentValidation;
using JetBrains.Annotations;
using Microsoft.EntityFrameworkCore;

namespace Api.Me;

[PublicAPI]
public sealed record RegisterUserRequest
{
    public required string DisplayName { get; init; }
    public required string? PictureUrl { get; init; }
    public required UserDevice Device { get; init; }

    [PublicAPI]
    public sealed record UserDevice
    {
        public required string Id { get; init; }
        public required string? ExpoPushToken { get; init; }
        public string Locale { get; init; } = "fr";
        public string Timezone { get; init; } = "Europe/London";

        // true by default to avoid any non-up-to-date client to pass non-unique device id
        public bool UniquenessNotGuaranteed { get; init; } = true;
    }
}

[PublicAPI]
public sealed record RegisterUserResponse
{
    public required string UserId { get; init; }
}

internal sealed class RegisterUserValidator : Validator<RegisterUserRequest>
{
    public RegisterUserValidator()
    {
        RuleFor(x => x.DisplayName)
            .MinimumLength(UserDisplayName.MinLength)
            .MaximumLength(UserDisplayName.MaxLength);

        RuleFor(x => x.Device.Id).NotEmpty();
        RuleFor(x => x.Device.Timezone).NotEmpty();
        RuleFor(x => x.Device.Locale).NotEmpty();
    }
}

internal sealed class RegisterUser(AppDbContext dbContext, ILogger<RegisterUser> logger)
    : Endpoint<RegisterUserRequest, RegisterUserResponse>
{
    public const string Path = "/@me/register";

    public override void Configure()
    {
        Post(Path);
    }

    public override async Task HandleAsync(RegisterUserRequest req, CancellationToken ct)
    {
        var userIdentity = HttpContext.ToCurrentUser().Identity;

        var newUser = false;
        var user = await dbContext.Set<User>().FirstOrDefaultAsync(user => user.Identity == userIdentity, ct);

        if (user is null)
        {
            logger.LogInformation("User {UserId} does not exist, registering user...", userIdentity);
            newUser = true;
            user = Domain.Users.User.Register(userIdentity, new UserDisplayName(req.DisplayName));
        }

        logger.LogInformation("Registering user...");

        var usersHavingTheSameDevice = await dbContext
            .Set<User>()
            .Where(dbUser => dbUser.Identity != user.Identity)
            .Where(otherUser => otherUser.UserDevices.Any(device => device.DeviceId == req.Device.Id))
            .ToListAsync(ct);

        logger.LogDebug(
            "Found {Count} users with the same device {DeviceId}",
            usersHavingTheSameDevice.Count,
            req.Device.Id);
        usersHavingTheSameDevice.ForEach(conflictingUser => conflictingUser.RemoveDevice(req.Device.Id));

        dbContext.Set<User>().UpdateRange(usersHavingTheSameDevice);

        logger.LogDebug("Updating user info...");
        user.UpdateInfo(new UserDisplayName(req.DisplayName), req.PictureUrl);

        logger.LogInformation(
            "Acknowledging user device {DeviceId} (unique ID: {UniqueId}) using Expo token {ExpoToken}",
            req.Device.Id,
            req.Device.UniquenessNotGuaranteed,
            req.Device.ExpoPushToken);

        var culture = new CultureInfo(req.Device.Locale);
        var timezone = TimeZoneInfo.TryFindSystemTimeZoneById(req.Device.Timezone, out var timeZone)
            ? timeZone
            : TimeZoneInfo.Utc;

        logger.LogDebug("User localization {Locale} {Tz}", culture, timeZone);

        user.AcknowledgeDevice(
            req.Device.Id,
            req.Device.ExpoPushToken,
            req.Device.UniquenessNotGuaranteed,
            culture,
            timezone);

        if (newUser)
        {
            await dbContext.Set<User>().AddAsync(user, ct);
            logger.LogDebug("User {UserId} added to db.", userIdentity);
        }
        else
        {
            dbContext.Set<User>().Update(user);
            logger.LogDebug("User {UserId} updated in db.", userIdentity);
        }

        await dbContext.SaveChangesAsync(ct);

        await SendOkAsync(
            new RegisterUserResponse
            {
                UserId = user.Identity
            },
            ct);
    }
}
