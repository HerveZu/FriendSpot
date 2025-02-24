using Api.Common;
using Api.Common.Infrastructure;
using Domain.Users;
using FastEndpoints;
using JetBrains.Annotations;
using Microsoft.EntityFrameworkCore;

namespace Api.Me;

[PublicAPI]
public sealed record RegisterUserRequest
{
    public required string DisplayName { get; init; }
    public required string? PictureUrl { get; init; }
    public required string ExpoToken { get; init; }
}

[PublicAPI]
public sealed record RegisterUserResponse
{
    public required string UserId { get; init; }
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
            user = Domain.Users.User.Register(userIdentity, req.DisplayName);
        }

        user.UpdateInfo(req.DisplayName, req.PictureUrl);
        user.RegisterDeviceIfNew(req.ExpoToken);

        if (newUser)
        {
            await dbContext.Set<User>().AddAsync(user, ct);
        }
        else
        {
            dbContext.Set<User>().Update(user);
        }

        await dbContext.SaveChangesAsync(ct);
    }
}
