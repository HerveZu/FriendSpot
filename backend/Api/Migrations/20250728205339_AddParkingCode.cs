using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Api.Migrations
{
    /// <inheritdoc />
    public partial class AddParkingCode : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Code",
                table: "Parking",
                type: "text",
                nullable: false,
                defaultValueSql: "concat('P-', upper(right(gen_random_uuid()::text, 6)))");

            migrationBuilder.CreateIndex(
                name: "IX_Parking_Code",
                table: "Parking",
                column: "Code",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Parking_Code",
                table: "Parking");

            migrationBuilder.DropColumn(
                name: "Code",
                table: "Parking");
        }
    }
}
