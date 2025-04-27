using System.Net;

namespace Api.Tests.TestBench;

internal static class HttpAssertions
{
    public static async Task AssertIsSuccessful(
        this HttpResponseMessage message,
        CancellationToken cancellationToken = default)
    {
        if (message.IsSuccessStatusCode)
        {
            Assert.Pass();
            return;
        }

        await TestContext.Error.WriteLineAsync(await message.Content.ReadAsStringAsync(cancellationToken));
        Assert.That(
            () => message.IsSuccessStatusCode,
            $"Expected successful HTTP status code, was {message.StatusCode}");
    }

    public static async Task AssertIs(
        this HttpResponseMessage message,
        HttpStatusCode expectedStatusCode,
        CancellationToken cancellationToken = default)
    {
        if (message.StatusCode == expectedStatusCode)
        {
            Assert.Pass();
            return;
        }

        await TestContext.Error.WriteLineAsync(await message.Content.ReadAsStringAsync(cancellationToken));
        Assert.Fail($"Expected HTTP status code {expectedStatusCode}, was {message.StatusCode}");
    }
}
