# CuraSphere Enterprise Edition: Domain & Database Schema Design
**Document ID:** `DOC-EE-004`  
**Version:** 1.0.0  
**Status:** Approved Schema Blueprint  
**Session:** Session 14: Enterprise Edition Architecture & Multi-Organization Foundation  
**Audience:** Database Architects, Software Engineers, Data Engineers

---

## 1. Domain Modeling Strategy & Entity Reuse

CuraSphere prioritizes **evolutionary extension** over entity duplication. We leverage established entities while introducing the necessary organizational hierarchy and tenancy interfaces:

```
[Existing Entities Reused/Extended]           [New Entities Introduced]
- BranchFacility (Extended with OrgId)        - Organization
- Department (Extended with FacilityId)       - OrganizationMembership
- UserAccount (Decoupled to Global Identity)  - FacilityAssignment
- Role & Permission (Scoped by Org)           - FeatureEntitlement
- AuditLog (Extended with OrgId/FacilityId)   - OrganizationSubscription
```

---

## 2. Core Organizational Domain Entities

### 2.1 `Organization` (New Entity)
The root legal tenant entity owning all clinical and financial assets.

```csharp
namespace CuraSphere.Domain.Entities;

public class Organization : BaseEntity
{
    public long OrganizationId { get; set; }
    public string OrganizationCode { get; set; } = string.Empty; // e.g. "ORG-BEACON"
    public string OrganizationName { get; set; } = string.Empty;
    public string LegalRegistrationNumber { get; set; } = string.Empty;
    public string TaxId { get; set; } = string.Empty;
    public string PrimaryEmail { get; set; } = string.Empty;
    public string PrimaryPhone { get; set; } = string.Empty;
    public string Timezone { get; set; } = "UTC";
    public string CurrencyCode { get; set; } = "PKR";
    public string Status { get; set; } = "Active"; // Active, Suspended, Archived
    public string SettingsJson { get; set; } = "{}"; // Branding, receipts, tenant configs

    // Navigation
    public virtual ICollection<BranchFacility> Facilities { get; set; } = new List<BranchFacility>();
    public virtual ICollection<OrganizationMembership> Memberships { get; set; } = new List<OrganizationMembership>();
    public virtual ICollection<FeatureEntitlement> Entitlements { get; set; } = new List<FeatureEntitlement>();
}
```

### 2.2 `BranchFacility` (Extended Existing Entity)
Extends the existing entity in `CuraSphere.Domain.Entities.BranchFacility.cs`:

```csharp
public class BranchFacility : BaseEntity
{
    public long BranchFacilityId { get; set; }
    public long OrganizationId { get; set; }
    public virtual Organization Organization { get; set; } = null!;
    
    public string BranchCode { get; set; } = string.Empty; // e.g. "BR-DOWNTOWN"
    public string BranchName { get; set; } = string.Empty;
    public string FacilityType { get; set; } = "Clinic"; // "Hospital", "Clinic", "DiagnosticCenter"
    public string EditionProfile { get; set; } = "Clinic"; // "Hospital" or "Clinic"
    
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Province { get; set; } = string.Empty;
    public string ContactPhone { get; set; } = string.Empty;
    public string ContactEmail { get; set; } = string.Empty;
    public string Status { get; set; } = "Active"; // "Active", "Inactive", "Maintenance"
    
    // Navigation
    public virtual ICollection<Department> Departments { get; set; } = new List<Department>();
}
```

### 2.3 `OrganizationMembership` (New Entity)
Decouples global identity (`UserAccount`) from tenant-specific permissions:

```csharp
public class OrganizationMembership : BaseEntity
{
    public long OrganizationMembershipId { get; set; }
    public long OrganizationId { get; set; }
    public virtual Organization Organization { get; set; } = null!;
    
    public long UserId { get; set; }
    public virtual UserAccount User { get; set; } = null!;
    
    public long RoleId { get; set; } // Role scoped specifically to this Organization
    public virtual Role Role { get; set; } = null!;
    
    public long? DefaultFacilityId { get; set; } // Preferred branch on login
    public virtual BranchFacility? DefaultFacility { get; set; }
    
    public string MembershipStatus { get; set; } = "Active"; // Active, Invited, Suspended, Revoked
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    // Granular branch access (multi-branch clinicians/administrators)
    public virtual ICollection<FacilityAssignment> FacilityAssignments { get; set; } = new List<FacilityAssignment>();
}
```

### 2.4 `FacilityAssignment` (New Entity)
Controls which specific facilities a user has permission to operate within:

```csharp
public class FacilityAssignment : BaseEntity
{
    public long FacilityAssignmentId { get; set; }
    public long OrganizationMembershipId { get; set; }
    public virtual OrganizationMembership Membership { get; set; } = null!;
    
    public long BranchFacilityId { get; set; }
    public virtual BranchFacility Facility { get; set; } = null!;
    
    public bool CanPrescribe { get; set; } = true;
    public bool CanSchedule { get; set; } = true;
    public bool CanBill { get; set; } = true;
}
```

---

## 3. Data Scoping Contracts & Interfaces

Every entity in CuraSphere implements explicit multi-tenancy contracts:

```csharp
namespace CuraSphere.Domain.Interfaces;

/// <summary>
/// Enforces mandatory organization-level data ownership.
/// Subject to EF Core Global Query Filters.
/// </summary>
public interface ITenantScopedEntity
{
    long OrganizationId { get; set; }
}

/// <summary>
/// Enforces facility-level operational locality within an organization.
/// </summary>
public interface IFacilityScopedEntity : ITenantScopedEntity
{
    long BranchFacilityId { get; set; }
}
```

### Applied to Existing Entities:
- **`Patient`:** Implements `ITenantScopedEntity` (`OrganizationId`). A patient belongs to the Organization, enabling their records to be shared across all branches in the healthcare network.
- **`Appointment`:** Implements `IFacilityScopedEntity` (`OrganizationId`, `BranchFacilityId`). Appointments occur at a specific branch facility.
- **`EmrEncounter`:** Implements `IFacilityScopedEntity` (`OrganizationId`, `BranchFacilityId`).
- **`Invoice` & `PaymentRecord`:** Implements `IFacilityScopedEntity` (`OrganizationId`, `BranchFacilityId`).

---

## 4. Key Relationships, Constraints & Referential Integrity

```
+--------------------+        1:N        +-----------------------+
|    Organization    | ----------------- |     BranchFacility    |
|   (OrganizationId) |                   |  (BranchFacilityId)   |
+--------------------+                   +-----------------------+
          │                                          │
          │ 1:N                                      │ 1:N
          ▼                                          ▼
+--------------------+        1:N        +-----------------------+
|OrganizationMembership| -------------- |       Department      |
|(OrgMembershipId)   |                   |     (DepartmentId)    |
+--------------------+                   +-----------------------+
          │
          │ N:1
          ▼
+--------------------+
|    UserAccount     |
|      (UserId)      |
+--------------------+
```

### 4.1 Unique Constraints Blueprint:
1. `Organization.OrganizationCode`: Globally Unique (`UNIQUE(organization_code)`).
2. `BranchFacility`: Unique within Organization (`UNIQUE(organization_id, branch_code)`).
3. `OrganizationMembership`: Unique user per organization (`UNIQUE(organization_id, user_id)`).
4. `Patient MRN`: Unique within Organization (`UNIQUE(organization_id, medical_record_number)`).
5. `Invoice Number`: Unique within Organization (`UNIQUE(organization_id, invoice_number)`).

---

## 5. Soft-Deletion & Temporal Audit Requirements

1. **Soft-Deletion Propagation:**
   - Setting `Organization.IsActive = false` (or `DeletedAt = UtcNow`) immediately cascades logically across all child facilities, memberships, and entities via EF Core query filter:
     `b.HasQueryFilter(e => e.Organization.IsActive && e.IsActive)`.
2. **Audit Logging Integration:**
   - The `AuditLog` entity is extended with `OrganizationId` and `BranchFacilityId`. Every cross-tenant administrative action, membership invitation, and permission change generates an immutable audit entry.
