using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Api.Migrations
{
    /// <inheritdoc />
    public partial class RefactorUserEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("truncate table \"ParkingSpotAvailability\"");
            migrationBuilder.DropForeignKey(
                name: "FK_ParkingSpotAvailability_ParkingLot_ParkingLotId",
                table: "ParkingSpotAvailability");

            migrationBuilder.DropForeignKey(
                name: "FK_Wallet_User_UserIdentity",
                table: "Wallet");

            migrationBuilder.DropTable(
                name: "Booking");

            migrationBuilder.DropTable(
                name: "ParkingLot");

            migrationBuilder.RenameColumn(
                name: "UserIdentity",
                table: "Wallet",
                newName: "UserId");

            migrationBuilder.RenameIndex(
                name: "IX_Wallet_UserIdentity",
                table: "Wallet",
                newName: "IX_Wallet_UserId");

            migrationBuilder.RenameColumn(
                name: "ParkingLotId",
                table: "ParkingSpotAvailability",
                newName: "ParkingSpotId");

            migrationBuilder.CreateTable(
                name: "ParkingSpot",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ParkingId = table.Column<Guid>(type: "uuid", nullable: false),
                    SpotName = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    OwnerId = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ParkingSpot", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ParkingSpot_Parking_ParkingId",
                        column: x => x.ParkingId,
                        principalTable: "Parking",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ParkingSpot_User_OwnerId",
                        column: x => x.OwnerId,
                        principalTable: "User",
                        principalColumn: "Identity",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ParkingSpotBooking",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ParkingSpotId = table.Column<Guid>(type: "uuid", nullable: false),
                    BookingUserId = table.Column<string>(type: "text", nullable: false),
                    From = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    To = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ParkingSpotBooking", x => new { x.ParkingSpotId, x.Id });
                    table.ForeignKey(
                        name: "FK_ParkingSpotBooking_ParkingSpot_ParkingSpotId",
                        column: x => x.ParkingSpotId,
                        principalTable: "ParkingSpot",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ParkingSpotBooking_User_BookingUserId",
                        column: x => x.BookingUserId,
                        principalTable: "User",
                        principalColumn: "Identity",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ParkingSpot_OwnerId",
                table: "ParkingSpot",
                column: "OwnerId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ParkingSpot_OwnerId_SpotName",
                table: "ParkingSpot",
                columns: new[] { "OwnerId", "SpotName" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ParkingSpot_ParkingId",
                table: "ParkingSpot",
                column: "ParkingId");

            migrationBuilder.CreateIndex(
                name: "IX_ParkingSpotBooking_BookingUserId",
                table: "ParkingSpotBooking",
                column: "BookingUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_ParkingSpotAvailability_ParkingSpot_ParkingSpotId",
                table: "ParkingSpotAvailability",
                column: "ParkingSpotId",
                principalTable: "ParkingSpot",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Wallet_User_UserId",
                table: "Wallet",
                column: "UserId",
                principalTable: "User",
                principalColumn: "Identity",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ParkingSpotAvailability_ParkingSpot_ParkingSpotId",
                table: "ParkingSpotAvailability");

            migrationBuilder.DropForeignKey(
                name: "FK_Wallet_User_UserId",
                table: "Wallet");

            migrationBuilder.DropTable(
                name: "ParkingSpotBooking");

            migrationBuilder.DropTable(
                name: "ParkingSpot");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "Wallet",
                newName: "UserIdentity");

            migrationBuilder.RenameIndex(
                name: "IX_Wallet_UserId",
                table: "Wallet",
                newName: "IX_Wallet_UserIdentity");

            migrationBuilder.RenameColumn(
                name: "ParkingSpotId",
                table: "ParkingSpotAvailability",
                newName: "ParkingLotId");

            migrationBuilder.CreateTable(
                name: "ParkingLot",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ParkingId = table.Column<Guid>(type: "uuid", nullable: false),
                    SpotName = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    UserIdentity = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ParkingLot", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ParkingLot_Parking_ParkingId",
                        column: x => x.ParkingId,
                        principalTable: "Parking",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ParkingLot_User_UserIdentity",
                        column: x => x.UserIdentity,
                        principalTable: "User",
                        principalColumn: "Identity",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Booking",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    From = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ParkingLotId = table.Column<Guid>(type: "uuid", nullable: false),
                    To = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UserIdentity = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Booking", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Booking_ParkingLot_ParkingLotId",
                        column: x => x.ParkingLotId,
                        principalTable: "ParkingLot",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Booking_ParkingLotId",
                table: "Booking",
                column: "ParkingLotId");

            migrationBuilder.CreateIndex(
                name: "IX_ParkingLot_ParkingId",
                table: "ParkingLot",
                column: "ParkingId");

            migrationBuilder.CreateIndex(
                name: "IX_ParkingLot_UserIdentity",
                table: "ParkingLot",
                column: "UserIdentity",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ParkingLot_UserIdentity_SpotName",
                table: "ParkingLot",
                columns: new[] { "UserIdentity", "SpotName" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_ParkingSpotAvailability_ParkingLot_ParkingLotId",
                table: "ParkingSpotAvailability",
                column: "ParkingLotId",
                principalTable: "ParkingLot",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Wallet_User_UserIdentity",
                table: "Wallet",
                column: "UserIdentity",
                principalTable: "User",
                principalColumn: "Identity",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
