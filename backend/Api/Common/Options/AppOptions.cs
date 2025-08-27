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
    [ConfigurationKeyName("ANDROID_SHA256_CERT_FINGERPRINT")]
    public required string AndroidSha256CertFingerprint { get; init; }

    public string[] BundleIds => BundleIdRaw.Split(",");

    public static string Section => "APP";
}
