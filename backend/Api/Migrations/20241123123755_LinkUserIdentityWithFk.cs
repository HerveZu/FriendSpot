using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Api.Migrations
{
    /// <inheritdoc />
    public partial class LinkUserIdentityWithFk : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Wallet_UserIdentity",
                table: "Wallet",
                column: "UserIdentity",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ParkingLot_UserIdentity",
                table: "ParkingLot",
                column: "UserIdentity",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_ParkingLot_User_UserIdentity",
                table: "ParkingLot",
                column: "UserIdentity",
                principalTable: "User",
                principalColumn: "Identity",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Wallet_User_UserIdentity",
                table: "Wallet",
                column: "UserIdentity",
                principalTable: "User",
                principalColumn: "Identity",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ParkingLot_User_UserIdentity",
                table: "ParkingLot");

            migrationBuilder.DropForeignKey(
                name: "FK_Wallet_User_UserIdentity",
                table: "Wallet");

            migrationBuilder.DropIndex(
                name: "IX_Wallet_UserIdentity",
                table: "Wallet");

            migrationBuilder.DropIndex(
                name: "IX_ParkingLot_UserIdentity",
                table: "ParkingLot");
        }
    }
}
