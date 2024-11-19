using Microsoft.EntityFrameworkCore;

namespace Api.Common.Infrastructure;

internal sealed class MigrateDb(AppDbContext dbContext, ILogger<MigrateDb> logger)
    : IStartupService
{
    public async Task Run()
    {
        if (EF.IsDesignTime)
        {
            return;
        }

        logger.LogInformation("Applying migrations...");

        await dbContext.Database.MigrateAsync();

        logger.LogInformation("Migrations have been applied");
    }
}
