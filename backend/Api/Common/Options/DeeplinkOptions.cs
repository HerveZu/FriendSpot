using System.ComponentModel.DataAnnotations;

namespace Api.Common.Options;

internal sealed record DeeplinkOptions : IOptions
{
    [Required]
    [ConfigurationKeyName("TARGET_SCHEME")]
    public required string TargetScheme { get; init; }

    public static string Section => "DEEPLINK";
}
