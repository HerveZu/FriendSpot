using System.ComponentModel.DataAnnotations;

namespace Api.Common.Options;

internal sealed record AppOptions : IOptions
{
    [Required]
    [ConfigurationKeyName("APPLE_APP_ID")]
    public required string AppleAppId { get; init; }

    [Required]
    [ConfigurationKeyName("APPLE_TEAM_ID")]
    public required string AppleTeamId { get; init; }

    [Required]
    [ConfigurationKeyName("BUNDLE_ID")]
    public required string BundleIdRaw { get; init; }

    [ConfigurationKeyName("SANDBOX_PURCHASES")]
    public required bool SandboxPurchases { get; init; }

    [Required]
    [ConfigurationKeyName("APPLE_CONNECT_API_ISSUER")]
    public required string AppleConnectApiIssuer { get; init; }

    [Required]
    [ConfigurationKeyName("APPLE_CONNECT_API_KEY_ID")]
    public required string AppleConnectApiKeyId { get; init; }

    [Required]
    [ConfigurationKeyName("APPLE_CONNECT_API_PRIVATE_KEY")]
    public required string AppleConnectApiPrivateKey { get; init; }

    [Required]
    [ConfigurationKeyName("GOOGLE_PLAY_API_PRIVATE_KEY")]
    public required string GooglePlayApiPrivateKey { get; init; }

    [Required]
    [ConfigurationKeyName("GOOGLE_PLAY_API_KEY_ID")]
    public required string GooglePlayApiKeyId { get; init; }

    [Required]
    [ConfigurationKeyName("GOOGLE_PLAY_API_CLIENT_EMAIL")]
    public required string GooglePlayApiClientEmail { get; init; }

    [Required]
    [ConfigurationKeyName("GOOGLE_PLAY_SHA256_CERT_FINGERPRINT")]
    public required string GooglePlaySha256CertFingerprint { get; init; }

    public string[] BundleIds => BundleIdRaw.Split(",");
    public string PrimaryBundleId => BundleIds.First();

    public static string Section => "APP";
}
