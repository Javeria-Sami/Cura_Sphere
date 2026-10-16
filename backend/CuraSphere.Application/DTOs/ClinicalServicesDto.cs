using System;

namespace CuraSphere.Application.DTOs;

public class PharmacyStockDto
{
    public long DrugId { get; set; }
    public string DrugCode { get; set; } = string.Empty;
    public string DrugName { get; set; } = string.Empty;
    public string GenericName { get; set; } = string.Empty;
    public string DosageForm { get; set; } = string.Empty;
    public int QuantityInStock { get; set; }
    public int MinimumThreshold { get; set; }
    public decimal UnitPrice { get; set; }
    public string ExpiryDate { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}

public class SurgicalProcedureDto
{
    public long SurgeryId { get; set; }
    public string SurgeryNumber { get; set; } = string.Empty;
    public long PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string MedicalRecordNumber { get; set; } = string.Empty;
    public string ProcedureName { get; set; } = string.Empty;
    public string OtRoomNumber { get; set; } = string.Empty;
    public string LeadSurgeonName { get; set; } = string.Empty;
    public string AnesthetistName { get; set; } = string.Empty;
    public string ScheduledStartTime { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}

public class IcuPatientVitalDto
{
    public long VitalId { get; set; }
    public long PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string MedicalRecordNumber { get; set; } = string.Empty;
    public string BedNumber { get; set; } = string.Empty;
    public string BloodPressure { get; set; } = string.Empty;
    public int HeartRate { get; set; }
    public int SpO2 { get; set; }
    public int GcsScore { get; set; }
    public decimal Temperature { get; set; }
    public string RecordedAt { get; set; } = string.Empty;
    public string AlertStatus { get; set; } = string.Empty;
}
