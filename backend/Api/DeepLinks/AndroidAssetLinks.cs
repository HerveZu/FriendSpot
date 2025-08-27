using System.Text.Json.Serialization;
using FastEndpoints;
using JetBrains.Annotations;

namespace Api.DeepLinks;

[PublicAPI]
public sealed record AssetLinksResponse
{
    public required string[] Relations { get; init; }
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

internal sealed class AndroidAssetLinks
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
            new[]
            {
                new AssetLinksResponse
                {
                    Relations =
                    [
                        "delegate_permission/common.handle_all_urls",
                        "delegate_permission/common.get_login_creds"
                    ],
                    Target = new AssetLinksResponse.TargetResponse
                    {
                        Namespace = "android_app",
                        PackageName = "com.friendspot",
                        Sha256CertFingerprints =
                        [
                            "15:9D:D8:54:A8:BB:13:6C:A8:A1:3C:1E:58:1C:CE:57:3F:3B:CD:31:65:E0:05:53:BB:40:1F:3C:4B:D0:DE:8C"
                        ]
                    }
                }
            });
    }
}
