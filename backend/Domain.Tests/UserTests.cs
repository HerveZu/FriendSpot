using System.Globalization;
using Domain.Users;
using NSubstitute;

namespace Domain.Tests;

[TestFixture]
public sealed class UserTests
{
    [Test]
    public void Register_ValidIdentityAndDisplayName_ReturnsUserWithInitialValues()
    {
        // Arrange
        const string identity = "user123";
        var displayName = new UserDisplayName("ValidName");

        // Act
        var user = User.Register(identity, displayName);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(user.Identity, Is.EqualTo(identity));
            Assert.That(user.DisplayName, Is.EqualTo(displayName));
            Assert.That(user.PictureUrl, Is.Null);
            Assert.That(user.Rating.Rating, Is.EqualTo(UserRating.Neutral().Rating));
            Assert.That(user.IsDeleted, Is.False);
            Assert.That(user.UserDevices, Is.Empty);
        });
    }

    [Test]
    public void Register_InvalidIdentity_ThrowsBusinessException()
    {
        // Arrange
        var displayName = new UserDisplayName("ValidName");

        // Act & Assert
        Assert.Throws<BusinessException>(() => User.Register("", displayName));
    }

    [Test]
    public void UpdateInfo_ValidData_UpdatesDisplayNameAndPictureUrl()
    {
        // Arrange
        var user = User.Register("user123", new UserDisplayName("InitialName"));
        var newDisplayName = new UserDisplayName("UpdatedName");
        const string newPictureUrl = "https://example.com/newpicture.jpg";

        // Act
        user.UpdateInfo(newDisplayName, newPictureUrl);

        Assert.Multiple(() =>
        {
            // Assert
            Assert.That(user.DisplayName, Is.EqualTo(newDisplayName));
            Assert.That(user.PictureUrl, Is.EqualTo(newPictureUrl));
        });
    }

    [Test]
    public void UpdatePictureUrl_ValidUrl_UpdatesPictureUrl()
    {
        // Arrange
        var user = User.Register("user123", new UserDisplayName("InitialName"));
        const string newPictureUrl = "https://example.com/newpicture.jpg";

        // Act
        user.UpdatePictureUrl(newPictureUrl);

        // Assert
        Assert.That(user.PictureUrl, Is.EqualTo(newPictureUrl));
    }

    [Test]
    public void AcknowledgeDevice_NewDevice_AddsDevice()
    {
        // Arrange
        var user = User.Register("user123", new UserDisplayName("InitialName"));

        // Act
        user.AcknowledgeDevice("device1", "token1", false, new CultureInfo("en"), TimeZoneInfo.Utc);

        // Assert
        Assert.That(user.UserDevices, Has.Count.EqualTo(1));
        Assert.Multiple(() =>
        {
            Assert.That(user.UserDevices[0].DeviceId, Is.EqualTo("device1"));
            Assert.That(user.UserDevices[0].ExpoPushToken, Is.EqualTo("token1"));
            Assert.That(user.UserDevices[0].Locale, Is.EqualTo(new CultureInfo("en")));
        });
    }

    [Test]
    public void AcknowledgeDevice_ExistingDevice_UpdatesExpoToken()
    {
        // Arrange
        var user = User.Register("user123", new UserDisplayName("InitialName"));
        user.AcknowledgeDevice("device1", "token1", false, new CultureInfo("en"), TimeZoneInfo.Utc);

        // Act
        user.AcknowledgeDevice("device1", "token2", false, new CultureInfo("fr"), TimeZoneInfo.Utc);

        // Assert
        Assert.That(user.UserDevices, Has.Count.EqualTo(1));
        Assert.That(user.UserDevices[0].ExpoPushToken, Is.EqualTo("token2"));
        Assert.That(user.UserDevices[0].Locale, Is.EqualTo(new CultureInfo("fr")));
    }

    [Test]
    public void AcknowledgeDevice_UniquenessNotGuaranteed_RemovesPotentialDuplicates()
    {
        // Arrange
        var user = User.Register("user123", new UserDisplayName("InitialName"));
        user.AcknowledgeDevice("device1", "token1", false, new CultureInfo("en"), TimeZoneInfo.Utc);
        user.AcknowledgeDevice("device2", "token2", true, new CultureInfo("fr"), TimeZoneInfo.Utc);

        // Act
        user.AcknowledgeDevice("device3", "token3", true, new CultureInfo("de"), TimeZoneInfo.Utc);

        // Assert
        Assert.That(user.UserDevices, Has.Count.EqualTo(2));
        Assert.Multiple(() =>
        {
            Assert.That(user.UserDevices[0].DeviceId, Is.EqualTo("device1"));
            Assert.That(user.UserDevices[1].DeviceId, Is.EqualTo("device3"));
        });
    }

    [Test]
    public void RemoveDevice_ExistingDevice_RemovesIt()
    {
        // Arrange
        var user = User.Register("user123", new UserDisplayName("InitialName"));
        user.AcknowledgeDevice("device1", "token1", false, new CultureInfo("en"), TimeZoneInfo.Utc);

        // Act
        user.RemoveDevice("device1");

        // Assert
        Assert.That(user.UserDevices.Count, Is.EqualTo(0));
    }

    [Test]
    public void RemoveAllDevices_RemovesAllDevices()
    {
        // Arrange
        var user = User.Register("user123", new UserDisplayName("InitialName"));
        user.AcknowledgeDevice("device1", "token1", false, new CultureInfo("en"), TimeZoneInfo.Utc);
        user.AcknowledgeDevice("device2", "token2", false, new CultureInfo("en"), TimeZoneInfo.Utc);

        // Act
        user.RemoveAllDevices();

        // Assert
        Assert.That(user.UserDevices, Is.Empty);
    }

    [Test]
    public void MarkDeleted_SetsIsDeletedToTrue()
    {
        // Arrange
        var user = User.Register("user123", new UserDisplayName("ValidName"));

        // Act
        user.MarkDeleted();

        // Assert
        Assert.That(user.IsDeleted, Is.True);
    }

    [Test]
    public async Task PushNotification_ShouldPushNotificationForAllDevices()
    {
        // Arrange
        var user = User.Register("user123", new UserDisplayName("ValidName"));
        user.AcknowledgeDevice("device1", "token1", false, new CultureInfo("en"), TimeZoneInfo.Utc);
        user.AcknowledgeDevice("device2", "token2", false, new CultureInfo("en"), TimeZoneInfo.Utc);
        var notificationService = Substitute.For<INotificationPushService>();

        // Act
        await user.PushNotification(
            notificationService,
            new Notification
            {
                Title = new LocalizedString("Test notification"),
                Body = new LocalizedString("I'm just a test notification")
            },
            CancellationToken.None);

        // Assert
        await notificationService.Received(2)
            .PushToDevice(
                Arg.Any<UserDevice>(),
                Arg.Any<Notification>(),
                Arg.Any<CancellationToken>()
            );
    }

    [Test]
    public void NeutralIncrease_ShouldNotExceedMaxStar()
    {
        // Arrange
        var userRating = UserRating.Neutral();

        // Act
        for (var i = 0; i < 9999; i++)
        {
            userRating.NeutralIncrease();
        }

        // Assert
        Assert.That(userRating.Rating, Is.EqualTo(3));
    }

    [Test]
    public void GoodIncrease_ShouldNotExceedMaxStar()
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

    [Test]
    public void BadDecrease_ShouldNotRateUnderZero()
    {
        // Arrange
        var userRating = UserRating.Neutral();

        // Act
        for (var i = 0; i < 9999; i++)
        {
            userRating.BadDecrease();
        }

        // Assert
        Assert.That(userRating.Rating, Is.EqualTo(0));
    }
}
