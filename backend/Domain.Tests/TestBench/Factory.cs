using System.Reflection;
using Domain.Parkings;
using Domain.ParkingSpots;

namespace Domain.Tests.TestBench;

/// <summary>
/// Factory that mimics the DbContext which uses the private ctor
/// </summary>
internal sealed class Factory
{
    public static ParkingSpotBooking ParkingSpotBooking(
        Guid id,
        string bookingUserId,
        DateTimeOffset from,
        DateTimeOffset to,
        BookRating? rating = null)
    {
        return ActivateNonPublic<ParkingSpotBooking>(
            id,
            bookingUserId,
            from,
            to,
            rating);
    }

    public static ParkingSpotAvailability ParkingSpotAvailability(
        Guid id,
        DateTimeOffset from,
        DateTimeOffset to)
    {
        return ActivateNonPublic<ParkingSpotAvailability>(id, from, to)!;
    }

    public static ParkingSpot ParkingSpot(
        Guid id,
        string ownerId,
        Guid parkingId,
        SpotName spotName,
        List<ParkingSpotBooking>? bookings = null,
        List<ParkingSpotAvailability>? availabilities = null)
    {
        return ActivateNonPublic<ParkingSpot>(id, ownerId, parkingId, spotName, bookings, availabilities);
    }

    public static Parking Parking(
        Guid id,
        string ownerId,
        ParkingName name,
        ParkingAddress address,
        List<ParkingBookingRequest>? bookingRequests = null)
    {
        return ActivateNonPublic<Parking>(id, ownerId, name, address, bookingRequests);
    }

    private static T ActivateNonPublic<T>(params object?[] parameters)
    {
        return (T)Activator.CreateInstance(
            typeof(T),
            BindingFlags.Instance | BindingFlags.NonPublic,
            null,
            parameters,
            null,
            null)!;
    }
}
