using Api.Common.Infrastructure;

namespace Api.Common;

internal sealed class RunInTransaction(AppDbContext dbContext) : IEndpointFilter
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
        catch
        {
            await dbContext.Database.RollbackTransactionAsync();
            throw;
        }
    }
}