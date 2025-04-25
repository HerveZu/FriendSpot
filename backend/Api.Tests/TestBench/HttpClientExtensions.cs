using System.Net.Http.Headers;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Api.Tests.TestBench;

internal static class HttpClientExtensions
{
    public static HttpClient UserClient(
        this WebApplicationFactory<Program> webApplicationFactory,
        string userId)
    {
        var client = webApplicationFactory.CreateClient();

        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue(TestAuthHandler.TestScheme, userId);

        return client;
    }
}
