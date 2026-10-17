using System;
using System.ComponentModel.DataAnnotations;

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

public class UpdateAppointmentStatusDto
{
    public string Status { get; set; } = string.Empty;
    public string? Remarks { get; set; }
}

public class RescheduleAppointmentDto
{
    public DateTime AppointmentDate { get; set; }
    public string AppointmentTime { get; set; } = "10:00 AM";
    public long? DoctorId { get; set; }
    public string? Remarks { get; set; }
}

public class DoctorLookupDto
{
    public long DoctorId { get; set; }
    public string DoctorCode { get; set; } = string.Empty;
    public string DoctorName { get; set; } = string.Empty;
    public string Specialization { get; set; } = string.Empty;
    public long DepartmentId { get; set; }
    public string DepartmentName { get; set; } = string.Empty;
    public decimal ConsultationFee { get; set; }
    public string PhoneNumber { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public int YearsOfExperience { get; set; }
    public string Status { get; set; } = "Active";
}

public class CreateDoctorDto
{
    [Required(ErrorMessage = "Doctor full name is required.")]
    public string Name { get; set; } = string.Empty;

    public string Specialization { get; set; } = "General Practice";

    public long? DepartmentId { get; set; }

    [Range(0, 1000000, ErrorMessage = "Consultation fee must be non-negative.")]
    public decimal ConsultationFee { get; set; } = 1500;

    public string? PhoneNumber { get; set; }

    [EmailAddress(ErrorMessage = "Invalid email address format.")]
    public string? Email { get; set; }

    [Range(0, 70, ErrorMessage = "Years of experience must be between 0 and 70.")]
    public int YearsOfExperience { get; set; } = 1;
}

public class DepartmentLookupDto
{
    public long DepartmentId { get; set; }
    public string DepartmentName { get; set; } = string.Empty;
    public string DepartmentCode { get; set; } = string.Empty;
}
