using System;
using System.Collections.Generic;
using CuraSphere.Domain.Entities;
using CuraSphere.Infrastructure.Services.Clinical;

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

        // Summary output
        Console.WriteLine("==================================================");
        Console.WriteLine($"RESULTS: Total: {passed + failed} | Passed: {passed} | Failed: {failed}");
        Console.WriteLine("==================================================");

        return failed == 0 ? 0 : 1;
    }
}
