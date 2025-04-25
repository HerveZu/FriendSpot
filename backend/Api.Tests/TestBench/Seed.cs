namespace Api.Tests.TestBench;

internal static class Seed
{
    public static class Users
    {
        public const string SpotOwner = "parking-owner-user-id";
        public const string Other = "other-user-id";
        public const string Unknown = "unknown-user-id";
    }

    public static class Parkings
    {
        public static readonly Guid Main = Guid.NewGuid();
    }

    public static class Spots
    {
        public static readonly Guid Main = Guid.NewGuid();
    }
}
