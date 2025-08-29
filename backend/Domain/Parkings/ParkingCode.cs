namespace Domain.Parkings;

public sealed record ParkingCode(string Value)
{
    private const char Prefix = 'F';
    private const string ValidChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    public static ParkingCode NewRandom(int length)
    {
        var code = new string(
            Enumerable.Repeat(ValidChars, length)
                .Select(s => s[Random.Shared.Next(length)])
                .ToArray());

        return new ParkingCode($"{Prefix}-{code.ToUpperInvariant()}");
    }

    public static implicit operator string(ParkingCode code)
    {
        return code.Value;
    }
}
