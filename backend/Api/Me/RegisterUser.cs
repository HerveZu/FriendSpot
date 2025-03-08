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
    }
}

internal sealed class RegisterUser(AppDbContext dbContext) : Endpoint<RegisterUserRequest, RegisterUserResponse>
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
            newUser = true;
            user = Domain.Users.User.Register(userIdentity, new UserDisplayName(req.DisplayName));
        }

        user.UpdateInfo(new UserDisplayName(req.DisplayName), req.PictureUrl);
        user.AcknowledgeDevice(req.Device.Id, req.Device.ExpoPushToken);

        if (newUser)
            await dbContext.Set<User>().AddAsync(user, ct);
        else
            dbContext.Set<User>().Update(user);

        await dbContext.SaveChangesAsync(ct);
    }
}
