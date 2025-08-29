using System.Net.Http.Headers;
using System.Security.Cryptography;
using Api.Common.Options;
using JetBrains.Annotations;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using Org.BouncyCastle.Crypto.Parameters;
using Org.BouncyCastle.Security;
using Refit;

namespace Api.Common.Infrastructure;

internal interface IAppStoreServerApi
{
    [Get("/inApps/v1/transactions/{transactionId}")]
    [Headers("Authorization: Bearer")]
    Task<ApiResponse<AppStoreTransactionInfoResponse>> GetTransactionInfo(
        string transactionId,
        CancellationToken cancellationToken = default);
}

[PublicAPI]
internal sealed record AppStoreTransactionInfoResponse
{
    public required string SignedTransactionInfo { get; init; }
}

// see: https://github.com/dragouf/AppStoreServerApi/blob/master/AppStoreServerApi/AppleAppstoreClient.cs
internal sealed class AppleConnectAuthHandler(IOptions<AppOptions> options) : DelegatingHandler
{
    private (string token, DateTime expiry)? _token;

    protected override async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken)
    {
        var jwt = _token?.expiry >= DateTime.Now ? _token.Value.token : GenerateAndCacheJwt();

        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", jwt);

        return await base.SendAsync(request, cancellationToken);
    }

    private string GenerateAndCacheJwt()
    {
        var now = DateTime.Now;
        var expiry = now.AddHours(1);

        var eCDsaSecurityKey = GetEcdsaSecurityKey();

        var handler = new JsonWebTokenHandler();
        var jwt = handler.CreateToken(
            new SecurityTokenDescriptor
            {
                Issuer = options.Value.AppleConnectApiIssuer,
                Audience = "appstoreconnect-v1",
                NotBefore = now,
                Expires = expiry,
                IssuedAt = now,
                Claims = new Dictionary<string, object>
                {
                    { "bid", options.Value.PrimaryBundleId },
                    { "nonce", Guid.NewGuid().ToString("N") }
                },
                SigningCredentials = new SigningCredentials(eCDsaSecurityKey, SecurityAlgorithms.EcdsaSha256)
            });

        _token = (jwt, expiry);
        return jwt;
    }

    private ECDsa GetEllipticCurveAlgorithm()
    {
        var privateKey = options.Value.AppleConnectApiPrivateKey.Replace("-----BEGIN PRIVATE KEY-----", string.Empty)
            .Replace("-----END PRIVATE KEY-----", string.Empty)
            .Replace(Environment.NewLine, "");
        var keyParams = (ECPrivateKeyParameters)PrivateKeyFactory.CreateKey(Convert.FromBase64String(privateKey));

        var normalizedEcPoint = keyParams.Parameters.G.Multiply(keyParams.D).Normalize();

        return ECDsa.Create(
            new ECParameters
            {
                Curve = ECCurve.CreateFromValue(keyParams.PublicKeyParamSet.Id),
                D = keyParams.D.ToByteArrayUnsigned(),
                Q =
                {
                    X = normalizedEcPoint.XCoord.GetEncoded(),
                    Y = normalizedEcPoint.YCoord.GetEncoded()
                }
            });
    }

    private ECDsaSecurityKey GetEcdsaSecurityKey()
    {
        var signatureAlgorithm = GetEllipticCurveAlgorithm();
        var eCDsaSecurityKey = new ECDsaSecurityKey(signatureAlgorithm)
        {
            KeyId = options.Value.AppleConnectApiKeyId
        };

        return eCDsaSecurityKey;
    }
}
