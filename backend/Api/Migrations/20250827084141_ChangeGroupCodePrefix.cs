using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Api.Migrations
{
    /// <inheritdoc />
    public partial class ChangeGroupCodePrefix : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                update "Parking" 
                set "Code" = replace("Parking"."Code", 'P-', 'F-')
                where true
                """);

            migrationBuilder.AlterColumn<string>(
                name: "Code",
                table: "Parking",
                type: "text",
                nullable: false,
                defaultValueSql: "concat('F-', upper(right(gen_random_uuid()::text, 6)))");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                update "Parking" 
                set "Code" = replace("Parking"."Code", 'F-', 'P-')
                where true
                """);

            migrationBuilder.AlterColumn<string>(
                name: "Code",
                table: "Parking",
                type: "text",
                nullable: false,
                defaultValueSql: "concat('P-', upper(right(gen_random_uuid()::text, 6)))");
        }
    }
}
