using Api.Common.Infrastructure;
using Domain;
using Domain.UserProducts;
using Microsoft.EntityFrameworkCore;

namespace Api.Common;

internal interface IUserFeatures
{
    Task<EnabledFeatures> GetEnabled(CancellationToken ct);
    Task<EnabledFeatures> GetEnabledForUser(string userId, CancellationToken ct);
}

internal sealed class UserFeatures(IHttpContextAccessor httpContextAccessor, AppDbContext dbContext) : IUserFeatures
{
    public async Task<EnabledFeatures> GetEnabled(CancellationToken ct)
    {
        if (httpContextAccessor.HttpContext is null)
        {
            throw new InvalidOperationException("HttpContext is null");
        }

        var currentUser = httpContextAccessor.HttpContext.ToCurrentUser();
        var userProducts = await dbContext.Set<UserProduct>()
            .Where(x => x.UserId == currentUser.Identity)
            .ToArrayAsync(ct);

        return new EnabledFeatures(userProducts);
    }

    public async Task<EnabledFeatures> GetEnabledForUser(string userId, CancellationToken ct)
    {
        var userProducts = await dbContext.Set<UserProduct>()
            .Where(x => x.UserId == userId)
            .ToArrayAsync(ct);

        return new EnabledFeatures(userProducts);
    }
}
