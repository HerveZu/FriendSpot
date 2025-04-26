using Domain.Users;

namespace Domain.Tests.Users;

[TestFixture]
[TestOf(typeof(User))]
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
        Assert.Multiple(
            () =>
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

        // Assert
        Assert.That(user.DisplayName, Is.EqualTo(newDisplayName));
        Assert.That(user.PictureUrl, Is.EqualTo(newPictureUrl));
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
        user.AcknowledgeDevice("device1", "token1", false);

        // Assert
        Assert.That(user.UserDevices.Count, Is.EqualTo(1));
        Assert.That(user.UserDevices[0].DeviceId, Is.EqualTo("device1"));
        Assert.That(user.UserDevices[0].ExpoPushToken, Is.EqualTo("token1"));
    }

    [Test]
    public void AcknowledgeDevice_ExistingDevice_UpdatesExpoToken()
    {
        // Arrange
        var user = User.Register("user123", new UserDisplayName("InitialName"));
        user.AcknowledgeDevice("device1", "token1", false);

        // Act
        user.AcknowledgeDevice("device1", "token2", false);

        // Assert
        Assert.That(user.UserDevices.Count, Is.EqualTo(1));
        Assert.That(user.UserDevices[0].ExpoPushToken, Is.EqualTo("token2"));
    }

    [Test]
    public void AcknowledgeDevice_UniquenessNotGuaranteed_RemovesPotentialDuplicates()
    {
        // Arrange
        var user = User.Register("user123", new UserDisplayName("InitialName"));
        user.AcknowledgeDevice("device1", "token1", true);
        user.AcknowledgeDevice("device2", "token2", true);

        // Act
        user.AcknowledgeDevice("device1", "token3", true);

        // Assert
        Assert.That(user.UserDevices.Count, Is.EqualTo(1));
        Assert.That(user.UserDevices[0].DeviceId, Is.EqualTo("device1"));
        Assert.That(user.UserDevices[0].ExpoPushToken, Is.EqualTo("token3"));
    }

    [Test]
    public void RemoveDevice_ExistingDevice_RemovesIt()
    {
        // Arrange
        var user = User.Register("user123", new UserDisplayName("InitialName"));
        user.AcknowledgeDevice("device1", "token1", false);

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
        user.AcknowledgeDevice("device1", "token1", false);
        user.AcknowledgeDevice("device2", "token2", false);

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
}
