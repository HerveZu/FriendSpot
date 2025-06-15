using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Api.Migrations
{
    /// <inheritdoc />
    public partial class AddParkingBookingRequestAcceptedByUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AcceptedByUserId",
                table: "ParkingBookingRequest",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ParkingBookingRequest_AcceptedByUserId",
                table: "ParkingBookingRequest",
                column: "AcceptedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_ParkingBookingRequest_User_AcceptedByUserId",
                table: "ParkingBookingRequest",
                column: "AcceptedByUserId",
                principalTable: "User",
                principalColumn: "Identity");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ParkingBookingRequest_User_AcceptedByUserId",
                table: "ParkingBookingRequest");

            migrationBuilder.DropIndex(
                name: "IX_ParkingBookingRequest_AcceptedByUserId",
                table: "ParkingBookingRequest");

            migrationBuilder.DropColumn(
                name: "AcceptedByUserId",
                table: "ParkingBookingRequest");
        }
    }
}
