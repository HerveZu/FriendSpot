namespace Domain;

public readonly struct Credits(decimal amount)
{
    public decimal Amount { get; } = Math.Round(amount, 2);
    public bool None => amount is 0;

    public static implicit operator decimal(Credits credits)
    {
        return credits.Amount;
    }
}
