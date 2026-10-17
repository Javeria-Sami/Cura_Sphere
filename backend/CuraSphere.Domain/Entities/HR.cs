using System;

namespace CuraSphere.Domain.Entities;

public class Department : BaseEntity
{
    public long DepartmentId { get; set; }
    public string DepartmentName { get; set; } = string.Empty;
    public string DepartmentCode { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string? ExtensionNumber { get; set; }
    public long? HeadDoctorId { get; set; }
    public string? Description { get; set; }
}

public class Specialization : BaseEntity
{
    public long SpecializationId { get; set; }
    public string SpecializationName { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class Employee : BaseEntity
{
    public long EmployeeId { get; set; }
    public string EmployeeCode { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public string PhoneNumber { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public DateTime HireDate { get; set; }
    public string Designation { get; set; } = string.Empty;
    public long DepartmentId { get; set; }
    public virtual Department Department { get; set; } = null!;
    public decimal Salary { get; set; }
    public string EmploymentStatus { get; set; } = "Active";
}

public class Doctor : BaseEntity
{
    public long DoctorId { get; set; }
    public long EmployeeId { get; set; }
    public virtual Employee Employee { get; set; } = null!;
    public string DoctorCode { get; set; } = string.Empty;
    public string LicenseNumber { get; set; } = string.Empty;
    public long DepartmentId { get; set; }
    public virtual Department Department { get; set; } = null!;
    public long SpecializationId { get; set; }
    public virtual Specialization Specialization { get; set; } = null!;
    public decimal ConsultationFee { get; set; }
    public int YearsOfExperience { get; set; }
    public string Qualification { get; set; } = string.Empty;
    public int ConsultationDuration { get; set; } = 15; // default in minutes
    public bool IsAvailableOnline { get; set; } = false;
    public string Status { get; set; } = "Active";
}
