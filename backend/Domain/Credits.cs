namespace Domain;

public readonly struct Credits(decimal amount)
{
    public decimal Amount { get; } = Math.Round(amount, 2);

    public static implicit operator decimal(Credits credits)
    {
        return credits.Amount;
    }

    public static Credits operator +(Credits a, Credits b)
    {
        return new Credits(a.Amount + b.Amount);
    }

    public static Credits operator -(Credits a, Credits b)
    {
        return new Credits(a.Amount - b.Amount);
    }
}
