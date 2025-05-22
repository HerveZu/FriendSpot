using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Api.Migrations
{
    /// <inheritdoc />
    public partial class MakeUserDeviceIdUnique : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("truncate table \"UserDevice\"");

            migrationBuilder.DropPrimaryKey(
                name: "PK_UserDevice",
                table: "UserDevice");

            migrationBuilder.DropColumn(
                name: "Id",
                table: "UserDevice");

            migrationBuilder.AddPrimaryKey(
                name: "PK_UserDevice",
                table: "UserDevice",
                column: "DeviceId");

            migrationBuilder.CreateIndex(
                name: "IX_UserDevice_UserIdentity",
                table: "UserDevice",
                column: "UserIdentity");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_UserDevice",
                table: "UserDevice");

            migrationBuilder.DropIndex(
                name: "IX_UserDevice_UserIdentity",
                table: "UserDevice");

            migrationBuilder.AddColumn<int>(
                name: "Id",
                table: "UserDevice",
                type: "integer",
                nullable: false,
                defaultValue: 0)
                .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

            migrationBuilder.AddPrimaryKey(
                name: "PK_UserDevice",
                table: "UserDevice",
                columns: new[] { "UserIdentity", "Id" });
        }
    }
}
