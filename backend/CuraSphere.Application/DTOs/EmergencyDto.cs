using System;

namespace CuraSphere.Application.DTOs;

public class EmergencyCaseDto
{
    public long EmergencyCaseId { get; set; }
    public string CaseNumber { get; set; } = string.Empty;
    public long PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string MedicalRecordNumber { get; set; } = string.Empty;
    public int Age { get; set; }
    public string ChiefComplaint { get; set; } = string.Empty;
    public string TriageLevel { get; set; } = string.Empty;
    public long? AttendingDoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public string ArrivalTime { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}

public class CreateEmergencyCaseDto
{
    public long PatientId { get; set; }
    public string ChiefComplaint { get; set; } = string.Empty;
    public string TriageLevel { get; set; } = "P1";
    public long? AttendingDoctorId { get; set; }
}
