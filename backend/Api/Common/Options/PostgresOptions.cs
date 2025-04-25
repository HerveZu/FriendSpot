using System.ComponentModel.DataAnnotations;

namespace Api.Common.Options;

internal sealed record PostgresOptions : IOptions
{
    [Required]
    [ConfigurationKeyName("CONNECTION_STRING")]
    public required string ConnectionString { get; init; }

    [ConfigurationKeyName("ENABLE_SENSITIVE_DATA_LOGGING")]
    public bool EnableSensitiveDataLogging { get; init; } = false;

    public static string Section => "POSTGRES";
}
