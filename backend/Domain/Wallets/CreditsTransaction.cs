namespace Domain.Wallets;

public sealed class CreditsTransaction
{
    private CreditsTransaction(string reference, Credits credits, TransactionState state)
    {
        Reference = reference;
        Credits = credits;
        State = state;
    }

    public string Reference { get; }
    public Credits Credits { get; }
    public TransactionState State { get; }
    public bool HasAnyEffect => Credits.Amount is not 0;

    public static CreditsTransaction Pending(string reference, Credits credits)
    {
        return new CreditsTransaction(reference, credits, TransactionState.Pending);
    }

    public static CreditsTransaction Confirmed(string reference, Credits credits)
    {
        return new CreditsTransaction(reference, credits, TransactionState.Confirmed);
    }
}

public enum TransactionState
{
    Pending,
    Confirmed
}