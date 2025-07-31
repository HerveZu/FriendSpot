using Api.Common.Options;
using FastEndpoints;
using JetBrains.Annotations;
using Microsoft.Extensions.Options;

namespace Api.DeepLinks;

[PublicAPI]
public class DeeplinkRequest
{
    public string? Target { get; set; }
}

internal sealed class DeeplinkRedirect(IOptions<DeeplinkOptions> options, ILogger<DeeplinkRedirect> logger)
    : Endpoint<DeeplinkRequest>
{
    public override void Configure()
    {
        Get("/_open");
        AllowAnonymous();
    }

    public override async Task HandleAsync(DeeplinkRequest req, CancellationToken ct)
    {
        var path = string.IsNullOrWhiteSpace(req.Target) ? "" : req.Target;
        var deeplink = $"{options.Value.TargetScheme}://{path}";

        logger.LogInformation("Redirecting to deeplink {Deeplink}", deeplink);

        // permanent to allow the browser to cache the redirection
        await SendRedirectAsync(deeplink, true, true);
    }
}
