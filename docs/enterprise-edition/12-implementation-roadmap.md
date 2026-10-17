# CuraSphere Enterprise Edition: Multi-Organization Implementation Roadmap
**Document ID:** `DOC-EE-012`  
**Version:** 1.0.0  
**Status:** Approved Master Roadmap  
**Session:** Session 14: Enterprise Edition Architecture & Multi-Organization Foundation  
**Audience:** Technical Leadership, Release Managers, Engineering Leads

---

## 1. Phased Execution Overview

To eliminate regression risks to the existing Hospital and Clinic Editions, the Enterprise Edition is structured into **nine controlled, incremental phases** (Phase A through Phase I):

```
Phase A: Architecture & Domain Blueprint (COMPLETED - Session 14)
   │
   ▼
Phase B: Organization & Facility Domain Entities
   │
   ▼
Phase C: Multi-Tenant Authentication & Tenant Context Middleware
   │
   ▼
Phase D: EF Core Global Query Filters & Repository Isolation
   │
   ▼
Phase E: Enterprise Administration Portal (UI/UX)
   │
   ▼
Phase F: Cross-Facility Aggregation & Reporting Engine
   │
   ▼
Phase G: Centralized Feature Entitlements & License Management
   │
   ▼
Phase H: Database Migration, Security Pen-Testing & Negative Tests
   │
   ▼
Phase I: Staging Deployment, Customer Onboarding & Release Sign-Off
```

---

## 2. Phase-by-Phase Technical Blueprint

### Phase A: Architecture Approval & Domain Blueprint (Completed in Session 14)
- **Objective:** Establish the product model, threat model, schema blueprints, and test harnesses.
- **Deliverables:** `docs/enterprise-edition/01` through `12`.
- **Status:** **APPROVED & COMPLETE**.

---

### Phase B: Organization & Facility Foundations
- **Objective:** Add `Organization`, `OrganizationMembership`, and `FacilityAssignment` entities to `CuraSphere.Domain`. Extend `BranchFacility` and `Department`.
- **Impacted Files:**
  - `backend/CuraSphere.Domain/Entities/Organization.cs` *(New)*
  - `backend/CuraSphere.Domain/Entities/BranchFacility.cs` *(Extend)*
  - `backend/CuraSphere.Domain/Entities/HR.cs` *(Extend Department)*
  - `backend/CuraSphere.Domain/Interfaces/ITenantScopedEntity.cs` *(New)*
- **Prerequisites:** Phase A.
- **Acceptance Criteria:** Entities compile cleanly; unit tests verify relationship mappings.
- **Tests:** Domain entity instantiations in `UnitTestRunner.cs`.

---

### Phase C: Authentication Membership & Tenant Context
- **Objective:** Decouple global user authentication from tenant authorization. Implement `ITenantContext` and `TenantResolutionMiddleware`.
- **Impacted Files:**
  - `backend/CuraSphere.Application/Interfaces/ITenantContext.cs` *(New)*
  - `backend/CuraSphere.Infrastructure/Services/TenantContext.cs` *(New)*
  - `backend/CuraSphere.Api/Middleware/TenantResolutionMiddleware.cs` *(New)*
  - `backend/CuraSphere.Api/Controllers/AuthController.cs` *(Extend)*
- **Prerequisites:** Phase B.
- **Acceptance Criteria:** `POST /api/auth/select-organization` validates active membership and mints contextual JWT with `org_id`.
- **Tests:** Vitest & .NET tests verifying multi-org login and organization switching.

---

### Phase D: Backend Data Isolation & EF Core Query Filters
- **Objective:** Configure model-level Global Query Filters (`b.HasQueryFilter(e => e.OrganizationId == _tenantContext.OrganizationId)`) across all repositories.
- **Impacted Files:**
  - `backend/CuraSphere.Infrastructure/Persistence/CuraSphereDbContext.cs`
  - `backend/CuraSphere.Infrastructure/Services/PatientService.cs`
  - `backend/CuraSphere.Infrastructure/Services/AppointmentService.cs`
  - `backend/CuraSphere.Infrastructure/Services/FinancialService.cs`
- **Prerequisites:** Phase C.
- **Acceptance Criteria:** No patient, appointment, or invoice can be read or written outside the active tenant context.
- **Tests:** Execute ISO-01 through ISO-05 negative authorization tests.

---

### Phase E: Enterprise Administration UI/UX
- **Objective:** Implement the frontend administrative views for Organization Overview, Facility Management, and Staff Memberships.
- **Impacted Files:**
  - `frontend/src/features/enterprise/pages/OrganizationOverviewPage.tsx` *(New)*
  - `frontend/src/features/enterprise/pages/FacilityManagementPage.tsx` *(New)*
  - `frontend/src/features/enterprise/pages/MembershipRosterPage.tsx` *(New)*
  - `frontend/src/components/layout/HeaderContextSwitcher.tsx` *(New)*
- **Prerequisites:** Phases B, C, D.
- **Acceptance Criteria:** Responsive, accessible UI for branch creation and staff invites with context switching.
- **Tests:** Vitest component tests and accessibility audits (`a11y-debugging`).

---

### Phase F: Cross-Facility Reporting & Analytics
- **Objective:** Build executive rollup services aggregating operational metrics across facilities without patient-level PHI disclosure.
- **Impacted Files:**
  - `backend/CuraSphere.Infrastructure/Services/ReportsService.cs`
  - `backend/CuraSphere.Api/Controllers/ReportsController.cs`
  - `frontend/src/features/enterprise/pages/NetworkAnalyticsPage.tsx` *(New)*
- **Prerequisites:** Phases D, E.
- **Acceptance Criteria:** Network analytics correctly sum revenue and census across authorized branches only.
- **Tests:** Verification against multi-branch synthetic seed data.

---

### Phase G: Feature Entitlements & License Management
- **Objective:** Implement the central feature entitlement engine (`[RequireEntitlement]`, `useEntitlement`).
- **Impacted Files:**
  - `backend/CuraSphere.Application/Interfaces/IEntitlementService.cs` *(New)*
  - `backend/CuraSphere.Api/Middleware/RequireEntitlementAttribute.cs` *(New)*
  - `frontend/src/hooks/useEntitlement.ts` *(New)*
- **Prerequisites:** Phase E.
- **Acceptance Criteria:** Disabled entitlements return HTTP 403 and hide corresponding frontend actions.
- **Tests:** Automated tests testing feature gating.

---

### Phase H: Database Migration, Security Pen-Testing & Negative Tests
- **Objective:** Execute the 4-stage data backfill script, verify orphan detection queries, and run the complete negative authorization matrix.
- **Impacted Files:**
  - `backend/CuraSphere.Infrastructure/Migrations/`
  - `scripts/migrate-to-multitenant.sql`
- **Prerequisites:** Phases B–G.
- **Acceptance Criteria:** 100% of negative authorization tests pass; zero regressions on Hospital and Clinic tests.
- **Tests:** Complete execution of `DOC-EE-011` test suite.

---

### Phase I: Staging Validation & Controlled Release
- **Objective:** Deploy to multi-tenant cloud staging environment and conduct user acceptance testing with synthetic multi-branch tenant accounts.
- **Prerequisites:** Phase H.
- **Acceptance Criteria:** Production sign-off and release gate approval.

---

## 3. Recommended Next Session

- **Target Session:** **Session 15: Enterprise Multi-Organization Domain & Membership Implementation (Phase B & C)**.
- **Core Scope:**
  1. Add `Organization`, `OrganizationMembership`, and `FacilityAssignment` entities.
  2. Implement `ITenantContext` and `TenantResolutionMiddleware`.
  3. Wire `POST /api/auth/select-organization` into the authentication pipeline.
  4. Ensure zero breaking changes to existing Hospital and Clinic Edition authentication.
