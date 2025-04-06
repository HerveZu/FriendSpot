namespace Domain.ParkingSpots;

public sealed record SpotName
{
    public const int MaxLength = 10;

    public SpotName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException($"'{nameof(name)}' cannot be null or whitespace.", nameof(name));
        }

        if (name.Length > MaxLength)
        {
            throw new ArgumentException($"'{nameof(name)}' cannot be longer than 10 characters.", nameof(name));
        }

        Name = name.ToUpper();
    }

    public string Name { get; }

    public static implicit operator string(SpotName spotName)
    {
        return spotName.Name;
    }
}