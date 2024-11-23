using Domain;
using JetBrains.Annotations;
using MediatR;

namespace Api.Common;

[UsedImplicitly(ImplicitUseTargetFlags.WithInheritors)]
internal interface IDomainEventHandler<in TEvent> : INotificationHandler<TEvent>
    where TEvent : IDomainEvent;