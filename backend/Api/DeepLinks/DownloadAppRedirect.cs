using System.Text;
using Api.Common.Options;
using FastEndpoints;
using HtmlAgilityPack;
using Microsoft.Extensions.Options;

namespace Api.DeepLinks;

internal sealed class DownloadAppRedirect(IOptions<DeeplinkOptions> options, ILogger<DownloadAppRedirect> logger)
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
            logger.LogDebug("User-Agent {UserAgent} not recognized, falling back to the AppStore", userAgent);
            appUrl = $"https://itunes.apple.com/app/id{options.Value.AppleAppId}";
        }

        logger.LogInformation("Scrapping HTML metadata tags from {Target} to forward", appUrl);
        using var client = new HttpClient();
        var targetResponse = await client.GetAsync(appUrl, ct);

        if (!targetResponse.IsSuccessStatusCode)
        {
            logger.LogWarning("Failed to fetch HTML metadata, falling back to a standard redirection");
            await SendRedirectAsync(appUrl, false, true);
            return;
        }

        var html = await targetResponse.Content.ReadAsStringAsync(ct);
        var htmlDocument = new HtmlDocument();
        htmlDocument.LoadHtml(html);
        var metaTags = htmlDocument.DocumentNode.SelectNodes("//meta");

        await SendBytesAsync(
            Encoding.UTF8.GetBytes(
                $"""
                 <!DOCTYPE html>
                 <html>
                 <head>
                     {string.Join('\n', metaTags.Select(tag => tag.OuterHtml))}
                   
                     <meta http-equiv="refresh" content="1;url={appUrl}" />
                 </head>
                 <body>
                   <p>Redirecting...</p>
                 </body>
                 </html>
                 """),
            contentType: "text/html; charset=utf-8",
            cancellation: ct);
    }
}
