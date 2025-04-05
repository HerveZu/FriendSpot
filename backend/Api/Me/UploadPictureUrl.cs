using Amazon;
using Amazon.S3;
using Amazon.S3.Model;
using Api.Common;
using Api.Common.Infrastructure;
using Api.Common.Options;
using Domain.Users;
using FastEndpoints;
using JetBrains.Annotations;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Api.Me;

[PublicAPI]
public sealed record UploadPictureUrlResponse
{
    public required string WriteUrl { get; init; }
    public required string ReadonlyUrl { get; init; }
}

internal sealed class UploadPictureUrl(IOptions<S3Options> s3Options, AppDbContext dbContext)
    : EndpointWithoutRequest<UploadPictureUrlResponse>
{
    public override void Configure()
    {
        Put("/@me/picture");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var currentUser = HttpContext.ToCurrentUser();
        var bucketRegion = RegionEndpoint.GetBySystemName(s3Options.Value.Region);

        const string userPictureFolder = "userPictures";
        var filename = $"{userPictureFolder}/{currentUser.Identity}";
        var client = new AmazonS3Client(s3Options.Value.AccessKeyId, s3Options.Value.AccessKeySecret, bucketRegion);

        var writeUrl = await client.GetPreSignedURLAsync(
            new GetPreSignedUrlRequest
            {
                BucketName = s3Options.Value.BucketName,
                Key = filename,
                Expires = DateTime.UtcNow.AddMinutes(2),
                Verb = HttpVerb.PUT
            });

        var publicUrl = $"https://{s3Options.Value.BucketName}.s3.{bucketRegion.SystemName}.amazonaws.com/{filename}";

        var user = await dbContext
            .Set<User>()
            .FirstAsync(user => user.Identity == currentUser.Identity, ct);

        user.UpdatePictureUrl(publicUrl);

        dbContext.Set<User>().Update(user);
        await dbContext.SaveChangesAsync(ct);

        await SendOkAsync(
            new UploadPictureUrlResponse
            {
                WriteUrl = writeUrl,
                ReadonlyUrl = publicUrl,
            },
            ct);
    }
}