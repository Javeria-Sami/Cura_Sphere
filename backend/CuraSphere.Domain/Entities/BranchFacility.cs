using System;
using System.Collections.Generic;
using CuraSphere.Domain.Interfaces;

namespace CuraSphere.Domain.Entities;

/// <summary>
/// Represents a physical or operational healthcare facility (hospital campus, satellite clinic, or branch)
/// belonging to an Organization.
/// </summary>
public class BranchFacility : BaseEntity, ITenantScopedEntity
{
    public long BranchFacilityId { get; set; }
    
    /// <summary>
    /// Mandatory parent organization identifier.
    /// </summary>
    public long OrganizationId { get; set; }
    public virtual Organization Organization { get; set; } = null!;
    
    /// <summary>
    /// Unique facility code within the organization (e.g. BR-MAIN, BR-NORTH).
    /// </summary>
    public string BranchCode { get; set; } = string.Empty;
    public string BranchName { get; set; } = string.Empty;
    
    /// <summary>
    /// Category of medical site: Hospital, Clinic, or DiagnosticCenter.
    /// </summary>
    public string FacilityType { get; set; } = "Clinic";
    
    /// <summary>
    /// Active workflow profile: "Hospital" or "Clinic".
    /// </summary>
    public string EditionProfile { get; set; } = "Clinic";
    
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Province { get; set; } = string.Empty;
    public string ContactPhone { get; set; } = string.Empty;
    public string? ContactEmail { get; set; }
    public string Status { get; set; } = "Active"; // Active, Inactive, Maintenance

    // Navigation properties
    public virtual ICollection<Department> Departments { get; set; } = new List<Department>();

    public static readonly HashSet<string> ValidStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        "Active", "Inactive", "Maintenance"
    };

    public static readonly HashSet<string> ValidFacilityTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "Hospital", "Clinic", "DiagnosticCenter"
    };

    public static string NormalizeCode(string? code)
    {
        if (string.IsNullOrWhiteSpace(code)) return string.Empty;
        return code.Trim().ToUpperInvariant();
    }
}
