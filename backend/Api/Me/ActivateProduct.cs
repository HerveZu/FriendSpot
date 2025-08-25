using System.IdentityModel.Tokens.Jwt;
using System.Net;
using Api.Common;
using Api.Common.Infrastructure;
using Domain.UserProducts;
using FastEndpoints;
using FluentValidation;
using JetBrains.Annotations;
using Microsoft.EntityFrameworkCore;

namespace Api.Me;

[PublicAPI]
public sealed record ActivateProductRequest
{
    public enum PurchaseProvider
    {
        AppStore
    }

    public required string TransactionId { get; init; }
    public required PurchaseProvider Provider { get; init; }
}

internal sealed class ActivateProductValidator : Validator<ActivateProductRequest>
{
    public ActivateProductValidator()
    {
        RuleFor(x => x.TransactionId).NotEmpty();
    }
}

internal sealed record ProductInfo(string ProductId, DateTimeOffset ExpirationDate);

internal sealed class ActivateProduct(
    AppDbContext dbContext,
    ILogger<ActivateProduct> logger,
    IAppStoreServerApi appStoreServerApi
) : Endpoint<ActivateProductRequest>
{
    public override void Configure()
    {
        Post("/@me/products/activate");
    }

    public override async Task HandleAsync(ActivateProductRequest req, CancellationToken ct)
    {
        var alreadyActivated =
            await dbContext.Set<UserProducts>().AnyAsync(x => x.TransactionId == req.TransactionId, ct);

        if (alreadyActivated)
        {
            await SendErrorsAsync((int)HttpStatusCode.Conflict, ct);
            return;
        }

        var currentUser = HttpContext.ToCurrentUser();
        logger.LogInformation(
            "Validating purchase from transaction {TransactionId} using provider {Provider}",
            req.TransactionId,
            req.Provider);

        var productInfo = req.Provider switch
        {
            ActivateProductRequest.PurchaseProvider.AppStore => await ValidateApple(req, ct),
            _ => null
        };

        if (productInfo is null)
        {
            ThrowError("The product could not been verified");
            return;
        }

        logger.LogInformation("Product verified {Product}", productInfo);

        var subscription = UserProducts.Activate(
            req.TransactionId,
            currentUser.Identity,
            productInfo.ProductId,
            productInfo.ExpirationDate);
        dbContext.Set<UserProducts>().Add(subscription);

        await dbContext.SaveChangesAsync(ct);
    }

    private async Task<ProductInfo?> ValidateApple(ActivateProductRequest req, CancellationToken cancellationToken)
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
