using System.Net;
using Api.Tests.TestBench;

namespace Api.Tests;

internal sealed class AuthenticationTests : IntegrationTestsBase
{
    [Test]
    [CancelAfter(10_000)]
    public async Task Request_ShouldReturnUnauthorized_WhenAnonymous(CancellationToken cancellationToken)
    {
        using var client = CreateClient();

        var apiResponse = await client.GetAsync(
            "/@me",
            cancellationToken);

        await apiResponse.AssertIs(HttpStatusCode.Unauthorized, cancellationToken);
    }

    [Test]
    [CancelAfter(10_000)]
    public async Task AuthenticatedRequest_ShouldReturnUnauthorized_WhenUnknownUser(CancellationToken cancellationToken)
    {
        using var client = UserClient(Seed.Users.Unknown);

        var apiResponse = await client.GetAsync(
            "/@me",
            cancellationToken);

        await apiResponse.AssertIs(HttpStatusCode.Unauthorized, cancellationToken);
    }

    [Test]
    [CancelAfter(10_000)]
    public async Task AuthenticatedRequest_ShouldReturnOk_WhenValidUser(CancellationToken cancellationToken)
    {
        using var client = UserClient(Seed.Users.Resident1);

        var apiResponse = await client.GetAsync(
            "/@me",
            cancellationToken);

        await apiResponse.AssertIs(HttpStatusCode.OK, cancellationToken);
    }
}
