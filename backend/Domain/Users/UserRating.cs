namespace Domain.Users;

public sealed record UserRating
{
    private const int MaxStar = 3;

    private UserRating(decimal rating)
    {
        Rating = rating;
    }

    public decimal Rating { get; private set; }

    public static UserRating Neutral()
    {
        return new UserRating((decimal)MaxStar / 2);
    }

    public void NeutralIncrease()
    {
        Rating = Math.Min(MaxStar, Rating + 0.05m);
    }

    public void GoodIncrease()
    {
        Rating = Math.Min(MaxStar, Rating + 0.2m);
    }

    public void BadDecrease()
    {
        Rating = Math.Max(0, Rating - 0.2m);
    }
}