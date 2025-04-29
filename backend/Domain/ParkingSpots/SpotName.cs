namespace Domain.ParkingSpots;

public sealed record SpotName
{
    public const int MaxLength = 10;

    public SpotName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Parking spot name cannot be empty", nameof(name));
        }

        if (name.Length > MaxLength)
        {
            throw new ArgumentException(
                $"Parking spot name cannot be longer than {MaxLength} characters, was {name.Length}.",
                nameof(name));
        }

        Name = name.ToUpper();
    }

    public string Name { get; }

    public static implicit operator string(SpotName spotName)
    {
        return spotName.Name;
    }
}
