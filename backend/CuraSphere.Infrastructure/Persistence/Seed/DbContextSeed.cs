using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using CuraSphere.Domain.Entities;

namespace CuraSphere.Infrastructure.Persistence.Seed;

public static class DbContextSeed
{
    public static async Task SeedAsync(CuraSphereDbContext context)
    {
        // 1. Seed Blood Groups
        if (!context.BloodGroups.Any())
        {
            context.BloodGroups.AddRange(
                new BloodGroup { BloodGroupName = "A+", Description = "A Positive" },
                new BloodGroup { BloodGroupName = "A-", Description = "A Negative" },
                new BloodGroup { BloodGroupName = "B+", Description = "B Positive" },
                new BloodGroup { BloodGroupName = "B-", Description = "B Negative" },
                new BloodGroup { BloodGroupName = "AB+", Description = "AB Positive" },
                new BloodGroup { BloodGroupName = "AB-", Description = "AB Negative" },
                new BloodGroup { BloodGroupName = "O+", Description = "O Positive" },
                new BloodGroup { BloodGroupName = "O-", Description = "O Negative" }
            );
            await context.SaveChangesAsync();
        }

        // 2. Seed Marital Statuses
        if (!context.MaritalStatuses.Any())
        {
            context.MaritalStatuses.AddRange(
                new MaritalStatus { StatusName = "Single" },
                new MaritalStatus { StatusName = "Married" },
                new MaritalStatus { StatusName = "Divorced" },
                new MaritalStatus { StatusName = "Widowed" }
            );
            await context.SaveChangesAsync();
        }

        // 3. Seed Religions
        if (!context.Religions.Any())
        {
            context.Religions.AddRange(
                new Religion { ReligionName = "Islam" },
                new Religion { ReligionName = "Christianity" },
                new Religion { ReligionName = "Hinduism" },
                new Religion { ReligionName = "Sikhism" },
                new Religion { ReligionName = "Buddhism" },
                new Religion { ReligionName = "Other" }
            );
            await context.SaveChangesAsync();
        }

        // 4. Seed Nationalities
        if (!context.Nationalities.Any())
        {
            context.Nationalities.AddRange(
                new Nationality { CountryName = "Pakistan", CountryCode = "PK" },
                new Nationality { CountryName = "United States", CountryCode = "US" },
                new Nationality { CountryName = "United Kingdom", CountryCode = "GB" },
                new Nationality { CountryName = "Canada", CountryCode = "CA" },
                new Nationality { CountryName = "United Arab Emirates", CountryCode = "AE" }
            );
            await context.SaveChangesAsync();
        }

        // 5. Seed Departments
        if (!context.Departments.Any())
        {
            context.Departments.AddRange(
                new Department { DepartmentName = "Outpatient Department", DepartmentCode = "OPD", Location = "Ground Floor, Block A", ExtensionNumber = "101", Description = "General consulting clinics" },
                new Department { DepartmentName = "Cardiology", DepartmentCode = "CARD", Location = "1st Floor, Block B", ExtensionNumber = "202", Description = "Heart and blood vessel treatments" },
                new Department { DepartmentName = "Pediatrics", DepartmentCode = "PED", Location = "Ground Floor, Block B", ExtensionNumber = "105", Description = "Children healthcare clinic" },
                new Department { DepartmentName = "Radiology", DepartmentCode = "RAD", Location = "Basement, Block A", ExtensionNumber = "050", Description = "X-Ray, MRI, CT scanning" },
                new Department { DepartmentName = "Pathology Laboratory", DepartmentCode = "LAB", Location = "Ground Floor, Block C", ExtensionNumber = "110", Description = "Blood, tissue, and specimen testing" },
                new Department { DepartmentName = "Pharmacy", DepartmentCode = "PHAR", Location = "Ground Floor, Entrance", ExtensionNumber = "100", Description = "Medicine dispensing and stocks" },
                new Department { DepartmentName = "Emergency", DepartmentCode = "ER", Location = "Ground Floor, East Wing", ExtensionNumber = "911", Description = "Urgent and acute trauma care" }
            );
            await context.SaveChangesAsync();
        }

        // 6. Seed Specializations
        if (!context.Specializations.Any())
        {
            context.Specializations.AddRange(
                new Specialization { SpecializationName = "General Physician", Description = "General medicine practitioner" },
                new Specialization { SpecializationName = "Cardiologist", Description = "Heart specialist" },
                new Specialization { SpecializationName = "Pediatrician", Description = "Child health specialist" },
                new Specialization { SpecializationName = "Radiologist", Description = "Medical imaging diagnostics specialist" },
                new Specialization { SpecializationName = "Pathologist", Description = "Laboratory diagnostic investigator" }
            );
            await context.SaveChangesAsync();
        }

        // 7. Seed Roles
        if (!context.Roles.Any())
        {
            context.Roles.AddRange(
                new Role { RoleName = "Super Administrator", Description = "Complete access to all system configurations and management" },
                new Role { RoleName = "Hospital Administrator", Description = "Oversees daily hospital operational departments" },
                new Role { RoleName = "Doctor", Description = "Handles encounters, diagnoses, vitals, prescriptions, and lab orders" },
                new Role { RoleName = "Nurse", Description = "Monitors patient vitals, admissions, and nursing notes" },
                new Role { RoleName = "Pharmacist", Description = "Dispenses medications and updates stock inventory" },
                new Role { RoleName = "Laboratory Technologist", Description = "Processes samples and enters test results" },
                new Role { RoleName = "Radiologist", Description = "Performs studies and writes imaging reports" },
                new Role { RoleName = "Cashier", Description = "Issues invoices and processes payments" },
                new Role { RoleName = "Receptionist", Description = "Handles patient registration, check-ins, and appointments" }
            );
            await context.SaveChangesAsync();
        }

        // 8. Seed Permissions
        if (!context.Permissions.Any())
        {
            context.Permissions.AddRange(
                // Patient management
                new Permission { PermissionName = "patients.read", ModuleName = "Patient Management", Description = "View patient demographics" },
                new Permission { PermissionName = "patients.create", ModuleName = "Patient Management", Description = "Register a new patient" },
                new Permission { PermissionName = "patients.update", ModuleName = "Patient Management", Description = "Update patient information" },
                new Permission { PermissionName = "patients.delete", ModuleName = "Patient Management", Description = "Soft-delete patient profile" },
                
                // Appointments
                new Permission { PermissionName = "appointments.read", ModuleName = "Appointment Management", Description = "View schedules and bookings" },
                new Permission { PermissionName = "appointments.create", ModuleName = "Appointment Management", Description = "Book patient appointments" },
                new Permission { PermissionName = "appointments.update", ModuleName = "Appointment Management", Description = "Reschedule appointments" },
                new Permission { PermissionName = "appointments.cancel", ModuleName = "Appointment Management", Description = "Cancel booked slots" },
                
                // Clinical encounters / EMR
                new Permission { PermissionName = "emr.read", ModuleName = "Clinical Services", Description = "View patient electronic medical records" },
                new Permission { PermissionName = "emr.create", ModuleName = "Clinical Services", Description = "Add vitals, diagnoses, and notes" },
                new Permission { PermissionName = "emr.sign", ModuleName = "Clinical Services", Description = "Finalize encounter documentation" },
                
                // Billing
                new Permission { PermissionName = "billing.read", ModuleName = "Billing", Description = "View invoices and patient payments" },
                new Permission { PermissionName = "billing.create", ModuleName = "Billing", Description = "Generate patient bills" },
                new Permission { PermissionName = "billing.pay", ModuleName = "Billing", Description = "Process invoice payments" }
            );
            await context.SaveChangesAsync();
        }

        // 8.5. Seed Role Permissions (Link Super Administrator to all permissions)
        if (!context.RolePermissions.Any())
        {
            var superAdminRole = context.Roles.FirstOrDefault(r => r.RoleName == "Super Administrator");
            var allPermissions = context.Permissions.ToList();

            if (superAdminRole != null && allPermissions.Any())
            {
                foreach (var permission in allPermissions)
                {
                    context.RolePermissions.Add(new RolePermission
                    {
                        RoleId = superAdminRole.RoleId,
                        PermissionId = permission.PermissionId
                    });
                }
                await context.SaveChangesAsync();
            }
        }

        // 9. Seed Default Super Administrator Employee & User Account
        var adminUser = context.UserAccounts.FirstOrDefault(u => u.Username == "admin");
        if (adminUser == null)
        {
            var adminDept = context.Departments.FirstOrDefault(d => d.DepartmentCode == "OPD");
            
            var adminEmployee = new Employee
            {
                EmployeeCode = "EMP00001",
                FirstName = "System",
                LastName = "Administrator",
                Gender = "Male",
                DateOfBirth = new DateTime(1985, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                PhoneNumber = "+923000000000",
                Email = "admin@curasphere.com",
                HireDate = DateTime.UtcNow,
                Designation = "System Administrator",
                DepartmentId = adminDept?.DepartmentId ?? 1,
                Salary = 150000.00m,
                EmploymentStatus = "Active"
            };

            context.Employees.Add(adminEmployee);
            await context.SaveChangesAsync();

            if (!context.Doctors.Any())
            {
                var doctor = new Doctor
                {
                    EmployeeId = adminEmployee.EmployeeId,
                    DoctorCode = "DOC00001",
                    LicenseNumber = "PMC-12345",
                    DepartmentId = adminDept?.DepartmentId ?? 1,
                    SpecializationId = 1,
                    ConsultationFee = 1500.00m,
                    Qualification = "MBBS, FCPS"
                };
                context.Doctors.Add(doctor);
                await context.SaveChangesAsync();
            }

            var adminRole = context.Roles.FirstOrDefault(r => r.RoleName == "Super Administrator");

            adminUser = new UserAccount
            {
                Username = "admin",
                EmployeeId = adminEmployee.EmployeeId,
                RoleId = adminRole?.RoleId ?? 1,
                AccountStatus = "Active",
                FailedLoginAttempts = 0
            };

            // Hash password using PasswordHasher
            var hasher = new PasswordHasher<UserAccount>();
            adminUser.PasswordHash = hasher.HashPassword(adminUser, "Admin123!");

            context.UserAccounts.Add(adminUser);
            await context.SaveChangesAsync();
        }
        else
        {
            // Reset to Active and correct password in case it got locked/mismatched during testing
            adminUser.AccountStatus = "Active";
            adminUser.FailedLoginAttempts = 0;
            var hasher = new PasswordHasher<UserAccount>();
            adminUser.PasswordHash = hasher.HashPassword(adminUser, "Admin123!");
            await context.SaveChangesAsync();
        }
    }
}
