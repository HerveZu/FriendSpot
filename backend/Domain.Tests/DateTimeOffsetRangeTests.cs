namespace Domain.Tests;

[TestFixture]
[TestOf(typeof(DateTimeOffsetRange))]
public sealed class DateTimeOffsetRangeTests
{
    [Test]
    public void Constructor_ShouldInitializeProperties_WhenValidValuesAreProvided()
    {
        var from = new DateTimeOffset(2023, 1, 1, 0, 0, 0, TimeSpan.Zero);
        var to = new DateTimeOffset(2023, 1, 2, 0, 0, 0, TimeSpan.Zero);

        var range = new DateTimeOffsetRange(from, to);

        Assert.Multiple(
            () =>
            {
                Assert.That(range.From, Is.EqualTo(from));
                Assert.That(range.To, Is.EqualTo(to));
            });
    }

    [Test]
    public void Constructor_ShouldThrowArgumentException_WhenToIsLessThanFrom()
    {
        var from = new DateTimeOffset(2023, 1, 2, 0, 0, 0, TimeSpan.Zero);
        var to = new DateTimeOffset(2023, 1, 1, 0, 0, 0, TimeSpan.Zero);

        var ex = Assert.Throws<ArgumentException>(() => _ = new DateTimeOffsetRange(from, to));
        Assert.That(ex.Message, Does.Contain("must be greater than"));
    }

    [Test]
    public void Duration_ShouldReturnCorrectTimeSpan()
    {
        var from = new DateTimeOffset(2023, 1, 1, 0, 0, 0, TimeSpan.Zero);
        var to = new DateTimeOffset(2023, 1, 2, 12, 0, 0, TimeSpan.Zero);

        var range = new DateTimeOffsetRange(from, to);

        Assert.That(range.Duration, Is.EqualTo(TimeSpan.FromHours(36)));
    }

    [Test]
    public void Overlaps_ShouldReturnTrue_WhenRangesOverlap()
    {
        var range1 = new DateTimeOffsetRange(
            new DateTimeOffset(2023, 1, 1, 0, 0, 0, TimeSpan.Zero),
            new DateTimeOffset(2023, 1, 3, 0, 0, 0, TimeSpan.Zero)
        );

        var range2 = new DateTimeOffsetRange(
            new DateTimeOffset(2023, 1, 2, 0, 0, 0, TimeSpan.Zero),
            new DateTimeOffset(2023, 1, 4, 0, 0, 0, TimeSpan.Zero)
        );

        Assert.That(range1.Overlaps(range2));
    }

    [Test]
    public void Overlaps_ShouldReturnFalse_WhenRangesDoNotOverlap()
    {
        var range1 = new DateTimeOffsetRange(
            new DateTimeOffset(2023, 1, 1, 0, 0, 0, TimeSpan.Zero),
            new DateTimeOffset(2023, 1, 2, 0, 0, 0, TimeSpan.Zero)
        );

        var range2 = new DateTimeOffsetRange(
            new DateTimeOffset(2023, 1, 3, 0, 0, 0, TimeSpan.Zero),
            new DateTimeOffset(2023, 1, 4, 0, 0, 0, TimeSpan.Zero)
        );

        Assert.That(range1.Overlaps(range2), Is.False);
    }

    [Test]
    public void Overlaps_ShouldReturnTrue_WhenSingleDateOverlaps()
    {
        var range = new DateTimeOffsetRange(
            new DateTimeOffset(2023, 1, 1, 0, 0, 0, TimeSpan.Zero),
            new DateTimeOffset(2023, 1, 5, 0, 0, 0, TimeSpan.Zero)
        );

        Assert.That(
            range.Overlaps(
                new DateTimeOffset(2023, 1, 3, 0, 0, 0, TimeSpan.Zero),
                new DateTimeOffset(2023, 1, 3, 0, 0, 0, TimeSpan.Zero)
            ));
    }

    [Test]
    public void Overlaps_ShouldReturnFalse_WhenRangeIsBefore()
    {
        var range = new DateTimeOffsetRange(
            new DateTimeOffset(2023, 1, 5, 0, 0, 0, TimeSpan.Zero),
            new DateTimeOffset(2023, 1, 10, 0, 0, 0, TimeSpan.Zero)
        );

        Assert.That(
            range.Overlaps(
                new DateTimeOffset(2023, 1, 1, 0, 0, 0, TimeSpan.Zero),
                new DateTimeOffset(2023, 1, 3, 0, 0, 0, TimeSpan.Zero)
            ),
            Is.False);
    }

    [Test]
    public void Extend_ShouldReturnExtendedRange()
    {
        var range = new DateTimeOffsetRange(
            new DateTimeOffset(2023, 1, 2, 0, 0, 0, TimeSpan.Zero),
            new DateTimeOffset(2023, 1, 4, 0, 0, 0, TimeSpan.Zero)
        );

        var extendedRange = range.Extend(
            new DateTimeOffset(2023, 1, 1, 0, 0, 0, TimeSpan.Zero),
            new DateTimeOffset(2023, 1, 5, 0, 0, 0, TimeSpan.Zero)
        );

        Assert.Multiple(
            () =>
            {
                Assert.That(extendedRange.From, Is.EqualTo(new DateTimeOffset(2023, 1, 1, 0, 0, 0, TimeSpan.Zero)));
                Assert.That(extendedRange.To, Is.EqualTo(new DateTimeOffset(2023, 1, 5, 0, 0, 0, TimeSpan.Zero)));
            });
    }

    [Test]
    public void Extend_ShouldReturnSameRange_WhenNoExtensionIsNeeded()
    {
        var range = new DateTimeOffsetRange(
            new DateTimeOffset(2023, 1, 2, 0, 0, 0, TimeSpan.Zero),
            new DateTimeOffset(2023, 1, 4, 0, 0, 0, TimeSpan.Zero)
        );

        var extendedRange = range.Extend(
            new DateTimeOffset(2023, 1, 2, 0, 0, 0, TimeSpan.Zero),
            new DateTimeOffset(2023, 1, 4, 0, 0, 0, TimeSpan.Zero)
        );

        Assert.Multiple(
            () =>
            {
                Assert.That(extendedRange.From, Is.EqualTo(range.From));
                Assert.That(extendedRange.To, Is.EqualTo(range.To));
            });
    }
}
