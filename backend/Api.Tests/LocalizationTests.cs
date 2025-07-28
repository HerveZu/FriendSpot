using System.Globalization;
using System.Resources;
using Api.Common;
using Domain;
using NSubstitute;

namespace Api.Tests;

[TestFixture]
public sealed class LocalizationTests
{
    [TestCase("Europe/Zurich", 1)]
    [TestCase("Australia/Sydney", 10)]
    [TestCase("Europe/London", 0)]
    public void Translate_DateArg_ShouldUseTimezoneOffset(string tz, int offsetWinterTime)
    {
        var culture = CultureInfo.InvariantCulture;
        var resourceManager = Substitute.For<ResourceManager>();
        var timeZoneInfo = TimeZoneInfo.FindSystemTimeZoneById(tz);

        resourceManager.GetString(Arg.Any<string>(), culture).Returns(null as string);

        var timeInWinterUtc = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        var localizedString = new LocalizedString("{0}", [LocalizedArg.Date(timeInWinterUtc)]);
        var localizedDate = localizedString.Translate(resourceManager, culture, timeZoneInfo);

        Assert.That((DateTime.Parse(localizedDate) - timeInWinterUtc).TotalHours, Is.EqualTo(offsetWinterTime));
    }
}
