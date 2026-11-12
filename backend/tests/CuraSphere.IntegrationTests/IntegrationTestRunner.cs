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

        // Integration Test 11: Real NotificationHub SignalR Authorization & Relational Identity Resolution
        try
        {
            var options = new DbContextOptionsBuilder<CuraSphereDbContext>()
                .UseInMemoryDatabase(databaseName: "CuraSphereTestDb_NotificationHub_" + Guid.NewGuid())
                .Options;

            using var context = new CuraSphereDbContext(options);

            // Seed Doctor A: User 501 -> Employee 201 -> Doctor 101
            var empDocA = new Employee
            {
                EmployeeId = 201,
                EmployeeCode = "EMP-DOC-A",
                FirstName = "Doctor",
                LastName = "Alpha",
                Gender = "Male",
                DateOfBirth = new DateTime(1980, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                PhoneNumber = "+923001234567",
                Email = "doc.alpha@curasphere.local",
                HireDate = DateTime.UtcNow,
                Designation = "Consultant",
                DepartmentId = 1,
                Salary = 200000m,
                EmploymentStatus = "Active"
            };
            context.Employees.Add(empDocA);

            var docA = new Doctor
            {
                DoctorId = 101,
                EmployeeId = 201,
                DoctorCode = "DOC-A",
                LicenseNumber = "PMC-DOC-A",
                DepartmentId = 1,
                SpecializationId = 1,
                ConsultationFee = 2500m,
                Status = "Active"
            };
            context.Doctors.Add(docA);

            var roleDoctor = new Role { RoleId = 10, RoleName = "Doctor" };
            context.Roles.Add(roleDoctor);

            var userDocA = new UserAccount
            {
                UserId = 501,
                Username = "doc_alpha",
                PasswordHash = "hash501",
                EmployeeId = 201,
                RoleId = 10,
                AccountStatus = "Active"
            };
            context.UserAccounts.Add(userDocA);

            // Seed Doctor B: User 502 -> Employee 202 -> Doctor 102
            var empDocB = new Employee
            {
                EmployeeId = 202,
                EmployeeCode = "EMP-DOC-B",
                FirstName = "Doctor",
                LastName = "Beta",
                Gender = "Female",
                DateOfBirth = new DateTime(1982, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                PhoneNumber = "+923007654321",
                Email = "doc.beta@curasphere.local",
                HireDate = DateTime.UtcNow,
                Designation = "Specialist",
                DepartmentId = 1,
                Salary = 200000m,
                EmploymentStatus = "Active"
            };
            context.Employees.Add(empDocB);

            var docB = new Doctor
            {
                DoctorId = 102,
                EmployeeId = 202,
                DoctorCode = "DOC-B",
                LicenseNumber = "PMC-DOC-B",
                DepartmentId = 1,
                SpecializationId = 1,
                ConsultationFee = 3000m,
                Status = "Active"
            };
            context.Doctors.Add(docB);

            var userDocB = new UserAccount
            {
                UserId = 502,
                Username = "doc_beta",
                PasswordHash = "hash502",
                EmployeeId = 202,
                RoleId = 10,
                AccountStatus = "Active"
            };
            context.UserAccounts.Add(userDocB);

            // Seed Receptionist: User 503 -> Employee 203 (No Doctor record)
            var empRec = new Employee
            {
                EmployeeId = 203,
                EmployeeCode = "EMP-REC",
                FirstName = "Reception",
                LastName = "Staff",
                Gender = "Female",
                DateOfBirth = new DateTime(1995, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                PhoneNumber = "+923005555555",
                Email = "reception@curasphere.local",
                HireDate = DateTime.UtcNow,
                Designation = "Front Desk Officer",
                DepartmentId = 1,
                Salary = 60000m,
                EmploymentStatus = "Active"
            };
            context.Employees.Add(empRec);

            var roleRec = new Role { RoleId = 11, RoleName = "Receptionist" };
            context.Roles.Add(roleRec);

            var userRec = new UserAccount
            {
                UserId = 503,
                Username = "reception_1",
                PasswordHash = "hash503",
                EmployeeId = 203,
                RoleId = 11,
                AccountStatus = "Active"
            };
            context.UserAccounts.Add(userRec);

            await context.SaveChangesAsync();

            // Instantiate actual NotificationHub with InMemory DB context
            var hub = new CuraSphere.Api.Hubs.NotificationHub(context);

            var mockGroupManager = new Mock<Microsoft.AspNetCore.SignalR.IGroupManager>();
            var addedGroups = new List<string>();
            var removedGroups = new List<string>();
            mockGroupManager
                .Setup(g => g.AddToGroupAsync(It.IsAny<string>(), It.IsAny<string>(), default))
                .Returns((string connId, string groupName, System.Threading.CancellationToken ct) =>
                {
                    addedGroups.Add(groupName);
                    return Task.CompletedTask;
                });
            mockGroupManager
                .Setup(g => g.RemoveFromGroupAsync(It.IsAny<string>(), It.IsAny<string>(), default))
                .Returns((string connId, string groupName, System.Threading.CancellationToken ct) =>
                {
                    removedGroups.Add(groupName);
                    return Task.CompletedTask;
                });

            void SetupHubContext(string userId, string roleName)
            {
                var claims = new List<System.Security.Claims.Claim>
                {
                    new(System.Security.Claims.ClaimTypes.NameIdentifier, userId),
                    new(System.Security.Claims.ClaimTypes.Role, roleName)
                };
                var identity = new System.Security.Claims.ClaimsIdentity(claims, "TestAuth");
                var principal = new System.Security.Claims.ClaimsPrincipal(identity);

                var mockHubCallerContext = new Mock<Microsoft.AspNetCore.SignalR.HubCallerContext>();
                mockHubCallerContext.Setup(c => c.ConnectionId).Returns($"conn-{userId}");
                mockHubCallerContext.Setup(c => c.User).Returns(principal);

                hub.Context = mockHubCallerContext.Object;
                hub.Groups = mockGroupManager.Object;
            }

            // Test 11.1: Doctor A (User 501) joining own channel (Doctor 101)
            SetupHubContext("501", "Doctor");
            addedGroups.Clear();
            await hub.JoinDoctorQueueChannel(101);
            Assert(addedGroups.Contains("DoctorQueue_101"), "Doctor A (User 501) successfully joins DoctorQueue_101 via relational employee resolution");

            // Test 11.2: Cross-Doctor Isolation: Doctor A (User 501) joining Doctor B channel (Doctor 102)
            bool doctorACrossJoinBlocked = false;
            try
            {
                await hub.JoinDoctorQueueChannel(102);
            }
            catch (Microsoft.AspNetCore.SignalR.HubException ex) when (ex.Message.Contains("not associated with Doctor 102"))
            {
                doctorACrossJoinBlocked = true;
            }
            Assert(doctorACrossJoinBlocked, "Doctor A (User 501) is strictly rejected from joining Doctor B's queue (DoctorQueue_102)");

            // Test 11.3: Cross-Doctor Isolation: Doctor B (User 502) joining Doctor A channel (Doctor 101)
            SetupHubContext("502", "Doctor");
            bool doctorBCrossJoinBlocked = false;
            try
            {
                await hub.JoinDoctorQueueChannel(101);
            }
            catch (Microsoft.AspNetCore.SignalR.HubException ex) when (ex.Message.Contains("not associated with Doctor 101"))
            {
                doctorBCrossJoinBlocked = true;
            }
            Assert(doctorBCrossJoinBlocked, "Doctor B (User 502) is strictly rejected from joining Doctor A's queue (DoctorQueue_101)");

            // Test 11.4: Receptionist joining ClinicQueue channel
            SetupHubContext("503", "Receptionist");
            addedGroups.Clear();
            await hub.JoinClinicQueueChannel();
            Assert(addedGroups.Contains("ClinicQueue"), "Receptionist successfully joins ClinicQueue channel");

            // Test 11.5: Receptionist attempting to join Doctor channel directly
            bool receptionistDoctorJoinBlocked = false;
            try
            {
                await hub.JoinDoctorQueueChannel(101);
            }
            catch (Microsoft.AspNetCore.SignalR.HubException ex) when (ex.Message.Contains("Insufficient role permissions"))
            {
                receptionistDoctorJoinBlocked = true;
            }
            Assert(receptionistDoctorJoinBlocked, "Receptionist is rejected from joining private doctor queue channel");

            // Test 11.6: Personal User Channel Isolation: User 503 attempting to join User 501 channel
            bool crossUserJoinBlocked = false;
            try
            {
                await hub.JoinUserChannel("501");
            }
            catch (Microsoft.AspNetCore.SignalR.HubException ex) when (ex.Message.Contains("Cannot subscribe to another user's personal channel"))
            {
                crossUserJoinBlocked = true;
            }
            Assert(crossUserJoinBlocked, "User 503 cannot subscribe to User 501 personal channel");

            // Test 11.7: Personal User Channel: User 503 joining own channel
            addedGroups.Clear();
            await hub.JoinUserChannel("503");
            Assert(addedGroups.Contains("User_503"), "User 503 successfully joins their own personal channel");

            // Test 11.8: Administrator Supervision of Doctor Queues
            SetupHubContext("1", "Super Administrator");
            addedGroups.Clear();
            await hub.JoinDoctorQueueChannel(101);
            Assert(addedGroups.Contains("DoctorQueue_101"), "Super Administrator successfully supervises DoctorQueue_101");

            // Mock Clients for Message Broadcast & Routing Isolation Verification
            var mockClients = new Mock<Microsoft.AspNetCore.SignalR.IHubCallerClients>();
            var mockClinicProxy = new Mock<Microsoft.AspNetCore.SignalR.IClientProxy>();
            var mockDocAProxy = new Mock<Microsoft.AspNetCore.SignalR.IClientProxy>();
            var mockDocBProxy = new Mock<Microsoft.AspNetCore.SignalR.IClientProxy>();
            var mockAllProxy = new Mock<Microsoft.AspNetCore.SignalR.IClientProxy>();

            var clinicPayloads = new List<object>();
            var docAPayloads = new List<object>();
            var docBPayloads = new List<object>();
            var allPayloads = new List<object>();

            mockClinicProxy
                .Setup(p => p.SendCoreAsync("QueueUpdated", It.IsAny<object[]>(), default))
                .Returns((string method, object[] args, System.Threading.CancellationToken ct) =>
                {
                    if (args != null && args.Length > 0) clinicPayloads.Add(args[0]);
                    return Task.CompletedTask;
                });

            mockDocAProxy
                .Setup(p => p.SendCoreAsync("QueueUpdated", It.IsAny<object[]>(), default))
                .Returns((string method, object[] args, System.Threading.CancellationToken ct) =>
                {
                    if (args != null && args.Length > 0) docAPayloads.Add(args[0]);
                    return Task.CompletedTask;
                });

            mockDocBProxy
                .Setup(p => p.SendCoreAsync("QueueUpdated", It.IsAny<object[]>(), default))
                .Returns((string method, object[] args, System.Threading.CancellationToken ct) =>
                {
                    if (args != null && args.Length > 0) docBPayloads.Add(args[0]);
                    return Task.CompletedTask;
                });

            mockAllProxy
                .Setup(p => p.SendCoreAsync("ReceiveNotification", It.IsAny<object[]>(), default))
                .Returns((string method, object[] args, System.Threading.CancellationToken ct) =>
                {
                    if (args != null && args.Length > 0) allPayloads.Add(args[0]);
                    return Task.CompletedTask;
                });

            mockClients.Setup(c => c.Group("ClinicQueue")).Returns(mockClinicProxy.Object);
            mockClients.Setup(c => c.Group("DoctorQueue_101")).Returns(mockDocAProxy.Object);
            mockClients.Setup(c => c.Group("DoctorQueue_102")).Returns(mockDocBProxy.Object);
            mockClients.Setup(c => c.All).Returns(mockAllProxy.Object);

            hub.Clients = mockClients.Object;

            // Test 11.9: Cross-Doctor Message Isolation and Dual-Tier Broadcast
            clinicPayloads.Clear();
            docAPayloads.Clear();
            docBPayloads.Clear();
            await hub.BroadcastQueueUpdate("TokenStatusChanged", 8881, "Consulting", 101);

            Assert(clinicPayloads.Count == 1, "BroadcastQueueUpdate dispatches message to ClinicQueue");
            Assert(docAPayloads.Count == 1, "BroadcastQueueUpdate dispatches message to target DoctorQueue_101");
            Assert(docBPayloads.Count == 0, "Cross-doctor message isolation: Doctor B (DoctorQueue_102) receives zero messages from Doctor 101 queue update");

            // Test 11.10: Zero PII Payload Verification
            var sentPayload = docAPayloads[0];
            var payloadType = sentPayload.GetType();
            bool hasPatientName = payloadType.GetProperty("PatientName") != null;
            bool hasMrn = payloadType.GetProperty("Mrn") != null || payloadType.GetProperty("MedicalRecordNumber") != null;
            bool hasCnic = payloadType.GetProperty("Cnic") != null;
            bool hasDiagnosis = payloadType.GetProperty("Diagnosis") != null || payloadType.GetProperty("Complaint") != null;
            var eventTypeProp = payloadType.GetProperty("EventType")?.GetValue(sentPayload)?.ToString();
            var tokenIdProp = payloadType.GetProperty("TokenId")?.GetValue(sentPayload);

            Assert(!hasPatientName && !hasMrn && !hasCnic && !hasDiagnosis, "Broadcast payload strictly contains zero clinical or demographic PII");
            Assert(eventTypeProp == "TokenStatusChanged" && Convert.ToInt64(tokenIdProp) == 8881, "Broadcast payload contains correct operational metadata (EventType, TokenId)");

            // Test 11.11: Admin System Broadcast Authorization Check
            SetupHubContext("501", "Doctor");
            bool doctorBroadcastBlocked = false;
            try
            {
                await hub.BroadcastNotification("Alert", "Test broadcast", "Warning");
            }
            catch (Microsoft.AspNetCore.SignalR.HubException ex) when (ex.Message.Contains("Only administrators can broadcast"))
            {
                doctorBroadcastBlocked = true;
            }
            Assert(doctorBroadcastBlocked, "Doctor role is strictly rejected from broadcasting system notifications");

            SetupHubContext("1", "Super Administrator");
            allPayloads.Clear();
            await hub.BroadcastNotification("Maintenance", "Scheduled maintenance tonight", "Info");
            Assert(allPayloads.Count == 1, "Super Administrator successfully broadcasts system notification to all clients");

            // Test 11.12: Channel Unsubscription (Leave) Verification
            removedGroups.Clear();
            await hub.LeaveClinicQueueChannel();
            Assert(removedGroups.Contains("ClinicQueue"), "LeaveClinicQueueChannel removes caller from ClinicQueue");

            removedGroups.Clear();
            await hub.LeaveDoctorQueueChannel(101);
            Assert(removedGroups.Contains("DoctorQueue_101"), "LeaveDoctorQueueChannel removes caller from DoctorQueue_101");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"  [ERROR] Integration Test 11 threw exception: {ex.Message}");
            failed++;
        }

        // Integration Test 12: Real ASP.NET Core SignalR Transport & Multi-Client Isolation
        try
        {
            await SignalRRealTransportTests.RunTestsAsync((cond, name) => Assert(cond, name));
        }
        catch (Exception ex)
        {
            Console.WriteLine($"  [ERROR] Integration Test 12 threw exception: {ex.Message}");
            failed++;
        }

        // Summary output
        Console.WriteLine("==================================================");
        Console.WriteLine($"RESULTS: Total: {passed + failed} | Passed: {passed} | Failed: {failed}");
        Console.WriteLine("==================================================");

        return failed == 0 ? 0 : 1;
    }
}
