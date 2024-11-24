using Api.Common;
using Api.Common.Infrastructure;
using Domain.Users;
using FastEndpoints;
using JetBrains.Annotations;
using Microsoft.EntityFrameworkCore;

namespace Api.Me;

[PublicAPI]
public sealed record RegisterResponse
{
    public required string UserId { get; init; }
}

internal sealed class Register(AppDbContext dbContext) : EndpointWithoutRequest<RegisterResponse>
{
    public const string Path = "/@me/register";

    public override void Configure()
    {
        Post(Path);
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var userIdentity = HttpContext.ToCurrentUser().Identity;

        if (await dbContext.Set<User>().AnyAsync(user => user.Identity == userIdentity, ct))
        {
            ThrowError("User already exists.");
            return;
        }

        var user = Domain.Users.User.Register(HttpContext.ToCurrentUser().Identity);

        await dbContext.Set<User>().AddAsync(user, ct);
        await dbContext.SaveChangesAsync(ct);
    }
}