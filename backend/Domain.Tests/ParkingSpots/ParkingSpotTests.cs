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
    public void Book_ShouldThrow_WhenSpotNotAvailable()
    {
        // Arrange
        var parkingSpot = ParkingSpot.Define("owner-123", Guid.NewGuid(), "Spot A");

        // Act & Assert
        var exception = Assert.Throws<BusinessException>(
            () =>
                parkingSpot.Book("user-123", DateTimeOffset.UtcNow.AddDays(1), TimeSpan.FromHours(2)));
        Assert.That(exception?.Code, Is.EqualTo("ParkingSpot.NoAvailability"));
    }

    [Test]
    public void Book_ShouldThrow_WhenSomeoneElseBookingOverlaps()
    {
        // Arrange
        var parkingSpot = ParkingSpot.Define("owner-123", Guid.NewGuid(), "Spot A");

        parkingSpot.MakeAvailable(DateTimeOffset.UtcNow.AddMinutes(1), DateTimeOffset.UtcNow.AddDays(2));
        parkingSpot.Book("other-user-123", DateTimeOffset.UtcNow.AddHours(1), TimeSpan.FromHours(2));

        // Act & Assert
        var exception = Assert.Throws<BusinessException>(
            () =>
                parkingSpot.Book("user-123", DateTimeOffset.UtcNow.AddHours(2), TimeSpan.FromHours(2)));

        Assert.That(exception?.Code, Is.EqualTo("ParkingSpot.NoAvailability"));
    }

    [Test]
    public void Book_ShouldSucceed_WhenSomeoneElseBookingDoesntOverlap()
    {
        // Arrange
        var parkingSpot = ParkingSpot.Define("owner-123", Guid.NewGuid(), "Spot A");
        var from = DateTimeOffset.UtcNow.AddHours(6);

        parkingSpot.MakeAvailable(from, from.AddDays(2));
        parkingSpot.Book("user-123", from, TimeSpan.FromHours(6));

        // Act
        parkingSpot.Book("user-123", from.AddHours(4), TimeSpan.FromHours(6));

        // Assert
        Assert.That(parkingSpot.Bookings, Has.Count.EqualTo(1));
        Assert.Multiple(
            () =>
            {
                Assert.That(parkingSpot.Bookings[0].From, Is.EqualTo(from));
                Assert.That(parkingSpot.Bookings[0].To, Is.EqualTo(from.AddHours(10)));
            });
    }

    [Test]
    public void Book_ShouldExtendExitingBooking_WhenBookingOverlaps()
    {
        // Arrange
        var parkingSpot = ParkingSpot.Define("owner-123", Guid.NewGuid(), "Spot A");
        var from = DateTimeOffset.UtcNow.AddHours(6);

        parkingSpot.MakeAvailable(from, from.AddDays(2));
        parkingSpot.Book("other-user-123", from, TimeSpan.FromHours(6));

        // Act
        parkingSpot.Book("user-123", from.AddHours(8), TimeSpan.FromHours(6));

        // Assert
        Assert.That(parkingSpot.Bookings, Has.Count.EqualTo(2));
        Assert.Multiple(
            () =>
            {
                Assert.That(parkingSpot.Bookings[1].From, Is.EqualTo(from.AddHours(8)));
                Assert.That(parkingSpot.Bookings[1].To, Is.EqualTo(from.AddHours(14)));
            });
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
    public void MakeAvailable_ShouldMerge_WhenOverlappingAvailabilities()
    {
        // Arrange
        var parkingSpot = ParkingSpot.Define("owner-123", Guid.NewGuid(), "Spot A");
        var from = DateTimeOffset.UtcNow.AddDays(1);
        var to = from.AddDays(1);

        // Act
        parkingSpot.MakeAvailable(from, from.AddHours(12));
        parkingSpot.MakeAvailable(from.AddHours(6), from.AddHours(12));
        parkingSpot.MakeAvailable(from.AddHours(8), to);

        Assert.That(parkingSpot.Availabilities, Has.Count.EqualTo(1));
        Assert.Multiple(
            () =>
            {
                Assert.That(parkingSpot.Availabilities[0].From, Is.EqualTo(from));
                Assert.That(parkingSpot.Availabilities[0].To, Is.EqualTo(to));
            });
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

    [Test]
    public void CancelBooking_ShouldSucceed_WhenBookingExists()
    {
        var parkingSpot = ParkingSpot.Define("owner-123", Guid.NewGuid(), "Spot A");
        parkingSpot.MakeAvailable(DateTimeOffset.UtcNow.AddHours(1), DateTimeOffset.UtcNow.AddDays(5));

        var booking = parkingSpot.Book(
                "user-123",
                DateTimeOffset.UtcNow.AddHours(2),
                TimeSpan.FromHours(2)
            )
            .Booking;

        parkingSpot.CancelBooking("user-123", booking.Id);

        Assert.That(parkingSpot.Bookings, Does.Not.Contain(booking));
    }

    [Test]
    public void CancelBooking_ShouldThrow_WhenCancellingAnotherUsersBooking()
    {
        var parkingSpot = ParkingSpot.Define("owner-123", Guid.NewGuid(), "Spot A");
        parkingSpot.MakeAvailable(DateTimeOffset.UtcNow.AddHours(1), DateTimeOffset.UtcNow.AddDays(5));

        var booking = parkingSpot.Book(
                "user-123",
                DateTimeOffset.UtcNow.AddHours(2),
                TimeSpan.FromHours(2)
            )
            .Booking;

        var ex = Assert.Throws<BusinessException>(
            () =>
                parkingSpot.CancelBooking("different-user", booking.Id));

        Assert.Multiple(
            () =>
            {
                Assert.That(ex.Code, Is.EqualTo("ParkingSpot.InvalidCancelling"));
                Assert.That(parkingSpot.Bookings, Does.Contain(booking));
            });
    }

    [Test]
    public void CancelAvailability_ShouldSucceed_WhenAvailabilityExists()
    {
        var parkingSpot = ParkingSpot.Define("owner-123", Guid.NewGuid(), "Spot A");
        var startTime = DateTimeOffset.UtcNow.AddHours(1);
        var endTime = DateTimeOffset.UtcNow.AddDays(5);

        parkingSpot.MakeAvailable(startTime, endTime);
        parkingSpot.CancelAvailability("owner-123", parkingSpot.Availabilities[0].Id);

        Assert.That(parkingSpot.Availabilities, Is.Empty);
    }

    [Test]
    public void CancelAvailability_ShouldCancelAllBookedBookings_WhenAllBookingsStartAfterFrozenPeriod()
    {
        var parkingSpot = ParkingSpot.Define("owner-123", Guid.NewGuid(), "Spot A");
        var startTime = DateTimeOffset.UtcNow.AddDays(1);
        var endTime = DateTimeOffset.UtcNow.AddDays(5);

        parkingSpot.MakeAvailable(startTime, endTime);
        parkingSpot.Book("user-123", startTime.AddHours(1), TimeSpan.FromHours(1));
        parkingSpot.Book("other-user-123", startTime.AddHours(3), TimeSpan.FromHours(1));
        parkingSpot.Book("user-123", startTime.AddHours(5), TimeSpan.FromHours(1));

        parkingSpot.CancelAvailability("owner-123", parkingSpot.Availabilities[0].Id);

        Assert.Multiple(
            () =>
            {
                Assert.That(parkingSpot.Bookings, Is.Empty);
                Assert.That(parkingSpot.Availabilities, Is.Empty);
            });
    }

    [Test]
    public void CancelAvailability_ShouldThrow_WhenOneBookingStartsTooSoon()
    {
        var parkingSpot = ParkingSpot.Define("owner-123", Guid.NewGuid(), "Spot A");
        var startTime = DateTimeOffset.UtcNow.AddHours(1);
        var endTime = DateTimeOffset.UtcNow.AddDays(5);

        parkingSpot.MakeAvailable(startTime, endTime);
        parkingSpot.Book("user-123", startTime.AddHours(1), TimeSpan.FromHours(1));
        parkingSpot.Book("other-user-123", startTime.AddHours(3), TimeSpan.FromHours(1));
        parkingSpot.Book("user-123", startTime.AddHours(5), TimeSpan.FromHours(1));

        var ex = Assert.Throws<BusinessException>(
            () =>
                parkingSpot.CancelAvailability("owner-123", parkingSpot.Availabilities[0].Id));

        Assert.Multiple(
            () =>
            {
                Assert.That(ex.Code, Is.EqualTo("ParkingSpot.InvalidCancelling"));
                Assert.That(parkingSpot.Availabilities, Has.Count.EqualTo(1));
                Assert.That(parkingSpot.Bookings, Has.Count.EqualTo(3));
            });
    }

    [Test]
    public void CancelAvailability_ShouldThrow_WhenNotOwner()
    {
        var parkingSpot = ParkingSpot.Define("owner-123", Guid.NewGuid(), "Spot A");
        var startTime = DateTimeOffset.UtcNow.AddHours(1);
        var endTime = DateTimeOffset.UtcNow.AddDays(5);

        parkingSpot.MakeAvailable(startTime, endTime);

        var ex = Assert.Throws<BusinessException>(
            () =>
                parkingSpot.CancelAvailability("not-owner-user-123", parkingSpot.Availabilities[0].Id));

        Assert.Multiple(
            () =>
            {
                Assert.That(ex.Code, Is.EqualTo("ParkingSpot.InvalidCancelling"));
                Assert.That(parkingSpot.Availabilities, Does.Contain(parkingSpot.Availabilities[0]));
            });
    }

    [Test]
    public void CancelAvailability_ShouldThrow_WhenAvailabilityNotFound()
    {
        var parkingSpot = ParkingSpot.Define("owner-123", Guid.NewGuid(), "Spot A");

        var ex = Assert.Throws<BusinessException>(
            () =>
                parkingSpot.CancelAvailability("owner-123", Guid.NewGuid()));

        Assert.That(ex.Code, Is.EqualTo("ParkingSpot.AvailabilityNotFound"));
    }

    [Test]
    public void CancelBooking_ShouldThrow_WhenOwnerCancelTooLate()
    {
        var parkingSpot = ParkingSpot.Define("owner-123", Guid.NewGuid(), "Spot A");
        var verySoonStartTime = DateTimeOffset.UtcNow.AddMinutes(1);
        var endTime = DateTimeOffset.UtcNow.AddDays(5);

        parkingSpot.MakeAvailable(verySoonStartTime, endTime);
        var booking = parkingSpot.Book("user-123", verySoonStartTime, TimeSpan.FromHours(6)).Booking;

        var ex = Assert.Throws<BusinessException>(
            () =>
                parkingSpot.CancelBooking("owner-123", booking.Id));

        Assert.Multiple(
            () =>
            {
                Assert.That(ex.Code, Is.EqualTo("ParkingSpot.InvalidCancelling"));
                Assert.That(parkingSpot.Bookings, Does.Contain(booking));
            });
    }

    [Test]
    public void CancelBooking_ShouldSucceed_WhenBookingUserCancelLastMinute()
    {
        var parkingSpot = ParkingSpot.Define("owner-123", Guid.NewGuid(), "Spot A");
        var verySoonStartTime = DateTimeOffset.UtcNow.AddMinutes(1);
        var endTime = DateTimeOffset.UtcNow.AddDays(5);

        parkingSpot.MakeAvailable(verySoonStartTime, endTime);
        var booking = parkingSpot.Book("user-123", verySoonStartTime, TimeSpan.FromHours(6)).Booking;

        parkingSpot.CancelBooking("user-123", booking.Id);

        Assert.That(parkingSpot.Bookings, Does.Not.Contain(booking));
    }
}
