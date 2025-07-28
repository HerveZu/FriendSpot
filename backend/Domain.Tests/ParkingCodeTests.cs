using Domain.Parkings;

namespace Domain.Tests;

[TestFixture]
[TestOf(typeof(ParkingCode))]
public sealed class ParkingCodeTests
{
    [Test]
    public void NewRandom_ShouldCreateCodeWithCorrectLength()
    {
        // Arrange
        const int expectedLength = 4;

        // Act
        var code = ParkingCode.NewRandom(expectedLength);

        // Assert
        var actualLength = code.Value.Split('-')[1].Length;
        Assert.That(actualLength, Is.EqualTo(expectedLength));
    }

    [Test]
    public void NewRandom_ShouldCreateCodeStartingWithP()
    {
        // Act
        var code = ParkingCode.NewRandom(4);

        // Assert
        Assert.That(code.Value, Does.StartWith("P-"));
    }

    [Test]
    public void NewRandom_ShouldCreateDifferentCodesOnMultipleCalls()
    {
        // Act
        var code1 = ParkingCode.NewRandom(4);
        var code2 = ParkingCode.NewRandom(4);

        // Assert
        Assert.That(code1.Value, Is.Not.EqualTo(code2.Value));
    }

    [Test]
    public void NewRandom_ShouldOnlyUseValidCharacters()
    {
        // Act
        var code = ParkingCode.NewRandom(10);
        var randomPart = code.Value.Split('-')[1];

        // Assert
        Assert.That(randomPart, Does.Match("^[A-Z0-9]+$"));
    }
}
