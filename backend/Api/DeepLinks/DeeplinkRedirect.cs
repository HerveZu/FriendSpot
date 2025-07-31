using FastEndpoints;
using JetBrains.Annotations;

namespace Api.DeepLinks;

[PublicAPI]
public class DeeplinkRequest
{
    public string? Target { get; set; }
}

public sealed class DeeplinkRedirect(ILogger<DeeplinkRedirect> logger) : Endpoint<DeeplinkRequest>
{
    public override void Configure()
    {
        Get("/_open");
        AllowAnonymous();
    }

    public override Task HandleAsync(DeeplinkRequest req, CancellationToken ct)
    {
        var path = string.IsNullOrWhiteSpace(req.Target) ? "" : req.Target;
        var deeplink = $"friendspot://{path}";

        logger.LogInformation("Redirecting to deeplink {Deeplink}", deeplink);

        // permanent to allow the browser to cache the redirection
        HttpContext.Response.Redirect(deeplink, true);

        return Task.CompletedTask;
    }
}
