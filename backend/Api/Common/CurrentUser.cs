using Domain;

namespace Api.Common;

internal sealed record CurrentUser(string Identity) : ICurrentUser;

internal static class CurrentUserFactory
{
    public static CurrentUser ToUser(this HttpContext httpContext)
    {
        var userId = httpContext.User.Identity?.Name
                     ?? throw new InvalidOperationException("Claims principal's identity is null");

        return new CurrentUser(userId);
    }
}
