using System;

namespace CuraSphere.Domain.Entities;

public class PharmacyStock : BaseEntity
{
    public long DrugId { get; set; }
    public string DrugCode { get; set; } = string.Empty;
    public string DrugName { get; set; } = string.Empty;
    public string GenericName { get; set; } = string.Empty;
    public string DosageForm { get; set; } = "Tablet"; // Tablet, Syrup, Injection, Ointment
    public int QuantityInStock { get; set; }
    public int MinimumThreshold { get; set; } = 50;
    public decimal UnitPrice { get; set; }
    public DateTime ExpiryDate { get; set; }
    public string Status { get; set; } = "Available"; // Available, Low Stock, Expired
}

public class SurgicalProcedure : BaseEntity
{
    public long SurgeryId { get; set; }
    public string SurgeryNumber { get; set; } = string.Empty;
    public long PatientId { get; set; }
    public virtual Patient Patient { get; set; } = null!;
    
    public string ProcedureName { get; set; } = string.Empty;
    public string OtRoomNumber { get; set; } = "OT-1";
    public long LeadSurgeonId { get; set; }
    public virtual Doctor LeadSurgeon { get; set; } = null!;
    
    public string AnesthetistName { get; set; } = string.Empty;
    public DateTime ScheduledStartTime { get; set; }
    public DateTime? ActualEndTime { get; set; }
    public string Status { get; set; } = "Scheduled"; // Scheduled, In Surgery, Completed, Cancelled
}

public class IcuPatientVital : BaseEntity
{
    public long VitalId { get; set; }
    public long PatientId { get; set; }
    public virtual Patient Patient { get; set; } = null!;
    
    public string BedNumber { get; set; } = "ICU-01";
    public string BloodPressure { get; set; } = "120/80";
    public int HeartRate { get; set; } = 75;
    public int SpO2 { get; set; } = 98; // Oxygen Saturation %
    public int GcsScore { get; set; } = 15; // Glasgow Coma Scale
    public decimal Temperature { get; set; } = 98.6m;
    public DateTime RecordedAt { get; set; } = DateTime.UtcNow;
    public string AlertStatus { get; set; } = "Normal"; // Normal, Warning, Critical
}
