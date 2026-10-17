# CuraSphere Enterprise Edition: Product Hierarchy & Multi-Edition Model
**Document ID:** `DOC-EE-002`  
**Version:** 1.0.0  
**Status:** Approved Architectural Specification  
**Session:** Session 14: Enterprise Edition Architecture & Multi-Organization Foundation  
**Audience:** Product Managers, Enterprise Architects, Engineering Leads

---

## 1. Unified Multi-Edition Product Strategy

CuraSphere rejects the fragmented approach of maintaining separate codebases for different healthcare market segments. Instead, CuraSphere implements a **Single-Codebase, Multi-Profile Architecture** where three distinct editions share a common core domain, unified REST API contracts, and an adaptive user interface.

```
+-----------------------------------------------------------------------------------+
|                           CURASPHERE COMMON PLATFORM CORE                         |
|   Security & Auth | Demographics | Appointments | Clinical EMR | Billing & Cashier|
+-----------------------------------------------------------------------------------+
           |                                   |                              |
           v                                   v                              v
+-----------------------+           +--------------------+         +--------------------+
|   HOSPITAL EDITION    |           |   CLINIC EDITION   |         | ENTERPRISE EDITION |
| Inpatient Wards (IPD) |           | Outpatient Fast-Trk|         | Multi-Organization |
| Emergency Room (ER)   |           | Fast Consultation  |         | Multi-Branch Sync  |
| Operating Theater (OT)|           | Quick POS Billing  |         | Central Analytics  |
| Intensive Care (ICU)  |           | Streamlined Queue  |         | Tenant Isolation   |
+-----------------------+           +--------------------+         +--------------------+
```

---

## 2. Definitive Conceptual Entity Hierarchy

To eliminate ambiguity across development and operational teams, CuraSphere defines ten strictly delineated concepts:

```
[Subscription / License Tier]
              │ Governs commercial limits & active editions
              ▼
    [Healthcare Organization] ◄────── Legal & Data Security Boundary (Tenant)
              │
              ├── [Organization Membership] ◄── Link to [User Account] (Global Identity)
              │           │
              │           └── Has [Membership Role] (Scoped Permissions in this Org)
              │
              ├── [Feature Entitlements] ◄── Flags: multi-facility, audit-export, api-access
              │
              └── [Facility / Branch] ◄── Physical / Virtual Operational Site
                          │               (Runs Hospital Edition or Clinic Edition Profile)
                          │
                          └── [Department] ◄── Clinical or administrative unit (e.g., Cardiology)
                                      │
                                      └── Assigned Clinicians, Staff & Beds
```

### 2.1 Conceptual Definitions
1. **Product Edition:** The operational workflow profile enabled for a facility or deployment.
   - *Hospital Edition:* Full inpatient admission, emergency triage, surgical suites, and ICU telemetry.
   - *Clinic Edition:* Streamlined outpatient registration, calendar appointments, EMR SOAP notes, and thermal POS receipting.
   - *Enterprise Edition:* Network-level management layer enabling multi-organization tenancy, cross-facility aggregation, and centralized governance.
2. **Healthcare Organization:** The primary tenant boundary (e.g., "Aga Khan Health Services", "National Medical Group"). An organization legally owns all clinical, demographic, and financial data created under its umbrella. Data never crosses organization boundaries.
3. **Facility or Branch:** A physical hospital, satellite clinic, or diagnostic center operating under an organization (e.g., "Main Hospital Campus", "West End Outpatient Clinic").
4. **Department:** A specialized functional unit inside a facility (e.g., "Pediatrics", "Cardiology", "Outpatient Cashier").
5. **User Account:** A globally unique user identity (email address, password hash, MFA credentials, audit identifier). A user account exists independently of any single healthcare organization.
6. **Organization Membership:** An associative record binding a `UserAccount` to an `Organization`. It specifies the user's status within that organization, their primary assigned facility, and their membership role.
7. **Role & Permission:** The granular RBAC mechanism governing operations. Permissions follow the `Resource.Action` pattern (`patients.create`, `invoices.void`). Roles are assigned *within* an organization membership, not globally across the entire database.
8. **Subscription / License:** The commercial agreement defining the maximum permitted facilities, active clinician seats, storage quotas, and edition entitlements.
9. **Feature Entitlement:** A boolean or numeric flag controlling access to modular platform capabilities (e.g., `multi_branch_reporting = true`, `custom_branding = false`).

---

## 3. Strict Boundary Separation: Edition vs. Authorization vs. Data Isolation

A common architectural failure in healthcare software is conflating software editions with user permissions or data boundaries. CuraSphere strictly enforces three distinct layers:

```
+-----------------------------------------------------------------------------------+
| LAYER 1: DATA TENANCY (Data Isolation Boundary)                                    |
| "Whose data is this?" -> Enforced by OrganizationId & EF Core Global Query Filter |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
| LAYER 2: AUTHORIZATION (Permission Boundary)                                      |
| "Can this user do this action?" -> Enforced by Roles & HasPermissionAttribute     |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
| LAYER 3: EDITION & ENTITLEMENTS (Workflow Profile Boundary)                       |
| "Is this feature active here?" -> Enforced by EditionService & RequireModule      |
+-----------------------------------------------------------------------------------+
```

### Critical Rules:
- **Never use Edition to secure Data:** Changing a UI profile from Hospital to Clinic does not restrict data access. Tenant data boundaries are enforced exclusively by `OrganizationId`.
- **Never use Roles to enforce Tenancy:** A user possessing the "SuperAdmin" role in Organization A has zero access to records in Organization B.
- **Fail-Closed Default:** If a request cannot be unequivocally mapped to an authorized organization context, the backend rejects the request with HTTP 401 Unauthorized or HTTP 403 Forbidden.
