namespace Domain.Parkings;

public sealed record ParkingAddress
{
    public const int MaxLength = 100;

    public ParkingAddress(string address)
    {
        if (string.IsNullOrWhiteSpace(address))
        {
            throw new BusinessException("Parking.InvalidAddress", "Parking address cannot be empty");
        }

        if (address.Length > MaxLength)
        {
            throw new BusinessException(
                "Parking.InvalidAddress",
                $"Parking address cannot be longer than {MaxLength} characters, was {address.Length}.");
        }

        Address = address;
    }

    public string Address { get; }

    public static implicit operator string(ParkingAddress spotName)
    {
        return spotName.Address;
    }
}
