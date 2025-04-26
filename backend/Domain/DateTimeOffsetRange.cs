using System.Diagnostics.Contracts;

namespace Domain;

public readonly struct DateTimeOffsetRange
{
    public DateTimeOffsetRange(DateTimeOffset from, DateTimeOffset to)
    {
        if (to <= from)
        {
            throw new ArgumentException($"{to} must be greater than {From}.");
        }

        From = from;
        To = to;
    }

    public DateTimeOffset From { get; }
    public DateTimeOffset To { get; }
    public TimeSpan Duration => To - From;

    public bool Overlaps(DateTimeOffsetRange other)
    {
        return Overlaps(other.From, other.To);
    }

    public bool Overlaps(DateTimeOffset from, DateTimeOffset to)
    {
        return From <= to && from <= To;
    }

    [Pure]
    public DateTimeOffsetRange Extend(DateTimeOffset newFrom, DateTimeOffset newTo)
    {
        var from = new[] { From, newFrom }.Min();
        var to = new[] { To, newTo }.Max();

        return new DateTimeOffsetRange(from, to);
    }
}
