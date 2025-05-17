using System.Net.Http.Json;
using Api.Bookings;
using Api.Tests.TestBench;
using Microsoft.AspNetCore.WebUtilities;

namespace Api.Tests;

internal sealed class SuggestedSpotsTests : IntegrationTestsBase
{
    [Test]
    [CancelAfter(10_000)]
    public async Task GetSuggestedSpots_ShouldReturnAllAvailableSpots_WhenDurationIsMoreThanAnHour(
        CancellationToken cancellationToken)
    {
        using var resident1 = UserClient(Seed.Users.Resident1);
        using var resident2 = UserClient(Seed.Users.Resident2);

        var now = DateTimeOffset.Now;

        await Task.WhenAll(
            // short
            (await resident1.PostAsync(
                "/spots/availabilities",
                JsonContent.Create(
                    new MakeMySpotAvailableRequest
                    {
                        From = now.AddHours(1),
                        To = now.AddHours(1.5)
                    }),
                cancellationToken)).AssertIsSuccessful(cancellationToken),
            // just enough
            (await resident1.PostAsync(
                "/spots/availabilities",
                JsonContent.Create(
                    new MakeMySpotAvailableRequest
                    {
                        From = now.AddHours(2),
                        To = now.AddHours(3)
                    }),
                cancellationToken)).AssertIsSuccessful(cancellationToken),
            // long
            (await resident1.PostAsync(
                "/spots/availabilities",
                JsonContent.Create(
                    new MakeMySpotAvailableRequest
                    {
                        From = now.AddHours(5),
                        To = now.AddHours(8)
                    }),
                cancellationToken)).AssertIsSuccessful(cancellationToken));

        var suggestedSpotsResponse = await resident2.GetAsync(
            QueryHelpers.AddQueryString(
                "/spots/suggested",
                new Dictionary<string, string?>
                {
                    { "from", DateTimeOffset.Now.ToString("O") },
                    { "to", DateTimeOffset.Now.AddDays(1).ToString("O") }
                }),
            cancellationToken);

        await suggestedSpotsResponse.AssertIsSuccessful(cancellationToken);
        var suggestedSpots =
            await suggestedSpotsResponse.Content.ReadFromJsonAsync<GetSuggestedSpotsResponse>(cancellationToken);

        Assert.That(suggestedSpots, Is.Not.Null);
        Assert.That(suggestedSpots.Suggestions, Is.Not.Empty);
        Assert.That(suggestedSpots.Suggestions, Has.Length.EqualTo(2));
        Assert.Multiple(
            () =>
            {
                Assert.That(suggestedSpots.Suggestions[0].Duration, Is.EqualTo(TimeSpan.FromHours(1)));
                Assert.That(suggestedSpots.Suggestions[1].Duration, Is.EqualTo(TimeSpan.FromHours(3)));
            });
    }

    [Test]
    [CancelAfter(10_000)]
    public async Task GetSuggestedSpots_ShouldReturnSpot_WhenOverlappingLookupWindow(
        CancellationToken cancellationToken)
    {
        using var resident1 = UserClient(Seed.Users.Resident1);
        using var resident2 = UserClient(Seed.Users.Resident2);

        var now = DateTimeOffset.Now;

        await (await resident1.PostAsync(
                "/spots/availabilities",
                JsonContent.Create(
                    new MakeMySpotAvailableRequest
                    {
                        From = now.AddHours(1),
                        To = now.AddHours(36)
                    }),
                cancellationToken))
            .AssertIsSuccessful(cancellationToken);

        var suggestedSpotsResponse = await resident2.GetAsync(
            QueryHelpers.AddQueryString(
                "/spots/suggested",
                new Dictionary<string, string?>
                {
                    { "from", DateTimeOffset.Now.ToString("O") },
                    { "to", DateTimeOffset.Now.AddDays(1).ToString("O") }
                }),
            cancellationToken);

        await suggestedSpotsResponse.AssertIsSuccessful(cancellationToken);
        var suggestedSpots =
            await suggestedSpotsResponse.Content.ReadFromJsonAsync<GetSuggestedSpotsResponse>(cancellationToken);

        Assert.That(suggestedSpots, Is.Not.Null);
        Assert.That(suggestedSpots.Suggestions, Is.Not.Empty);
        Assert.That(suggestedSpots.Suggestions, Has.Length.EqualTo(1));
        Assert.That(suggestedSpots.Suggestions[0].Duration, Is.EqualTo(TimeSpan.FromHours(35)));
    }
}
