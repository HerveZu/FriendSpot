namespace Api.Common;

internal sealed record CurrentUser(string Identity);

internal static class CurrentUserFactory
{
    public static CurrentUser? ToCurrentUserOrAnonymous(this HttpContext httpContext)
    {
        var userId = httpContext.User.Identity?.Name;

        return userId is null ? null : new CurrentUser(userId);
    }

    public static CurrentUser ToCurrentUser(this HttpContext httpContext)
    {
        return httpContext.ToCurrentUserOrAnonymous()
                     ?? throw new InvalidOperationException("Claims principal's identity is null");
    }
}
