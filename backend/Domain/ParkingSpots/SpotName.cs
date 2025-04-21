namespace Domain.ParkingSpots;

public sealed record SpotName
{
    public const int MaxLength = 10;

    public SpotName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new BusinessException("ParkingSpot.InvalidName", "Parking spot name cannot be empty");
        }

        if (name.Length > MaxLength)
        {
            throw new BusinessException(
                "ParkingSpot.InvalidName",
                $"Parking spot name cannot be longer than {MaxLength} characters, was {name.Length}.");
        }

        Name = name.ToUpper();
    }

    public string Name { get; }

    public static implicit operator string(SpotName spotName)
    {
        return spotName.Name;
    }
}
