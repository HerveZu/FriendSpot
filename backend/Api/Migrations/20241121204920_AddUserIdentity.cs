using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Api.Migrations
{
    /// <inheritdoc />
    public partial class AddUserIdentity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "UserIdentity",
                table: "ParkingLot",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_ParkingLot_UserIdentity_SpotName",
                table: "ParkingLot",
                columns: new[] { "UserIdentity", "SpotName" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ParkingLot_UserIdentity_SpotName",
                table: "ParkingLot");

            migrationBuilder.DropColumn(
                name: "UserIdentity",
                table: "ParkingLot");
        }
    }
}
