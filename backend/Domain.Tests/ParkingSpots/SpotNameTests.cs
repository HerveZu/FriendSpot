using Domain.ParkingSpots;

namespace Domain.Tests.ParkingSpots;

[TestFixture]
[TestOf(typeof(SpotName))]
public sealed class SpotNameTests
{
    [Test]
    public void Constructor_ValidName_SetsNameAndConvertsToUpperCase()
    {
        // Arrange
        const string input = "ValidName";

        // Act
        var spotName = new SpotName(input);

        // Assert
        Assert.That(spotName.Name, Is.EqualTo("VALIDNAME"));
    }

    [TestCase("")]
    [TestCase("   ")]
    public void Constructor_InvalidName_ThrowsArgumentException_EmptyOrWhitespaceName(string input)
    {
        // Act & Assert
        var exception = Assert.Throws<ArgumentException>(() => _ = new SpotName(input));
        Assert.Multiple(
            () =>
            {
                Assert.That(exception.Message, Does.Contain("Parking spot name cannot be empty"));
                Assert.That(exception.ParamName, Is.EqualTo("name"));
            });
    }

    [Test]
    public void Constructor_InvalidName_ThrowsArgumentException_NameExceedsMaxLength()
    {
        // Arrange
        var input = new string('A', SpotName.MaxLength + 1);

        // Act & Assert
        var exception = Assert.Throws<ArgumentException>(() => _ = new SpotName(input));
        Assert.Multiple(
            () =>
            {
                Assert.That(
                    exception.Message,
                    Does.Contain($"Parking spot name cannot be longer than {SpotName.MaxLength} characters"));
                Assert.That(exception.ParamName, Is.EqualTo("name"));
            });
    }

    [Test]
    public void ImplicitOperator_ToString_ReturnsName()
    {
        // Arrange
        const string input = "Spot100";
        var spotName = new SpotName(input);

        // Act
        string result = spotName;

        // Assert
        Assert.That(result, Is.EqualTo("SPOT100"));
    }
}
