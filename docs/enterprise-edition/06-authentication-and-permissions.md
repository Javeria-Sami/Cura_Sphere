# CuraSphere Enterprise Edition: Authentication, Multi-Org Memberships & RBAC
**Document ID:** `DOC-EE-006`  
**Version:** 1.0.0  
**Status:** Approved Security Architecture  
**Session:** Session 14: Enterprise Edition Architecture & Multi-Organization Foundation  
**Audience:** Security Architects, Identity Engineers, Full-Stack Developers

---

## 1. Decoupling Authentication from Organization Access

In a multi-organization architecture, **Identity (Who you are)** is fundamentally decoupled from **Tenancy (Where you work and what you can do)**:

```
[User Account] (Global Identity: email, password hash, MFA)
      │
      ├── Organization Alpha Membership ---> Role: "Doctor" (Facility: Central Clinic)
      │
      └── Organization Beta Membership  ---> Role: "Consultant" (Facility: North Hospital)
```

### 1.1 Multi-Organization Authentication Lifecycle
1. **Primary Authentication (`POST /api/auth/login`):**
   - User authenticates with global credentials (email & password).
   - If user belongs to exactly one active organization, server issues an Organization Context JWT immediately.
   - If user belongs to multiple organizations, server returns an intermediate session token and the list of available organizations (`UserOrganizationDto[]`).
2. **Organization Context Selection (`POST /api/auth/select-organization`):**
   - Client sends chosen `OrganizationId` with the intermediate token.
   - Server verifies active membership in `OrganizationMembership`, extracts the user's role and permissions for *that specific organization*, and mints the authoritative Contextual Access JWT.
3. **Contextual JWT Payload Structure:**
   ```json
   {
     "sub": "1001",
     "email": "dr.kamran@beaconhealth.com",
     "org_id": "501",
     "org_code": "ORG-BEACON",
     "facility_id": "12",
     "role": "Doctor",
     "permissions": ["patients.read", "appointments.manage", "clinical.write"],
     "exp": 1792150000
   }
   ```

---

## 2. Preliminary Enterprise Role-Permission Matrix

CuraSphere defines eight standard enterprise roles enforcing least-privilege access:

| Role Identifier | Organization Scope | Facility Scope | Target Persona |
| :--- | :--- | :--- | :--- |
| **`PlatformAdmin`** | System-Wide (All Orgs) | All Facilities | CuraSphere Cloud DevOps / Support Engineer |
| **`OrgOwner`** | Full Organization | All Facilities in Org | Chief Executive Officer / Clinic Group Founder |
| **`OrgAdmin`** | Full Organization | All Facilities in Org | Regional Operations Director / Practice Manager |
| **`FacilityAdmin`** | Scoped to Facility | Single Facility | Branch Manager / Medical Superintendent |
| **`DoctorClinician`**| Scoped to Facility | Assigned Facilities | Physician / Specialist / Surgeon |
| **`Receptionist`** | Scoped to Facility | Assigned Facilities | Front Desk / Patient Registration Operator |
| **`BillingCashier`** | Scoped to Facility | Assigned Facilities | Finance Officer / Counter Cashier |
| **`ComplianceAuditor`**| Full Organization | All Facilities (Read-Only) | Healthcare Quality Inspector / External Auditor |

---

## 3. Comprehensive Permission Catalog & Access Grid

Permissions follow the explicit `Resource.Action` convention validated by the backend `HasPermissionAttribute.cs`:

| Functional Domain | Permissions Required | `PlatformAdmin` | `OrgOwner` | `OrgAdmin` | `FacilityAdmin` | `DoctorClinician` | `Receptionist` | `BillingCashier` | `ComplianceAuditor` |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Org Settings** | `org.settings.manage` | **NO** (System only) | **YES** | **YES** | Read-Only | None | None | None | Read-Only |
| **Facility Management** | `facilities.manage` | Read/Support | **YES** | **YES** | Edit Assigned | None | None | None | Read-Only |
| **User & Memberships** | `memberships.manage` | None | **YES** | **YES** | Branch Staff | None | None | None | Read-Only |
| **Patient Demographics**| `patients.read/write`| None | Full | Full | Full | Full | Full | Read-Only | Read-Only (Masked) |
| **Appointments** | `appointments.manage`| None | Full | Full | Full | Assigned Dr | Full | Read-Only | Read-Only |
| **Clinical Records (EMR)**| `clinical.read/write`| **RESTRICTED** | None (PHI guard) | None | Emergency Break-glass | **YES** | None | None | De-identified |
| **Billing & Payments** | `billing.create/collect`| None | Full | Full | Branch Summary | None | None | **YES** | Read-Only |
| **Audit Logs** | `audit.read` | System Logs | **YES** | **YES** | Branch Logs | None | None | None | **YES** |
| **Cross-Facility Reports**| `reports.cross_facility`| None | **YES** | **YES** | None (Local only)| None | None | None | **YES** |

### Critical Privacy Rule on Platform Administrators:
> **Platform Administrators Have Zero Default Access to Protected Health Information (PHI):** A Platform Administrator manages platform subscriptions, database migrations, and organization lifecycle. They are strictly prohibited from viewing patient names, diagnosis notes, or clinical encounter history without an explicitly logged, time-limited, two-person authorized "Break-Glass Audit" procedure.

---

## 4. Context Switching, Role Evolution & Revocation

### 4.1 Organization Switching Workflow
- When a multi-organization user changes organization in the UI header switcher, the frontend invokes `POST /api/auth/select-organization`.
- The server validates that membership is still `Active`.
- A new contextual token is minted; local storage / Zustand state updates cleanly without requiring full re-login.

### 4.2 Membership Revocation Protocol
- When an administrator revokes a membership (`memberships.revoke`), the backend increments the user's `SecurityStamp` in `UserAccount`.
- The active token validation handler checks the cached security stamp on every state-changing request. A revoked membership results in immediate HTTP 401 Unauthorized within 60 seconds.
