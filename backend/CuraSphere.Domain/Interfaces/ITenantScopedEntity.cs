namespace CuraSphere.Domain.Interfaces;

/// <summary>
/// Contract for domain entities that belong strictly to a specific Healthcare Organization.
/// </summary>
public interface ITenantScopedEntity
{
    long OrganizationId { get; set; }
}

/// <summary>
/// Contract for domain entities that belong to a specific Branch Facility within an Organization.
/// </summary>
public interface IFacilityScopedEntity : ITenantScopedEntity
{
    long BranchFacilityId { get; set; }
}
