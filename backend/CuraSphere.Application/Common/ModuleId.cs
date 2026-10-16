namespace CuraSphere.Application.Common;

/// <summary>
/// Identifiers for CuraSphere functional modules, categorised into Shared, Hospital-specific, and Clinic-specific.
/// </summary>
public enum ModuleId
{
    // ==========================================
    // SHARED CAPABILITIES (Both Hospital & Clinic)
    // ==========================================
    Dashboard = 1,
    Patients = 2,
    Doctors = 3,
    Nurses = 4,
    Appointments = 5,
    Opd = 6,
    Emr = 7,
    Diagnostics = 8,
    Laboratory = 9,
    Radiology = 10,
    Pharmacy = 11,
    Billing = 12,
    Payments = 13,
    Insurance = 14,
    Inventory = 15,
    Hr = 16,
    Attendance = 17,
    Reports = 18,
    Notifications = 19,
    Audit = 20,
    Administration = 21,

    // ==========================================
    // HOSPITAL-ONLY CAPABILITIES (Disabled in Clinic)
    // ==========================================
    Ipd = 100,
    Emergency = 101,
    Surgery = 102,
    Icu = 103,

    // ==========================================
    // CLINIC-ORIENTED EXTENSIONS (Planned / Registered)
    // ==========================================
    ClinicWorkspace = 200,
    ClinicQueue = 201,
    ClinicBilling = 202
}
