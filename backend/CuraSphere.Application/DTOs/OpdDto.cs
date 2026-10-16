using System;

namespace CuraSphere.Application.DTOs;

public class OpdTokenDto
{
    public long OpdTokenId { get; set; }
    public string TokenNumber { get; set; } = string.Empty;
    public long PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string MedicalRecordNumber { get; set; } = string.Empty;
    public int Age { get; set; }
    public long DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public int QueuePosition { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Vitals { get; set; } = "Normal";
    public string? ChiefComplaint { get; set; }
}

public class CreateOpdTokenDto
{
    public long PatientId { get; set; }
    public long DoctorId { get; set; }
    public long DepartmentId { get; set; }
    public string? ChiefComplaint { get; set; }
}
