using Domain.Parkings;
using Domain.Tests.TestBench;

namespace Domain.Tests;

[TestFixture]
[TestOf(typeof(Parking))]
public sealed class ParkingTests
{
    [Test]
    [TestCase("Parking A", "Main st central", "owner-123")]
    [TestCase("Another parking", "Main st central, bla bla bla", "owner-123")]
    public void Create_ShouldSucceed_WhenValidData(string name, string address, string ownerId)
    {
        // Act
        var parking = Parking.Create(ownerId, name, address);

        // Assert
        Assert.Multiple(
            () =>
            {
                Assert.That(parking.Name.Name, Is.EqualTo(name));
                Assert.That(parking.Address.Address, Is.EqualTo(address));
                Assert.That(parking.OwnerId, Is.EqualTo(ownerId));
            });
    }

    [Test]
    [TestCase("", "Main st central", "owner-123")]
    [TestCase("   ", "Main st central", "owner-123")]
    [TestCase("Parking A", "", "owner-123")]
    [TestCase("Parking A", "   ", "owner-123")]
    [TestCase(
        "Parking A",
        "A super long address that will definitely fail because no bug is in there, right ?A super long address that will definitely fail because no bug is in there, right ?",
        "owner-123")]
    [TestCase(
        "A Very long parking name that should fail.A Very long parking name that should fail",
        "Main st central",
        "owner-123")]
    public void Create_ShouldThrow_WhenInvalidData(string name, string address, string ownerId)
    {
        Assert.Throws<ArgumentException>(
            () =>
                Parking.Create(ownerId, name, address));
    }

    [Test]
    public void TransferOwnership_ShouldSucceed_WhenTransferringToAnotherUser()
    {
        // Arrange
        var parking = Factory.Parking(
            Guid.NewGuid(),
            "owner-123",
            new ParkingName("Parking A"),
            new ParkingAddress("Main st central"));
        const string newOwnerId = "new-owner-123";

        // Act
        parking.TransferOwnership(newOwnerId);

        // Assert
        Assert.That(parking.OwnerId, Is.EqualTo(newOwnerId));
    }

    [Test]
    public void TransferOwnership_ShouldThrow_WhenTransferringToSameUser()
    {
        // Arrange
        var parking = Factory.Parking(
            Guid.NewGuid(),
            "owner-123",
            new ParkingName("Parking A"),
            new ParkingAddress("Main st central"));

        // Act
        var ex = Assert.Throws<BusinessException>(() => parking.TransferOwnership("owner-123"));

        // Assert
        Assert.That(ex.Code, Is.EqualTo("Parking.InvalidTransfer"));
    }

    [Test]
    public void EditInfo_ShouldSucceed_WhenAsOwner()
    {
        // Arrange
        var parking = Factory.Parking(
            Guid.NewGuid(),
            "owner-123",
            new ParkingName("Parking A"),
            new ParkingAddress("Main st central"));
        const string newName = "Updated Parking";
        const string newAddress = "456 New Street";

        // Act
        parking.EditInfo("owner-123", newName, newAddress);

        // Assert
        Assert.Multiple(
            () =>
            {
                Assert.That(parking.Name.Name, Is.EqualTo(newName));
                Assert.That(parking.Address.Address, Is.EqualTo(newAddress));
            });
    }

    [Test]
    public void EditInfo_ShouldThrow_WhenAsSomeoneElse()
    {
        var parking = Factory.Parking(
            Guid.NewGuid(),
            "owner-123",
            new ParkingName("Parking A"),
            new ParkingAddress("Main st central"));
        const string newName = "Updated Parking";
        const string newAddress = "456 New Street";

        var ex = Assert.Throws<BusinessException>(() => parking.EditInfo("other-123", newName, newAddress));

        Assert.That(ex.Code, Is.EqualTo("Parking.InvalidEditing"));
    }

    [Test]
    public void Delete_ShouldSucceed_WhenAsOwner()
    {
        var parking = Factory.Parking(
            Guid.NewGuid(),
            "owner-123",
            new ParkingName("Parking A"),
            new ParkingAddress("Main st central"));
        parking.Delete("owner-123");

        Assert.Pass();
    }

    [Test]
    public void Delete_ShouldThrow_WhenAsSomeoneElse()
    {
        var parking = Factory.Parking(
            Guid.NewGuid(),
            "owner-123",
            new ParkingName("Parking A"),
            new ParkingAddress("Main st central"));

        var ex = Assert.Throws<BusinessException>(() => parking.Delete("other-123"));

        Assert.That(ex.Code, Is.EqualTo("Parking.InvalidDeletion"));
    }

    [TestCase(1, 2, -1)]
    [TestCase(2, 1, 1)]
    [TestCase(2, 2, 1)]
    public void RequestBooking_ShouldThrow_WhenInvalid(int fromAddHours, int toAddHours, decimal bonus)
    {
        var now = DateTimeOffset.Now;
        var parking = Factory.Parking(
            Guid.NewGuid(),
            "owner-123",
            new ParkingName("Parking A"),
            new ParkingAddress("Main st central"));

        var ex = Assert.Throws<BusinessException>(
            () => parking.RequestBooking(
                "other-123",
                now.AddHours(fromAddHours),
                now.AddHours(toAddHours),
                new Credits(bonus)));

        Assert.That(ex.Code, Is.EqualTo("ParkingBookingRequest.Invalid"));
    }

    [TestCase(1, 2, 0)]
    [TestCase(1, 2, 1)]
    public void RequestBooking_ShouldSucceed_WhenValid(int fromAddHours, int toAddHours, decimal bonus)
    {
        var parking = Factory.Parking(
            Guid.NewGuid(),
            "owner-123",
            new ParkingName("Parking A"),
            new ParkingAddress("Main st central"));

        parking.RequestBooking(
            "other-123",
            DateTimeOffset.Now.AddHours(fromAddHours),
            DateTimeOffset.Now.AddHours(toAddHours),
            new Credits(bonus));

        Assert.Pass();
    }

    [Test]
    public void BookingRequest_ShouldCost1CreditPerHourPlusBonus_WhenSucceeds()
    {
        var parking = Factory.Parking(
            Guid.NewGuid(),
            "owner-123",
            new ParkingName("Parking A"),
            new ParkingAddress("Main st central"));

        var request = parking.RequestBooking(
            "other-123",
            DateTimeOffset.Now.AddHours(10),
            DateTimeOffset.Now.AddHours(14).AddMinutes(30),
            new Credits(100));

        // Assert
        Assert.That(request.Cost.Amount, Is.EqualTo(104.5));
    }
}
