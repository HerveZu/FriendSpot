using Domain.Wallets;

namespace Domain.Tests.Wallets;

[TestFixture]
[TestOf(typeof(Wallet))]
public sealed class WalletTests
{
    [Test]
    public void Wallet_Create_ShouldInitializeProperly()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();

        // Act
        var wallet = Wallet.Create(userId);

        Assert.Multiple(
            () =>
            {
                // Assert
                Assert.That(wallet.UserId, Is.EqualTo(userId));
                Assert.That(wallet.Id, Is.Not.EqualTo(Guid.Empty));
                Assert.That(wallet.Transactions, Is.Empty);
            });
    }

    [Test]
    public void Wallet_Charge_ShouldChargeWhenCreditsAreSufficient()
    {
        // Arrange
        var wallet = Wallet.Create(Guid.NewGuid().ToString());
        wallet.CreditConfirmed("ref1", new Credits(100));

        // Act
        wallet.Charge("ref2", new Credits(50));

        Assert.Multiple(
            () =>
            {
                // Assert
                Assert.That(wallet.Credits.Amount, Is.EqualTo(50));
                Assert.That(wallet.Transactions, Has.Count.EqualTo(2));
                Assert.That(wallet.Transactions.Any(t => t is { Reference: "ref2", Credits.Amount: -50 }), Is.True);
            });
    }

    [Test]
    public void Wallet_Charge_ShouldThrowWhenCreditsAreInsufficient()
    {
        // Arrange
        var wallet = Wallet.Create(Guid.NewGuid().ToString());
        wallet.CreditConfirmed("ref1", new Credits(50));

        // Act & Assert
        var exception = Assert.Throws<BusinessException>(() => wallet.Charge("ref2", new Credits(100)));
        Assert.That(exception.Code, Is.EqualTo("Wallet.NotEnoughCredits"));
    }

    [Test]
    public void Wallet_Charge_ShouldThrowWhenCreditsAreNegative()
    {
        // Arrange
        var wallet = Wallet.Create(Guid.NewGuid().ToString());

        // Act & Assert
        var exception = Assert.Throws<BusinessException>(() => wallet.Charge("ref1", new Credits(-10)));
        Assert.That(exception.Code, Is.EqualTo("Wallet.NegativeChargeAmount"));
    }

    [Test]
    public void Wallet_CreditConfirmed_ShouldAddConfirmedCredits()
    {
        // Arrange
        var wallet = Wallet.Create(Guid.NewGuid().ToString());

        // Act
        wallet.CreditConfirmed("ref1", new Credits(100));

        // Assert
        Assert.Multiple(
            () =>
            {
                Assert.That(wallet.Credits.Amount, Is.EqualTo(100));
                Assert.That(wallet.Transactions.Count, Is.EqualTo(1));
                Assert.That(wallet.Transactions.First().State, Is.EqualTo(TransactionState.Confirmed));
            });
    }

    [Test]
    public void Wallet_CreditPending_ShouldAddPendingCredits()
    {
        // Arrange
        var wallet = Wallet.Create(Guid.NewGuid().ToString());

        // Act
        wallet.CreditPending("ref1", new Credits(100));

        Assert.Multiple(
            () =>
            {
                // Assert
                Assert.That(wallet.Credits.Amount, Is.EqualTo(0));
                Assert.That(wallet.PendingCredits.Amount, Is.EqualTo(100));
                Assert.That(wallet.Transactions, Has.Count.EqualTo(1));
                Assert.That(wallet.Transactions[0].State, Is.EqualTo(TransactionState.Pending));
            });
    }

    [Test]
    public void Wallet_ConfirmPending_ShouldConfirmPendingCredit()
    {
        // Arrange
        var wallet = Wallet.Create(Guid.NewGuid().ToString());
        wallet.CreditPending("ref1", new Credits(100));

        // Act
        wallet.ConfirmPending("ref1");

        Assert.Multiple(
            () =>
            {
                // Assert
                Assert.That(wallet.Credits.Amount, Is.EqualTo(100));
                Assert.That(wallet.PendingCredits.Amount, Is.EqualTo(0));
                Assert.That(wallet.Transactions, Has.Count.EqualTo(1));
                Assert.That(wallet.Transactions[0].State, Is.EqualTo(TransactionState.Confirmed));
            });
    }

    [Test]
    public void Wallet_ConfirmPending_ShouldThrowIfTransactionIsNotPending()
    {
        // Arrange
        var wallet = Wallet.Create(Guid.NewGuid().ToString());
        wallet.CreditConfirmed("ref1", new Credits(100));

        // Act & Assert
        var exception = Assert.Throws<BusinessException>(() => wallet.ConfirmPending("ref1"));
        Assert.That(exception.Code, Is.EqualTo("Wallet.CannotConfirmPending"));
    }

    [Test]
    public void Wallet_ConfirmPending_ShouldThrowIfTransactionDoesNotExist()
    {
        // Arrange
        var wallet = Wallet.Create(Guid.NewGuid().ToString());

        // Act & Assert
        var exception = Assert.Throws<InvalidOperationException>(() => wallet.ConfirmPending("non-existent-ref"));
        Assert.That(exception.Message, Does.Contain("Sequence contains no matching element"));
    }

    [Test]
    public void Wallet_Cancel_ShouldRemoveTransaction()
    {
        // Arrange
        var wallet = Wallet.Create(Guid.NewGuid().ToString());
        wallet.CreditConfirmed("ref1", new Credits(100));

        // Act
        wallet.Cancel("ref1");

        Assert.Multiple(
            () =>
            {
                // Assert
                Assert.That(wallet.Transactions, Is.Empty);
                Assert.That(wallet.Credits.Amount, Is.EqualTo(0));
            });
    }

    [Test]
    public void Wallet_Cancel_ShouldThrowIfTransactionDoesNotExist()
    {
        // Arrange
        var wallet = Wallet.Create(Guid.NewGuid().ToString());

        // Act & Assert
        var exception = Assert.Throws<InvalidOperationException>(() => wallet.Cancel("non-existent-ref"));
        Assert.That(exception.Message, Does.Contain("Sequence contains no matching element"));
    }

    [Test]
    public void Wallet_IdempotentTransaction_ShouldNotAddDuplicateTransactions()
    {
        // Arrange
        var wallet = Wallet.Create(Guid.NewGuid().ToString());
        wallet.CreditConfirmed("ref1", new Credits(100));
        // Act
        wallet.CreditConfirmed("ref1", new Credits(100));

        Assert.Multiple(
            () =>
            {
                // Assert
                Assert.That(wallet.Transactions.Count, Is.EqualTo(1));
                Assert.That(wallet.Credits.Amount, Is.EqualTo(100));
            });
    }

    [Test]
    public void Wallet_IdempotentTransaction_ShouldUpdateTransactionIfReferenceExists()
    {
        // Arrange
        var wallet = Wallet.Create(Guid.NewGuid().ToString());
        wallet.CreditConfirmed("ref1", new Credits(100));

        // Act
        wallet.CreditPending("ref1", new Credits(200));

        Assert.Multiple(
            () =>
            {
                // Assert
                Assert.That(wallet.Transactions.Count, Is.EqualTo(1));
                Assert.That(wallet.Credits.Amount, Is.EqualTo(0));
                Assert.That(wallet.PendingCredits.Amount, Is.EqualTo(200));
                Assert.That(wallet.Transactions.First().State, Is.EqualTo(TransactionState.Pending));
            });
    }
}
