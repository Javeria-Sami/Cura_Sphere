using System;

namespace CuraSphere.Domain.Entities;

public class LabOrder : BaseEntity
{
    public long LabOrderId { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public long PatientId { get; set; }
    public virtual Patient Patient { get; set; } = null!;
    
    public long DoctorId { get; set; }
    public virtual Doctor Doctor { get; set; } = null!;
    
    public string TestName { get; set; } = string.Empty;
    public string Category { get; set; } = "Hematology"; // Hematology, Biochemistry, Urinalysis, Endocrine
    public DateTime OrderedAt { get; set; } = DateTime.UtcNow;
    public string Status { get; set; } = "Pending"; // Pending, Processing, Completed, Critical
    public string? ResultValue { get; set; }
    public string? ReferenceRange { get; set; }
}

public class RadiologyStudy : BaseEntity
{
    public long StudyId { get; set; }
    public string StudyNumber { get; set; } = string.Empty;
    public long PatientId { get; set; }
    public virtual Patient Patient { get; set; } = null!;
    
    public long DoctorId { get; set; }
    public virtual Doctor Doctor { get; set; } = null!;
    
    public string StudyName { get; set; } = string.Empty;
    public string Modality { get; set; } = "X-Ray"; // X-Ray, MRI, CT Scan, Ultrasound, Echo
    public string Priority { get; set; } = "Routine"; // Routine, Urgent, STAT
    public DateTime OrderedAt { get; set; } = DateTime.UtcNow;
    public string? RadiologistName { get; set; }
    public string Status { get; set; } = "Scheduled"; // Scheduled, Processing, Reported
    public string? ImpressionReport { get; set; }
}
