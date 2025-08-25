using Api.Common.Options;
using FastEndpoints;
using Microsoft.Extensions.Options;

namespace Api.DeepLinks;

internal sealed class DownloadAppRedirect(IOptions<AppOptions> options, ILogger<DownloadAppRedirect> logger)
    : EndpointWithoutRequest
{
    private const string OpenPath = "/_open";
    public static readonly string[] OpenPaths = [OpenPath, Path.Join(OpenPath, "*")];

    public override void Configure()
    {
        Get(OpenPaths.Select(path => path.Replace("*", "{*path}")).ToArray());
        AllowAnonymous();
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var userAgent = HttpContext.Request.Headers.UserAgent.ToString();
        string[] iosPatterns = ["iphone", "ipad", "ipod"];
        string[] androidPatterns = ["android"];

        string? appUrl = null;
        if (iosPatterns.Any(pattern =>
                userAgent.Contains(pattern, StringComparison.InvariantCultureIgnoreCase)))
        {
            appUrl = $"https://itunes.apple.com/app/id{options.Value.AppleAppId}";
        }

        if (androidPatterns.Any(pattern =>
                userAgent.Contains(pattern, StringComparison.InvariantCultureIgnoreCase)))
        {
            appUrl = $"https://play.google.com/store/apps/details?id={options.Value.BundleIds.First()}";
        }

        if (appUrl is null)
        {
            ThrowError("Could not determine what device platform is used from the User-Agent header.");
            return;
        }

        logger.LogInformation("Redirecting to app url for download {AppUrl}", appUrl);

        await SendRedirectAsync(appUrl, false, true);
    }
}
