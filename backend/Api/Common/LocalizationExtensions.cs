using System.Globalization;
using System.Resources;
using LocalizedString = Domain.LocalizedString;

namespace Api.Common;

public static class LocalizationExtensions
{
    public static string Translate(
        this LocalizedString localizedString,
        ResourceManager resourceManager,
        CultureInfo culture,
        TimeZoneInfo timeZoneInfo)
    {
        var translation = resourceManager.GetString(localizedString.Key, culture) ?? localizedString.Key;

        return string.Format(
            culture,
            translation,
            localizedString.Args?.Select(arg => arg.Localize((culture, timeZoneInfo))).ToArray<object?>() ?? []);
    }
}
