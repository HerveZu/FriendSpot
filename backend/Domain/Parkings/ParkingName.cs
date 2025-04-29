namespace Domain.Parkings;

public sealed record ParkingName
{
    public const int MaxLength = 50;

    public ParkingName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Parking name cannot be empty", nameof(name));
        }

        if (name.Length > MaxLength)
        {
            throw new ArgumentException(
                $"Parking name cannot be longer than {MaxLength} characters, was {name.Length}.",
                nameof(name));
        }

        Name = name;
    }

    public string Name { get; }

    public static implicit operator string(ParkingName spotName)
    {
        return spotName.Name;
    }
}
