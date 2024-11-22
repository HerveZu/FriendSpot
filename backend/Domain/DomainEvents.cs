using FastEndpoints;

namespace Domain;

public interface IBroadcastEvents
{
    DomainEvents DomainEvents { get; }
}

public sealed class DomainEvents
{
    private readonly List<IEvent> _domainEvents = [];

    public IEnumerable<IEvent> UncommittedEvents => _domainEvents.ToArray();

    public void Register(IEvent @event)
    {
        _domainEvents.Add(@event);
    }
}
