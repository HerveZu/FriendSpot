using Domain.Users;
using JetBrains.Annotations;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Domain.Parkings;

public sealed record ParkingDeleted : IDomainEvent
{
    public required Guid ParkingId { get; init; }
}

public sealed record BookingRequested : IDomainEvent
{
    public required Guid ParkingId { get; init; }
    public required Guid RequestId { get; init; }
    public required string RequesterId { get; init; }
    public required Credits Cost { get; init; }
    public required DateTimeOffsetRange Date { get; init; }
}

public sealed record BookingRequestExpired : IDomainEvent
{
    public required Guid RequestId { get; init; }
    public required string RequesterId { get; init; }
}

public sealed record BookingRequestCancelled : IDomainEvent
{
    public required string CancelledByUserId { get; init; }
}

public sealed record BookingRequestAccepted : IDomainEvent
{
    public required Guid RequestId { get; init; }
    public required string RequesterId { get; init; }
    public required string AcceptedByUserId { get; init; }
    public required DateTimeOffsetRange Date { get; init; }
    public required Credits Bonus { get; init; }
}

public sealed class Parking : IAggregateRoot
{
    private readonly List<ParkingBookingRequest> _bookingRequests = [];
    private readonly DomainEvents _domainEvents = new();

    private Parking(
        Guid id,
        string ownerId,
        ParkingName name,
        ParkingAddress address,
        ParkingCode code,
        uint maxSpotCount)
    {
        Id = id;
        OwnerId = ownerId;
        Name = name;
        Address = address;
        Code = code;
        MaxSpotCount = maxSpotCount;
    }

    private Parking(
        Guid id,
        string ownerId,
        ParkingName name,
        ParkingAddress address,
        ParkingCode code,
        uint maxSpotCount,
        List<ParkingBookingRequest>? bookingRequests = null)
    {
        Id = id;
        OwnerId = ownerId;
        Name = name;
        Address = address;
        Code = code;
        MaxSpotCount = maxSpotCount;
        _bookingRequests = bookingRequests ?? [];
    }

    public Guid Id { get; }
    public ParkingCode Code { get; }
    public string OwnerId { get; private set; }
    public ParkingName Name { get; private set; }
    public ParkingAddress Address { get; private set; }
    public uint MaxSpotCount { get; }
    public IReadOnlyList<ParkingBookingRequest> BookingRequests => _bookingRequests.AsReadOnly();

    public IEnumerable<IDomainEvent> GetUncommittedEvents()
    {
        return _domainEvents.GetUncommittedEvents();
    }

    public static Parking Create(string ownerId, string name, string address)
    {
        return new Parking(
            Guid.CreateVersion7(),
            ownerId,
            new ParkingName(name),
            new ParkingAddress(address),
            ParkingCode.NewRandom(6),
            10);
    }

    public ParkingBookingRequest RequestBooking(
        string requesterId,
        DateTimeOffset from,
        DateTimeOffset to,
        Credits bonus)
    {
        var request = ParkingBookingRequest.New(requesterId, from, to, bonus);
        _bookingRequests.Add(request);

        _domainEvents.RegisterNext(
            new BookingRequested
            {
                ParkingId = Id,
                RequestId = request.Id,
                RequesterId = requesterId,
                Cost = request.Cost,
                Date = request.DateRange
            });

        return request;
    }

    public void AcceptBookingRequest(string userId, Guid requestId)
    {
        var request = _bookingRequests.SingleOrDefault(request => request.Id == requestId);

        if (request is null)
        {
            throw new BusinessException("Parking.BookingRequestNotFound", "No booking request found.");
        }

        request.Accept(userId);

        // expires BEFORE being accepted
        _domainEvents.RegisterNext(
            new BookingRequestExpired
            {
                RequestId = request.Id,
                RequesterId = request.RequesterId,
            });

        _domainEvents.RegisterNext(
            new BookingRequestAccepted
            {
                AcceptedByUserId = userId,
                RequesterId = request.RequesterId,
                RequestId = request.Id,
                Date = request.DateRange,
                Bonus = request.Bonus
            });
    }

    public void CancelBookingRequest(string userId, Guid requestId)
    {
        var request = _bookingRequests.SingleOrDefault(request => request.Id == requestId);

        if (request is null)
        {
            throw new BusinessException("Parking.BookingRequestNotFound", "No booking request found.");
        }

        if (!request.CanCancel(userId))
        {
            throw new BusinessException("Parking.CannotCancelBookingRequest", "The request cannot be cancelled.");
        }

        _bookingRequests.Remove(request);

        _domainEvents.RegisterNext(
            new BookingRequestCancelled
            {
                CancelledByUserId = userId
            });

        _domainEvents.RegisterNext(
            new BookingRequestExpired
            {
                RequestId = request.Id,
                RequesterId = request.RequesterId,
            });
    }

    public bool TryMarkBookingRequestExpired(Guid requestId)
    {
        var request = _bookingRequests.SingleOrDefault(request => request.Id == requestId);

        if (request is null)
        {
            throw new BusinessException("Parking.BookingRequestNotFound", "No booking request found.");
        }

        if (request.Accepted)
        {
            return false;
        }

        _bookingRequests.Remove(request);

        _domainEvents.RegisterNext(
            new BookingRequestExpired
            {
                RequestId = request.Id,
                RequesterId = request.RequesterId,
            });

        return true;
    }

    public void TransferOwnership(string newOwnerId)
    {
        if (OwnerId == newOwnerId)
        {
            throw new BusinessException("Parking.InvalidTransfer", "The owner cannot transfer the parking to himself.");
        }

        OwnerId = newOwnerId;
    }

    public void EditInfo([UsedImplicitly] string updatingUserId, string newName, string newAddress)
    {
        if (updatingUserId != OwnerId)
        {
            throw new BusinessException("Parking.InvalidEditing", "Only the owner can edit the parking info.");
        }

        Name = new ParkingName(newName);
        Address = new ParkingAddress(newAddress);
    }

    public void Delete([UsedImplicitly] string deletingUserId)
    {
        if (deletingUserId != OwnerId)
        {
            throw new BusinessException("Parking.InvalidDeletion", "Only the owner can delete the parking.");
        }

        _domainEvents.RegisterNext(new ParkingDeleted { ParkingId = Id });
    }
}

internal sealed class ParkingConfig : IEntityConfiguration<Parking>
{
    public void Configure(EntityTypeBuilder<Parking> builder)
    {
        builder.HasKey(x => x.Id);
        builder.HasOne<User>().WithMany().HasForeignKey(x => x.OwnerId);

        builder
            .Property(x => x.Code)
            .HasConversion(x => x.Value, x => new ParkingCode(x));

        builder.Property(x => x.MaxSpotCount);

        builder.HasIndex(x => x.Code).IsUnique();

        builder
            .Property(x => x.Name)
            .HasConversion<string>(x => x.Name, x => new ParkingName(x))
            .HasMaxLength(ParkingName.MaxLength);

        builder
            .Property(x => x.Address)
            .HasConversion<string>(x => x.Address, x => new ParkingAddress(x))
            .HasMaxLength(ParkingAddress.MaxLength);

        builder.OwnsMany(
            x => x.BookingRequests,
            bookingBuilder =>
            {
                bookingBuilder.Property(x => x.Id);
                bookingBuilder.Property(x => x.From);
                bookingBuilder.Property(x => x.To);
                bookingBuilder
                    .Property(x => x.Bonus)
                    .HasConversion(x => x.Amount, x => new Credits(x));
                bookingBuilder.Ignore(x => x.DateRange);

                bookingBuilder
                    .HasOne<User>()
                    .WithMany()
                    .HasForeignKey(x => x.RequesterId);

                bookingBuilder
                    .HasOne<User>()
                    .WithMany()
                    .HasForeignKey(x => x.AcceptedByUserId);
            });
    }
}
