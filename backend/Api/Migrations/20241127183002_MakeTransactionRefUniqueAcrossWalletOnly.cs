using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Api.Migrations
{
    /// <inheritdoc />
    public partial class MakeTransactionRefUniqueAcrossWalletOnly : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_CreditsTransaction_Reference",
                table: "CreditsTransaction");

            migrationBuilder.CreateIndex(
                name: "IX_CreditsTransaction_WalletId_Reference",
                table: "CreditsTransaction",
                columns: new[] { "WalletId", "Reference" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_CreditsTransaction_WalletId_Reference",
                table: "CreditsTransaction");

            migrationBuilder.CreateIndex(
                name: "IX_CreditsTransaction_Reference",
                table: "CreditsTransaction",
                column: "Reference",
                unique: true);
        }
    }
}
