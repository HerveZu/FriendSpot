using System.Globalization;

namespace Domain;

public sealed record LocalizedString(string Key, LocalizedArg[]? Args = null);

public sealed class LocalizedArg(Func<CultureInfo, string> getString)
{
    public static LocalizedArg Date(DateTimeOffset date)
    {
        return new LocalizedArg(culture => date.ToString("f", culture));
    }

    public static LocalizedArg String(string value)
    {
        return new LocalizedArg(value.ToString);
    }

    public string Localize(CultureInfo cultureInfo)
    {
        return getString(cultureInfo);
    }
}
