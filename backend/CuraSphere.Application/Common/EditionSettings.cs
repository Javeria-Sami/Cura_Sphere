using System;

namespace CuraSphere.Application.Common;

/// <summary>
/// Configuration settings governing active edition deployment.
/// </summary>
public class EditionSettings
{
    public const string SectionName = "EditionSettings";

    /// <summary>
    /// Active software edition: "Hospital", "Clinic", or "Enterprise".
    /// Defaults to "Hospital" for strict backward compatibility.
    /// </summary>
    public string CurrentEdition { get; set; } = "Hospital";

    /// <summary>
    /// Optional display name for the deploying medical facility or organization.
    /// </summary>
    public string FacilityName { get; set; } = "CuraSphere Healthcare Facility";

    /// <summary>
    /// Safely parses the configured edition, defaulting to Hospital on missing or invalid values.
    /// </summary>
    public EditionType GetEditionType()
    {
        if (Enum.TryParse<EditionType>(CurrentEdition, true, out var edition))
        {
            return edition;
        }

        // Fail-safe backward-compatible default
        return EditionType.Hospital;
    }
}
