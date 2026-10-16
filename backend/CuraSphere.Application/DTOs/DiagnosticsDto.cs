using System;

namespace CuraSphere.Application.DTOs;

public class LabOrderDto
{
    public long LabOrderId { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public long PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string MedicalRecordNumber { get; set; } = string.Empty;
    public string DoctorName { get; set; } = string.Empty;
    public string TestName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string OrderedAt { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? ResultValue { get; set; }
    public string? ReferenceRange { get; set; }
}

public class CreateLabOrderDto
{
    public long PatientId { get; set; }
    public long DoctorId { get; set; }
    public string TestName { get; set; } = string.Empty;
    public string Category { get; set; } = "Hematology";
}

public class RadiologyStudyDto
{
    public long StudyId { get; set; }
    public string StudyNumber { get; set; } = string.Empty;
    public long PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string MedicalRecordNumber { get; set; } = string.Empty;
    public string DoctorName { get; set; } = string.Empty;
    public string StudyName { get; set; } = string.Empty;
    public string Modality { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public string OrderedAt { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? ImpressionReport { get; set; }
}
