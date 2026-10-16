using System;

namespace CuraSphere.Application.DTOs;

public class AppointmentListDto
{
    public long AppointmentId { get; set; }
    public string AppointmentNumber { get; set; } = string.Empty;
    public long PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string MedicalRecordNumber { get; set; } = string.Empty;
    public long DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public string AppointmentDate { get; set; } = string.Empty;
    public string AppointmentTime { get; set; } = string.Empty;
    public string AppointmentType { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? ReasonForVisit { get; set; }
}

public class CreateAppointmentDto
{
    public long PatientId { get; set; }
    public long DoctorId { get; set; }
    public long DepartmentId { get; set; }
    public DateTime AppointmentDate { get; set; }
    public string AppointmentTime { get; set; } = "10:00 AM";
    public string AppointmentType { get; set; } = "OPD";
    public string? ReasonForVisit { get; set; }
}
