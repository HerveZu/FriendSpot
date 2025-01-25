using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Api.Migrations
{
    /// <inheritdoc />
    public partial class AddUserRating : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "Rating_Rating",
                table: "User",
                type: "numeric",
                nullable: false,
                defaultValue: 1.5m);

            migrationBuilder.AddColumn<int>(
                name: "Rating",
                table: "ParkingSpotBooking",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Rating_Rating",
                table: "User");

            migrationBuilder.DropColumn(
                name: "Rating",
                table: "ParkingSpotBooking");
        }
    }
}
