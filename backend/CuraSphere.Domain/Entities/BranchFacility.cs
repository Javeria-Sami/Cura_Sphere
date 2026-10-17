using System;

namespace CuraSphere.Domain.Entities;

public class BranchFacility : BaseEntity
{
    public long BranchFacilityId { get; set; }
    public string BranchCode { get; set; } = string.Empty; // e.g. BR-MAIN, BR-NORTH
    public string BranchName { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Province { get; set; } = string.Empty;
    public string ContactPhone { get; set; } = string.Empty;
    public string Status { get; set; } = "Active";
}
