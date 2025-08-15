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
                    Relations = ["delegate_permission/common.handle_all_urls"],
                    Target = new AssetLinksResponse.TargetResponse
                    {
                        Namespace = "android_app"
                    }
                }
            });
    }
}
