namespace Api.Tests.TestBench;

internal static class Seed
{
    public static class Users
    {
        public const string ParkingAdmin = "parking-admin-id";
        public const string Resident1 = "parking-resident-1-id";
        public const string Resident2 = "parking-resident-2-id";
        public const string Unknown = "unknown-user-id";
    }

    public static class Parkings
    {
        public static readonly Guid Main = Guid.NewGuid();
    }

    public static class Spots
    {
        public static readonly Guid Admin = Guid.NewGuid();
        public static readonly Guid Resident1 = Guid.NewGuid();
        public static readonly Guid Resident2 = Guid.NewGuid();
    }
}
