using System.IdentityModel.Tokens.Jwt;
using Api.Common;
using Api.Common.Infrastructure;
using Api.Common.Options;
using Domain.UserProducts;
using FastEndpoints;
using FluentValidation;
using JetBrains.Annotations;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Api.Me;

[PublicAPI]
public sealed record ActivateProductRequest
{
    public enum PurchaseProvider
    {
        AppStore,
        PlayStore
    }

    public required string TransactionId { get; init; }
    public required string PurchaseToken { get; init; }
    public required PurchaseProvider Provider { get; init; }
}

internal sealed class ActivateProductValidator : Validator<ActivateProductRequest>
{
    public ActivateProductValidator()
    {
        RuleFor(x => x.TransactionId).NotEmpty();
        RuleFor(x => x.PurchaseToken).NotEmpty();
    }
}

internal sealed record ProductInfo(string ProductId, DateTimeOffset ExpirationDate);

internal sealed class ActivateProduct(
    AppDbContext dbContext,
    ILogger<ActivateProduct> logger,
    IAppStoreServerApi appStoreServerApi,
    IGooglePlayDeveloperApi googlePlayDeveloperApi,
    IOptions<AppOptions> appOptions
) : Endpoint<ActivateProductRequest>
{
    public override void Configure()
    {
        Post("/@me/products/activate");
    }

    public override async Task HandleAsync(ActivateProductRequest req, CancellationToken ct)
    {
        var alreadyActivated =
            await dbContext.Set<UserProduct>().AnyAsync(x => x.TransactionId == req.TransactionId, ct);

        if (alreadyActivated)
        {
            // idempotent, already activated -> ok to allow the client to complete the transaction
            await SendOkAsync(ct);
            return;
        }

        var currentUser = HttpContext.ToCurrentUser();
        logger.LogInformation(
            "Validating purchase from transaction {TransactionId} using provider {Provider}",
            req.TransactionId,
            req.Provider);

        IStoreProductValidator? validator = req.Provider switch
        {
            ActivateProductRequest.PurchaseProvider.AppStore => new AppStoreProductValidator(appStoreServerApi),
            ActivateProductRequest.PurchaseProvider.PlayStore => new PlayStoreProductValidator(
                googlePlayDeveloperApi,
                appOptions.Value),
            _ => null
        };

        if (validator is null)
        {
            ThrowError($"The provider {req.Provider} is not supported");
            return;
        }

        logger.LogDebug(
            "Validating product using validator {Validator} from provider {Provider}",
            validator.GetType().Name,
            req.Provider);

        var productInfo = await validator.ValidateAppStore(req, ct);

        if (productInfo is null)
        {
            ThrowError("The product could not been verified");
            return;
        }

        logger.LogInformation("Product verified {Product}", productInfo);

        var subscription = UserProduct.Activate(
            req.TransactionId,
            currentUser.Identity,
            productInfo.ProductId,
            productInfo.ExpirationDate);
        dbContext.Set<UserProduct>().Add(subscription);

        await dbContext.SaveChangesAsync(ct);
        await SendOkAsync(ct);
    }
}

internal interface IStoreProductValidator
{
    Task<ProductInfo?> ValidateAppStore(ActivateProductRequest req, CancellationToken cancellationToken);
}

internal sealed class AppStoreProductValidator(IAppStoreServerApi appStoreServerApi) : IStoreProductValidator
{
    public async Task<ProductInfo?> ValidateAppStore(ActivateProductRequest req, CancellationToken cancellationToken)
    {
        var transaction = await appStoreServerApi.GetTransactionInfo(req.TransactionId, cancellationToken);
        await transaction.EnsureSuccessfulAsync();

        if (transaction.Content is null)
        {
            return null;
        }

        var transactionPayload = new JwtSecurityTokenHandler().ReadJwtToken(transaction.Content.SignedTransactionInfo);
        var claims = transactionPayload.Claims.ToDictionary(x => x.Type, x => x.Value);

        return new ProductInfo(
            claims["productId"],
            DateTimeOffset.FromUnixTimeMilliseconds(long.Parse(claims["expiresDate"])));
    }
}

internal sealed class PlayStoreProductValidator(IGooglePlayDeveloperApi playDeveloperApi, AppOptions options)
    : IStoreProductValidator
{
    public async Task<ProductInfo?> ValidateAppStore(ActivateProductRequest req, CancellationToken cancellationToken)
    {
        var subscriptionStatus = await playDeveloperApi.GetSubscriptionStatusAsync(
            options.PrimaryBundleId,
            req.TransactionId,
            req.PurchaseToken,
            cancellationToken);

        await subscriptionStatus.EnsureSuccessfulAsync();

        if (subscriptionStatus.Content is null)
        {
            return null;
        }

        var isSandboxSubscription =
            subscriptionStatus.Content.PurchaseType is SubscriptionPurchase.PurchaseTypeResponse.Test;

        if (!options.SandboxPurchases && isSandboxSubscription)
        {
            return null;
        }

        return new ProductInfo(
            subscriptionStatus.Content.ProductId,
            DateTimeOffset.FromUnixTimeMilliseconds(subscriptionStatus.Content.ExpiryTimeMillis));
    }
}
