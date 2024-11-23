using MediatR;

namespace Domain;

public interface IDomainEvent : INotification;

public interface IBroadcastEvents
{
    IEnumerable<IDomainEvent> GetUncommittedEvents();
}

public sealed class DomainEvents
{
    private readonly List<IDomainEvent> _domainEvents = [];

    public void Register(IDomainEvent @event)
    {
        _domainEvents.Add(@event);
    }

    public IEnumerable<IDomainEvent> GetUncommittedEvents()
    {
        var events = _domainEvents.ToArray();
        _domainEvents.Clear();

        return events;
    }
}