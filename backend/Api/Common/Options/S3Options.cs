using System.ComponentModel.DataAnnotations;

namespace Api.Common.Options;

internal sealed class S3Options : IOptions
{
    [Required]
    [ConfigurationKeyName("BUCKET_NAME")]
    public required string BucketName { get; init; }

    [Required]
    [ConfigurationKeyName("REGION")]
    public required string Region { get; init; }

    [Required]
    [ConfigurationKeyName("ACCESS_KEY_ID")]
    public required string AccessKeyId { get; init; }

    [Required]
    [ConfigurationKeyName("ACCESS_KEY_SECRET")]
    public required string AccessKeySecret { get; init; }

    public static string Section => "S3";
}