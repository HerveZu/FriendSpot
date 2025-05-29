using System.Net;
using System.Net.Http.Json;

namespace Api.Tests.TestBench;

internal static class HttpAssertions
{
    public static async Task<TResponse> AssertIsSuccessful<TResponse>(
        this HttpResponseMessage message,
        CancellationToken cancellationToken = default)
    {
        await AssertIsSuccessful(message, cancellationToken);

        var response = await message.Content.ReadFromJsonAsync<TResponse>(cancellationToken);
        Assert.That(response, Is.Not.Null);

        return response;
    }

    public static async Task AssertIsSuccessful(
        this HttpResponseMessage message,
        CancellationToken cancellationToken = default)
    {
        if (message.IsSuccessStatusCode)
        {
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
            return;
        }

        await TestContext.Error.WriteLineAsync(await message.Content.ReadAsStringAsync(cancellationToken));
        Assert.Fail($"Expected HTTP status code {expectedStatusCode}, was {message.StatusCode}");
    }
}
