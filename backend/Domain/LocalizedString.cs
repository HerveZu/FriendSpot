using System.Globalization;

namespace Domain;

using LocalizationInfo = (CultureInfo culture, TimeZoneInfo timeZone);

public sealed record LocalizedString(string Key, LocalizedArg[]? Args = null);

public sealed class LocalizedArg(Func<LocalizationInfo, string> getString)
{
    public static LocalizedArg Date(DateTimeOffset date)
    {
        return new LocalizedArg(x => date
            // convert to timezone local time for user intuitive dates
            .ToOffset(x.timeZone.BaseUtcOffset)
            .ToString("f", x.culture));
    }

    public static LocalizedArg String(string value)
    {
        return new LocalizedArg(x => value.ToString(x.culture));
    }

    public string Localize(LocalizationInfo localizationInfo)
    {
        return getString(localizationInfo);
    }
}
