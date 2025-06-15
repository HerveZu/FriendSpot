using MediatR;

namespace Domain;

public interface IDomainEvent : INotification;

public interface IAggregateRoot
{
    IEnumerable<IDomainEvent> GetUncommittedEvents();
}

public sealed class DomainEvents
{
    private readonly Queue<IDomainEvent> _domainEvents = [];

    public void RegisterNext(IDomainEvent @event)
    {
        _domainEvents.Enqueue(@event);
    }

    public IEnumerable<IDomainEvent> GetUncommittedEvents()
    {
        while (_domainEvents.Count > 0)
        {
            yield return _domainEvents.Dequeue();
        }
    }
}
