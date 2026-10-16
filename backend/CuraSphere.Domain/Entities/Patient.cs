using System;
using System.Collections.Generic;

namespace CuraSphere.Domain.Entities;

public class Patient : BaseEntity
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
    
    // Demographics Foreign Keys
    public long? BloodGroupId { get; set; }
    public BloodGroup? BloodGroup { get; set; }
    
    public long? MaritalStatusId { get; set; }
    public MaritalStatus? MaritalStatus { get; set; }
    
    public long? NationalityId { get; set; }
    public Nationality? Nationality { get; set; }
    
    public long? ReligionId { get; set; }
    public Religion? Religion { get; set; }
    
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Province { get; set; } = string.Empty;
    public string? PostalCode { get; set; }
    
    // Emergency Contact
    public string EmergencyContactName { get; set; } = string.Empty;
    public string EmergencyContactPhone { get; set; } = string.Empty;
    public string EmergencyRelationship { get; set; } = string.Empty;
    
    public string? PatientPhoto { get; set; }
    public DateTime RegistrationDate { get; set; } = DateTime.UtcNow;
    public string PatientStatus { get; set; } = "Active";

    // Navigation properties
    public virtual ICollection<PatientGuardian> Guardians { get; set; } = new List<PatientGuardian>();
    public virtual ICollection<PatientInsurance> Insurances { get; set; } = new List<PatientInsurance>();
}

public class PatientGuardian : BaseEntity
{
    public long GuardianId { get; set; }
    public long PatientId { get; set; }
    public virtual Patient Patient { get; set; } = null!;
    public string GuardianName { get; set; } = string.Empty;
    public string Relationship { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string Address { get; set; } = string.Empty;
}

public class PatientInsurance : BaseEntity
{
    public long PatientInsuranceId { get; set; }
    public long PatientId { get; set; }
    public virtual Patient Patient { get; set; } = null!;
    
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
