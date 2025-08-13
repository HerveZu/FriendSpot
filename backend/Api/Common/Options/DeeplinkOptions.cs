using System.ComponentModel.DataAnnotations;

namespace Api.Common.Options;

internal sealed record DeeplinkOptions : IOptions
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

    public string[] BundleIds => BundleIdRaw.Split(",");

    public static string Section => "DEEPLINK";
}
