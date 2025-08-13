using Api.Common.Options;
using FastEndpoints;
using JetBrains.Annotations;
using Microsoft.Extensions.Options;

namespace Api.DeepLinks;

[PublicAPI]
public sealed record AasaResponse
{
    public required SiteApplinks Applinks { get; init; }

    [PublicAPI]
    public sealed record SiteApplinks
    {
        public required string[] Apps { get; init; }
        public required Detail[] Details { get; init; }

        [PublicAPI]
        public sealed record Detail
        {
            public required string AppId { get; init; }
            public required string[] Paths { get; init; }
        }
    }
}

internal sealed class AppleAasa(IOptions<DeeplinkOptions> options) : EndpointWithoutRequest<AasaResponse>
{
    public override void Configure()
    {
        AllowAnonymous();
        Get("/.well-known/apple-app-site-association");
    }

    public override Task<AasaResponse> ExecuteAsync(CancellationToken ct)
    {
        return Task.FromResult(
            new AasaResponse
            {
                Applinks = new AasaResponse.SiteApplinks
                {
                    Apps = [],
                    Details =
                    [
                        new AasaResponse.SiteApplinks.Detail
                        {
                            AppId = $"{options.Value.AppleTeamId}.{options.Value.BundleId}",
                            Paths = DownloadAppRedirect.OpenPaths
                        }
                    ]
                }
            });
    }
}
