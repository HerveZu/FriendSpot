namespace Api.Common.Options;

internal sealed record CorsOptions : IOptions
{
    [ConfigurationKeyName("ALLOWED_ORIGINS")]
    private string AllowedOriginsRaw { get; } = string.Empty;

    public string[] AllowedOrigins => AllowedOriginsRaw.Split(',', StringSplitOptions.RemoveEmptyEntries);

    public static string Section => "CORS";
}
