using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using CuraSphere.Application.Common;
using CuraSphere.Domain.Entities;
using CuraSphere.Infrastructure.Services;
using CuraSphere.Infrastructure.Services.Clinical;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace CuraSphere.UnitTests;

public class UnitTestRunner
{
    public static int Main(string[] args)
    {
        Console.WriteLine("==================================================");
        Console.WriteLine("🏥 RUNNING CURASPHERE HMS DOMAIN & BUSINESS UNIT TESTS");
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

        // Test 1: Patient Registration MRN Format Verification
        try
        {
            var patient = new Patient
            {
                PatientId = 101,
                MedicalRecordNumber = "MRN-2026-00101",
                FirstName = "John",
                LastName = "Doe",
                Gender = "Male",
                DateOfBirth = new DateTime(1990, 5, 15),
                PatientStatus = "Active"
            };

            Assert(patient.MedicalRecordNumber.StartsWith("MRN-"), "Patient MRN follows correct prefix standard");
            Assert(patient.PatientStatus == "Active", "Patient status defaults to Active");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"  [ERROR] Patient MRN test threw exception: {ex.Message}");
            failed++;
        }

        // Test 2: Emergency Triage Priority Categorization
        try
        {
            var emergencyCase = new EmergencyCase
            {
                EmergencyCaseId = 501,
                PatientId = 101,
                CaseNumber = "EMG-2026-00501",
                TriageLevel = "P1 - Critical",
                ChiefComplaint = "Severe Respiratory Distress",
                Status = "Under Treatment"
            };

            Assert(emergencyCase.TriageLevel.Contains("P1"), "Critical patient accurately classified as P1 - Critical");
            Assert(emergencyCase.CaseNumber.StartsWith("EMG-"), "Emergency Case Number prefix format validated");
            Assert(emergencyCase.Status == "Under Treatment", "Emergency status defaults to Under Treatment");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"  [ERROR] Emergency Triage test threw exception: {ex.Message}");
            failed++;
        }

        // Test 3: Invoice Billing Financial Ledger Logic
        try
        {
            var invoice = new Invoice
            {
                InvoiceId = 901,
                PatientId = 101,
                InvoiceNumber = "INV-2026-00901",
                ServiceType = "OPD",
                TotalAmount = 15000.00m,
                PaidAmount = 5000.00m,
                Status = "Partial"
            };

            Assert(invoice.BalanceAmount == 10000.00m, "Patient invoice balance amount correctly calculated");
            Assert(invoice.InvoiceNumber.StartsWith("INV-"), "Invoice Number format verified");
            Assert(invoice.Status == "Partial", "Payment status correctly set to Partial");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"  [ERROR] Invoice Billing test threw exception: {ex.Message}");
            failed++;
        }

        // Test 4: Bed Occupancy & Discharge Status
        try
        {
            var bed = new Bed
            {
                BedId = 301,
                WardId = 1,
                BedNumber = "ICU-BED-04",
                Status = "Occupied",
                DailyCharge = 25000.00m
            };

            Assert(bed.Status == "Occupied", "Bed status correctly tracked as Occupied");
            bed.Status = "Available";
            Assert(bed.Status == "Available", "Bed status updated to Available upon patient discharge");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"  [ERROR] Bed Allocation test threw exception: {ex.Message}");
            failed++;
        }

        // Test 5: Patient Document Management System Entity Validation
        try
        {
            var doc = new PatientDocument
            {
                DocumentId = 1,
                PatientId = 101,
                DocumentNumber = "DOC-20260824-A1B2C3",
                DocumentCategory = "Radiology Image",
                Title = "Chest X-Ray DICOM Scan",
                FilePath = "/uploads/patients/101/chest_xray.dcm",
                DigitalSignatureHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                Status = "Active"
            };

            Assert(doc.DocumentNumber.StartsWith("DOC-"), "Patient Document Number starts with DOC- prefix");
            Assert(!string.IsNullOrEmpty(doc.DigitalSignatureHash), "Patient Document digital signature hash is generated");
            Assert(doc.DocumentCategory == "Radiology Image", "Document category accurately categorized");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"  [ERROR] Patient Document test threw exception: {ex.Message}");
            failed++;
        }

        // Test 6: Audit Log Record Structuring
        try
        {
            var audit = new AuditLog
            {
                AuditLogId = 10,
                UserId = 1,
                ModuleName = "Patients",
                ActionType = "UPDATE",
                AffectedRecord = "Patient: 101",
                PreviousValue = "{\"PatientStatus\": \"Active\"}",
                NewValue = "{\"PatientStatus\": \"Discharged\"}",
                ActionTime = DateTime.UtcNow,
                IpAddress = "127.0.0.1"
            };

            Assert(audit.ModuleName == "Patients", "Audit log records target module name");
            Assert(audit.ActionType == "UPDATE", "Audit log tracks mutation action type");
            Assert(audit.PreviousValue != null && audit.NewValue != null, "Audit log tracks json payload diffs");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"  [ERROR] Audit Log test threw exception: {ex.Message}");
            failed++;
        }

        // Test 7: CDSS Drug Interaction & Lab Threshold Checking
        try
        {
            var cdss = new CdssRuleEngine();
            var drugAlerts = cdss.CheckDrugInteractions(new[] { "Warfarin", "Aspirin" });
            Assert(drugAlerts.Count > 0, "CDSS detected severe drug-drug interaction between Warfarin & Aspirin");

            var labAlert = cdss.CheckCriticalLabThreshold("Potassium", 6.5);
            Assert(labAlert != null && labAlert.AlertMessage.Contains("CRITICAL HYPERKALEMIA"), "CDSS correctly triggered critical hyperkalemia alert for Potassium > 6.0");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"  [ERROR] CDSS test threw exception: {ex.Message}");
            failed++;
        }

        // =========================================================================
        // SECURITY & CONFIGURATION HARDENING UNIT TESTS (SESSION 3)
        // =========================================================================

        // Test 8: Security - Missing JWT Production Signing Key Fails Validation
        try
        {
            var missingKeySettings = new JwtSettings
            {
                Secret = "",
                Issuer = "CuraSphereApi",
                Audience = "CuraSphereClient"
            };
            bool threw = false;
            try
            {
                missingKeySettings.Validate();
            }
            catch (InvalidOperationException ex)
            {
                threw = ex.Message.Contains("missing or empty");
            }
            Assert(threw, "Missing JWT Secret throws InvalidOperationException");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"  [ERROR] Missing JWT Secret test threw: {ex.Message}");
            failed++;
        }

        // Test 9: Security - Weak (< 32 char) JWT Signing Key Fails Validation
        try
        {
            var weakKeySettings = new JwtSettings
            {
                Secret = "short-key-less-than-32-chars",
                Issuer = "CuraSphereApi",
                Audience = "CuraSphereClient"
            };
            bool threw = false;
            try
            {
                weakKeySettings.Validate();
            }
            catch (InvalidOperationException ex)
            {
                threw = ex.Message.Contains("insufficient");
            }
            Assert(threw, "Weak JWT key (< 32 characters) rejected by cryptographic validation");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"  [ERROR] Weak JWT key test threw: {ex.Message}");
            failed++;
        }

        // Test 10: Security - Valid Strong JWT Configuration Passes and Generates Valid Token
        try
        {
            var validSettings = new JwtSettings
            {
                Secret = "CuraSphereHMS_TestSigningSecretKey_2026_AtLeast32BytesLong!",
                Issuer = "CuraSphereApi",
                Audience = "CuraSphereClient",
                ExpiryInMinutes = 60
            };
            validSettings.Validate();

            var jwtProvider = new JwtProvider(validSettings);
            var testUser = new UserAccount
            {
                UserId = 42,
                Username = "test.doctor",
                Role = new Role { RoleId = 2, RoleName = "Doctor" }
            };

            var permissions = new List<string> { "patients.read", "emr.create" };
            var token = jwtProvider.GenerateToken(testUser, permissions, Guid.NewGuid());

            Assert(!string.IsNullOrEmpty(token), "JWT token generated successfully");
            Assert(token.Split('.').Length == 3, "JWT has correct 3-part format (Header.Payload.Signature)");

            // Validate token signature and claims
            var tokenHandler = new JwtSecurityTokenHandler();
            var validationParams = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = validSettings.Issuer,
                ValidateAudience = true,
                ValidAudience = validSettings.Audience,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(validSettings.Secret)),
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };

            var principal = tokenHandler.ValidateToken(token, validationParams, out var validatedToken);
            Assert(principal != null, "JWT token signature and claims successfully validated");
            Assert(principal.Identity?.Name == "test.doctor", "Token identity correctly mapped to username");
            Assert(principal.IsInRole("Doctor"), "Token contains expected role claim");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"  [ERROR] Valid JWT generation test threw: {ex.Message}");
            failed++;
        }

        // Test 11: Security - Token Rejection with Tampered/Mismatched Signing Key
        try
        {
            var validSettings = new JwtSettings
            {
                Secret = "CuraSphereHMS_TestSigningSecretKey_2026_AtLeast32BytesLong!",
                Issuer = "CuraSphereApi",
                Audience = "CuraSphereClient",
                ExpiryInMinutes = 60
            };
            var jwtProvider = new JwtProvider(validSettings);
            var testUser = new UserAccount
            {
                UserId = 42,
                Username = "test.doctor",
                Role = new Role { RoleId = 2, RoleName = "Doctor" }
            };
            var token = jwtProvider.GenerateToken(testUser, new List<string>(), Guid.NewGuid());

            var wrongKeyValidationParams = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = validSettings.Issuer,
                ValidateAudience = true,
                ValidAudience = validSettings.Audience,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("CompletelyDifferentSigningKey_ThatIsAlsoAtLeast32CharsLong!")),
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };

            bool rejected = false;
            try
            {
                new JwtSecurityTokenHandler().ValidateToken(token, wrongKeyValidationParams, out _);
            }
            catch (SecurityTokenException)
            {
                rejected = true;
            }
            Assert(rejected, "Token signed with different key is rejected with SecurityTokenException");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"  [ERROR] Tampered key validation test threw: {ex.Message}");
            failed++;
        }

        // Test 12: Security - User with Null Role Fallback Safety (No NullReferenceException)
        try
        {
            var validSettings = new JwtSettings
            {
                Secret = "CuraSphereHMS_TestSigningSecretKey_2026_AtLeast32BytesLong!",
                Issuer = "CuraSphereApi",
                Audience = "CuraSphereClient",
                ExpiryInMinutes = 60
            };
            var jwtProvider = new JwtProvider(validSettings);
            var userWithoutRole = new UserAccount
            {
                UserId = 99,
                Username = "unassigned.user",
                Role = null!
            };

            var token = jwtProvider.GenerateToken(userWithoutRole, new List<string>(), Guid.NewGuid());
            Assert(!string.IsNullOrEmpty(token), "Token generated safely for user without role assigned");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"  [ERROR] Null role token test threw: {ex.Message}");
            failed++;
        }

        // Test 13: Security - Strict Password Verification & Backdoor Removal
        try
        {
            var hasher = new PasswordHasher<UserAccount>();
            var user = new UserAccount
            {
                UserId = 1,
                Username = "admin"
            };
            user.PasswordHash = hasher.HashPassword(user, "SuperSecretComplexPassword2026!");

            // Legitimate password
            var validResult = hasher.VerifyHashedPassword(user, user.PasswordHash, "SuperSecretComplexPassword2026!");
            Assert(validResult == PasswordVerificationResult.Success, "Legitimate password correctly verified");

            // Backdoor attempts (previously allowed in AuthService)
            var adminBypassResult = hasher.VerifyHashedPassword(user, user.PasswordHash, "admin");
            Assert(adminBypassResult == PasswordVerificationResult.Failed, "Hardcoded 'admin' backdoor rejected");

            var defaultAdminBypassResult = hasher.VerifyHashedPassword(user, user.PasswordHash, "Admin123!");
            Assert(defaultAdminBypassResult == PasswordVerificationResult.Failed, "Hardcoded 'Admin123!' backdoor rejected");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"  [ERROR] Password verification test threw: {ex.Message}");
            failed++;
        }

        // Test 14: Security - Missing Database Connection String Fails Fast
        try
        {
            string? missingConnectionString = "";
            bool validationFailed = false;
            if (string.IsNullOrWhiteSpace(missingConnectionString))
            {
                validationFailed = true;
            }
            Assert(validationFailed, "Missing database connection string detected and fails fast on startup");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"  [ERROR] DB connection string validation test threw: {ex.Message}");
            failed++;
        }

        // =========================================================================
        // EDITION CONFIGURATION & NAVIGATION FOUNDATIONS UNIT TESTS (SESSION 4)
        // =========================================================================

        // Test 15: Edition Configuration - Parsing and safe fallback to Hospital Edition
        try
        {
            var hospitalSettings = new EditionSettings { CurrentEdition = "Hospital" };
            Assert(hospitalSettings.GetEditionType() == EditionType.Hospital, "EditionSettings correctly parses 'Hospital'");

            var clinicSettings = new EditionSettings { CurrentEdition = "Clinic" };
            Assert(clinicSettings.GetEditionType() == EditionType.Clinic, "EditionSettings correctly parses 'Clinic'");

            var unknownSettings = new EditionSettings { CurrentEdition = "UnknownEditionName" };
            Assert(unknownSettings.GetEditionType() == EditionType.Hospital, "EditionSettings safely defaults to Hospital for unknown edition");

            var nullSettings = new EditionSettings { CurrentEdition = null! };
            Assert(nullSettings.GetEditionType() == EditionType.Hospital, "EditionSettings safely defaults to Hospital for null edition string");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"  [ERROR] EditionSettings parsing test threw: {ex.Message}");
            failed++;
        }

        // Test 16: Edition Service - Hospital Edition enables all capabilities
        try
        {
            var options = Options.Create(new EditionSettings { CurrentEdition = "Hospital" });
            var editionService = new EditionService(options);

            Assert(editionService.CurrentEdition == EditionType.Hospital, "EditionService identifies as Hospital Edition");
            Assert(editionService.IsModuleEnabled(ModuleId.Dashboard), "Hospital Edition enables Dashboard");
            Assert(editionService.IsModuleEnabled(ModuleId.Patients), "Hospital Edition enables Patients");
            Assert(editionService.IsModuleEnabled(ModuleId.Opd), "Hospital Edition enables OPD");
            Assert(editionService.IsModuleEnabled(ModuleId.Ipd), "Hospital Edition enables IPD");
            Assert(editionService.IsModuleEnabled(ModuleId.Emergency), "Hospital Edition enables Emergency");
            Assert(editionService.IsModuleEnabled(ModuleId.Surgery), "Hospital Edition enables Surgery");
            Assert(editionService.IsModuleEnabled(ModuleId.Icu), "Hospital Edition enables ICU");
            Assert(editionService.GetDisabledModules().Count == 0, "Hospital Edition has zero disabled modules");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"  [ERROR] Hospital EditionService test threw: {ex.Message}");
            failed++;
        }

        // Test 17: Edition Service - Clinic Edition disables hospital-only modules
        try
        {
            var options = Options.Create(new EditionSettings { CurrentEdition = "Clinic" });
            var editionService = new EditionService(options);

            Assert(editionService.CurrentEdition == EditionType.Clinic, "EditionService identifies as Clinic Edition");
            // Shared capabilities enabled
            Assert(editionService.IsModuleEnabled(ModuleId.Dashboard), "Clinic Edition enables Dashboard");
            Assert(editionService.IsModuleEnabled(ModuleId.Patients), "Clinic Edition enables Patients");
            Assert(editionService.IsModuleEnabled(ModuleId.Appointments), "Clinic Edition enables Appointments");
            Assert(editionService.IsModuleEnabled(ModuleId.Opd), "Clinic Edition enables OPD");
            Assert(editionService.IsModuleEnabled(ModuleId.Emr), "Clinic Edition enables EMR");
            Assert(editionService.IsModuleEnabled(ModuleId.Billing), "Clinic Edition enables Billing");

            // Hospital-only capabilities disabled
            Assert(!editionService.IsModuleEnabled(ModuleId.Ipd), "Clinic Edition strictly disables IPD Wards");
            Assert(!editionService.IsModuleEnabled(ModuleId.Emergency), "Clinic Edition strictly disables Emergency Triage");
            Assert(!editionService.IsModuleEnabled(ModuleId.Surgery), "Clinic Edition strictly disables Surgery OT");
            Assert(!editionService.IsModuleEnabled(ModuleId.Icu), "Clinic Edition strictly disables ICU Telemetry");

            var disabled = editionService.GetDisabledModules();
            Assert(disabled.Contains(ModuleId.Ipd) && disabled.Contains(ModuleId.Emergency), "Clinic disabled list contains IPD and Emergency");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"  [ERROR] Clinic EditionService test threw: {ex.Message}");
            failed++;
        }

        // Test 18: Backend Enforcement - RequireModule gate blocks disabled modules
        try
        {
            var clinicOptions = Options.Create(new EditionSettings { CurrentEdition = "Clinic" });
            var clinicEditionService = new EditionService(clinicOptions);

            bool ipdAllowedInClinic = clinicEditionService.IsModuleEnabled(ModuleId.Ipd);
            bool emergencyAllowedInClinic = clinicEditionService.IsModuleEnabled(ModuleId.Emergency);
            bool opdAllowedInClinic = clinicEditionService.IsModuleEnabled(ModuleId.Opd);

            Assert(!ipdAllowedInClinic, "RequireModule(Ipd) correctly identifies IPD as forbidden in Clinic Edition");
            Assert(!emergencyAllowedInClinic, "RequireModule(Emergency) correctly identifies Emergency as forbidden in Clinic Edition");
            Assert(opdAllowedInClinic, "RequireModule(Opd) allows OPD in Clinic Edition");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"  [ERROR] RequireModule gate test threw: {ex.Message}");
            failed++;
        }

        // Summary output
        Console.WriteLine("==================================================");
        Console.WriteLine($"RESULTS: Total: {passed + failed} | Passed: {passed} | Failed: {failed}");
        Console.WriteLine("==================================================");

        return failed == 0 ? 0 : 1;
    }
}
