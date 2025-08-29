using System.IdentityModel.Tokens.Jwt;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Security.Cryptography;
using Api.Common.Options;
using JetBrains.Annotations;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Refit;

namespace Api.Common.Infrastructure;

[PublicAPI]
internal sealed record SubscriptionPurchase
{
    [PublicAPI]
    public enum PurchaseTypeResponse
    {
        Regular = 0,
        Test = 1
    }

    public required string ProductId { get; init; }
    public required long ExpiryTimeMillis { get; init; }

    public PurchaseTypeResponse? PurchaseType { get; init; }
}

internal interface IGooglePlayDeveloperApi
{
    [Get(
        "/androidpublisher/v3/applications/{packageName}/purchases/subscriptions/{subscriptionId}/tokens/{purchaseToken}")]
    Task<ApiResponse<SubscriptionPurchase>> GetSubscriptionStatusAsync(
        string packageName,
        string subscriptionId,
        string purchaseToken,
        CancellationToken cancellationToken = default);
}

internal sealed record GooglePlayAccessTokenResponse
{
    public required string AccessToken { get; init; }
    public required int ExpiresIn { get; init; }
}

internal sealed class GooglePlayAuthHandler(IOptions<AppOptions> options, ILogger<GooglePlayAuthHandler> logger)
    : DelegatingHandler
{
    private static readonly HttpClient _tokenClient = new();
    private (string token, DateTime expiry)? _token;

    protected override async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken)
    {
        logger.LogInformation("Generating JWT for GooglePlay Developer API");

        var jwt = _token?.expiry >= DateTime.UtcNow
            ? _token.Value.token
            : await GenerateAndCacheAccessTokenAsync(cancellationToken);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", jwt);

        return await base.SendAsync(request, cancellationToken);
    }

    private async Task<string> GenerateAndCacheAccessTokenAsync(CancellationToken cancellationToken)
    {
        var jwt = GenerateJwtAssertion();

        var content = new FormUrlEncodedContent(
        [
            new KeyValuePair<string, string>("grant_type", "urn:ietf:params:oauth:grant-type:jwt-bearer"),
            new KeyValuePair<string, string>("assertion", jwt)
        ]);

        var response = await _tokenClient.PostAsync("https://oauth2.googleapis.com/token", content, cancellationToken);
        response.EnsureSuccessStatusCode();

        var tokenResponse =
            await response.Content.ReadFromJsonAsync<GooglePlayAccessTokenResponse>(
                cancellationToken: cancellationToken)
            ?? throw new InvalidOperationException("Failed to parse token response");
        _token = (tokenResponse.AccessToken, DateTime.UtcNow.AddSeconds(tokenResponse.ExpiresIn));

        return _token.Value.token;
    }

    private string GenerateJwtAssertion()
    {
        var now = DateTime.UtcNow;
        var handler = new JwtSecurityTokenHandler();

        // Load the private key from the JSON file.
        var rsa = RSA.Create();
        rsa.ImportFromPem(options.Value.GooglePlayApiPrivateKey);

        var securityKey = new RsaSecurityKey(rsa)
        {
            KeyId = options.Value.GooglePlayApiKeyId
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Issuer = options.Value.GooglePlayApiClientEmail,
            Audience = "https://oauth2.googleapis.com/token",
            NotBefore = now,
            Expires = now.AddHours(1),
            IssuedAt = now,
            Subject = new ClaimsIdentity(
            [
                new Claim("scope", "https://www.googleapis.com/auth/androidpublisher")
            ]),
            SigningCredentials = new SigningCredentials(securityKey, SecurityAlgorithms.RsaSha256)
        };

        var jwt = handler.CreateToken(tokenDescriptor);
        return handler.WriteToken(jwt);
    }
}
