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

    public static CreditsTransaction Create(string reference, Credits credits, TransactionState state)
    {
        return new CreditsTransaction(reference, credits, state);
    }
}

public enum TransactionState
{
    Pending,
    Confirmed
}
