using System.Globalization;

namespace Domain;

public readonly struct Credits(decimal notRoundedAmount)
{
    public decimal Amount { get; } = Math.Round(notRoundedAmount, 2);

    public override string ToString()
    {
        return Amount.ToString(CultureInfo.InvariantCulture);
    }

    public static implicit operator decimal(Credits credits)
    {
        return credits.Amount;
    }

    public static Credits operator +(Credits a, Credits b)
    {
        return new Credits(a.Amount + b.Amount);
    }

    public static Credits operator -(Credits credits)
    {
        return new Credits(-credits.Amount);
    }

    public static Credits operator -(Credits a, Credits b)
    {
        return new Credits(a.Amount - b.Amount);
    }

    public static bool operator <(Credits a, Credits b)
    {
        return a.Amount < b.Amount;
    }

    public static bool operator >(Credits a, Credits b)
    {
        return a.Amount > b.Amount;
    }
}
