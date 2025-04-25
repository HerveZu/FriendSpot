using System.Net;
using Api.Tests.TestBench;

namespace Api.Tests;

internal sealed class AuthenticationTests : IntegrationTestsBase
{
    [Test]
    [CancelAfter(10_000)]
    public async Task Request__WhenAnonymous__ShouldReturnUnauthorized(CancellationToken cancellationToken)
    {
        var client = ApplicationFactory.CreateClient();

        var apiResponse = await client.GetAsync(
            "/@me",
            cancellationToken);

        await apiResponse.AssertIs(HttpStatusCode.Unauthorized);
    }

    [Test]
    [CancelAfter(10_000)]
    public async Task AuthenticatedRequest__WhenUnknownUser__ShouldReturnUnauthorized(
        CancellationToken cancellationToken)
    {
        var client = ApplicationFactory.UserClient(Users.Unknown);

        var apiResponse = await client.GetAsync(
            "/@me",
            cancellationToken);

        await apiResponse.AssertIs(HttpStatusCode.Unauthorized);
    }

    [Test]
    [CancelAfter(10_000)]
    public async Task AuthenticatedRequest__WhenValidUser__ShouldReturnOk(CancellationToken cancellationToken)
    {
        var client = ApplicationFactory.UserClient(Users.Valid);

        var apiResponse = await client.GetAsync(
            "/@me",
            cancellationToken);

        await apiResponse.AssertIs(HttpStatusCode.OK);
    }
}
