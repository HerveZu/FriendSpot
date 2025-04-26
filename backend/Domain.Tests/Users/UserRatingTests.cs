using Domain.Users;

namespace Domain.Tests.Users;

[TestFixture]
[TestOf(typeof(UserRating))]
public sealed class UserRatingTests
{
    [Test]
    public void NeutralIncrease_ShouldNotExceedMaxStar()
    {
        // Arrange
        var userRating = UserRating.Neutral();

        // Act
        for (var i = 0; i < 9999; i++)
        {
            userRating.GoodIncrease();
        }

        // Assert
        Assert.That(userRating.Rating, Is.EqualTo(3));
    }
}
