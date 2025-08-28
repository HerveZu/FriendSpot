namespace Domain.Tests;

[TestFixture]
public sealed class CreditsTests
{
    [Test]
    public void Constructor_ShouldRoundToTwoDecimalPlaces()
    {
        // Arrange
        const decimal input = 123.456m;
        const decimal expected = 123.46m;

        // Act
        var credits = new Credits(input);

        // Assert
        Assert.That(credits.Amount, Is.EqualTo(expected));
    }

    [Test]
    public void ImplicitConversionToDecimal_ShouldReturnAmount()
    {
        // Arrange
        var credits = new Credits(50.00m);

        // Act
        decimal result = credits;

        // Assert
        Assert.That(result, Is.EqualTo(50.00m));
    }

    [Test]
    public void AdditionOperator_ShouldAddTwoCredits()
    {
        // Arrange
        var a = new Credits(20.50m);
        var b = new Credits(30.25m);
        var expected = new Credits(50.75m);

        // Act
        var result = a + b;

        // Assert
        Assert.That(result.Amount, Is.EqualTo(expected.Amount));
    }

    [Test]
    public void UnaryMinusOperator_ShouldNegateCredits()
    {
        // Arrange
        var credits = new Credits(20.50m);
        var expected = new Credits(-20.50m);

        // Act
        var result = -credits;

        // Assert
        Assert.That(result.Amount, Is.EqualTo(expected.Amount));
    }

    [Test]
    public void SubtractionOperator_ShouldSubtractTwoCredits()
    {
        // Arrange
        var a = new Credits(50.75m);
        var b = new Credits(30.25m);
        var expected = new Credits(20.50m);

        // Act
        var result = a - b;

        // Assert
        Assert.That(result.Amount, Is.EqualTo(expected.Amount));
    }

    [Test]
    public void LessThanOperator_ShouldReturnTrue_WhenALessThanB()
    {
        // Arrange
        var a = new Credits(20.50m);
        var b = new Credits(30.00m);

        // Act
        var result = a < b;

        // Assert
        Assert.That(result);
    }

    [Test]
    public void LessThanOperator_ShouldReturnFalse_WhenAGreaterThanOrEqualToB()
    {
        // Arrange
        var a = new Credits(30.00m);
        var b = new Credits(29.99m);

        // Act
        var result = a < b;

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public void GreaterThanOperator_ShouldReturnTrue_WhenAGreaterThanB()
    {
        // Arrange
        var a = new Credits(40.50m);
        var b = new Credits(30.00m);

        // Act
        var result = a > b;

        // Assert
        Assert.That(result);
    }

    [Test]
    public void GreaterThanOperator_ShouldReturnFalse_WhenALessThanOrEqualToB()
    {
        // Arrange
        var a = new Credits(30.00m);
        var b = new Credits(30.01m);

        // Act
        var result = a > b;

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public void AdditionOperator_ShouldHandleEdgeCases_LargeNumbers()
    {
        // Arrange
        var a = new Credits(1_000_000_000.99m);
        var b = new Credits(0.01m);
        var expected = new Credits(1_000_000_001.00m);

        // Act
        var result = a + b;

        // Assert
        Assert.That(result.Amount, Is.EqualTo(expected.Amount));
    }

    [Test]
    public void SubtractionOperator_ShouldHandleEdgeCases_NegativeResult()
    {
        // Arrange
        var a = new Credits(25.50m);
        var b = new Credits(50.75m);
        var expected = new Credits(-25.25m);

        // Act
        var result = a - b;

        // Assert
        Assert.That(result.Amount, Is.EqualTo(expected.Amount));
    }

    [Test]
    public void Constructor_ShouldHandleNegativeAmounts()
    {
        // Arrange
        const decimal input = -123.456m;
        const decimal expected = -123.46m;

        // Act
        var credits = new Credits(input);

        // Assert
        Assert.That(credits.Amount, Is.EqualTo(expected));
    }

    [Test]
    public void Constructor_ShouldHandleZeroAmount()
    {
        // Arrange
        const decimal input = 0.00m;

        // Act
        var credits = new Credits(input);

        // Assert
        Assert.That(credits.Amount, Is.EqualTo(0.00m));
    }
}
