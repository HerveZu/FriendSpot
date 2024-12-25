namespace Domain;

public sealed class BusinessException(string code, string message) : Exception(message)
{
    public string Code { get; } = code;
}