using Domain.ParkingSpots;

namespace Domain.Tests.ParkingSpots;

[TestFixture]
[TestOf(typeof(ParkingSpot))]
public sealed class ParkingSpotTests
{
    [Test]
    public void Define_ShouldCreateNewParkingSpot()
    {
        // Arrange
        const string ownerId = "owner-123";
        var parkingId = Guid.NewGuid();
        const string spotName = "Spot A";

        // Act
        var parkingSpot = ParkingSpot.Define(ownerId, parkingId, spotName);

        // Assert
        Assert.Multiple(
            () =>
            {
                Assert.That(parkingSpot.Id, Is.Not.EqualTo(Guid.Empty));
                Assert.That(parkingSpot.OwnerId, Is.EqualTo(ownerId));
                Assert.That(parkingSpot.ParkingId, Is.EqualTo(parkingId));
                Assert.That((string)parkingSpot.SpotName, Is.EqualTo(spotName.ToUpper()));
            });
    }

    [Test]
    public void ChangeSpotName_ShouldUpdateSpotNameAndParkingId()
    {
        // Arrange
        var parkingSpot = ParkingSpot.Define("owner-123", Guid.NewGuid(), "Spot A");
        var newParkingId = Guid.NewGuid();
        const string newSpotName = "Spot B";

        // Act
        parkingSpot.ChangeSpotName(newParkingId, newSpotName);

        // Assert
        Assert.Multiple(
            () =>
            {
                Assert.That(parkingSpot.ParkingId, Is.EqualTo(newParkingId));
                Assert.That(parkingSpot.SpotName.Name, Is.EqualTo(newSpotName.ToUpper()));
            });
    }

    [Test]
    public void Book_ShouldThrow_WhenSpotIsDisabled()
    {
        // Arrange
        var parkingSpot = ParkingSpot.Define("owner-123", Guid.NewGuid(), "Spot A");
        parkingSpot.Disable();

        // Act & Assert
        var exception = Assert.Throws<BusinessException>(
            () =>
                parkingSpot.Book("user-123", DateTimeOffset.UtcNow.AddDays(1), TimeSpan.FromHours(2)));
        Assert.That(exception?.Code, Is.EqualTo("ParkingSpot.Disabled"));
    }

    [Test]
    public void Book_ShouldThrow_WhenBookingOwnSpot()
    {
        // Arrange
        var parkingSpot = ParkingSpot.Define("owner-123", Guid.NewGuid(), "Spot A");

        // Act & Assert
        var exception = Assert.Throws<BusinessException>(
            () =>
                parkingSpot.Book("owner-123", DateTimeOffset.UtcNow.AddDays(1), TimeSpan.FromHours(2)));
        Assert.That(exception?.Code, Is.EqualTo("ParkingSpot.InvalidBooking"));
    }

    [Test]
    public void Book_ShouldThrow_WhenBookingInPast()
    {
        // Arrange
        var parkingSpot = ParkingSpot.Define("owner-123", Guid.NewGuid(), "Spot A");

        // Act & Assert
        var exception = Assert.Throws<BusinessException>(
            () =>
                parkingSpot.Book("user-123", DateTimeOffset.UtcNow.AddDays(-1), TimeSpan.FromHours(2)));
        Assert.That(exception?.Code, Is.EqualTo("ParkingSpot.InvalidBooking"));
    }

    [Test]
    public void Book_ShouldThrow_WhenDurationIsNotPositive()
    {
        // Arrange
        var parkingSpot = ParkingSpot.Define("owner-123", Guid.NewGuid(), "Spot A");

        // Act & Assert
        var exception = Assert.Throws<BusinessException>(
            () =>
                parkingSpot.Book("user-123", DateTimeOffset.UtcNow.AddDays(1), TimeSpan.Zero));
        Assert.That(exception?.Code, Is.EqualTo("ParkingSpot.InvalidBooking"));
    }

    [Test]
    public void MakeAvailable_ShouldThrow_WhenSpotIsDisabled()
    {
        // Arrange
        var parkingSpot = ParkingSpot.Define("owner-123", Guid.NewGuid(), "Spot A");
        parkingSpot.Disable();

        // Act & Assert
        var exception = Assert.Throws<BusinessException>(
            () =>
                parkingSpot.MakeAvailable(DateTimeOffset.UtcNow.AddDays(1), DateTimeOffset.UtcNow.AddDays(2)));
        Assert.That(exception?.Code, Is.EqualTo("ParkingSpot.Disabled"));
    }

    [Test]
    public void RateBooking_ShouldThrow_WhenBookingNotFound()
    {
        // Arrange
        var parkingSpot = ParkingSpot.Define("owner-123", Guid.NewGuid(), "Spot A");

        // Act & Assert
        var exception = Assert.Throws<BusinessException>(
            () =>
                parkingSpot.RateBooking("user-123", Guid.NewGuid(), BookRating.Good));
        Assert.That(exception?.Code, Is.EqualTo("ParkingSpot.BookingNotFound"));
    }

    [Test]
    public void RateBooking_ShouldThrow_WhenRatingAnotherUsersBooking()
    {
        // Arrange
        var parkingSpot = ParkingSpot.Define("owner-123", Guid.NewGuid(), "Spot A");
        parkingSpot.MakeAvailable(DateTimeOffset.UtcNow.AddMinutes(1), DateTimeOffset.UtcNow.AddDays(5));
        var booking = parkingSpot.Book("user-123", DateTimeOffset.UtcNow.AddDays(1), TimeSpan.FromHours(2)).Booking;

        // Act & Assert
        var exception = Assert.Throws<BusinessException>(
            () =>
                parkingSpot.RateBooking("other-user", booking.Id, BookRating.Good));
        Assert.That(exception?.Code, Is.EqualTo("ParkingSpot.InvalidRating"));
    }

    [Test]
    public async Task RateBooking_ShouldSucceed_WhenAllConditionsAreMet()
    {
        // Arrange
        var parkingSpot = ParkingSpot.Define("owner-123", Guid.NewGuid(), "Spot A");
        // 10ms is way enough time to book without being in the past
        parkingSpot.MakeAvailable(DateTimeOffset.UtcNow.AddMilliseconds(10), DateTimeOffset.UtcNow.AddDays(5));

        var booking = parkingSpot.Book(
                "user-123",
                DateTimeOffset.UtcNow.AddMilliseconds(1),
                TimeSpan.FromMilliseconds(50))
            .Booking;
        await Task.Delay(100); // Wait for booking to complete

        // Act
        parkingSpot.RateBooking("user-123", booking.Id, BookRating.Good);

        // Assert
        Assert.That(booking.Rating, Is.EqualTo(BookRating.Good));
    }

    [Test]
    public void CancelBooking_ShouldThrow_WhenBookingNotFound()
    {
        // Arrange
        var parkingSpot = ParkingSpot.Define("owner-123", Guid.NewGuid(), "Spot A");

        // Act & Assert
        var exception = Assert.Throws<BusinessException>(
            () =>
                parkingSpot.CancelBooking("owner-123", Guid.NewGuid()));
        Assert.That(exception?.Code, Is.EqualTo("ParkingSpot.BookingNotFound"));
    }

    [Test]
    public void CancelAllBookingsWithByPass_ShouldRemoveAllActiveBookings()
    {
        // Arrange
        var parkingSpot = ParkingSpot.Define("owner-123", Guid.NewGuid(), "Spot A");
        parkingSpot.MakeAvailable(DateTimeOffset.UtcNow.AddMinutes(1), DateTimeOffset.UtcNow.AddDays(5));
        parkingSpot.Book("user-123", DateTimeOffset.UtcNow.AddDays(1), TimeSpan.FromHours(3));
        parkingSpot.Book("user-456", DateTimeOffset.UtcNow.AddDays(2), TimeSpan.FromHours(3));

        // Act
        parkingSpot.CancelAllBookingsWithByPass();

        // Assert
        Assert.That(parkingSpot.Bookings, Is.Empty);
    }
}