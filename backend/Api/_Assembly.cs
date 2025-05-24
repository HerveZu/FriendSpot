using System.Runtime.CompilerServices;
using JetBrains.Annotations;

[assembly: InternalsVisibleTo("Api.Tests")]
[assembly: InternalsVisibleTo("DynamicProxyGenAssembly2")]

namespace Api;

// marker class, needs to stay in the Api namespace
[UsedImplicitly]
public sealed class NotificationResources;