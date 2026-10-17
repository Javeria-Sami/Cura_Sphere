# CuraSphere Enterprise Edition: Enterprise Reporting & Data Boundaries
**Document ID:** `DOC-EE-009`  
**Version:** 1.0.0  
**Status:** Approved Reporting Architecture  
**Session:** Session 14: Enterprise Edition Architecture & Multi-Organization Foundation  
**Audience:** Data Engineers, Security Architects, Clinical Operations Directors

---

## 1. Dual-Tier Reporting Model

Enterprise healthcare organizations require two distinct reporting lenses that serve radically different operational personas:

```
[Level 1: Facility-Level Operational Reports]     [Level 2: Organization Executive Rollups]
Audience: Ward Sisters, Receptionists, Doctors   Audience: Chief Financial Officer, Network CEO
Scope: Scoped strictly to 1 Branch Facility      Scope: Aggregated across all 15 Branch Facilities
Data: Patient-level identifiable operational data Data: Anonymized / de-identified statistical totals
Example: "Today's Clinic Appointment Queue"      Example: "Q3 Total Billed Revenue Across All Branches"
```

---

## 2. Strict Boundary Rules & Cross-Facility Isolation

### Rule 1: No Cross-Organization Contamination Under Any Circumstance
A report query must never, under any condition or parameter combination, aggregate data across multiple organizations. All reporting services inject the verified `OrganizationId` from `ITenantContext` as the root predicate:
```csharp
var query = _context.Invoices
    .AsNoTracking()
    .Where(i => i.OrganizationId == _tenantContext.OrganizationId);
```

### Rule 2: Facility Administrators Cannot View Sibling Branch Data
An administrator or doctor assigned to "Downtown Clinic" (`BranchFacilityId = 12`) cannot execute reports that include records from "North Hospital" (`BranchFacilityId = 14`), even though both belong to the same parent organization. Sibling branch viewing requires explicit `reports.cross_facility` permission.

### Rule 3: De-identification on Network-Level Rollups
Cross-facility rollups viewed by corporate financial analysts must not expose identifiable patient names or medical diagnoses. Reports aggregate counts, revenue sums, and occupancy percentages:
```csharp
public class BranchFinancialRollupDto
{
    public long BranchFacilityId { get; set; }
    public string BranchName { get; set; } = string.Empty;
    public decimal TotalBilled { get; set; }
    public decimal TotalCollected { get; set; }
    public int CompletedAppointmentsCount { get; set; }
    public decimal BedOccupancyRate { get; set; }
}
```

---

## 3. Query Performance & Read-Replica Strategy

1. **SARGable UTC Date Ranges:** All time-based aggregations use indexable `>= startDateUtc && < endDateUtc` timestamp filters (as established in Session 13).
2. **Read-Replica Routing:** Intensive reporting queries are routed to read-only PostgreSQL replicas via connection string tagging to avoid locking online transactional processing (OLTP) tables during clinic consultation hours.
3. **Audit Logging for Data Exports:** Generating CSV or PDF exports of financial or patient summaries triggers an immediate `AuditLog` entry recording the user ID, timestamp, IP address, filter parameters, and row count exported.
