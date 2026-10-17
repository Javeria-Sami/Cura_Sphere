using Microsoft.EntityFrameworkCore;
using CuraSphere.Domain.Entities;

namespace CuraSphere.Infrastructure.Persistence;

public class CuraSphereDbContext : DbContext
{
    public CuraSphereDbContext(DbContextOptions<CuraSphereDbContext> options) : base(options)
    {
    }

    public DbSet<BloodGroup> BloodGroups { get; set; } = null!;
    public DbSet<MaritalStatus> MaritalStatuses { get; set; } = null!;
    public DbSet<Religion> Religions { get; set; } = null!;
    public DbSet<Nationality> Nationalities { get; set; } = null!;
    public DbSet<Patient> Patients { get; set; } = null!;
    public DbSet<PatientGuardian> PatientGuardians { get; set; } = null!;
    public DbSet<PatientInsurance> PatientInsurances { get; set; } = null!;
    
    public DbSet<Department> Departments { get; set; } = null!;
    public DbSet<Specialization> Specializations { get; set; } = null!;
    public DbSet<Employee> Employees { get; set; } = null!;
    public DbSet<Doctor> Doctors { get; set; } = null!;
    
    public DbSet<Role> Roles { get; set; } = null!;
    public DbSet<Permission> Permissions { get; set; } = null!;
    public DbSet<RolePermission> RolePermissions { get; set; } = null!;
    public DbSet<UserAccount> UserAccounts { get; set; } = null!;
    public DbSet<UserSession> UserSessions { get; set; } = null!;
    
    public DbSet<AuditLog> AuditLogs { get; set; } = null!;
    public DbSet<PatientDocument> PatientDocuments { get; set; } = null!;

    // Clinical & OPD
    public DbSet<Appointment> Appointments { get; set; } = null!;
    public DbSet<OpdToken> OpdTokens { get; set; } = null!;
    public DbSet<EmrEncounter> EmrEncounters { get; set; } = null!;

    // Inpatient & Emergency
    public DbSet<Ward> Wards { get; set; } = null!;
    public DbSet<Bed> Beds { get; set; } = null!;
    public DbSet<IpdAdmission> IpdAdmissions { get; set; } = null!;
    public DbSet<EmergencyCase> EmergencyCases { get; set; } = null!;

    // Diagnostics
    public DbSet<LabOrder> LabOrders { get; set; } = null!;
    public DbSet<RadiologyStudy> RadiologyStudies { get; set; } = null!;

    // Financial
    public DbSet<Invoice> Invoices { get; set; } = null!;
    public DbSet<PaymentRecord> PaymentRecords { get; set; } = null!;
    public DbSet<InsuranceClaimRecord> InsuranceClaims { get; set; } = null!;

    // Operations
    public DbSet<InventoryItem> InventoryItems { get; set; } = null!;
    public DbSet<AttendanceRecord> AttendanceRecords { get; set; } = null!;

    // Clinical Services
    public DbSet<PharmacyStock> PharmacyStocks { get; set; } = null!;
    public DbSet<SurgicalProcedure> SurgicalProcedures { get; set; } = null!;
    public DbSet<IcuPatientVital> IcuPatientVitals { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure Patient schema tables
        modelBuilder.Entity<BloodGroup>(entity =>
        {
            entity.ToTable("blood_group", "patient");
            entity.HasKey(e => e.BloodGroupId);
            entity.Property(e => e.BloodGroupId).HasColumnName("blood_group_id");
            entity.Property(e => e.BloodGroupName).HasColumnName("blood_group_name").HasMaxLength(10).IsRequired();
            entity.Property(e => e.Description).HasColumnName("description").HasMaxLength(100);
        });

        modelBuilder.Entity<MaritalStatus>(entity =>
        {
            entity.ToTable("marital_status", "patient");
            entity.HasKey(e => e.MaritalStatusId);
            entity.Property(e => e.MaritalStatusId).HasColumnName("marital_status_id");
            entity.Property(e => e.StatusName).HasColumnName("status_name").HasMaxLength(50).IsRequired();
        });

        modelBuilder.Entity<Religion>(entity =>
        {
            entity.ToTable("religion", "patient");
            entity.HasKey(e => e.ReligionId);
            entity.Property(e => e.ReligionId).HasColumnName("religion_id");
            entity.Property(e => e.ReligionName).HasColumnName("religion_name").HasMaxLength(100).IsRequired();
        });

        modelBuilder.Entity<Nationality>(entity =>
        {
            entity.ToTable("nationality", "patient");
            entity.HasKey(e => e.NationalityId);
            entity.Property(e => e.NationalityId).HasColumnName("nationality_id");
            entity.Property(e => e.CountryName).HasColumnName("country_name").HasMaxLength(100).IsRequired();
            entity.Property(e => e.CountryCode).HasColumnName("country_code").HasMaxLength(10).IsRequired();
        });

        modelBuilder.Entity<Patient>(entity =>
        {
            entity.ToTable("patient", "patient");
            entity.HasKey(e => e.PatientId);
            entity.Property(e => e.PatientId).HasColumnName("patient_id");
            entity.Property(e => e.MedicalRecordNumber).HasColumnName("medical_record_number").HasMaxLength(25).IsRequired();
            entity.HasIndex(e => e.MedicalRecordNumber).IsUnique();
            
            entity.Property(e => e.FirstName).HasColumnName("first_name").HasMaxLength(100).IsRequired();
            entity.Property(e => e.MiddleName).HasColumnName("middle_name").HasMaxLength(100);
            entity.Property(e => e.LastName).HasColumnName("last_name").HasMaxLength(100).IsRequired();
            entity.Property(e => e.Gender).HasColumnName("gender").HasMaxLength(20).IsRequired();
            entity.Property(e => e.DateOfBirth).HasColumnName("date_of_birth").IsRequired();
            entity.Property(e => e.Age).HasColumnName("age");
            entity.Property(e => e.CnicPassport).HasColumnName("cnic_passport").HasMaxLength(20);
            entity.Property(e => e.PhoneNumber).HasColumnName("phone_number").HasMaxLength(20).IsRequired();
            entity.Property(e => e.AlternatePhone).HasColumnName("alternate_phone").HasMaxLength(20);
            entity.Property(e => e.Email).HasColumnName("email").HasMaxLength(150);
            
            entity.Property(e => e.BloodGroupId).HasColumnName("blood_group_id");
            entity.Property(e => e.MaritalStatusId).HasColumnName("marital_status_id");
            entity.Property(e => e.NationalityId).HasColumnName("nationality_id");
            entity.Property(e => e.ReligionId).HasColumnName("religion_id");
            
            entity.Property(e => e.Address).HasColumnName("address").IsRequired();
            entity.Property(e => e.City).HasColumnName("city").HasMaxLength(100).IsRequired();
            entity.Property(e => e.Province).HasColumnName("province").HasMaxLength(100).IsRequired();
            entity.Property(e => e.PostalCode).HasColumnName("postal_code").HasMaxLength(20);
            
            entity.Property(e => e.EmergencyContactName).HasColumnName("emergency_contact_name").HasMaxLength(150).IsRequired();
            entity.Property(e => e.EmergencyContactPhone).HasColumnName("emergency_contact_phone").HasMaxLength(20).IsRequired();
            entity.Property(e => e.EmergencyRelationship).HasColumnName("emergency_relationship").HasMaxLength(50).IsRequired();
            
            entity.Property(e => e.PatientPhoto).HasColumnName("patient_photo");
            entity.Property(e => e.RegistrationDate).HasColumnName("registration_date").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.PatientStatus).HasColumnName("patient_status").HasMaxLength(30).IsRequired().HasDefaultValue("Active");

            // Relationships
            entity.HasOne(e => e.BloodGroup)
                .WithMany()
                .HasForeignKey(e => e.BloodGroupId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.MaritalStatus)
                .WithMany()
                .HasForeignKey(e => e.MaritalStatusId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Nationality)
                .WithMany()
                .HasForeignKey(e => e.NationalityId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Religion)
                .WithMany()
                .HasForeignKey(e => e.ReligionId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<PatientGuardian>(entity =>
        {
            entity.ToTable("patient_guardian", "patient");
            entity.HasKey(e => e.GuardianId);
            entity.Property(e => e.GuardianId).HasColumnName("guardian_id");
            entity.Property(e => e.PatientId).HasColumnName("patient_id").IsRequired();
            entity.Property(e => e.GuardianName).HasColumnName("guardian_name").HasMaxLength(150).IsRequired();
            entity.Property(e => e.Relationship).HasColumnName("relationship").HasMaxLength(50).IsRequired();
            entity.Property(e => e.PhoneNumber).HasColumnName("phone_number").HasMaxLength(20).IsRequired();
            entity.Property(e => e.Email).HasColumnName("email").HasMaxLength(150);
            entity.Property(e => e.Address).HasColumnName("address").IsRequired();

            entity.HasOne(e => e.Patient)
                .WithMany(p => p.Guardians)
                .HasForeignKey(e => e.PatientId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PatientInsurance>(entity =>
        {
            entity.ToTable("patient_insurance", "patient");
            entity.HasKey(e => e.PatientInsuranceId);
            entity.Property(e => e.PatientInsuranceId).HasColumnName("patient_insurance_id");
            entity.Property(e => e.PatientId).HasColumnName("patient_id").IsRequired();
            entity.Property(e => e.InsuranceProviderId).HasColumnName("insurance_provider_id").IsRequired();
            entity.Property(e => e.PolicyNumber).HasColumnName("policy_number").HasMaxLength(100).IsRequired();
            entity.Property(e => e.MemberId).HasColumnName("member_id").HasMaxLength(100).IsRequired();
            entity.Property(e => e.CoverageType).HasColumnName("coverage_type").HasMaxLength(50).IsRequired();
            entity.Property(e => e.ValidFrom).HasColumnName("valid_from").IsRequired();
            entity.Property(e => e.ValidTo).HasColumnName("valid_to").IsRequired();
            entity.Property(e => e.CoveragePercentage).HasColumnName("coverage_percentage").HasPrecision(5, 2).IsRequired();
            entity.Property(e => e.DeductibleAmount).HasColumnName("deductible_amount").HasPrecision(12, 2).IsRequired();
            entity.Property(e => e.Status).HasColumnName("status").HasMaxLength(20).IsRequired().HasDefaultValue("Active");

            entity.HasOne(e => e.Patient)
                .WithMany(p => p.Insurances)
                .HasForeignKey(e => e.PatientId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Configure HR schema tables
        modelBuilder.Entity<Department>(entity =>
        {
            entity.ToTable("department", "hr");
            entity.HasKey(e => e.DepartmentId);
            entity.Property(e => e.DepartmentId).HasColumnName("department_id");
            entity.Property(e => e.DepartmentName).HasColumnName("department_name").HasMaxLength(100).IsRequired();
            entity.HasIndex(e => e.DepartmentName).IsUnique();
            entity.Property(e => e.DepartmentCode).HasColumnName("department_code").HasMaxLength(20).IsRequired();
            entity.HasIndex(e => e.DepartmentCode).IsUnique();
            entity.Property(e => e.Location).HasColumnName("location").HasMaxLength(150).IsRequired();
            entity.Property(e => e.ExtensionNumber).HasColumnName("extension_number").HasMaxLength(20);
            entity.Property(e => e.HeadDoctorId).HasColumnName("head_doctor_id");
            entity.Property(e => e.Description).HasColumnName("description");
        });

        modelBuilder.Entity<Specialization>(entity =>
        {
            entity.ToTable("specialization", "hr");
            entity.HasKey(e => e.SpecializationId);
            entity.Property(e => e.SpecializationId).HasColumnName("specialization_id");
            entity.Property(e => e.SpecializationName).HasColumnName("specialization_name").HasMaxLength(150).IsRequired();
            entity.HasIndex(e => e.SpecializationName).IsUnique();
            entity.Property(e => e.Description).HasColumnName("description");
        });

        modelBuilder.Entity<Employee>(entity =>
        {
            entity.ToTable("employee", "hr");
            entity.HasKey(e => e.EmployeeId);
            entity.Property(e => e.EmployeeId).HasColumnName("employee_id");
            entity.Property(e => e.EmployeeCode).HasColumnName("employee_code").HasMaxLength(30).IsRequired();
            entity.HasIndex(e => e.EmployeeCode).IsUnique();
            entity.Property(e => e.FirstName).HasColumnName("first_name").HasMaxLength(100).IsRequired();
            entity.Property(e => e.LastName).HasColumnName("last_name").HasMaxLength(100).IsRequired();
            entity.Property(e => e.Gender).HasColumnName("gender").HasMaxLength(20).IsRequired();
            entity.Property(e => e.DateOfBirth).HasColumnName("date_of_birth").IsRequired();
            entity.Property(e => e.PhoneNumber).HasColumnName("phone_number").HasMaxLength(20).IsRequired();
            entity.Property(e => e.Email).HasColumnName("email").HasMaxLength(150).IsRequired();
            entity.Property(e => e.HireDate).HasColumnName("hire_date").IsRequired();
            entity.Property(e => e.Designation).HasColumnName("designation").HasMaxLength(100).IsRequired();
            entity.Property(e => e.DepartmentId).HasColumnName("department_id").IsRequired();
            entity.Property(e => e.Salary).HasColumnName("salary").HasPrecision(12, 2).IsRequired();
            entity.Property(e => e.EmploymentStatus).HasColumnName("employment_status").HasMaxLength(30).IsRequired().HasDefaultValue("Active");

            entity.HasOne(e => e.Department)
                .WithMany()
                .HasForeignKey(e => e.DepartmentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Doctor>(entity =>
        {
            entity.ToTable("doctor", "hr");
            entity.HasKey(e => e.DoctorId);
            entity.Property(e => e.DoctorId).HasColumnName("doctor_id");
            entity.Property(e => e.EmployeeId).HasColumnName("employee_id").IsRequired();
            entity.Property(e => e.DoctorCode).HasColumnName("doctor_code").HasMaxLength(30).IsRequired();
            entity.HasIndex(e => e.DoctorCode).IsUnique();
            entity.Property(e => e.LicenseNumber).HasColumnName("license_number").HasMaxLength(100).IsRequired();
            entity.HasIndex(e => e.LicenseNumber).IsUnique();
            entity.Property(e => e.DepartmentId).HasColumnName("department_id").IsRequired();
            entity.Property(e => e.SpecializationId).HasColumnName("specialization_id").IsRequired();
            entity.Property(e => e.ConsultationFee).HasColumnName("consultation_fee").HasPrecision(12, 2).IsRequired();
            entity.Property(e => e.YearsOfExperience).HasColumnName("years_of_experience").IsRequired();
            entity.Property(e => e.Qualification).HasColumnName("qualification").HasMaxLength(200).IsRequired();
            entity.Property(e => e.ConsultationDuration).HasColumnName("consultation_duration").IsRequired().HasDefaultValue(15);
            entity.Property(e => e.IsAvailableOnline).HasColumnName("is_available_online").IsRequired().HasDefaultValue(false);
            entity.Property(e => e.Status).HasColumnName("status").HasMaxLength(30).IsRequired().HasDefaultValue("Active");

            entity.HasOne(e => e.Employee)
                .WithMany()
                .HasForeignKey(e => e.EmployeeId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Department)
                .WithMany()
                .HasForeignKey(e => e.DepartmentId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Specialization)
                .WithMany()
                .HasForeignKey(e => e.SpecializationId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Configure Security schema tables
        modelBuilder.Entity<Role>(entity =>
        {
            entity.ToTable("role", "security");
            entity.HasKey(e => e.RoleId);
            entity.Property(e => e.RoleId).HasColumnName("role_id");
            entity.Property(e => e.RoleName).HasColumnName("role_name").HasMaxLength(100).IsRequired();
            entity.HasIndex(e => e.RoleName).IsUnique();
            entity.Property(e => e.Description).HasColumnName("description");
        });

        modelBuilder.Entity<Permission>(entity =>
        {
            entity.ToTable("permission", "security");
            entity.HasKey(e => e.PermissionId);
            entity.Property(e => e.PermissionId).HasColumnName("permission_id");
            entity.Property(e => e.PermissionName).HasColumnName("permission_name").HasMaxLength(150).IsRequired();
            entity.HasIndex(e => e.PermissionName).IsUnique();
            entity.Property(e => e.ModuleName).HasColumnName("module_name").HasMaxLength(100).IsRequired();
            entity.Property(e => e.Description).HasColumnName("description");
        });

        modelBuilder.Entity<RolePermission>(entity =>
        {
            entity.ToTable("role_permission", "security");
            entity.HasKey(e => e.RolePermissionId);
            entity.Property(e => e.RolePermissionId).HasColumnName("role_permission_id");
            entity.Property(e => e.RoleId).HasColumnName("role_id").IsRequired();
            entity.Property(e => e.PermissionId).HasColumnName("permission_id").IsRequired();

            entity.HasOne(e => e.Role)
                .WithMany()
                .HasForeignKey(e => e.RoleId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Permission)
                .WithMany()
                .HasForeignKey(e => e.PermissionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<UserAccount>(entity =>
        {
            entity.ToTable("user_account", "security");
            entity.HasKey(e => e.UserId);
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.Username).HasColumnName("username").HasMaxLength(100).IsRequired();
            entity.HasIndex(e => e.Username).IsUnique();
            entity.Property(e => e.PasswordHash).HasColumnName("password_hash").IsRequired();
            entity.Property(e => e.EmployeeId).HasColumnName("employee_id");
            entity.Property(e => e.RoleId).HasColumnName("role_id").IsRequired();
            entity.Property(e => e.LastLogin).HasColumnName("last_login");
            entity.Property(e => e.AccountStatus).HasColumnName("account_status").HasMaxLength(30).IsRequired().HasDefaultValue("Active");
            entity.Property(e => e.FailedLoginAttempts).HasColumnName("failed_login_attempts").IsRequired().HasDefaultValue(0);
            entity.Property(e => e.PasswordChangedAt).HasColumnName("password_changed_at");

            entity.HasOne(e => e.Employee)
                .WithMany()
                .HasForeignKey(e => e.EmployeeId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Role)
                .WithMany()
                .HasForeignKey(e => e.RoleId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<UserSession>(entity =>
        {
            entity.ToTable("user_session", "security");
            entity.HasKey(e => e.SessionId);
            entity.Property(e => e.SessionId).HasColumnName("session_id");
            entity.Property(e => e.UserId).HasColumnName("user_id").IsRequired();
            entity.Property(e => e.LoginTime).HasColumnName("login_time").IsRequired().HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.LogoutTime).HasColumnName("logout_time");
            entity.Property(e => e.IpAddress).HasColumnName("ip_address").HasMaxLength(50).IsRequired();
            entity.Property(e => e.DeviceInformation).HasColumnName("device_information").IsRequired();
            entity.Property(e => e.SessionStatus).HasColumnName("session_status").HasMaxLength(30).IsRequired().HasDefaultValue("Active");

            entity.HasOne(e => e.UserAccount)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Configure Audit schema tables
        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.ToTable("audit_log", "audit");
            entity.HasKey(e => e.AuditLogId);
            entity.Property(e => e.AuditLogId).HasColumnName("audit_log_id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.ModuleName).HasColumnName("module_name").HasMaxLength(100).IsRequired();
            entity.Property(e => e.ActionType).HasColumnName("action_type").HasMaxLength(50).IsRequired();
            entity.Property(e => e.AffectedRecord).HasColumnName("affected_record").HasMaxLength(100).IsRequired();
            entity.Property(e => e.PreviousValue).HasColumnName("previous_value").HasColumnType("jsonb");
            entity.Property(e => e.NewValue).HasColumnName("new_value").HasColumnType("jsonb");
            entity.Property(e => e.ActionTime).HasColumnName("action_time").IsRequired().HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.IpAddress).HasColumnName("ip_address").HasMaxLength(50).IsRequired();

            entity.HasOne(e => e.UserAccount)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Appointment>(e => { e.HasKey(x => x.AppointmentId); });
        modelBuilder.Entity<OpdToken>(e => { e.HasKey(x => x.OpdTokenId); });
        modelBuilder.Entity<EmrEncounter>(e => { e.HasKey(x => x.EncounterId); });

        modelBuilder.Entity<Ward>(e => { e.HasKey(x => x.WardId); });
        modelBuilder.Entity<Bed>(e => { e.HasKey(x => x.BedId); });
        modelBuilder.Entity<IpdAdmission>(e => { e.HasKey(x => x.AdmissionId); });
        modelBuilder.Entity<EmergencyCase>(e => { e.HasKey(x => x.EmergencyCaseId); });

        modelBuilder.Entity<LabOrder>(e => { e.HasKey(x => x.LabOrderId); });
        modelBuilder.Entity<RadiologyStudy>(e => { e.HasKey(x => x.StudyId); });

        modelBuilder.Entity<Invoice>(e => { e.HasKey(x => x.InvoiceId); });
        modelBuilder.Entity<PaymentRecord>(e => { e.HasKey(x => x.PaymentId); });
        modelBuilder.Entity<InsuranceClaimRecord>(e => { e.HasKey(x => x.ClaimId); });
        modelBuilder.Entity<InventoryItem>(e => { e.HasKey(x => x.ItemId); });
        modelBuilder.Entity<AttendanceRecord>(e => { e.HasKey(x => x.AttendanceId); });
        modelBuilder.Entity<PharmacyStock>(e => { e.HasKey(x => x.DrugId); });
        modelBuilder.Entity<SurgicalProcedure>(e => { e.HasKey(x => x.SurgeryId); });
        modelBuilder.Entity<IcuPatientVital>(e => { e.HasKey(x => x.VitalId); });
        modelBuilder.Entity<PatientDocument>(e => { e.HasKey(x => x.DocumentId); });

        // Apply Global Query Filter for BaseEntity (Soft Delete)
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (typeof(BaseEntity).IsAssignableFrom(entityType.ClrType))
            {
                modelBuilder.Entity(entityType.ClrType)
                    .HasQueryFilter(ConvertFilterExpression(entityType.ClrType));
            }
        }
    }

    private static System.Linq.Expressions.LambdaExpression ConvertFilterExpression(Type type)
    {
        var parameter = System.Linq.Expressions.Expression.Parameter(type, "e");
        var property = System.Linq.Expressions.Expression.Property(parameter, "IsActive");
        var trueConstant = System.Linq.Expressions.Expression.Constant(true);
        var body = System.Linq.Expressions.Expression.Equal(property, trueConstant);
        return System.Linq.Expressions.Expression.Lambda(body, parameter);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = DateTime.UtcNow;
                    entry.Entity.IsActive = true;
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedAt = DateTime.UtcNow;
                    break;
                case EntityState.Deleted:
                    entry.State = EntityState.Modified;
                    entry.Entity.IsActive = false;
                    entry.Entity.UpdatedAt = DateTime.UtcNow;
                    break;
            }
        }
        return base.SaveChangesAsync(cancellationToken);
    }
}
