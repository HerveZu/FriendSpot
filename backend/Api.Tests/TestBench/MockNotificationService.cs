using Api.Common.Notifications;
using Domain.Users;

namespace Api.Tests.TestBench;

internal sealed class MockNotificationService : INotificationPushService
{
    public Task PushToUser(User user, Notification notification, CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }
}
