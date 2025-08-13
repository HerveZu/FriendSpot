using System.Text.Json.Serialization;
using Api.Common.Options;
using FastEndpoints;
using JetBrains.Annotations;
using Microsoft.Extensions.Options;

namespace Api.DeepLinks;

[PublicAPI]
public sealed record AasaResponse
{
    [JsonPropertyName("applinks")]
    public required ApplinksResponse AppLinks { get; init; }

    [JsonPropertyName("activitycontinuation")]
    public required ActivityContinuationResponse ActivityContinuation { get; init; }

    [JsonPropertyName("webcredentials")]
    public required WebCredentialsResponse WebCredentials { get; init; }

    [PublicAPI]
    public sealed record ApplinksResponse
    {
        public required string[] Apps { get; init; }
        public required DetailResponse[] Details { get; init; }

        [PublicAPI]
        public sealed record DetailResponse
        {
            [JsonPropertyName("appIDs")]
            public required string[] AppIds { get; init; }

            public required string[] Paths { get; init; }
        }
    }

    [PublicAPI]
    public sealed record ActivityContinuationResponse
    {
        public required string[] Apps { get; init; }
    }

    [PublicAPI]
    public sealed record WebCredentialsResponse
    {
        public required string[] Apps { get; init; }
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
        var appIds = options.Value.BundleIds
            .Select(bundleId => $"{options.Value.AppleTeamId}.{bundleId}")
            .ToArray();

        return Task.FromResult(
            new AasaResponse
            {
                AppLinks = new AasaResponse.ApplinksResponse
                {
                    Apps = [],
                    Details =
                    [
                        new AasaResponse.ApplinksResponse.DetailResponse
                        {
                            AppIds = appIds,
                            Paths = DownloadAppRedirect.OpenPaths
                        }
                    ]
                },
                ActivityContinuation = new AasaResponse.ActivityContinuationResponse
                {
                    Apps = appIds
                },
                WebCredentials = new AasaResponse.WebCredentialsResponse
                {
                    Apps = appIds
                }
            });
    }
}
