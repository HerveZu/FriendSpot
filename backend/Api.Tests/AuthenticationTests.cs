using System.Net;
using Api.Tests.TestBench;

namespace Api.Tests;

internal sealed class AuthenticationTests : IntegrationTestsBase
{
    [Test]
    [CancelAfter(10_000)]
    public async Task Request_WhenAnonymous_ShouldReturnUnauthorized(CancellationToken cancellationToken)
    {
        var client = ApplicationFactory.CreateClient();

        var apiResponse = await client.GetAsync(
            "/@me",
            cancellationToken);

        await apiResponse.AssertIs(HttpStatusCode.Unauthorized);
    }

    [Test]
    [CancelAfter(10_000)]
    public async Task AuthenticatedRequest_WhenUnknownUser_ShouldReturnUnauthorized(CancellationToken cancellationToken)
    {
        var client = ApplicationFactory.UserClient(Seed.Users.Unknown);

        var apiResponse = await client.GetAsync(
            "/@me",
            cancellationToken);

        await apiResponse.AssertIs(HttpStatusCode.Unauthorized);
    }

    [Test]
    [CancelAfter(10_000)]
    public async Task AuthenticatedRequest_WhenValidUser_ShouldReturnOk(CancellationToken cancellationToken)
    {
        var client = ApplicationFactory.UserClient(Seed.Users.SpotOwner);

        var apiResponse = await client.GetAsync(
            "/@me",
            cancellationToken);

        await apiResponse.AssertIs(HttpStatusCode.OK);
    }
}
