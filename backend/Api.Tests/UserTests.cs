using System.Net;
using Api.Tests.TestBench;

namespace Api.Tests;

internal sealed class UserTests : IntegrationTestsBase
{
    [Test]
    [CancelAfter(60_000)]
    public async Task ViewMe_HappyPath(CancellationToken cancellationToken)
    {
        var client = ApplicationFactory.UserClient(Seed.Users.Resident1);

        var me = await client.GetAsync(
            "/@me",
            cancellationToken);

        await me.AssertIs(HttpStatusCode.OK, cancellationToken);
    }
}
