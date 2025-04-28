using Domain.ParkingSpots;

namespace Domain.Tests.ParkingSpots;

[TestFixture]
[TestOf(typeof(ParkingSpotBooking))]
public class ParkingSpotBookingTests
{
    private readonly DateTimeOffset _justBeforeNow = DateTimeOffset.Now;
    private const decimal HourlyRate = 1.00m;
    private const string TestUserId = "user123";
    private const string NonOwnerId = "nonOwner123";

    [Test]
    public void New_ShouldCreateBooking_WithExpectedValues()
    {
        // Arrange
        var startTime = _justBeforeNow;
        var duration = TimeSpan.FromHours(3);

        // Act
        var booking = ParkingSpotBooking.New(TestUserId, startTime, duration);

        // Assert
        Assert.Multiple(
            () =>
            {
                Assert.That(booking.BookingUserId, Is.EqualTo(TestUserId));
                Assert.That(booking.From, Is.EqualTo(startTime));
                Assert.That(booking.To, Is.EqualTo(startTime + duration));
                Assert.That(booking.Rating, Is.Null);
            });
    }

    [Test]
    public void Extend_ShouldUpdateFromAndTo_WhenDatesOverlap()
    {
        // Arrange
        var booking = ParkingSpotBooking.New(TestUserId, _justBeforeNow, TimeSpan.FromHours(1));
        var newFrom = booking.From.AddMinutes(-30);
        var newTo = booking.To.AddMinutes(30);

        // Act
        booking.Extend(newFrom, newTo);

        // Assert
        Assert.Multiple(
            () =>
            {
                Assert.That(booking.From, Is.EqualTo(newFrom));
                Assert.That(booking.To, Is.EqualTo(newTo));
            });
    }

    [Test]
    public void Extend_ShouldUpdateFromAndTo_WhenNewDatesAreOutsideOldDates()
    {
        // Arrange
        var booking = ParkingSpotBooking.New(TestUserId, _justBeforeNow, TimeSpan.FromHours(1));
        var newFrom = booking.From.AddHours(-2);
        var newTo = booking.To.AddHours(2);

        // Act
        booking.Extend(newFrom, newTo);

        // Assert
        Assert.Multiple(
            () =>
            {
                Assert.That(booking.From, Is.EqualTo(newFrom));
                Assert.That(booking.To, Is.EqualTo(newTo));
            });
    }

    [Test]
    public void Duration_ShouldReturn_ExpectedTimeSpan()
    {
        // Arrange
        const int hours = 5;
        var expectedDuration = TimeSpan.FromHours(hours);
        var booking = ParkingSpotBooking.New(TestUserId, _justBeforeNow, expectedDuration);

        // Act
        var duration = booking.Duration;

        // Assert
        Assert.That(duration, Is.EqualTo(expectedDuration));
    }

    [Test]
    [TestCase(0.1f, 1)]
    [TestCase(0.5f, 1)]
    [TestCase(1, 1)]
    [TestCase(3, 3)]
    public void Cost_ShouldNeverBeLessThanOne(float hours, decimal expectedCost)
    {
        // Arrange
        var booking = ParkingSpotBooking.New(TestUserId, _justBeforeNow, TimeSpan.FromHours(hours));

        // Act
        var cost = booking.Cost;

        // Assert
        Assert.That((decimal)cost, Is.GreaterThanOrEqualTo(expectedCost));
    }

    [Test]
    public void Cost_ShouldReflectDuration()
    {
        // Arrange
        const int hours = 3;
        const decimal expectedCost = hours * HourlyRate;

        var booking = ParkingSpotBooking.New(TestUserId, _justBeforeNow, TimeSpan.FromHours(hours));

        // Act
        var cost = booking.Cost;

        // Assert
        Assert.That((decimal)cost, Is.EqualTo(expectedCost));
    }

    [Test]
    public void HasNotExpiredNow_ShouldReturnTrue_WhenBookingIsActive()
    {
        // Arrange - create a booking that spans from 30 minutes ago to 30 minutes from now
        const int minutesBefore = 30;
        const int totalMinutes = 60;
        var booking = ParkingSpotBooking.New(
            TestUserId,
            _justBeforeNow.AddMinutes(-minutesBefore),
            TimeSpan.FromMinutes(totalMinutes)
        );

        // Act
        // Use reflection or other means to mock current time if ParkingSpotBooking allows it
        var hasNotExpiredNow = booking.HasNotExpiredNow;

        // Assert
        Assert.That(hasNotExpiredNow, Is.True);
    }

    [Test]
    public void HasNotExpiredNow_ShouldReturnFalse_WhenBookingEndIsInPast()
    {
        // Arrange
        const int hoursBefore = 2;
        const int durationHours = 1;
        var booking = ParkingSpotBooking.New(
            TestUserId,
            _justBeforeNow.AddHours(-hoursBefore),
            TimeSpan.FromHours(durationHours)
        );

        // Act
        var hasNotExpiredNow = booking.HasNotExpiredNow;

        // Assert
        Assert.That(hasNotExpiredNow, Is.False);
    }

    [Test]
    public void HasNotExpiredNow_ShouldReturnTrue_WhenBookingIsInFuture()
    {
        // Arrange
        const int hoursAhead = 1;
        const int durationHours = 1;
        var booking = ParkingSpotBooking.New(
            TestUserId,
            _justBeforeNow.AddHours(hoursAhead),
            TimeSpan.FromHours(durationHours)
        );

        // Act
        var hasNotExpiredNow = booking.HasNotExpiredNow;

        // Assert
        Assert.That(hasNotExpiredNow, Is.True);
    }

    [Test]
    public void CanCancel_ShouldReturnTrue_ForOwnerBeforeStart()
    {
        // Arrange
        const int hoursAhead = 1;
        const int durationHours = 2;
        var booking = ParkingSpotBooking.New(
            TestUserId,
            _justBeforeNow.AddHours(hoursAhead),
            TimeSpan.FromHours(durationHours)
        );

        // Act
        var canCancel = booking.CanCancel(TestUserId);

        // Assert
        Assert.That(canCancel, Is.True);
    }

    [Test]
    public void CanCancel_ShouldReturnFalse_ForOwnerAfterEnd()
    {
        // Arrange
        const int hoursBefore = 3;
        const int durationHours = 1;
        var booking = ParkingSpotBooking.New(
            TestUserId,
            _justBeforeNow.AddHours(-hoursBefore),
            TimeSpan.FromHours(durationHours)
        );

        // Act
        var canCancel = booking.CanCancel(TestUserId);

        // Assert
        Assert.That(canCancel, Is.False);
    }

    [Test]
    public void CanCancel_ShouldReturnFalse_ForNonOwner()
    {
        // Arrange
        const string ownerId = "owner123";
        const int hoursAhead = 1;
        const int durationHours = 2;
        var booking = ParkingSpotBooking.New(
            ownerId,
            _justBeforeNow.AddHours(hoursAhead),
            TimeSpan.FromHours(durationHours)
        );

        // Act
        var canCancel = booking.CanCancel(NonOwnerId);

        // Assert
        Assert.That(canCancel, Is.False);
    }

    [Test]
    public void Rate_ShouldSetRating_WhenBookingHasEnded()
    {
        // Arrange
        const int hoursBefore = 2;
        const int durationHours = 1;
        var booking = ParkingSpotBooking.New(
            TestUserId,
            _justBeforeNow.AddHours(-hoursBefore),
            TimeSpan.FromHours(durationHours)
        );

        // Act
        booking.Rate(BookRating.Good);

        // Assert
        Assert.That(booking.Rating, Is.EqualTo(BookRating.Good));
    }

    [Test]
    public void Rate_ShouldThrowException_WhenBookingIsOngoing()
    {
        // Arrange
        const int durationHours = 2;
        var booking = ParkingSpotBooking.New(
            TestUserId,
            _justBeforeNow,
            TimeSpan.FromHours(durationHours)
        );

        // Act & Assert
        Assert.That(
            () => booking.Rate(BookRating.Bad),
            Throws.TypeOf<BusinessException>());
    }

    [Test]
    public void Rate_ShouldThrowException_WhenBookingIsAlreadyRated()
    {
        // Arrange
        const int hoursBefore = 2;
        const int durationHours = 1;
        var booking = ParkingSpotBooking.New(
            TestUserId,
            _justBeforeNow.AddHours(-hoursBefore),
            TimeSpan.FromHours(durationHours)
        );

        booking.Rate(BookRating.Good);

        // Act & Assert
        Assert.That(
            () => booking.Rate(BookRating.Bad),
            Throws.TypeOf<BusinessException>());
    }

    [Test]
    public void New_ShouldThrowException_WhenDurationIsNegative()
    {
        // Arrange
        var negativeDuration = TimeSpan.FromHours(-1);

        // Act & Assert
        Assert.That(
            () => ParkingSpotBooking.New(TestUserId, _justBeforeNow, negativeDuration),
            Throws.TypeOf<ArgumentException>());
    }
}
