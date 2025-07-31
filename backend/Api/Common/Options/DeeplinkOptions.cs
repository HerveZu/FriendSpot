namespace Api.Common.Options;

internal sealed record DeeplinkOptions : IOptions
{
    [ConfigurationKeyName("TARGET_SCHEME")]
    public required string TargetScheme { get; init; }

    public static string Section => "DEEPLINK";
}
