using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using CuraSphere.Infrastructure.Persistence;
using CuraSphere.Infrastructure.Persistence.Seed;
using CuraSphere.Domain.Entities;
using CuraSphere.Application.Interfaces;
using CuraSphere.Application.DTOs;
using CuraSphere.Api.Controllers;
using CuraSphere.Api.Health;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Logging;

namespace CuraSphere.IntegrationTests;

public class IntegrationTestRunner
{
    public static async Task<int> Main(string[] args)
    {
        Console.WriteLine("==================================================");
        Console.WriteLine("🌐 RUNNING CURASPHERE HMS INTEGRATION & API TESTS");
        Console.WriteLine("==================================================");

        int passed = 0;
        int failed = 0;

        void Assert(bool condition, string testName)
        {
            if (condition)
            {
                Console.WriteLine($"  [PASS] {testName}");
                passed++;
            }
            else
            {
                Console.WriteLine($"  [FAIL] {testName}");
                failed++;
            }
        }

        // Integration Test 1: Patient Controller Get Patient By ID
        try
        {
            var mockPatientService = new Mock<IPatientService>();
            mockPatientService.Setup(s => s.GetPatientByIdAsync(1001))
                .ReturnsAsync(new PatientDetailDto
                {
                    PatientId = 1001,
                    MedicalRecordNumber = "MRN-TEST-1001",
                    FirstName = "Alice",
                    LastName = "Smith",
                    Gender = "Female",
                    DateOfBirth = new DateTime(1985, 3, 20),
                    PatientStatus = "Active"
                });

            var controller = new PatientController(mockPatientService.Object);
            var result = await controller.GetPatientById(1001) as OkObjectResult;
            Assert(result != null && result.StatusCode == 200, "PatientController.GetPatientById returned HTTP 200 OK");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"  [ERROR] Integration Test 1 threw exception: {ex.Message}");
            failed++;
        }

        // Integration Test 2: Document Controller Upload & Retrieval via DbContext
        try
        {
            var options = new DbContextOptionsBuilder<CuraSphereDbContext>()
                .UseInMemoryDatabase(databaseName: "CuraSphereTestDb_" + Guid.NewGuid())
                .Options;

            using var context = new CuraSphereDbContext(options);
            context.Patients.Add(new Patient
            {
                PatientId = 1001,
                MedicalRecordNumber = "MRN-TEST-1001",
                FirstName = "Alice",
                LastName = "Smith",
                Gender = "Female",
                DateOfBirth = new DateTime(1985, 3, 20)
            });
            await context.SaveChangesAsync();

            var docController = new DocumentController(context);
            var uploadResult = await docController.UploadDocument(1001, "Lab Report", "Blood Test Panel", "Dr. Smith") as OkObjectResult;
            Assert(uploadResult != null && uploadResult.StatusCode == 200, "DocumentController.UploadDocument successfully created record");

            var getDocsResult = await docController.GetPatientDocuments(1001) as OkObjectResult;
            Assert(getDocsResult != null && getDocsResult.StatusCode == 200, "DocumentController.GetPatientDocuments retrieved uploaded document");

            var fhirResult = await docController.ExportFhirPatient(1001) as ContentResult;
            Assert(fhirResult != null && fhirResult.ContentType == "application/fhir+json", "DocumentController.ExportFhirPatient output FHIR R4 JSON format");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"  [ERROR] Integration Test 2 threw exception: {ex.Message}");
            failed++;
        }

        // Integration Test 3: Emergency Controller Triage Case Retrieval
        try
        {
            var mockEmergencyService = new Mock<IEmergencyService>();
            mockEmergencyService.Setup(s => s.GetActiveCasesAsync(It.IsAny<string?>(), It.IsAny<string?>()))
                .ReturnsAsync(new List<EmergencyCaseDto>
                {
                    new EmergencyCaseDto
                    {
                        EmergencyCaseId = 501,
                        CaseNumber = "EMG-2026-00501",
                        PatientId = 1001,
                        PatientName = "Alice Smith",
                        TriageLevel = "P1 - Critical",
                        Status = "Under Treatment"
                    }
                });

            var emergencyController = new EmergencyController(mockEmergencyService.Object);
            var casesResult = await emergencyController.GetCases(null, "P1") as OkObjectResult;
            Assert(casesResult != null && casesResult.StatusCode == 200, "EmergencyController.GetCases returned HTTP 200 OK with P1 cases");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"  [ERROR] Integration Test 3 threw exception: {ex.Message}");
            failed++;
        }

        // Integration Test 4: Database Readiness Health Check Verification
        try
        {
            var services = new ServiceCollection();
            var options = new DbContextOptionsBuilder<CuraSphereDbContext>()
                .UseInMemoryDatabase(databaseName: "CuraSphereHealthCheckDb_" + Guid.NewGuid())
                .Options;

            services.AddScoped(_ => new CuraSphereDbContext(options));
            services.AddLogging();
            var serviceProvider = services.BuildServiceProvider();
            var scopeFactory = serviceProvider.GetRequiredService<IServiceScopeFactory>();
            var logger = serviceProvider.GetRequiredService<ILogger<DatabaseHealthCheck>>();

            var healthCheck = new DatabaseHealthCheck(scopeFactory, logger);
            var checkResult = await healthCheck.CheckHealthAsync(new HealthCheckContext());

            Assert(checkResult.Status == HealthStatus.Healthy, "DatabaseHealthCheck accurately reports Healthy when database can connect");
            Assert(checkResult.Description == "Database connectivity operational", "DatabaseHealthCheck description matches operational contract");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"  [ERROR] Integration Test 4 threw exception: {ex.Message}");
            failed++;
        }

        // Integration Test 5: Database Readiness Cancellation / Timeout Handling
        try
        {
            var services = new ServiceCollection();
            var options = new DbContextOptionsBuilder<CuraSphereDbContext>()
                .UseInMemoryDatabase(databaseName: "CuraSphereTimeoutDb_" + Guid.NewGuid())
                .Options;

            services.AddScoped(_ => new CuraSphereDbContext(options));
            services.AddLogging();
            var serviceProvider = services.BuildServiceProvider();
            var scopeFactory = serviceProvider.GetRequiredService<IServiceScopeFactory>();
            var logger = serviceProvider.GetRequiredService<ILogger<DatabaseHealthCheck>>();

            var healthCheck = new DatabaseHealthCheck(scopeFactory, logger);
            using var cts = new CancellationTokenSource();
            cts.Cancel();

            var canceledResult = await healthCheck.CheckHealthAsync(new HealthCheckContext(), cts.Token);
            Assert(canceledResult.Status == HealthStatus.Unhealthy, "DatabaseHealthCheck returns Unhealthy when cancellation is signaled");
            Assert(canceledResult.Description == "Database connectivity check timed out.", "DatabaseHealthCheck description indicates timeout on cancellation");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"  [ERROR] Integration Test 5 threw exception: {ex.Message}");
            failed++;
        }

        // Integration Test 6: Database Readiness Exception & Failure Handling
        try
        {
            var brokenServices = new ServiceCollection();
            brokenServices.AddLogging();
            var brokenProvider = brokenServices.BuildServiceProvider();
            var brokenScopeFactory = brokenProvider.GetRequiredService<IServiceScopeFactory>();
            var brokenLogger = brokenProvider.GetRequiredService<ILogger<DatabaseHealthCheck>>();

            var brokenHealthCheck = new DatabaseHealthCheck(brokenScopeFactory, brokenLogger);
            var brokenResult = await brokenHealthCheck.CheckHealthAsync(new HealthCheckContext());

            Assert(brokenResult.Status == HealthStatus.Unhealthy, "DatabaseHealthCheck returns Unhealthy when exception occurs during resolution or connectivity");
            Assert(brokenResult.Description == "Database connectivity check encountered an exception.", "DatabaseHealthCheck description indicates failure with exception");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"  [ERROR] Integration Test 6 threw exception: {ex.Message}");
            failed++;
        }

        // Integration Test 7: Production Seeding Safety (Zero User Accounts By Default)
        try
        {
            var options = new DbContextOptionsBuilder<CuraSphereDbContext>()
                .UseInMemoryDatabase(databaseName: "CuraSphereTestDb_ProdSafety_" + Guid.NewGuid())
                .Options;

            using var context = new CuraSphereDbContext(options);

            // In production/staging with no explicit bootstrap flag set:
            Environment.SetEnvironmentVariable("SEED_INITIAL_ADMIN", null);
            Environment.SetEnvironmentVariable("INITIAL_ADMIN_PASSWORD", null);

            await DbContextSeed.SeedAsync(context, isDevelopment: false);

            Assert(await context.Roles.AnyAsync(), "Production seed creates default system roles and lookups");
            Assert(await context.UserAccounts.CountAsync() == 0, "Production seed creates zero user accounts by default");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"  [ERROR] Integration Test 7 threw exception: {ex.Message}");
            failed++;
        }

        // Integration Test 8: Controlled Administrator Bootstrap, Hashing & Idempotency
        try
        {
            var options = new DbContextOptionsBuilder<CuraSphereDbContext>()
                .UseInMemoryDatabase(databaseName: "CuraSphereTestDb_Bootstrap_" + Guid.NewGuid())
                .Options;

            using var context = new CuraSphereDbContext(options);

            const string testAdminUser = "secops_admin";
            const string testAdminPass = "ComplexInitialSecret2026!";

            Environment.SetEnvironmentVariable("SEED_INITIAL_ADMIN", "true");
            Environment.SetEnvironmentVariable("INITIAL_ADMIN_USERNAME", testAdminUser);
            Environment.SetEnvironmentVariable("INITIAL_ADMIN_PASSWORD", testAdminPass);

            // Initial invocation
            await DbContextSeed.SeedAsync(context, isDevelopment: false);

            var createdUser = await context.UserAccounts.FirstOrDefaultAsync(u => u.Username == testAdminUser);
            Assert(createdUser != null, "Controlled bootstrap creates initial administrator user account");
            Assert(createdUser?.AccountStatus == "Active", "Initial administrator account is marked Active");

            if (createdUser != null)
            {
                var hasher = new PasswordHasher<UserAccount>();
                var verifySuccess = hasher.VerifyHashedPassword(createdUser, createdUser.PasswordHash, testAdminPass);
                Assert(verifySuccess == PasswordVerificationResult.Success, "Administrator password hash verifies with provided initial secret");

                var verifyFail = hasher.VerifyHashedPassword(createdUser, createdUser.PasswordHash, "WrongPassword!");
                Assert(verifyFail == PasswordVerificationResult.Failed, "Administrator password hash rejects invalid password");
            }

            // Repeated invocation / Idempotency check:
            Environment.SetEnvironmentVariable("INITIAL_ADMIN_PASSWORD", "AnotherPassword999!");
            await DbContextSeed.SeedAsync(context, isDevelopment: false);

            var totalAccounts = await context.UserAccounts.CountAsync();
            Assert(totalAccounts == 1, "Repeated bootstrap execution refuses to duplicate administrator account");

            var reloadedUser = await context.UserAccounts.FirstOrDefaultAsync(u => u.Username == testAdminUser);
            if (reloadedUser != null)
            {
                var hasher = new PasswordHasher<UserAccount>();
                var verifyOriginal = hasher.VerifyHashedPassword(reloadedUser, reloadedUser.PasswordHash, testAdminPass);
                Assert(verifyOriginal == PasswordVerificationResult.Success, "Existing administrator account is protected and password is not overwritten");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"  [ERROR] Integration Test 8 threw exception: {ex.Message}");
            failed++;
        }
        finally
        {
            Environment.SetEnvironmentVariable("SEED_INITIAL_ADMIN", null);
            Environment.SetEnvironmentVariable("INITIAL_ADMIN_USERNAME", null);
            Environment.SetEnvironmentVariable("INITIAL_ADMIN_PASSWORD", null);
        }

        // Integration Test 9: Bootstrap Validation Failure on Missing or Insecure Credentials
        try
        {
            var options = new DbContextOptionsBuilder<CuraSphereDbContext>()
                .UseInMemoryDatabase(databaseName: "CuraSphereTestDb_ValidationFail_" + Guid.NewGuid())
                .Options;

            using var context = new CuraSphereDbContext(options);

            Environment.SetEnvironmentVariable("SEED_INITIAL_ADMIN", "true");
            Environment.SetEnvironmentVariable("INITIAL_ADMIN_PASSWORD", null);

            bool threwOnMissing = false;
            try
            {
                await DbContextSeed.SeedAsync(context, isDevelopment: false);
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("minimum length of 12 characters"))
            {
                threwOnMissing = true;
            }
            Assert(threwOnMissing, "Bootstrap rejects missing initial password in non-development mode");

            Environment.SetEnvironmentVariable("INITIAL_ADMIN_PASSWORD", "short7");
            bool threwOnShort = false;
            try
            {
                await DbContextSeed.SeedAsync(context, isDevelopment: false);
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("minimum length of 12 characters"))
            {
                threwOnShort = true;
            }
            Assert(threwOnShort, "Bootstrap rejects short password (< 12 characters) in non-development mode");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"  [ERROR] Integration Test 9 threw exception: {ex.Message}");
            failed++;
        }
        finally
        {
            Environment.SetEnvironmentVariable("SEED_INITIAL_ADMIN", null);
            Environment.SetEnvironmentVariable("INITIAL_ADMIN_PASSWORD", null);
        }

        // Integration Test 10: Partial Seeding Recovery & Employee Uniqueness Safety
        try
        {
            var options = new DbContextOptionsBuilder<CuraSphereDbContext>()
                .UseInMemoryDatabase(databaseName: "CuraSphereTestDb_PartialRecovery_" + Guid.NewGuid())
                .Options;

            using var context = new CuraSphereDbContext(options);

            // Pre-seed an employee with EMP00001 (simulating pre-existing employee or partial seed)
            var preSeededEmployee = new Employee
            {
                EmployeeCode = "EMP00001",
                FirstName = "Existing",
                LastName = "Staff",
                Gender = "Other",
                DateOfBirth = new DateTime(1990, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                PhoneNumber = "+923001112233",
                Email = "existing@curasphere.local",
                HireDate = DateTime.UtcNow,
                Designation = "Existing Staff",
                DepartmentId = 1,
                Salary = 100000.00m,
                EmploymentStatus = "Active"
            };
            context.Employees.Add(preSeededEmployee);
            await context.SaveChangesAsync();

            Environment.SetEnvironmentVariable("SEED_INITIAL_ADMIN", "true");
            Environment.SetEnvironmentVariable("INITIAL_ADMIN_PASSWORD", "ResilientSecret2026!");

            // Should safely reuse EMP00001 rather than throwing duplicate employee code exception
            await DbContextSeed.SeedAsync(context, isDevelopment: false);

            var adminUser = await context.UserAccounts.FirstOrDefaultAsync(u => u.Username == "admin");
            Assert(adminUser != null, "Partial seeding recovery successfully creates administrator");
            Assert(adminUser?.EmployeeId == preSeededEmployee.EmployeeId, "Administrator account is correctly linked to existing employee record");
            Assert(await context.Employees.CountAsync(e => e.EmployeeCode == "EMP00001") == 1, "Employee EMP00001 uniqueness is preserved without duplicate collision");

            var reloadedEmp = await context.Employees.FirstOrDefaultAsync(e => e.EmployeeCode == "EMP00001");
            Assert(reloadedEmp?.FirstName == "Existing" && reloadedEmp?.LastName == "Staff", "Existing employee profile data is preserved during recovery");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"  [ERROR] Integration Test 10 threw exception: {ex.Message}");
            failed++;
        }
        finally
        {
            Environment.SetEnvironmentVariable("SEED_INITIAL_ADMIN", null);
            Environment.SetEnvironmentVariable("INITIAL_ADMIN_PASSWORD", null);
        }

        // Summary output
        Console.WriteLine("==================================================");
        Console.WriteLine($"RESULTS: Total: {passed + failed} | Passed: {passed} | Failed: {failed}");
        Console.WriteLine("==================================================");

        return failed == 0 ? 0 : 1;
    }
}
