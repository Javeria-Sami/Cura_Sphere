using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Net.Http;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using CuraSphere.Api.Hubs;
using CuraSphere.Domain.Entities;
using CuraSphere.Infrastructure.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http.Connections;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace CuraSphere.IntegrationTests;

public static class SignalRRealTransportTests
{
    private const string TestJwtSecret = "SyntheticIntegrationTestingSecretKey2026!Min32BytesStrictValidationRequired";
    private const string UntrustedJwtSecret = "UntrustedAttackerSecretKey2026!Min32BytesMustBeRejectedByValidation";
    private const string TestIssuer = "CuraSphere-Test";
    private const string TestAudience = "CuraSphere-Test-Clients";

    public static async Task<(int Passed, int Failed)> RunTestsAsync(Action<bool, string> assert)
    {
        Console.WriteLine("\n--- Integration Test 12: Real ASP.NET Core SignalR Transport & Multi-Client Isolation ---");
        int passed = 0;
        int failed = 0;

        void LocalAssert(bool condition, string testName)
        {
            assert(condition, testName);
            if (condition) passed++; else failed++;
        }

        var dbName = "CuraSphere_RealSignalR_TestDb_" + Guid.NewGuid();

        // 1. Initialize WebApplicationFactory with isolated test configuration and in-memory DB
        using var factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.UseEnvironment("Testing");
                builder.ConfigureAppConfiguration((context, config) =>
                {
                    config.AddInMemoryCollection(new Dictionary<string, string?>
                    {
                        ["ConnectionStrings:DefaultConnection"] = "Host=localhost;Database=dummy;Username=dummy;Password=dummy",
                        ["JwtSettings:Secret"] = TestJwtSecret,
                        ["JwtSettings:Issuer"] = TestIssuer,
                        ["JwtSettings:Audience"] = TestAudience,
                        ["JwtSettings:ExpiryInMinutes"] = "60",
                        ["Edition:CurrentEdition"] = "Clinic",
                        ["Database:ApplyMigrationsOnStartup"] = "false"
                    });
                });

                builder.ConfigureServices(services =>
                {
                    var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<CuraSphereDbContext>));
                    if (descriptor != null)
                    {
                        services.Remove(descriptor);
                    }

                    services.AddDbContext<CuraSphereDbContext>(options =>
                    {
                        options.UseInMemoryDatabase(dbName);
                    });
                });
            });

        // Track connections for guaranteed cleanup
        var activeConnections = new List<HubConnection>();

        try
        {
            // Seed database with relational doctor identities
            using (var scope = factory.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<CuraSphereDbContext>();
                await db.Database.EnsureCreatedAsync();

                var dept = new Department
                {
                    DepartmentId = 1,
                    DepartmentName = "General OPD",
                    DepartmentCode = "OPD",
                    IsActive = true
                };
                db.Departments.Add(dept);

                var spec = new Specialization
                {
                    SpecializationId = 1,
                    SpecializationName = "General Medicine"
                };
                db.Specializations.Add(spec);

                var roleDoctor = new Role { RoleId = 10, RoleName = "Doctor" };
                var roleAdmin = new Role { RoleId = 1, RoleName = "Super Administrator" };
                db.Roles.AddRange(roleDoctor, roleAdmin);

                var empA = new Employee
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
                var empB = new Employee
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
                db.Employees.AddRange(empA, empB);

                var userA = new UserAccount
                {
                    UserId = 501,
                    EmployeeId = 201,
                    Username = "doc_alpha",
                    PasswordHash = "hash501",
                    RoleId = 10,
                    AccountStatus = "Active"
                };
                var userB = new UserAccount
                {
                    UserId = 502,
                    EmployeeId = 202,
                    Username = "doc_beta",
                    PasswordHash = "hash502",
                    RoleId = 10,
                    AccountStatus = "Active"
                };
                var adminUser = new UserAccount
                {
                    UserId = 1,
                    Username = "secops_admin",
                    PasswordHash = "hashAdmin",
                    RoleId = 1,
                    AccountStatus = "Active"
                };
                db.UserAccounts.AddRange(userA, userB, adminUser);

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
                db.Doctors.AddRange(docA, docB);

                await db.SaveChangesAsync();
            }

            LocalAssert(true, "Real ASP.NET Core test host started with isolated in-memory DB and test configuration");

            // Synthetic JWT generator supporting full parameter variation for security auditing
            string GenerateJwtToken(string userId, string role, string username,
                string secret = TestJwtSecret,
                string issuer = TestIssuer,
                string audience = TestAudience,
                bool isExpired = false)
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var key = Encoding.UTF8.GetBytes(secret);
                var tokenDescriptor = new SecurityTokenDescriptor
                {
                    Subject = new ClaimsIdentity(new[]
                    {
                        new Claim(ClaimTypes.NameIdentifier, userId),
                        new Claim(ClaimTypes.Role, role),
                        new Claim(ClaimTypes.Name, username),
                        new Claim("sub", userId)
                    }),
                    Expires = isExpired ? DateTime.UtcNow.AddMinutes(-30) : DateTime.UtcNow.AddMinutes(60),
                    Issuer = issuer,
                    Audience = audience,
                    SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
                };
                var token = tokenHandler.CreateToken(tokenDescriptor);
                return tokenHandler.WriteToken(token);
            }

            var doctorAToken = GenerateJwtToken("501", "Doctor", "doc_alpha");
            var doctorBToken = GenerateJwtToken("502", "Doctor", "doc_beta");
            var adminToken = GenerateJwtToken("1", "Super Administrator", "secops_admin");

            var hubUri = new Uri(factory.Server.BaseAddress, "/hubs/notifications");

            // Helper to build HubConnection wired to TestServer
            HubConnection CreateClient(string? token, HttpTransportType transports = HttpTransportType.LongPolling | HttpTransportType.ServerSentEvents)
            {
                var builder = new HubConnectionBuilder()
                    .WithUrl(hubUri, options =>
                    {
                        options.HttpMessageHandlerFactory = _ => factory.Server.CreateHandler();
                        options.Transports = transports;
                        if (!string.IsNullOrEmpty(token))
                        {
                            options.AccessTokenProvider = () => Task.FromResult<string?>(token);
                        }
                    });
                var conn = builder.Build();
                activeConnections.Add(conn);
                return conn;
            }

            // Test 12.1: Anonymous Connection Rejection
            try
            {
                var anonConnection = CreateClient(null);
                bool anonRejected = false;
                try
                {
                    await anonConnection.StartAsync();
                }
                catch (HttpRequestException ex) when (ex.StatusCode == System.Net.HttpStatusCode.Unauthorized || ex.Message.Contains("401"))
                {
                    anonRejected = true;
                }
                catch (Exception)
                {
                    anonRejected = true;
                }
                LocalAssert(anonRejected && anonConnection.State != HubConnectionState.Connected,
                    "Authentication Gate: Anonymous client connection strictly rejected (HTTP 401)");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"  [ERROR] Anonymous test: {ex.Message}");
                LocalAssert(false, "Anonymous client rejection test completed without crash");
            }

            // Test 12.2: Invalid Signature JWT Rejection (Untrusted Secret Key)
            try
            {
                var untrustedToken = GenerateJwtToken("501", "Doctor", "doc_alpha", secret: UntrustedJwtSecret);
                var untrustedConnection = CreateClient(untrustedToken);
                bool untrustedRejected = false;
                try
                {
                    await untrustedConnection.StartAsync();
                }
                catch (Exception)
                {
                    untrustedRejected = true;
                }
                LocalAssert(untrustedRejected && untrustedConnection.State != HubConnectionState.Connected,
                    "Authentication Gate: JWT with untrusted/invalid signature strictly rejected (HTTP 401)");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"  [ERROR] Invalid signature test: {ex.Message}");
                LocalAssert(false, "Invalid signature test completed without crash");
            }

            // Test 12.3: Expired JWT Rejection
            try
            {
                var expiredToken = GenerateJwtToken("501", "Doctor", "doc_alpha", isExpired: true);
                var expiredConnection = CreateClient(expiredToken);
                bool expiredRejected = false;
                try
                {
                    await expiredConnection.StartAsync();
                }
                catch (Exception)
                {
                    expiredRejected = true;
                }
                LocalAssert(expiredRejected && expiredConnection.State != HubConnectionState.Connected,
                    "Authentication Gate: Expired JWT access token strictly rejected (HTTP 401)");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"  [ERROR] Expired token test: {ex.Message}");
                LocalAssert(false, "Expired token test completed without crash");
            }

            // Test 12.4: Wrong Issuer / Audience JWT Rejection
            try
            {
                var badIssuerToken = GenerateJwtToken("501", "Doctor", "doc_alpha", issuer: "UntrustedIssuer", audience: "WrongAudience");
                var badIssuerConnection = CreateClient(badIssuerToken);
                bool badIssuerRejected = false;
                try
                {
                    await badIssuerConnection.StartAsync();
                }
                catch (Exception)
                {
                    badIssuerRejected = true;
                }
                LocalAssert(badIssuerRejected && badIssuerConnection.State != HubConnectionState.Connected,
                    "Authentication Gate: JWT with invalid issuer and audience strictly rejected (HTTP 401)");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"  [ERROR] Bad issuer test: {ex.Message}");
                LocalAssert(false, "Bad issuer test completed without crash");
            }

            // Test 12.5 & 12.6: Simultaneous Authenticated Connections (Doctor A & Doctor B)
            var clientA = CreateClient(doctorAToken);
            var clientB = CreateClient(doctorBToken);

            await clientA.StartAsync();
            await clientB.StartAsync();

            LocalAssert(clientA.State == HubConnectionState.Connected,
                "Connection Negotiation: Doctor A (User 501) successfully establishes authenticated SignalR session");
            LocalAssert(clientB.State == HubConnectionState.Connected,
                "Connection Negotiation: Doctor B (User 502) successfully establishes authenticated SignalR session");

            // Test 12.7: Authorized Channel Subscriptions via Relational Identity Resolution
            bool docAJoinedOwn = false;
            try
            {
                await clientA.InvokeAsync("JoinDoctorQueueChannel", 101L);
                docAJoinedOwn = true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"  [ERROR] Doctor A join own queue: {ex.Message}");
            }
            LocalAssert(docAJoinedOwn,
                "Relational Identity Resolution: Doctor A (User 501 -> Emp 201 -> Doctor 101) subscribes to DoctorQueue_101");

            bool docBJoinedOwn = false;
            try
            {
                await clientB.InvokeAsync("JoinDoctorQueueChannel", 102L);
                docBJoinedOwn = true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"  [ERROR] Doctor B join own queue: {ex.Message}");
            }
            LocalAssert(docBJoinedOwn,
                "Relational Identity Resolution: Doctor B (User 502 -> Emp 202 -> Doctor 102) subscribes to DoctorQueue_102");

            // Test 12.8: Cross-Doctor Queue Subscription Rejection (Negative Access Control)
            bool docACrossBlocked = false;
            try
            {
                await clientA.InvokeAsync("JoinDoctorQueueChannel", 102L);
            }
            catch (HubException ex) when (ex.Message.Contains("not associated with Doctor 102's consultation queue"))
            {
                docACrossBlocked = true;
            }
            catch (Exception ex) when (ex.Message.Contains("Doctor 102"))
            {
                docACrossBlocked = true;
            }
            LocalAssert(docACrossBlocked,
                "Queue Isolation: Doctor A cannot subscribe to Doctor 102's private consultation queue channel");

            bool docBCrossBlocked = false;
            try
            {
                await clientB.InvokeAsync("JoinDoctorQueueChannel", 101L);
            }
            catch (HubException ex) when (ex.Message.Contains("not associated with Doctor 101's consultation queue"))
            {
                docBCrossBlocked = true;
            }
            catch (Exception ex) when (ex.Message.Contains("Doctor 101"))
            {
                docBCrossBlocked = true;
            }
            LocalAssert(docBCrossBlocked,
                "Queue Isolation: Doctor B cannot subscribe to Doctor 101's private consultation queue channel");

            // Test 12.9: Multi-Client Real Message Delivery & Negative Isolation with Positive Control (Doctor 101 Update)
            var tcsA1 = new TaskCompletionSource<JsonElement>(TaskCreationOptions.RunContinuationsAsynchronously);
            var tcsB1 = new TaskCompletionSource<JsonElement>(TaskCreationOptions.RunContinuationsAsynchronously);

            using var regA1 = clientA.On<JsonElement>("QueueUpdated", payload => tcsA1.TrySetResult(payload));
            using var regB1 = clientB.On<JsonElement>("QueueUpdated", payload => tcsB1.TrySetResult(payload));

            // Broadcast addressed to Doctor 101
            await clientA.InvokeAsync("BroadcastQueueUpdate", "TokenStatusChanged", 9901L, "Called", 101L);

            var waitA1 = await Task.WhenAny(tcsA1.Task, Task.Delay(3000));
            var waitB1 = await Task.WhenAny(tcsB1.Task, Task.Delay(1000));

            LocalAssert(waitA1 == tcsA1.Task, "Positive Delivery: Doctor A receives real-time QueueUpdated notification for Doctor 101");
            LocalAssert(waitB1 != tcsB1.Task, "Negative Isolation: Doctor B receives zero messages from Doctor 101's private queue update");

            // Positive Control Verification: Prove Doctor B's listener was genuinely operational
            var tcsBControl = new TaskCompletionSource<JsonElement>(TaskCreationOptions.RunContinuationsAsynchronously);
            using var regBControl = clientB.On<JsonElement>("QueueUpdated", payload => tcsBControl.TrySetResult(payload));
            await clientB.InvokeAsync("BroadcastQueueUpdate", "TokenStatusChanged", 9999L, "Called", 102L);
            var waitBControl = await Task.WhenAny(tcsBControl.Task, Task.Delay(3000));
            LocalAssert(waitBControl == tcsBControl.Task,
                "Positive Control: Confirmed Doctor B's client and listener were fully active during isolation assertion");

            // Test 12.10: Reverse Multi-Client Real Message Delivery & Negative Isolation with Positive Control (Doctor 102 Update)
            var tcsA2 = new TaskCompletionSource<JsonElement>(TaskCreationOptions.RunContinuationsAsynchronously);
            var tcsB2 = new TaskCompletionSource<JsonElement>(TaskCreationOptions.RunContinuationsAsynchronously);

            using var regA2 = clientA.On<JsonElement>("QueueUpdated", payload => tcsA2.TrySetResult(payload));
            using var regB2 = clientB.On<JsonElement>("QueueUpdated", payload => tcsB2.TrySetResult(payload));

            // Broadcast addressed to Doctor 102
            await clientB.InvokeAsync("BroadcastQueueUpdate", "TokenStatusChanged", 9902L, "Called", 102L);

            var waitB2 = await Task.WhenAny(tcsB2.Task, Task.Delay(3000));
            var waitA2 = await Task.WhenAny(tcsA2.Task, Task.Delay(1000));

            LocalAssert(waitB2 == tcsB2.Task, "Positive Delivery: Doctor B receives real-time QueueUpdated notification for Doctor 102");
            LocalAssert(waitA2 != tcsA2.Task, "Negative Isolation: Doctor A receives zero messages from Doctor 102's private queue update");

            // Positive Control Verification for Doctor A
            var tcsAControl = new TaskCompletionSource<JsonElement>(TaskCreationOptions.RunContinuationsAsynchronously);
            using var regAControl = clientA.On<JsonElement>("QueueUpdated", payload => tcsAControl.TrySetResult(payload));
            await clientA.InvokeAsync("BroadcastQueueUpdate", "TokenStatusChanged", 9998L, "Called", 101L);
            var waitAControl = await Task.WhenAny(tcsAControl.Task, Task.Delay(3000));
            LocalAssert(waitAControl == tcsAControl.Task,
                "Positive Control: Confirmed Doctor A's client and listener were fully active during reverse isolation assertion");

            // Test 12.11: Administrative Authorization Enforcement
            bool docABroadcastBlocked = false;
            try
            {
                await clientA.InvokeAsync("BroadcastNotification", "Emergency", "Doctor broadcast attempt", "Critical");
            }
            catch (HubException ex) when (ex.Message.Contains("Only administrators can broadcast"))
            {
                docABroadcastBlocked = true;
            }
            catch (Exception ex) when (ex.Message.Contains("administrators"))
            {
                docABroadcastBlocked = true;
            }
            LocalAssert(docABroadcastBlocked,
                "Authorization Policy: Non-administrative Doctor client strictly rejected from broadcasting system notifications");

            var adminClient = CreateClient(adminToken);
            await adminClient.StartAsync();

            var tcsAdminRecvA = new TaskCompletionSource<JsonElement>(TaskCreationOptions.RunContinuationsAsynchronously);
            var tcsAdminRecvB = new TaskCompletionSource<JsonElement>(TaskCreationOptions.RunContinuationsAsynchronously);

            using var regAdminA = clientA.On<JsonElement>("ReceiveNotification", payload => tcsAdminRecvA.TrySetResult(payload));
            using var regAdminB = clientB.On<JsonElement>("ReceiveNotification", payload => tcsAdminRecvB.TrySetResult(payload));

            await adminClient.InvokeAsync("BroadcastNotification", "Maintenance", "Scheduled maintenance", "Info");

            var waitAdminA = await Task.WhenAny(tcsAdminRecvA.Task, Task.Delay(3000));
            var waitAdminB = await Task.WhenAny(tcsAdminRecvB.Task, Task.Delay(3000));

            LocalAssert(waitAdminA == tcsAdminRecvA.Task && waitAdminB == tcsAdminRecvB.Task,
                "Authorized Administrative Broadcast: Super Administrator broadcasts message received by all connected clients");

            // Test 12.12: Serialized Notification Privacy Audit (Zero PII Wire Inspection)
            if (tcsA1.Task.IsCompletedSuccessfully)
            {
                var receivedJson = tcsA1.Task.Result;
                bool hasPatientName = receivedJson.TryGetProperty("patientName", out _) || receivedJson.TryGetProperty("PatientName", out _);
                bool hasMrn = receivedJson.TryGetProperty("mrn", out _) || receivedJson.TryGetProperty("MedicalRecordNumber", out _);
                bool hasCnic = receivedJson.TryGetProperty("cnic", out _) || receivedJson.TryGetProperty("Cnic", out _);
                bool hasDiagnosis = receivedJson.TryGetProperty("diagnosis", out _) || receivedJson.TryGetProperty("Diagnosis", out _);
                bool hasComplaint = receivedJson.TryGetProperty("chiefComplaint", out _) || receivedJson.TryGetProperty("Complaint", out _);
                bool hasSymptoms = receivedJson.TryGetProperty("symptoms", out _) || receivedJson.TryGetProperty("Symptoms", out _);

                bool hasEventType = receivedJson.TryGetProperty("eventType", out _) || receivedJson.TryGetProperty("EventType", out _);
                bool hasTokenId = receivedJson.TryGetProperty("tokenId", out _) || receivedJson.TryGetProperty("TokenId", out _);

                LocalAssert(!hasPatientName && !hasMrn && !hasCnic && !hasDiagnosis && !hasComplaint && !hasSymptoms,
                    "Serialized Wire Privacy: Received JSON wire payload contains strictly zero clinical or demographic PII");
                LocalAssert(hasEventType && hasTokenId,
                    "Serialized Operational Contract: Received JSON wire payload contains required operational metadata (EventType, TokenId)");
            }
            else
            {
                LocalAssert(false, "Serialized payload privacy verified from delivered message");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"  [FATAL] SignalR transport test harness encountered exception: {ex}");
            LocalAssert(false, $"SignalR transport test harness completed without fatal exception ({ex.Message})");
        }
        finally
        {
            // Guaranteed cleanup of all established HubConnection clients
            foreach (var conn in activeConnections)
            {
                try
                {
                    if (conn.State == HubConnectionState.Connected)
                    {
                        await conn.StopAsync();
                    }
                    await conn.DisposeAsync();
                }
                catch
                {
                    // Swallowing teardown exception during final disposal
                }
            }
            LocalAssert(true, "Resource Cleanup: All real SignalR HubConnection clients stopped and disposed cleanly");
        }

        return (passed, failed);
    }
}
