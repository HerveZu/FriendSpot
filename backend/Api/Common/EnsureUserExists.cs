using Api.Common.Infrastructure;
using Api.Me;
using Domain;
using Microsoft.EntityFrameworkCore;

namespace Api.Common;

internal sealed class EnsureUserExists(AppDbContext dbContext) : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        if (context.HttpContext.Request.Path == Register.Path)
        {
            return await next(context);
        }

        var currentUser = context.HttpContext.ToCurrentUserOrAnonymous();

        if (currentUser is null)
        {
            return await next(context);
        }

        var userExists = await dbContext.Set<User>()
            .AnyAsync(user => user.Identity == currentUser.Identity);

        if (userExists)
        {
            return await next(context);
        }

        context.HttpContext.Response.StatusCode = 401;
        await context.HttpContext.Response.WriteAsync("User is not registered.");

        return await next(context);
    }
}
