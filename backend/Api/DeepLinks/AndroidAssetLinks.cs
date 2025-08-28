using System.Text.Json.Serialization;
using Api.Common.Options;
using FastEndpoints;
using JetBrains.Annotations;
using Microsoft.Extensions.Options;

namespace Api.DeepLinks;

[PublicAPI]
public sealed record AssetLinksResponse
{
    public required string[] Relation { get; init; }
    public required TargetResponse Target { get; init; }

    [PublicAPI]
    public sealed record TargetResponse
    {
        public required string Namespace { get; init; }

        [JsonPropertyName("package_name")]
        public required string PackageName { get; init; }

        [JsonPropertyName("sha256_cert_fingerprints")]
        public required string[] Sha256CertFingerprints { get; init; }
    }
}

internal sealed class AndroidAssetLinks(IOptions<AppOptions> options)
    : EndpointWithoutRequest<AssetLinksResponse[]>
{
    public override void Configure()
    {
        AllowAnonymous();
        Get("/.well-known/assetlinks.json");
    }

    public override Task<AssetLinksResponse[]> ExecuteAsync(CancellationToken ct)
    {
        return Task.FromResult(
            options.Value.BundleIds.Select(bundleId => new AssetLinksResponse
                {
                    Relation =
                    [
                        "delegate_permission/common.handle_all_urls",
                        "delegate_permission/common.get_login_creds"
                    ],
                    Target = new AssetLinksResponse.TargetResponse
                    {
                        Namespace = "android_app",
                        PackageName = bundleId,
                        Sha256CertFingerprints = [options.Value.GooglePlaySha256CertFingerprint]
                    }
                })
                .ToArray());
    }
}
