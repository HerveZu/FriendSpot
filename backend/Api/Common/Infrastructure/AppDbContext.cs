using Api.Common.Options;
using Api.Common.Reflexion;
using Domain;
using EntityFramework.Extensions.AddQueryFilter;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Api.Common.Infrastructure;

internal sealed class AppDbContext(
    IOptions<PostgresOptions> postgresOptions,
    IHttpContextAccessor httpContextAccessor,
    IPublisher publisher
) : DbContext
{
    private string? CurrentUserIdentity => httpContextAccessor.HttpContext?.User.Identity?.Name;

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        optionsBuilder.UseNpgsql(postgresOptions.Value.ConnectionString);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var configurationType = typeof(IEntityConfiguration<>);
        var assembly = configurationType.Assembly;

        modelBuilder.ApplyConfigurationsFromAssembly(
            assembly,
            type => type.IsAssignableToGenericType(configurationType)
        );

        modelBuilder.AddQueryFilterOnAllEntities<IUserResource>(
            entity => entity.UserIdentity == CurrentUserIdentity);

        modelBuilder.UseUtcDateTimeConverter();
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = new ())
    {
        var uncommittedEvents = ChangeTracker.Entries<IBroadcastEvents>()
            .ToArray() // prevent ef error
            .SelectMany(x => x.Entity.GetUncommittedEvents());

        // execute synchronously to avoid db context concurrency errors
        foreach (var @event in uncommittedEvents)
        {
            await publisher.Publish(@event, cancellationToken);
        }

        return await base.SaveChangesAsync(cancellationToken);
    }
}
