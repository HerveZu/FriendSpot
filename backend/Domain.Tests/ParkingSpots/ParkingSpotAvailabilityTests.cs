using Domain.ParkingSpots;

namespace Domain.Tests.ParkingSpots;

[TestFixture]
[TestOf(typeof(ParkingSpotAvailability))]
public sealed class ParkingSpotAvailabilityTests
{
    private readonly TimeSpan _splitBorderMargin = TimeSpan.FromMinutes(1);

    [Test]
    public void New_ThrowsException_WhenFromIsInThePast()
    {
        var from = DateTimeOffset.UtcNow.AddMinutes(-1);
        var to = DateTimeOffset.UtcNow.AddHours(1);

        var ex = Assert.Throws<BusinessException>(() => ParkingSpotAvailability.New(from, to));
        Assert.That(ex!.Code, Is.EqualTo("ParkingSpot.InvalidAvailabilities"));
    }

    [Test]
    public void New_ThrowsException_WhenFromIsAfterTo()
    {
        var from = DateTimeOffset.UtcNow.AddHours(2);
        var to = DateTimeOffset.UtcNow.AddHours(1);

        var ex = Assert.Throws<BusinessException>(() => ParkingSpotAvailability.New(from, to));
        Assert.That(ex!.Code, Is.EqualTo("ParkingSpot.InvalidAvailabilities"));
    }

    [Test]
    public void New_CreatesInstance_WhenFromIsBeforeToAndInFuture()
    {
        var from = DateTimeOffset.UtcNow.AddMinutes(10);
        var to = DateTimeOffset.UtcNow.AddHours(2);

        var availability = ParkingSpotAvailability.New(from, to);

        Assert.Multiple(
            () =>
            {
                Assert.That(availability.From, Is.EqualTo(from));
                Assert.That(availability.To, Is.EqualTo(to));
                Assert.That(availability.Duration, Is.EqualTo(to - from));
            });
    }

    [Test]
    public void Merge_ThrowsException_WhenAvailabilitiesDoNotOverlap()
    {
        var existing = ParkingSpotAvailability.New(
            DateTimeOffset.UtcNow.AddHours(1),
            DateTimeOffset.UtcNow.AddHours(2));
        var @new = ParkingSpotAvailability.New(
            DateTimeOffset.UtcNow.AddHours(3),
            DateTimeOffset.UtcNow.AddHours(4));

        var ex = Assert.Throws<BusinessException>(() => ParkingSpotAvailability.Merge(existing, @new));
        Assert.That(ex!.Code, Is.EqualTo("ParkingSpot.InvalidAvailabilities"));
    }

    [Test]
    public void Merge_ReturnsMergedAvailability_WhenAvailabilitiesOverlap()
    {
        var existing = ParkingSpotAvailability.New(
            DateTimeOffset.UtcNow.AddHours(1),
            DateTimeOffset.UtcNow.AddHours(2));
        var @new = ParkingSpotAvailability.New(
            DateTimeOffset.UtcNow.AddMinutes(90),
            DateTimeOffset.UtcNow.AddHours(3));

        var merged = ParkingSpotAvailability.Merge(existing, @new);

        Assert.Multiple(
            () =>
            {
                Assert.That(merged.From, Is.EqualTo(existing.From));
                Assert.That(merged.To, Is.EqualTo(@new.To));
            });
    }

    [Test]
    public void CanCancel_ReturnsTrue_WhenAllBookingsStartAfterFrozenPeriod()
    {
        var availability = ParkingSpotAvailability.New(
            DateTimeOffset.UtcNow.AddMinutes(30),
            DateTimeOffset.UtcNow.AddHours(2));
        var bookings = new[]
        {
            ParkingSpotBooking.New("user1", DateTimeOffset.UtcNow.AddMinutes(45), TimeSpan.FromMinutes(30)),
            ParkingSpotBooking.New("user1", DateTimeOffset.UtcNow.AddMinutes(90), TimeSpan.FromMinutes(30))
        };

        var result = availability.CanCancel("user1", bookings);

        Assert.That(result, Is.True);
    }

    [Test]
    public void CanCancel_ReturnsFalse_WhenAnyBookingStartsTooSoon()
    {
        var availability = ParkingSpotAvailability.New(
            DateTimeOffset.UtcNow.AddMinutes(30),
            DateTimeOffset.UtcNow.AddHours(2));
        var bookings = new[]
        {
            ParkingSpotBooking.New("user1", DateTimeOffset.UtcNow.AddMinutes(45), TimeSpan.FromMinutes(30)),
            ParkingSpotBooking.New("user2", DateTimeOffset.UtcNow, TimeSpan.FromMinutes(30))
        };

        var result = availability.CanCancel("user1", bookings);

        Assert.That(result, Is.False);
    }

    [Test]
    public void SplitNonOverlapping_ReturnsSameAvailability_ForNoBooking()
    {
        var availability = ParkingSpotAvailability.New(
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
        var availability = ParkingSpotAvailability.New(
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
                Assert.That(splitResult[0].To + _splitBorderMargin, Is.EqualTo(bookings[0].From));
            });
    }

    [Test]
    public void SplitNonOverlapping_ReturnsStartTrimmed_WhenBookingOverlapsStart()
    {
        var availability = ParkingSpotAvailability.New(
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
                Assert.That(splitResult[0].From - _splitBorderMargin, Is.EqualTo(bookings[0].To));
                Assert.That(splitResult[0].To, Is.EqualTo(availability.To));
            });
    }

    [Test]
    public void SplitNonOverlapping_ReturnsSplitAvailabilities_WhenBookingOverlapsMiddle()
    {
        var availability = ParkingSpotAvailability.New(
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
                Assert.That(splitResult[0].To + _splitBorderMargin, Is.EqualTo(bookings[0].From));
                Assert.That(splitResult[1].From - _splitBorderMargin, Is.EqualTo(bookings[0].To));
                Assert.That(splitResult[1].To, Is.EqualTo(availability.To));
            });
    }

    [Test]
    public void SplitNonOverlapping_ReturnsSplitAvailabilitiesInStartOrder()
    {
        var availability = ParkingSpotAvailability.New(
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
