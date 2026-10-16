using System;
using System.Collections.Generic;

namespace CuraSphere.Domain.Entities;

public class Ward : BaseEntity
{
    public long WardId { get; set; }
    public string WardName { get; set; } = string.Empty;
    public string WardType { get; set; } = "General"; // General, ICU, Cardiac, Maternity, Ortho, Neuro
    public int Capacity { get; set; }
    public string Status { get; set; } = "Active";
    
    public virtual ICollection<Bed> Beds { get; set; } = new List<Bed>();
}

public class Bed : BaseEntity
{
    public long BedId { get; set; }
    public long WardId { get; set; }
    public virtual Ward Ward { get; set; } = null!;
    
    public string BedNumber { get; set; } = string.Empty;
    public string Status { get; set; } = "Available"; // Available, Occupied, Reserved, Cleaning, Maintenance
    public decimal DailyCharge { get; set; }
}

public class IpdAdmission : BaseEntity
{
    public long AdmissionId { get; set; }
    public string AdmissionNumber { get; set; } = string.Empty;
    public long PatientId { get; set; }
    public virtual Patient Patient { get; set; } = null!;
    
    public long DoctorId { get; set; }
    public virtual Doctor Doctor { get; set; } = null!;
    
    public long BedId { get; set; }
    public virtual Bed Bed { get; set; } = null!;
    
    public DateTime AdmissionDate { get; set; } = DateTime.UtcNow;
    public DateTime? DischargeDate { get; set; }
    public string PrimaryDiagnosis { get; set; } = string.Empty;
    public string PatientCondition { get; set; } = "Stable"; // Stable, Critical, Observation, Discharged
    public string Status { get; set; } = "Admitted"; // Admitted, Discharged, Transferred
}

public class EmergencyCase : BaseEntity
{
    public long EmergencyCaseId { get; set; }
    public string CaseNumber { get; set; } = string.Empty;
    public long PatientId { get; set; }
    public virtual Patient Patient { get; set; } = null!;
    
    public long? AttendingDoctorId { get; set; }
    public virtual Doctor? AttendingDoctor { get; set; }
    
    public string TriageLevel { get; set; } = "P1"; // P1 - Critical, P2 - Urgent, P3 - Standard
    public string ChiefComplaint { get; set; } = string.Empty;
    public DateTime ArrivalTime { get; set; } = DateTime.UtcNow;
    public string Status { get; set; } = "Under Treatment"; // Under Treatment, Stabilizing, Transferred, Discharged
}
