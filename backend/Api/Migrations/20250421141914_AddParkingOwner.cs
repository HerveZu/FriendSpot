using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Api.Migrations
{
    /// <inheritdoc />
    public partial class AddParkingOwner : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "OwnerId",
                table: "Parking",
                type: "text",
                nullable: false,

                // Hervé Zucchinetti's account
                defaultValue: "0brEs3onLtNr3cvY1rk2CIH8Ao42");

            migrationBuilder.CreateIndex(
                name: "IX_Parking_OwnerId",
                table: "Parking",
                column: "OwnerId");

            migrationBuilder.AddForeignKey(
                name: "FK_Parking_User_OwnerId",
                table: "Parking",
                column: "OwnerId",
                principalTable: "User",
                principalColumn: "Identity",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Parking_User_OwnerId",
                table: "Parking");

            migrationBuilder.DropIndex(
                name: "IX_Parking_OwnerId",
                table: "Parking");

            migrationBuilder.DropColumn(
                name: "OwnerId",
                table: "Parking");
        }
    }
}
