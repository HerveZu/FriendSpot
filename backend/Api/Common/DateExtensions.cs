namespace Api.Common;

internal static class DateExtensions
{
    public static DateTimeOffset Max(DateTimeOffset a, DateTimeOffset b)
    {
        return a > b ? a : b;
    }
}