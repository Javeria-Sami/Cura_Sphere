using System;
using System.Collections.Generic;

namespace CuraSphere.Domain.Entities;

public class Appointment : BaseEntity
{
    public long AppointmentId { get; set; }
    public string AppointmentNumber { get; set; } = string.Empty;
    public long PatientId { get; set; }
    public virtual Patient Patient { get; set; } = null!;
    
    public long DoctorId { get; set; }
    public virtual Doctor Doctor { get; set; } = null!;
    
    public long DepartmentId { get; set; }
    public virtual Department Department { get; set; } = null!;
    
    public DateTime AppointmentDate { get; set; }
    public TimeSpan AppointmentTime { get; set; }
    public string AppointmentType { get; set; } = "OPD"; // OPD, Follow-up, Consultation, Emergency
    public string Status { get; set; } = "Scheduled"; // Scheduled, Checked In, Completed, Cancelled, No Show
    public string? ReasonForVisit { get; set; }
    public string? Remarks { get; set; }
}

public class OpdToken : BaseEntity
{
    public long OpdTokenId { get; set; }
    public string TokenNumber { get; set; } = string.Empty;
    public long PatientId { get; set; }
    public virtual Patient Patient { get; set; } = null!;
    
    public long DoctorId { get; set; }
    public virtual Doctor Doctor { get; set; } = null!;
    
    public long DepartmentId { get; set; }
    public virtual Department Department { get; set; } = null!;
    
    public DateTime TokenDate { get; set; } = DateTime.UtcNow.Date;
    public int QueuePosition { get; set; }
    public string Status { get; set; } = "Waiting"; // Waiting, Called, Consulting, Completed, Cancelled
    public string? ChiefComplaint { get; set; }
}

public class EmrEncounter : BaseEntity
{
    public long EncounterId { get; set; }
    public string EncounterNumber { get; set; } = string.Empty;
    public long PatientId { get; set; }
    public virtual Patient Patient { get; set; } = null!;
    
    public long DoctorId { get; set; }
    public virtual Doctor Doctor { get; set; } = null!;
    
    public DateTime EncounterDate { get; set; } = DateTime.UtcNow;
    public string EncounterType { get; set; } = "OPD"; // OPD, IPD, Emergency, Surgery
    public string Diagnosis { get; set; } = string.Empty;
    public string? Symptoms { get; set; }
    public string? ClinicalNotes { get; set; }
    public string Status { get; set; } = "SignedOff";
}
