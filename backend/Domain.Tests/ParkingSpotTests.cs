using Domain.ParkingSpots;
using Domain.Tests.TestBench;

namespace Domain.Tests;

[TestFixture]
[TestOf(typeof(ParkingSpot))]
public sealed class ParkingSpotTests
{
    private readonly TimeSpan _availabilitySplitBorderMargin = TimeSpan.FromMinutes(1);

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
        var parkingSpot = Factory.ParkingSpot(Guid.NewGuid(), "owner-123", Guid.NewGuid(), new SpotName("Spot A"));
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
        var parkingSpot = Factory.ParkingSpot(Guid.NewGuid(), "owner-123", Guid.NewGuid(), new SpotName("Spot A"));
        parkingSpot.Disable();

        // Act & Assert
        var exception = Assert.Throws<BusinessException>(
            () =>
                parkingSpot.Book("user-123", DateTimeOffset.Now.AddDays(1), TimeSpan.FromHours(2)));
        Assert.That(exception?.Code, Is.EqualTo("ParkingSpot.Disabled"));
    }

    [Test]
    public void Book_ShouldThrow_WhenBookingOwnSpot()
    {
        // Arrange
        var parkingSpot = Factory.ParkingSpot(Guid.NewGuid(), "owner-123", Guid.NewGuid(), new SpotName("Spot A"));

        // Act & Assert
        var exception = Assert.Throws<BusinessException>(
            () =>
                parkingSpot.Book("owner-123", DateTimeOffset.Now.AddDays(1), TimeSpan.FromHours(2)));
        Assert.That(exception?.Code, Is.EqualTo("ParkingSpot.InvalidBooking"));
    }

    [Test]
    public void Book_ShouldThrow_WhenBookingInPast()
    {
        // Arrange
        var parkingSpot = Factory.ParkingSpot(
            Guid.NewGuid(),
            "owner-123",
            Guid.NewGuid(),
            new SpotName("Spot A"),
            [],
            [
                Factory.ParkingSpotAvailability(
                    Guid.NewGuid(),
                    DateTimeOffset.Now.AddDays(-2),
                    DateTimeOffset.Now.AddDays(5))
            ]);
        // Act & Assert
        var exception = Assert.Throws<BusinessException>(
            () =>
                parkingSpot.Book("user-123", DateTimeOffset.Now.AddDays(-1), TimeSpan.FromHours(2)));
        Assert.That(exception?.Code, Is.EqualTo("ParkingSpotBooking.Invalid"));
    }

    [Test]
    public void Book_ShouldThrow_WhenSpotNotAvailable()
    {
        // Arrange
        var parkingSpot = Factory.ParkingSpot(Guid.NewGuid(), "owner-123", Guid.NewGuid(), new SpotName("Spot A"));

        // Act & Assert
        var exception = Assert.Throws<BusinessException>(
            () =>
                parkingSpot.Book("user-123", DateTimeOffset.Now.AddDays(1), TimeSpan.FromHours(2)));
        Assert.That(exception?.Code, Is.EqualTo("ParkingSpot.NoAvailability"));
    }

    [Test]
    public void Book_ShouldThrow_WhenSomeoneElseBookingOverlaps()
    {
        // Arrange
        var parkingSpot = Factory.ParkingSpot(Guid.NewGuid(), "owner-123", Guid.NewGuid(), new SpotName("Spot A"));

        parkingSpot.MakeAvailable(DateTimeOffset.Now.AddMinutes(1), DateTimeOffset.Now.AddDays(2));
        parkingSpot.Book("other-user-123", DateTimeOffset.Now.AddHours(1), TimeSpan.FromHours(2));

        // Act & Assert
        var exception = Assert.Throws<BusinessException>(
            () =>
                parkingSpot.Book("user-123", DateTimeOffset.Now.AddHours(2), TimeSpan.FromHours(2)));

        Assert.That(exception?.Code, Is.EqualTo("ParkingSpot.NoAvailability"));
    }

    [Test]
    public void Book_ShouldSucceed_WhenSomeoneElseBookingDoesntOverlap()
    {
        // Arrange
        var parkingSpot = Factory.ParkingSpot(Guid.NewGuid(), "owner-123", Guid.NewGuid(), new SpotName("Spot A"));
        var from = DateTimeOffset.Now.AddHours(6);

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
    public void Booking_ShouldCost1CreditPerHour_WhenSucceeds()
    {
        // Arrange
        var parkingSpot = Factory.ParkingSpot(
            Guid.NewGuid(),
            "owner-123",
            Guid.NewGuid(),
            new SpotName("Spot A"),
            [],
            [
                Factory.ParkingSpotAvailability(
                    Guid.NewGuid(),
                    DateTimeOffset.Now.AddHours(1),
                    DateTimeOffset.Now.AddDays(2))
            ]);

        // Act
        var (_, cost) = parkingSpot.Book(
            "user-123",
            DateTimeOffset.Now.AddHours(2),
            TimeSpan.FromHours(4).Add(TimeSpan.FromMinutes(30)));

        // Assert
        Assert.That(cost.Amount, Is.EqualTo(4.5));
    }

    [Test]
    public void Book_ShouldExtendExitingBooking_WhenBookingOverlaps()
    {
        // Arrange
        var parkingSpot = Factory.ParkingSpot(Guid.NewGuid(), "owner-123", Guid.NewGuid(), new SpotName("Spot A"));
        var from = DateTimeOffset.Now.AddHours(6);

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
    public void Book_ShouldThrow_WhenDurationIsNegative()
    {
        // Arrange
        var parkingSpot = Factory.ParkingSpot(
            Guid.NewGuid(),
            "owner-123",
            Guid.NewGuid(),
            new SpotName("Spot A"),
            [],
            [
                Factory.ParkingSpotAvailability(
                    Guid.NewGuid(),
                    DateTimeOffset.Now,
                    DateTimeOffset.Now.AddDays(5))
            ]);

        // Act & Assert
        var exception = Assert.Throws<BusinessException>(
            () =>
                parkingSpot.Book("user-123", DateTimeOffset.Now.AddDays(1), TimeSpan.Zero));
        Assert.That(exception?.Code, Is.EqualTo("ParkingSpotBooking.Invalid"));
    }

    [Test]
    public void MakeAvailable_ShouldThrow_WhenSpotIsDisabled()
    {
        // Arrange
        var parkingSpot = Factory.ParkingSpot(Guid.NewGuid(), "owner-123", Guid.NewGuid(), new SpotName("Spot A"));
        parkingSpot.Disable();

        // Act & Assert
        var exception = Assert.Throws<BusinessException>(
            () =>
                parkingSpot.MakeAvailable(DateTimeOffset.Now.AddDays(1), DateTimeOffset.Now.AddDays(2)));
        Assert.That(exception?.Code, Is.EqualTo("ParkingSpot.Disabled"));
    }

    [Test]
    public void MakeAvailable_ShouldMerge_WhenOverlappingAvailabilities()
    {
        // Arrange
        var parkingSpot = Factory.ParkingSpot(Guid.NewGuid(), "owner-123", Guid.NewGuid(), new SpotName("Spot A"));
        var from = DateTimeOffset.Now.AddDays(1);
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
        var parkingSpot = Factory.ParkingSpot(Guid.NewGuid(), "owner-123", Guid.NewGuid(), new SpotName("Spot A"));

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
        var parkingSpot = Factory.ParkingSpot(Guid.NewGuid(), "owner-123", Guid.NewGuid(), new SpotName("Spot A"));
        parkingSpot.MakeAvailable(DateTimeOffset.Now.AddMinutes(1), DateTimeOffset.Now.AddDays(5));
        var booking = parkingSpot.Book("user-123", DateTimeOffset.Now.AddDays(1), TimeSpan.FromHours(2)).Booking;

        // Act & Assert
        var exception = Assert.Throws<BusinessException>(
            () =>
                parkingSpot.RateBooking("other-user", booking.Id, BookRating.Good));
        Assert.That(exception?.Code, Is.EqualTo("ParkingSpot.InvalidRating"));
    }

    [Test]
    public void RateBooking_ShouldSucceed_WhenAllConditionsAreMet()
    {
        // Arrange
        var booking = Factory.ParkingSpotBooking(
            Guid.NewGuid(),
            "user-123",
            DateTimeOffset.Now.AddDays(-2),
            DateTimeOffset.Now.AddDays(-1));

        var parkingSpot = Factory.ParkingSpot(
            Guid.NewGuid(),
            "owner-123",
            Guid.NewGuid(),
            new SpotName("Spot A"),
            [booking],
            []);

        // Act
        parkingSpot.RateBooking("user-123", booking.Id, BookRating.Good);

        // Assert
        Assert.That(booking.Rating, Is.EqualTo(BookRating.Good));
    }

    [Test]
    public void CancelBooking_ShouldThrow_WhenBookingNotFound()
    {
        // Arrange
        var parkingSpot = Factory.ParkingSpot(Guid.NewGuid(), "owner-123", Guid.NewGuid(), new SpotName("Spot A"));

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
        var parkingSpot = Factory.ParkingSpot(Guid.NewGuid(), "owner-123", Guid.NewGuid(), new SpotName("Spot A"));
        parkingSpot.MakeAvailable(DateTimeOffset.Now.AddMinutes(1), DateTimeOffset.Now.AddDays(5));
        parkingSpot.Book("user-123", DateTimeOffset.Now.AddDays(1), TimeSpan.FromHours(3));
        parkingSpot.Book("user-456", DateTimeOffset.Now.AddDays(2), TimeSpan.FromHours(3));

        // Act
        parkingSpot.CancelAllBookingsWithByPass();

        // Assert
        Assert.That(parkingSpot.Bookings, Is.Empty);
    }

    [Test]
    public void CancelBooking_ShouldSucceed_WhenBookingExists()
    {
        var parkingSpot = Factory.ParkingSpot(Guid.NewGuid(), "owner-123", Guid.NewGuid(), new SpotName("Spot A"));
        parkingSpot.MakeAvailable(DateTimeOffset.Now.AddHours(1), DateTimeOffset.Now.AddDays(5));

        var booking = parkingSpot.Book(
                "user-123",
                DateTimeOffset.Now.AddHours(2),
                TimeSpan.FromHours(2)
            )
            .Booking;

        parkingSpot.CancelBooking("user-123", booking.Id);

        Assert.That(parkingSpot.Bookings, Does.Not.Contain(booking));
    }

    [Test]
    public void CancelBooking_ShouldThrow_WhenCancellingAnotherUsersBooking()
    {
        var parkingSpot = Factory.ParkingSpot(Guid.NewGuid(), "owner-123", Guid.NewGuid(), new SpotName("Spot A"));
        parkingSpot.MakeAvailable(DateTimeOffset.Now.AddHours(1), DateTimeOffset.Now.AddDays(5));

        var booking = parkingSpot.Book(
                "user-123",
                DateTimeOffset.Now.AddHours(2),
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
        var parkingSpot = Factory.ParkingSpot(Guid.NewGuid(), "owner-123", Guid.NewGuid(), new SpotName("Spot A"));
        var startTime = DateTimeOffset.Now.AddHours(1);
        var endTime = DateTimeOffset.Now.AddDays(5);

        parkingSpot.MakeAvailable(startTime, endTime);
        parkingSpot.CancelAvailability("owner-123", parkingSpot.Availabilities[0].Id);

        Assert.That(parkingSpot.Availabilities, Is.Empty);
    }

    [Test]
    public void CancelAvailability_ShouldCancelAllBookedBookings_WhenAllBookingsStartAfterFrozenPeriod()
    {
        var parkingSpot = Factory.ParkingSpot(Guid.NewGuid(), "owner-123", Guid.NewGuid(), new SpotName("Spot A"));
        var startTime = DateTimeOffset.Now.AddDays(1);
        var endTime = DateTimeOffset.Now.AddDays(5);

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
        var parkingSpot = Factory.ParkingSpot(Guid.NewGuid(), "owner-123", Guid.NewGuid(), new SpotName("Spot A"));
        var startTime = DateTimeOffset.Now.AddHours(1);
        var endTime = DateTimeOffset.Now.AddDays(5);

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
        var parkingSpot = Factory.ParkingSpot(Guid.NewGuid(), "owner-123", Guid.NewGuid(), new SpotName("Spot A"));
        var startTime = DateTimeOffset.Now.AddHours(1);
        var endTime = DateTimeOffset.Now.AddDays(5);

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
        var parkingSpot = Factory.ParkingSpot(Guid.NewGuid(), "owner-123", Guid.NewGuid(), new SpotName("Spot A"));

        var ex = Assert.Throws<BusinessException>(
            () =>
                parkingSpot.CancelAvailability("owner-123", Guid.NewGuid()));

        Assert.That(ex.Code, Is.EqualTo("ParkingSpot.AvailabilityNotFound"));
    }

    [Test]
    public void CancelBooking_ShouldThrow_WhenOwnerCancelTooLate()
    {
        var parkingSpot = Factory.ParkingSpot(Guid.NewGuid(), "owner-123", Guid.NewGuid(), new SpotName("Spot A"));
        var verySoonStartTime = DateTimeOffset.Now.AddMinutes(1);
        var endTime = DateTimeOffset.Now.AddDays(5);

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
        var parkingSpot = Factory.ParkingSpot(Guid.NewGuid(), "owner-123", Guid.NewGuid(), new SpotName("Spot A"));
        var verySoonStartTime = DateTimeOffset.Now.AddMinutes(1);
        var endTime = DateTimeOffset.Now.AddDays(5);

        parkingSpot.MakeAvailable(verySoonStartTime, endTime);
        var booking = parkingSpot.Book("user-123", verySoonStartTime, TimeSpan.FromHours(6)).Booking;

        parkingSpot.CancelBooking("user-123", booking.Id);

        Assert.That(parkingSpot.Bookings, Does.Not.Contain(booking));
    }

    [Test]
    public void SplitNonOverlapping_ReturnsSameAvailability_ForNoBooking()
    {
        var availability = Factory.ParkingSpotAvailability(
            Guid.NewGuid(),
            DateTimeOffset.UtcNow.AddMinutes(30),
            DateTimeOffset.UtcNow.AddMinutes(90));

        var splitResult = availability.SplitNonOverlapping([]);

        Assert.That(splitResult, Has.Length.EqualTo(1));
        Assert.Multiple(
            () =>
            {
                Assert.That(splitResult[0].From, Is.EqualTo(availability.From));
                Assert.That(splitResult[0].To, Is.EqualTo(availability.To));
            });
    }

    [Test]
    public void SplitNonOverlapping_ReturnsTailTrimmed_WhenBookingOverlapsEnd()
    {
        var availability = Factory.ParkingSpotAvailability(
            Guid.NewGuid(),
            DateTimeOffset.UtcNow.AddMinutes(30),
            DateTimeOffset.UtcNow.AddHours(2));
        var bookings = new[]
        {
            ParkingSpotBooking.New("user1", DateTimeOffset.UtcNow.AddHours(1), TimeSpan.FromHours(3))
        };

        var splitResult = availability.SplitNonOverlapping(bookings);

        Assert.That(splitResult, Has.Length.EqualTo(1));
        Assert.Multiple(
            () =>
            {
                Assert.That(splitResult[0].From, Is.EqualTo(availability.From));
                Assert.That(splitResult[0].To + _availabilitySplitBorderMargin, Is.EqualTo(bookings[0].From));
            });
    }

    [Test]
    public void SplitNonOverlapping_ReturnsStartTrimmed_WhenBookingOverlapsStart()
    {
        var availability = Factory.ParkingSpotAvailability(
            Guid.NewGuid(),
            DateTimeOffset.UtcNow.AddMinutes(30),
            DateTimeOffset.UtcNow.AddHours(2));
        var bookings = new[]
        {
            ParkingSpotBooking.New("user1", DateTimeOffset.UtcNow.AddMinutes(5), TimeSpan.FromHours(1)),
        };

        var splitResult = availability.SplitNonOverlapping(bookings);

        Assert.That(splitResult, Has.Length.EqualTo(1));
        Assert.Multiple(
            () =>
            {
                Assert.That(splitResult[0].From - _availabilitySplitBorderMargin, Is.EqualTo(bookings[0].To));
                Assert.That(splitResult[0].To, Is.EqualTo(availability.To));
            });
    }

    [Test]
    public void SplitNonOverlapping_ReturnsSplitAvailabilities_WhenBookingOverlapsMiddle()
    {
        var availability = Factory.ParkingSpotAvailability(
            Guid.NewGuid(),
            DateTimeOffset.UtcNow.AddMinutes(30),
            DateTimeOffset.UtcNow.AddHours(2));
        var bookings = new[]
        {
            ParkingSpotBooking.New("user1", DateTimeOffset.UtcNow.AddHours(1), TimeSpan.FromMinutes(30)),
        };

        var splitResult = availability.SplitNonOverlapping(bookings);

        Assert.That(splitResult, Has.Length.EqualTo(2));
        Assert.Multiple(
            () =>
            {
                Assert.That(splitResult[0].From, Is.EqualTo(availability.From));
                Assert.That(splitResult[0].To + _availabilitySplitBorderMargin, Is.EqualTo(bookings[0].From));
                Assert.That(splitResult[1].From - _availabilitySplitBorderMargin, Is.EqualTo(bookings[0].To));
                Assert.That(splitResult[1].To, Is.EqualTo(availability.To));
            });
    }

    [Test]
    public void SplitNonOverlapping_ReturnsSplitAvailabilitiesInStartOrder()
    {
        var availability = Factory.ParkingSpotAvailability(
            Guid.NewGuid(),
            DateTimeOffset.UtcNow.AddMinutes(30),
            DateTimeOffset.UtcNow.AddHours(6));
        var bookings = new[]
        {
            ParkingSpotBooking.New("user1", DateTimeOffset.UtcNow.AddHours(1), TimeSpan.FromMinutes(30)),
            ParkingSpotBooking.New("user1", DateTimeOffset.UtcNow.AddHours(2), TimeSpan.FromMinutes(30)),
            ParkingSpotBooking.New("user1", DateTimeOffset.UtcNow.AddHours(3), TimeSpan.FromMinutes(30)),
            ParkingSpotBooking.New("user1", DateTimeOffset.UtcNow.AddHours(4), TimeSpan.FromMinutes(30)),
        };

        var splitResult = availability.SplitNonOverlapping(bookings);

        Assert.That(splitResult, Has.Length.EqualTo(5));
        Assert.Multiple(
            () =>
            {
                Assert.That(splitResult[0].From, Is.EqualTo(availability.From));
                Assert.That(splitResult[1].From, Is.GreaterThan(splitResult[0].To));
                Assert.That(splitResult[2].From, Is.GreaterThan(splitResult[1].To));
                Assert.That(splitResult[3].From, Is.GreaterThan(splitResult[2].To));
                Assert.That(splitResult[4].From, Is.GreaterThan(splitResult[3].To));
                Assert.That(splitResult[4].To, Is.EqualTo(availability.To));
            });
    }
}
