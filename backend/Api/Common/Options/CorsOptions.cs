namespace Api.Common.Options;

internal sealed record CorsOptions : IOptions
{
    [ConfigurationKeyName("ALLOWED_ORIGINS")]
    // ReSharper disable once MemberCanBePrivate.Global
    // ReSharper disable once AutoPropertyCanBeMadeGetOnly.Global
    public string AllowedOriginsRaw { get; init; } = string.Empty;

    public string[] AllowedOrigins => AllowedOriginsRaw.Split(',', StringSplitOptions.RemoveEmptyEntries);

    public static string Section => "CORS";
}