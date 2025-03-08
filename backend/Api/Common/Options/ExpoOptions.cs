using System.ComponentModel.DataAnnotations;

namespace Api.Common.Options;

internal sealed class ExpoOptions : IOptions
{
    [Required]
    [ConfigurationKeyName("PUSH_NOTIFICATION_TOKEN")]
    public required string PushNotificationToken { get; init; }

    public static string Section => "EXPO";
}
