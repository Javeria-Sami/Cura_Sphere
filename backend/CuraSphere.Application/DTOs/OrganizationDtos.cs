using System;
using System.Collections.Generic;

namespace CuraSphere.Application.DTOs;

public class OrganizationDto
{
    public long OrganizationId { get; set; }
    public string OrganizationCode { get; set; } = string.Empty;
    public string OrganizationName { get; set; } = string.Empty;
    public string? LegalRegistrationNumber { get; set; }
    public string? TaxId { get; set; }
    public string? PrimaryEmail { get; set; }
    public string? PrimaryPhone { get; set; }
    public string Timezone { get; set; } = "UTC";
    public string CurrencyCode { get; set; } = "PKR";
    public string Status { get; set; } = "Active";
    public string SettingsJson { get; set; } = "{}";
    public DateTime CreatedAt { get; set; }
    public int FacilityCount { get; set; }
}

public class CreateOrganizationDto
{
    public string OrganizationCode { get; set; } = string.Empty;
    public string OrganizationName { get; set; } = string.Empty;
    public string? LegalRegistrationNumber { get; set; }
    public string? TaxId { get; set; }
    public string? PrimaryEmail { get; set; }
    public string? PrimaryPhone { get; set; }
    public string Timezone { get; set; } = "UTC";
    public string CurrencyCode { get; set; } = "PKR";
}

public class UpdateOrganizationDto
{
    public string OrganizationName { get; set; } = string.Empty;
    public string? LegalRegistrationNumber { get; set; }
    public string? TaxId { get; set; }
    public string? PrimaryEmail { get; set; }
    public string? PrimaryPhone { get; set; }
    public string Timezone { get; set; } = "UTC";
    public string CurrencyCode { get; set; } = "PKR";
    public string Status { get; set; } = "Active";
    public string? SettingsJson { get; set; }
}

public class FacilityDto
{
    public long BranchFacilityId { get; set; }
    public long OrganizationId { get; set; }
    public string OrganizationName { get; set; } = string.Empty;
    public string BranchCode { get; set; } = string.Empty;
    public string BranchName { get; set; } = string.Empty;
    public string FacilityType { get; set; } = "Clinic";
    public string EditionProfile { get; set; } = "Clinic";
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Province { get; set; } = string.Empty;
    public string ContactPhone { get; set; } = string.Empty;
    public string? ContactEmail { get; set; }
    public string Status { get; set; } = "Active";
    public DateTime CreatedAt { get; set; }
    public int DepartmentCount { get; set; }
}

public class CreateFacilityDto
{
    public string BranchCode { get; set; } = string.Empty;
    public string BranchName { get; set; } = string.Empty;
    public string FacilityType { get; set; } = "Clinic";
    public string EditionProfile { get; set; } = "Clinic";
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Province { get; set; } = string.Empty;
    public string ContactPhone { get; set; } = string.Empty;
    public string? ContactEmail { get; set; }
}

public class UpdateFacilityDto
{
    public string BranchName { get; set; } = string.Empty;
    public string FacilityType { get; set; } = "Clinic";
    public string EditionProfile { get; set; } = "Clinic";
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Province { get; set; } = string.Empty;
    public string ContactPhone { get; set; } = string.Empty;
    public string? ContactEmail { get; set; }
    public string Status { get; set; } = "Active";
}
