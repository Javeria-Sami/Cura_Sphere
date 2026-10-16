using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace CuraSphere.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "audit");

            migrationBuilder.EnsureSchema(
                name: "patient");

            migrationBuilder.EnsureSchema(
                name: "hr");

            migrationBuilder.EnsureSchema(
                name: "security");

            migrationBuilder.CreateTable(
                name: "blood_group",
                schema: "patient",
                columns: table => new
                {
                    blood_group_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    blood_group_name = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    description = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedBy = table.Column<long>(type: "bigint", nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<long>(type: "bigint", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_blood_group", x => x.blood_group_id);
                });

            migrationBuilder.CreateTable(
                name: "department",
                schema: "hr",
                columns: table => new
                {
                    department_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    department_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    department_code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    location = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    extension_number = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    head_doctor_id = table.Column<long>(type: "bigint", nullable: true),
                    description = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedBy = table.Column<long>(type: "bigint", nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<long>(type: "bigint", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_department", x => x.department_id);
                });

            migrationBuilder.CreateTable(
                name: "marital_status",
                schema: "patient",
                columns: table => new
                {
                    marital_status_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    status_name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedBy = table.Column<long>(type: "bigint", nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<long>(type: "bigint", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_marital_status", x => x.marital_status_id);
                });

            migrationBuilder.CreateTable(
                name: "nationality",
                schema: "patient",
                columns: table => new
                {
                    nationality_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    country_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    country_code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedBy = table.Column<long>(type: "bigint", nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<long>(type: "bigint", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_nationality", x => x.nationality_id);
                });

            migrationBuilder.CreateTable(
                name: "permission",
                schema: "security",
                columns: table => new
                {
                    permission_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    permission_name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    module_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_permission", x => x.permission_id);
                });

            migrationBuilder.CreateTable(
                name: "religion",
                schema: "patient",
                columns: table => new
                {
                    religion_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    religion_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedBy = table.Column<long>(type: "bigint", nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<long>(type: "bigint", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_religion", x => x.religion_id);
                });

            migrationBuilder.CreateTable(
                name: "role",
                schema: "security",
                columns: table => new
                {
                    role_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    role_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedBy = table.Column<long>(type: "bigint", nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<long>(type: "bigint", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_role", x => x.role_id);
                });

            migrationBuilder.CreateTable(
                name: "specialization",
                schema: "hr",
                columns: table => new
                {
                    specialization_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    specialization_name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedBy = table.Column<long>(type: "bigint", nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<long>(type: "bigint", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_specialization", x => x.specialization_id);
                });

            migrationBuilder.CreateTable(
                name: "employee",
                schema: "hr",
                columns: table => new
                {
                    employee_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    employee_code = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    first_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    last_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    gender = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    date_of_birth = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    phone_number = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    email = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    hire_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    designation = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    department_id = table.Column<long>(type: "bigint", nullable: false),
                    salary = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    employment_status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false, defaultValue: "Active"),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedBy = table.Column<long>(type: "bigint", nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<long>(type: "bigint", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_employee", x => x.employee_id);
                    table.ForeignKey(
                        name: "FK_employee_department_department_id",
                        column: x => x.department_id,
                        principalSchema: "hr",
                        principalTable: "department",
                        principalColumn: "department_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "patient",
                schema: "patient",
                columns: table => new
                {
                    patient_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    medical_record_number = table.Column<string>(type: "character varying(25)", maxLength: 25, nullable: false),
                    first_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    middle_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    last_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    gender = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    date_of_birth = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    age = table.Column<int>(type: "integer", nullable: true),
                    cnic_passport = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    phone_number = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    alternate_phone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    email = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    blood_group_id = table.Column<long>(type: "bigint", nullable: true),
                    marital_status_id = table.Column<long>(type: "bigint", nullable: true),
                    nationality_id = table.Column<long>(type: "bigint", nullable: true),
                    religion_id = table.Column<long>(type: "bigint", nullable: true),
                    address = table.Column<string>(type: "text", nullable: false),
                    city = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    province = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    postal_code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    emergency_contact_name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    emergency_contact_phone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    emergency_relationship = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    patient_photo = table.Column<string>(type: "text", nullable: true),
                    registration_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    patient_status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false, defaultValue: "Active"),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedBy = table.Column<long>(type: "bigint", nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<long>(type: "bigint", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_patient", x => x.patient_id);
                    table.ForeignKey(
                        name: "FK_patient_blood_group_blood_group_id",
                        column: x => x.blood_group_id,
                        principalSchema: "patient",
                        principalTable: "blood_group",
                        principalColumn: "blood_group_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_patient_marital_status_marital_status_id",
                        column: x => x.marital_status_id,
                        principalSchema: "patient",
                        principalTable: "marital_status",
                        principalColumn: "marital_status_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_patient_nationality_nationality_id",
                        column: x => x.nationality_id,
                        principalSchema: "patient",
                        principalTable: "nationality",
                        principalColumn: "nationality_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_patient_religion_religion_id",
                        column: x => x.religion_id,
                        principalSchema: "patient",
                        principalTable: "religion",
                        principalColumn: "religion_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "role_permission",
                schema: "security",
                columns: table => new
                {
                    role_permission_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    role_id = table.Column<long>(type: "bigint", nullable: false),
                    permission_id = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_role_permission", x => x.role_permission_id);
                    table.ForeignKey(
                        name: "FK_role_permission_permission_permission_id",
                        column: x => x.permission_id,
                        principalSchema: "security",
                        principalTable: "permission",
                        principalColumn: "permission_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_role_permission_role_role_id",
                        column: x => x.role_id,
                        principalSchema: "security",
                        principalTable: "role",
                        principalColumn: "role_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "doctor",
                schema: "hr",
                columns: table => new
                {
                    doctor_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    employee_id = table.Column<long>(type: "bigint", nullable: false),
                    doctor_code = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    license_number = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    department_id = table.Column<long>(type: "bigint", nullable: false),
                    specialization_id = table.Column<long>(type: "bigint", nullable: false),
                    consultation_fee = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    years_of_experience = table.Column<int>(type: "integer", nullable: false),
                    qualification = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    consultation_duration = table.Column<int>(type: "integer", nullable: false, defaultValue: 15),
                    is_available_online = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false, defaultValue: "Active"),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedBy = table.Column<long>(type: "bigint", nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<long>(type: "bigint", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_doctor", x => x.doctor_id);
                    table.ForeignKey(
                        name: "FK_doctor_department_department_id",
                        column: x => x.department_id,
                        principalSchema: "hr",
                        principalTable: "department",
                        principalColumn: "department_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_doctor_employee_employee_id",
                        column: x => x.employee_id,
                        principalSchema: "hr",
                        principalTable: "employee",
                        principalColumn: "employee_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_doctor_specialization_specialization_id",
                        column: x => x.specialization_id,
                        principalSchema: "hr",
                        principalTable: "specialization",
                        principalColumn: "specialization_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "user_account",
                schema: "security",
                columns: table => new
                {
                    user_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    username = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    password_hash = table.Column<string>(type: "text", nullable: false),
                    employee_id = table.Column<long>(type: "bigint", nullable: true),
                    role_id = table.Column<long>(type: "bigint", nullable: false),
                    last_login = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    account_status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false, defaultValue: "Active"),
                    failed_login_attempts = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    password_changed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedBy = table.Column<long>(type: "bigint", nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<long>(type: "bigint", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_account", x => x.user_id);
                    table.ForeignKey(
                        name: "FK_user_account_employee_employee_id",
                        column: x => x.employee_id,
                        principalSchema: "hr",
                        principalTable: "employee",
                        principalColumn: "employee_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_user_account_role_role_id",
                        column: x => x.role_id,
                        principalSchema: "security",
                        principalTable: "role",
                        principalColumn: "role_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "patient_guardian",
                schema: "patient",
                columns: table => new
                {
                    guardian_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    patient_id = table.Column<long>(type: "bigint", nullable: false),
                    guardian_name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    relationship = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    phone_number = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    email = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    address = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedBy = table.Column<long>(type: "bigint", nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<long>(type: "bigint", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_patient_guardian", x => x.guardian_id);
                    table.ForeignKey(
                        name: "FK_patient_guardian_patient_patient_id",
                        column: x => x.patient_id,
                        principalSchema: "patient",
                        principalTable: "patient",
                        principalColumn: "patient_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "patient_insurance",
                schema: "patient",
                columns: table => new
                {
                    patient_insurance_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    patient_id = table.Column<long>(type: "bigint", nullable: false),
                    insurance_provider_id = table.Column<long>(type: "bigint", nullable: false),
                    policy_number = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    member_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    coverage_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    valid_from = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    valid_to = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    coverage_percentage = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    deductible_amount = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Active"),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedBy = table.Column<long>(type: "bigint", nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<long>(type: "bigint", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_patient_insurance", x => x.patient_insurance_id);
                    table.ForeignKey(
                        name: "FK_patient_insurance_patient_patient_id",
                        column: x => x.patient_id,
                        principalSchema: "patient",
                        principalTable: "patient",
                        principalColumn: "patient_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "audit_log",
                schema: "audit",
                columns: table => new
                {
                    audit_log_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<long>(type: "bigint", nullable: true),
                    module_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    action_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    affected_record = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    previous_value = table.Column<string>(type: "jsonb", nullable: true),
                    new_value = table.Column<string>(type: "jsonb", nullable: true),
                    action_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    ip_address = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_audit_log", x => x.audit_log_id);
                    table.ForeignKey(
                        name: "FK_audit_log_user_account_user_id",
                        column: x => x.user_id,
                        principalSchema: "security",
                        principalTable: "user_account",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "user_session",
                schema: "security",
                columns: table => new
                {
                    session_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<long>(type: "bigint", nullable: false),
                    login_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    logout_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ip_address = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    device_information = table.Column<string>(type: "text", nullable: false),
                    session_status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false, defaultValue: "Active")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_session", x => x.session_id);
                    table.ForeignKey(
                        name: "FK_user_session_user_account_user_id",
                        column: x => x.user_id,
                        principalSchema: "security",
                        principalTable: "user_account",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_audit_log_user_id",
                schema: "audit",
                table: "audit_log",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_department_department_code",
                schema: "hr",
                table: "department",
                column: "department_code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_department_department_name",
                schema: "hr",
                table: "department",
                column: "department_name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_doctor_department_id",
                schema: "hr",
                table: "doctor",
                column: "department_id");

            migrationBuilder.CreateIndex(
                name: "IX_doctor_doctor_code",
                schema: "hr",
                table: "doctor",
                column: "doctor_code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_doctor_employee_id",
                schema: "hr",
                table: "doctor",
                column: "employee_id");

            migrationBuilder.CreateIndex(
                name: "IX_doctor_license_number",
                schema: "hr",
                table: "doctor",
                column: "license_number",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_doctor_specialization_id",
                schema: "hr",
                table: "doctor",
                column: "specialization_id");

            migrationBuilder.CreateIndex(
                name: "IX_employee_department_id",
                schema: "hr",
                table: "employee",
                column: "department_id");

            migrationBuilder.CreateIndex(
                name: "IX_employee_employee_code",
                schema: "hr",
                table: "employee",
                column: "employee_code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_patient_blood_group_id",
                schema: "patient",
                table: "patient",
                column: "blood_group_id");

            migrationBuilder.CreateIndex(
                name: "IX_patient_marital_status_id",
                schema: "patient",
                table: "patient",
                column: "marital_status_id");

            migrationBuilder.CreateIndex(
                name: "IX_patient_medical_record_number",
                schema: "patient",
                table: "patient",
                column: "medical_record_number",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_patient_nationality_id",
                schema: "patient",
                table: "patient",
                column: "nationality_id");

            migrationBuilder.CreateIndex(
                name: "IX_patient_religion_id",
                schema: "patient",
                table: "patient",
                column: "religion_id");

            migrationBuilder.CreateIndex(
                name: "IX_patient_guardian_patient_id",
                schema: "patient",
                table: "patient_guardian",
                column: "patient_id");

            migrationBuilder.CreateIndex(
                name: "IX_patient_insurance_patient_id",
                schema: "patient",
                table: "patient_insurance",
                column: "patient_id");

            migrationBuilder.CreateIndex(
                name: "IX_permission_permission_name",
                schema: "security",
                table: "permission",
                column: "permission_name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_role_role_name",
                schema: "security",
                table: "role",
                column: "role_name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_role_permission_permission_id",
                schema: "security",
                table: "role_permission",
                column: "permission_id");

            migrationBuilder.CreateIndex(
                name: "IX_role_permission_role_id",
                schema: "security",
                table: "role_permission",
                column: "role_id");

            migrationBuilder.CreateIndex(
                name: "IX_specialization_specialization_name",
                schema: "hr",
                table: "specialization",
                column: "specialization_name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_user_account_employee_id",
                schema: "security",
                table: "user_account",
                column: "employee_id");

            migrationBuilder.CreateIndex(
                name: "IX_user_account_role_id",
                schema: "security",
                table: "user_account",
                column: "role_id");

            migrationBuilder.CreateIndex(
                name: "IX_user_account_username",
                schema: "security",
                table: "user_account",
                column: "username",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_user_session_user_id",
                schema: "security",
                table: "user_session",
                column: "user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "audit_log",
                schema: "audit");

            migrationBuilder.DropTable(
                name: "doctor",
                schema: "hr");

            migrationBuilder.DropTable(
                name: "patient_guardian",
                schema: "patient");

            migrationBuilder.DropTable(
                name: "patient_insurance",
                schema: "patient");

            migrationBuilder.DropTable(
                name: "role_permission",
                schema: "security");

            migrationBuilder.DropTable(
                name: "user_session",
                schema: "security");

            migrationBuilder.DropTable(
                name: "specialization",
                schema: "hr");

            migrationBuilder.DropTable(
                name: "patient",
                schema: "patient");

            migrationBuilder.DropTable(
                name: "permission",
                schema: "security");

            migrationBuilder.DropTable(
                name: "user_account",
                schema: "security");

            migrationBuilder.DropTable(
                name: "blood_group",
                schema: "patient");

            migrationBuilder.DropTable(
                name: "marital_status",
                schema: "patient");

            migrationBuilder.DropTable(
                name: "nationality",
                schema: "patient");

            migrationBuilder.DropTable(
                name: "religion",
                schema: "patient");

            migrationBuilder.DropTable(
                name: "employee",
                schema: "hr");

            migrationBuilder.DropTable(
                name: "role",
                schema: "security");

            migrationBuilder.DropTable(
                name: "department",
                schema: "hr");
        }
    }
}
