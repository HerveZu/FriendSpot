using Domain;

namespace Api.Common;

internal sealed record CurrentUser(string Identity) : ICurrentUser;

internal static class CurrentUserFactory
{
    public static CurrentUser ToUser(this IHttpContextAccessor httpContextAccessor)
    {
        var httpContext = httpContextAccessor.HttpContext ?? throw new InvalidOperationException("No http context");

        var userId = httpContext.User.Identity?.Name
                     ?? throw new InvalidOperationException("Claims principal's identity is null");

        return new CurrentUser(userId);
    }
}
