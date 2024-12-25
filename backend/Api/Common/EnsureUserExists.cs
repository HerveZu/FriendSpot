using System.Net;
using Api.Common.Infrastructure;
using Api.Me;
using Domain.Users;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace Api.Common;

internal sealed class EnsureUserExists : IGlobalPreProcessor
{
    public async Task PreProcessAsync(IPreProcessorContext context, CancellationToken ct)
    {
        var dbContext = context.HttpContext.Resolve<AppDbContext>();

        // skip checks on register otherwise user is not able to first register
        if (context.HttpContext.Request.Path == Register.Path)
        {
            return;
        }

        var currentUser = context.HttpContext.ToCurrentUserOrAnonymous();

        if (currentUser is null)
        {
            return;
        }

        var userExists = await dbContext.Set<User>()
            .AnyAsync(user => user.Identity == currentUser.Identity, ct);

        if (userExists)
        {
            return;
        }

        await context.HttpContext.Response.SendAsync(
            "User is not registered.",
            (int)HttpStatusCode.Unauthorized,
            cancellation: ct);
    }
}