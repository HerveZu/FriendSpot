using Api.Common;
using Api.Common.Infrastructure;
using Domain.Users;
using FastEndpoints;

namespace Api.Me;

internal sealed class DeleteAccount(AppDbContext dbContext, ILogger<DeleteAccount> logger) : EndpointWithoutRequest
{
    public override void Configure()
    {
        Delete("/@me");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var currentUser = HttpContext.ToCurrentUser();
        var me = await dbContext.Set<User>()
            .FindAsync([currentUser.Identity], ct);

        if (me is null)
        {
            ThrowError("User has already been deleted.");
            return;
        }

        logger.LogInformation("Marking user account with id {UserId} deleted", currentUser.Identity);
        me.MarkDeleted();

        dbContext.Set<User>().Update(me);
        await dbContext.SaveChangesAsync(ct);
    }
}
