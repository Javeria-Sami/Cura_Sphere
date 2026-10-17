# CuraSphere Enterprise Edition: Tenant Security Threat Model & Defense-in-Depth Controls
**Document ID:** `DOC-EE-005`  
**Version:** 1.0.0  
**Status:** Approved Security Specification  
**Session:** Session 14: Enterprise Edition Architecture & Multi-Organization Foundation  
**Audience:** Application Security Engineers, Lead Architects, Compliance Officers

---

## 1. Threat Modeling Scope & Security Principles

In multi-tenant healthcare software, data isolation failure is a catastrophic regulatory and clinical disaster. A malicious or negligent actor belonging to Organization Alpha must never be able to read, modify, search, or infer data belonging to Organization Beta.

### Core Security Tenet
> **Client-Supplied Tenant Identifiers Are Untrusted:** The application server must never trust an `OrganizationId` submitted in an HTTP request header, query string, or JSON payload unless verified against cryptographically validated server-side claims and active membership records.

---

## 2. Threat Vector Analysis & Engineering Mitigations

```
                      POTENTIAL ATTACK SURFACE & DEFENSIVE MITIGATION LAYERS
                      
[Attacker Vector]                                    [Defensive Layer]
1. IDOR Query Parameter (?patientId=402)       ---> Layer 1: Validated Claims JWT (Tenant Context)
2. Direct API Tampering (POST /api/appointments)---> Layer 2: Entity Framework Global Query Filters
3. Cache Key Collision (GET /patients/101)     ---> Layer 3: Organization-Prefixed Cache Keys
4. Leaked Storage Files (/documents/scan.pdf)  ---> Layer 4: Tenant-Isolated S3 Object Storage Paths
5. Background Cron Jobs (Nightly Report)       ---> Layer 5: Explicit Tenant Scoping Context Runner
6. Stale Session After Membership Revocation   ---> Layer 6: Security Stamp & Immediate Token Revocation
7. Bypass at Raw Database Driver / SQL         ---> Layer 7: PostgreSQL Row-Level Security (RLS) Engine
```

### Detailed Threat Matrix

| Threat ID | Attack Vector | Potential Impact | Required Defensive Control | Verification Method |
| :--- | :--- | :--- | :--- | :--- |
| **THREAT-01** | **ID Guessing (IDOR):** Attacker increments `PatientId` or `AppointmentId` in URL parameter. | Cross-tenant PHI disclosure. | EF Core Global Query Filter automatically injects `AND organization_id = @currentOrgId`. The record returns HTTP 404 Not Found as if it does not exist. | Negative Unit Test attempting cross-tenant GET. |
| **THREAT-02** | **Foreign Key Injection:** Attacker creates an appointment in Org A referencing a `DoctorId` from Org B. | Cross-tenant association corruption. | Entity validation in `AppointmentService` resolves doctor via tenant-filtered query filter. Doctor ID from foreign tenant returns null, failing validation. | Negative Integration Test attempting cross-tenant FK binding. |
| **THREAT-03** | **Search Enumeration:** Attacker searches patients by phone or partial name hoping to view foreign patients. | Directory harvesting. | All search expressions in `PatientService` are chained on the tenant-filtered `IQueryable`. Global filter guarantees foreign records are never examined. | Automated test with 2 synthetic organizations. |
| **THREAT-04** | **Unscoped Background Jobs:** Nightly reporting worker aggregates database without tenant context. | Data leakage in scheduled reports. | Background jobs must loop over active organizations and instantiate a dedicated tenant scope per iteration. | Unit test verifying worker context initialization. |
| **THREAT-05** | **Cache Key Collision:** In-memory or Redis cache keys stored without tenant namespace (e.g. `patient:101`). | Cache poisoning across tenants. | Mandatory cache key convention: `cache:org:{orgId}:entity:{id}`. Cache service enforces prefix. | Static code analysis rule rejecting non-namespaced keys. |
| **THREAT-06** | **Shared Document Storage Paths:** Medical PDFs stored in flat cloud storage (e.g., `/scans/101.pdf`). | Public/shared URL leakage. | Storage paths namespaced by tenant GUID: `/org_{orgGuid}/facilities/{facilityId}/documents/{docId}.enc`. Presigned URLs expire in 5 minutes. | Storage provider integration test. |
| **THREAT-07** | **Overly Broad Admin Privilege:** Platform SuperAdmin browses patient clinical records. | Violation of HIPAA minimum necessary standard. | SuperAdmins possess system management permissions (`system.organizations.manage`), but zero clinical permissions (`clinical.read`). Break-glass audit required for debugging. | Role-Permission audit verification. |
| **THREAT-08** | **Stale Revoked Membership:** User is fired from Org A, but their JWT token has 45 minutes remaining. | Unauthorized post-termination access. | Token validation verifies `SecurityStamp` in distributed cache or memory cache on every sensitive request. Revocation immediately blacklists token. | Membership revocation smoke test. |

---

## 3. PostgreSQL Row-Level Security (RLS) Evaluation

PostgreSQL provides native Row-Level Security (RLS) allowing table policies to be enforced directly within the database engine.

```sql
-- Example PostgreSQL RLS Policy
ALTER TABLE patient.patient ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON patient.patient
    FOR ALL
    TO curasphere_app_user
    USING (organization_id = NULLIF(current_setting('app.current_org_id', true), '')::bigint);
```

### 3.1 Benefits
- **Engine-Level Defense-in-Depth:** Even if a developer writes raw ADO.NET SQL or uses `.IgnoreQueryFilters()`, the PostgreSQL engine refuses to return rows where `organization_id` does not match the active session variable.
- **Protection Against SQL Injection:** An injection attack cannot break out of the tenant sandbox.

### 3.2 Limitations & Connection Pooling Gotchas
- **Connection Pool State Leakage:** When using connection pooling (Npgsql, PgBouncer), setting `SET LOCAL app.current_org_id = '10'` must be strictly cleared before returning the connection to the pool (`DISCARD ALL` or resetting session settings), otherwise a subsequent request on that pooled connection could inherit the previous tenant's identity!
- **Performance Overhead:** RLS adds a small execution overhead on complex joins with hundreds of thousands of rows.

### 3.3 Implementation Recommendation for CuraSphere
- **Primary Line of Defense:** Entity Framework Core Global Query Filters (`HasQueryFilter`).
- **Secondary Defense (Phase D/H):** PostgreSQL RLS enabled for high-security environments, configured with Npgsql connection interceptors that set and clear `app.current_org_id` on every connection open/close cycle.

---

## 4. Formal Isolation Verification Mandate

> **Critical Rule:** No tenant-isolation claim may be certified as production-ready without explicit, automated negative authorization tests executed in a staging environment with at least two isolated synthetic healthcare organizations.
