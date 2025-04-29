namespace Domain.Parkings;

public sealed record ParkingName
{
    public const int MaxLength = 50;

    public ParkingName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new BusinessException("Parking.InvalidName", "Parking name cannot be empty");
        }

        if (name.Length > MaxLength)
        {
            throw new BusinessException(
                "Parking.InvalidName",
                $"Parking name cannot be longer than {MaxLength} characters, was {name.Length}.");
        }

        Name = name;
    }

    public string Name { get; }

    public static implicit operator string(ParkingName spotName)
    {
        return spotName.Name;
    }
}
