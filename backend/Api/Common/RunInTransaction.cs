using Api.Common.Infrastructure;

namespace Api.Common;

internal sealed class RunInTransaction(AppDbContext dbContext, ILogger<RunInTransaction> logger) : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        await dbContext.Database.BeginTransactionAsync();

        try
        {
            var result = await next(context);
            await dbContext.Database.CommitTransactionAsync();

            return result;
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Exception inside transaction scope, rolling back...");
            await dbContext.Database.RollbackTransactionAsync();

            throw;
        }
    }
}
