using System;
using System.Collections.Generic;

namespace CuraSphere.Domain.Entities;

/// <summary>
/// Represents an independent healthcare enterprise or organization.
/// Serves as the primary tenant and legal owner of all facilities, clinical data, and financial records.
/// </summary>
public class Organization : BaseEntity
{
    public long OrganizationId { get; set; }
    
    /// <summary>
    /// Unique normalized organization identifier (e.g., ORG-BEACON, ORG-METRO).
    /// </summary>
    public string OrganizationCode { get; set; } = string.Empty;
    
    /// <summary>
    /// Official display and commercial name of the healthcare organization.
    /// </summary>
    public string OrganizationName { get; set; } = string.Empty;
    
    public string? LegalRegistrationNumber { get; set; }
    public string? TaxId { get; set; }
    public string? PrimaryEmail { get; set; }
    public string? PrimaryPhone { get; set; }
    public string Timezone { get; set; } = "UTC";
    public string CurrencyCode { get; set; } = "PKR";
    
    /// <summary>
    /// Operating status: Active, Suspended, or Inactive.
    /// </summary>
    public string Status { get; set; } = "Active";
    
    /// <summary>
    /// Encoded tenant settings, receipt headers/footers, and branding configuration.
    /// </summary>
    public string SettingsJson { get; set; } = "{}";

    // Navigation properties
    public virtual ICollection<BranchFacility> Facilities { get; set; } = new List<BranchFacility>();

    // Static domain status helpers
    public static readonly HashSet<string> ValidStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        "Active", "Suspended", "Inactive"
    };

    public static string NormalizeCode(string? code)
    {
        if (string.IsNullOrWhiteSpace(code)) return string.Empty;
        return code.Trim().ToUpperInvariant();
    }

    public static bool IsValidCodeFormat(string code)
    {
        if (string.IsNullOrWhiteSpace(code)) return false;
        if (code.Length < 3 || code.Length > 30) return false;
        
        // Alphanumeric with hyphens and underscores
        foreach (var c in code)
        {
            if (!char.IsLetterOrDigit(c) && c != '-' && c != '_')
            {
                return false;
            }
        }
        return true;
    }
}
