using Domain;
using FastEndpoints;
using FluentValidation;
using FluentValidation.Results;

namespace Api.Common;

internal sealed class ReturnBusinessErrors : IGlobalPostProcessor
{
    public async Task PostProcessAsync(IPostProcessorContext context, CancellationToken ct)
    {
        if (!context.HasExceptionOccurred)
        {
            return;
        }

        if (!context.ExceptionDispatchInfo.SourceException.GetType().IsAssignableTo(typeof(BusinessException)))
        {
            return;
        }

        var businessException = (BusinessException)context.ExceptionDispatchInfo.SourceException;
        context.MarkExceptionAsHandled();

        await context.HttpContext.Response.SendErrorsAsync(
            [
                new ValidationFailure(businessException.Code, businessException.Message)
                {
                    ErrorCode = businessException.Code,
                    Severity = Severity.Error
                }
            ],
            cancellation: ct);
    }
}
