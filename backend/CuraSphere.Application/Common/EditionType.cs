namespace CuraSphere.Application.Common;

/// <summary>
/// Supported software deployment editions for CuraSphere.
/// </summary>
public enum EditionType
{
    /// <summary>
    /// Comprehensive Hospital Management System with inpatient, surgery, ICU, and emergency workflows.
    /// </summary>
    Hospital = 1,

    /// <summary>
    /// Streamlined Clinic Edition for outpatient consultations, appointments, and quick billing.
    /// </summary>
    Clinic = 2,

    /// <summary>
    /// Multi-facility healthcare network (future architecture reservation; not implemented in this session).
    /// </summary>
    Enterprise = 3
}
