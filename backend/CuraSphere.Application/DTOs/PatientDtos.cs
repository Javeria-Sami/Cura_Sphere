using System;
using System.Collections.Generic;

namespace CuraSphere.Application.DTOs;

public class LookupDto
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
}

public class PatientListDto
{
    public long PatientId { get; set; }
    public string MedicalRecordNumber { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string? MiddleName { get; set; }
    public string LastName { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public int Age { get; set; }
    public string PhoneNumber { get; set; } = string.Empty;
    public string PatientStatus { get; set; } = "Active";
}

public class PatientDetailDto
{
    public long PatientId { get; set; }
    public string MedicalRecordNumber { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string? MiddleName { get; set; }
    public string LastName { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public int? Age { get; set; }
    public string? CnicPassport { get; set; }
    public string PhoneNumber { get; set; } = string.Empty;
    public string? AlternatePhone { get; set; }
    public string? Email { get; set; }
    
    // Lookup relationships
    public long? BloodGroupId { get; set; }
    public string? BloodGroupName { get; set; }
    public long? MaritalStatusId { get; set; }
    public string? MaritalStatusName { get; set; }
    public long? NationalityId { get; set; }
    public string? CountryName { get; set; }
    public long? ReligionId { get; set; }
    public string? ReligionName { get; set; }
    
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Province { get; set; } = string.Empty;
    public string? PostalCode { get; set; }
    
    // Emergency Contact
    public string EmergencyContactName { get; set; } = string.Empty;
    public string EmergencyContactPhone { get; set; } = string.Empty;
    public string EmergencyRelationship { get; set; } = string.Empty;
    
    public string? PatientPhoto { get; set; }
    public DateTime RegistrationDate { get; set; }
    public string PatientStatus { get; set; } = "Active";

    // Linked arrays
    public List<GuardianDto> Guardians { get; set; } = new();
    public List<InsuranceDto> Insurances { get; set; } = new();
}

public class GuardianDto
{
    public long GuardianId { get; set; }
    public string GuardianName { get; set; } = string.Empty;
    public string Relationship { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string Address { get; set; } = string.Empty;
}

public class InsuranceDto
{
    public long PatientInsuranceId { get; set; }
    public long InsuranceProviderId { get; set; }
    public string PolicyNumber { get; set; } = string.Empty;
    public string MemberId { get; set; } = string.Empty;
    public string CoverageType { get; set; } = string.Empty;
    public DateTime ValidFrom { get; set; }
    public DateTime ValidTo { get; set; }
    public decimal CoveragePercentage { get; set; }
    public decimal DeductibleAmount { get; set; }
    public string Status { get; set; } = "Active";
}

public class RegisterPatientDto
{
    public string FirstName { get; set; } = string.Empty;
    public string? MiddleName { get; set; }
    public string LastName { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public string? CnicPassport { get; set; }
    public string PhoneNumber { get; set; } = string.Empty;
    public string? AlternatePhone { get; set; }
    public string? Email { get; set; }
    
    public long? BloodGroupId { get; set; }
    public long? MaritalStatusId { get; set; }
    public long? NationalityId { get; set; }
    public long? ReligionId { get; set; }
    
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Province { get; set; } = string.Empty;
    public string? PostalCode { get; set; }
    
    // Emergency Contact
    public string EmergencyContactName { get; set; } = string.Empty;
    public string EmergencyContactPhone { get; set; } = string.Empty;
    public string EmergencyRelationship { get; set; } = string.Empty;
    
    public string? PatientPhoto { get; set; }
    public string PatientStatus { get; set; } = "Active";

    public List<RegisterGuardianDto> Guardians { get; set; } = new();
    public List<RegisterInsuranceDto> Insurances { get; set; } = new();
}

public class RegisterGuardianDto
{
    public string GuardianName { get; set; } = string.Empty;
    public string Relationship { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string Address { get; set; } = string.Empty;
}

public class RegisterInsuranceDto
{
    public long InsuranceProviderId { get; set; }
    public string PolicyNumber { get; set; } = string.Empty;
    public string MemberId { get; set; } = string.Empty;
    public string CoverageType { get; set; } = string.Empty;
    public DateTime ValidFrom { get; set; }
    public DateTime ValidTo { get; set; }
    public decimal CoveragePercentage { get; set; }
    public decimal DeductibleAmount { get; set; }
}

public class UpdatePatientDto : RegisterPatientDto
{
}

public class DuplicateCheckRequest
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public string? CnicPassport { get; set; }
}

public class DuplicateCheckResponse
{
    public bool IsPotentialDuplicate { get; set; }
    public List<PatientListDto> Matches { get; set; } = new();
}

public class PagedResultDto<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}
