using Api.Common;
using Api.Common.Infrastructure;
using Domain.Users;
using FastEndpoints;
using FluentValidation;
using JetBrains.Annotations;
using Microsoft.EntityFrameworkCore;

namespace Api.Me;

[PublicAPI]
public sealed record LogoutRequest
{
    public required string ExpoToken { get; init; }
}

internal sealed class LogoutValidator : Validator<LogoutRequest>
{
    public LogoutValidator()
    {
        RuleFor(x => x.ExpoToken).NotEmpty();
    }
}

internal sealed class Logout(AppDbContext dbContext) : Endpoint<LogoutRequest>
{
    public override void Configure()
    {
        Post("/@me/logout");
    }

    public override async Task HandleAsync(LogoutRequest req, CancellationToken ct)
    {
        var userIdentity = HttpContext.ToCurrentUser().Identity;
        var user = await dbContext.Set<User>().FirstAsync(user => user.Identity == userIdentity, ct);

        user.RemoveDevice(req.ExpoToken);

        dbContext.Set<User>().Update(user);

        await dbContext.SaveChangesAsync(ct);
    }
}
