using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Api.Migrations
{
    /// <inheritdoc />
    public partial class AddDeviceUniquenessNotGuaranteedProperty : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "UniquenessNotGuaranteed",
                table: "UserDevice",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            // to prevent from keeping devices that might be duplicated
            migrationBuilder.Sql("truncate table \"UserDevice\"");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UniquenessNotGuaranteed",
                table: "UserDevice");
        }
    }
}
