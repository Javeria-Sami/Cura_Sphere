using System;

namespace CuraSphere.Application.DTOs;

public class IpdAdmissionDto
{
    public long AdmissionId { get; set; }
    public string AdmissionNumber { get; set; } = string.Empty;
    public long PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string MedicalRecordNumber { get; set; } = string.Empty;
    public string WardName { get; set; } = string.Empty;
    public string BedNumber { get; set; } = string.Empty;
    public long DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public string AdmissionDate { get; set; } = string.Empty;
    public int DaysAdmitted { get; set; }
    public string PrimaryDiagnosis { get; set; } = string.Empty;
    public string PatientCondition { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}

public class CreateIpdAdmissionDto
{
    public long PatientId { get; set; }
    public long DoctorId { get; set; }
    public long BedId { get; set; }
    public string PrimaryDiagnosis { get; set; } = string.Empty;
    public string PatientCondition { get; set; } = "Stable";
}
