# CuraSphere Enterprise Edition: Current State Architecture Assessment
**Document ID:** `DOC-EE-001`  
**Version:** 1.0.0  
**Status:** Approved Architectural Baseline  
**Session:** Session 14: Enterprise Edition Architecture & Multi-Organization Foundation  
**Audience:** Principal Software Architects, Lead Engineers, Security Officers

---

## 1. Executive Summary

CuraSphere was conceived as an enterprise-grade Hospital Management System (Hospital Edition) and has been successfully extended with streamlined outpatient capabilities (Clinic Edition) across Sessions 1 through 13.

As CuraSphere prepares for multi-facility networks, polyclinics, and multi-tenant SaaS hosting (Enterprise Edition), this document conducts an unsparing, evidence-based audit of the current codebase. It identifies existing architectural foundations that can be repurposed, exposes architectural gaps that must be bridged, and establishes the exact baseline upon which the multi-organization architecture will be engineered.

---

## 2. Actual Codebase Architecture Inventory

The repository adheres to a clean, decoupled client-server architecture:

```
[Frontend Client]                  [Backend Application Server]               [Persistence]
React 18 + TypeScript             ASP.NET Core 8 Web API                     PostgreSQL 15+
Vite 5.4 + Tailwind CSS           Controllers -> Application -> Infrastructure EF Core (Npgsql)
Zustand + React Router             JWT Auth + RBAC + Module Engine            Relational Schema
```

### 2.1 Backend Project Structure
- **`backend/CuraSphere.Domain`:** Pure domain layer containing entity models (`Patient`, `Doctor`, `Appointment`, `EmrEncounter`, `Invoice`, `AuditLog`, `BranchFacility`, `UserAccount`, `Role`, `Permission`). Dependencies: Zero external packages.
- **`backend/CuraSphere.Application`:** Use case contracts, interfaces (`IPatientService`, `IAppointmentService`, `IEmrService`, `IFinancialService`, `IEditionService`), DTOs, and common enumerations (`EditionType`, `ModuleId`).
- **`backend/CuraSphere.Infrastructure`:** Persistence implementations (`CuraSphereDbContext`), entity configurations, seed routines (`DbContextSeed`), clinical engines (`CdssRuleEngine`), and security providers (`JwtProvider`, `AuthService`).
- **`backend/CuraSphere.Api`:** REST API controllers, JWT authentication middleware, CORS configuration, request logging with correlation IDs (`X-Correlation-ID`), health check probes (`/health`, `/health/live`, `/health/ready`), and SignalR realtime hubs.

### 2.2 Frontend Project Structure
- **`frontend/src/`:** Modular feature architecture (`features/auth`, `features/patients`, `features/appointments`, `features/emr`, `features/billing`, `features/dashboard`).
- **`stores/`:** Lightweight global state using Zustand (`authStore.ts`, `editionStore.ts`).
- **`lib/`:** Shared Axios client (`api.ts`) with dynamic base URL resolution and automated Bearer token attachment.
- **`components/layout/`:** Dynamic sidebar and navigation layout filtering visible modules based on edition and user permissions.

---

## 3. Existing Organization & Facility Capabilities

A rigorous audit of the domain entities reveals several nascent organizational elements already present in the codebase:

1. **`BranchFacility` Entity (`CuraSphere.Domain.Entities.BranchFacility.cs`):**
   - Fields: `BranchFacilityId`, `BranchCode`, `BranchName`, `Address`, `City`, `Province`, `ContactPhone`, `Status`.
   - *Status:* Modeled in domain, but currently **unlinked** to clinical records, patients, or financial transactions.
2. **`Department` Entity (`CuraSphere.Domain.Entities.HR.cs`):**
   - Fields: `DepartmentId`, `DepartmentName`, `DepartmentCode`, `Location`, `HeadDoctorId`.
   - *Status:* Foreign-keyed to `Doctor` and `Employee`, but lacks a parent `BranchFacilityId` or `OrganizationId`.
3. **`EditionSettings` (`CuraSphere.Application.Common.EditionSettings.cs`):**
   - Fields: `CurrentEdition` (`Hospital`, `Clinic`, `Enterprise`), `FacilityName`.
   - *Status:* Operates as a single deployment-level global configuration read from environment variable `CURASPHERE_EDITION`. It does not support runtime tenant switching.
4. **`EditionType.Enterprise` (`CuraSphere.Application.Common.EditionType.cs`):**
   - Value `Enterprise = 3` was pre-allocated during Session 4 as a future architectural reservation.

---

## 4. Major Architectural Gaps for Multi-Tenancy

The following fundamental architectural gaps prevent immediate multi-tenant deployment:

| Subsystem | Current State (Single-Tenant Assumption) | Required State (Enterprise Multi-Tenant) | Architectural Severity |
| :--- | :--- | :--- | :---: |
| **Tenant Ownership** | Entities (`Patient`, `Appointment`, `Invoice`, `EmrEncounter`) have no tenant identifier. | All tenant-owned records must implement `ITenantScopedEntity` with an immutable `OrganizationId`. | **CRITICAL** |
| **Tenant Context** | API requests execute in an ambient single-tenant context; no tenant extraction. | Claims-based `ITenantContext` resolved from validated JWT claims and organization membership. | **CRITICAL** |
| **Data Isolation** | Queries execute against the global database without tenant filtering. | EF Core Global Query Filters (`HasQueryFilter`) enforced automatically across all repositories. | **CRITICAL** |
| **User Identity** | `UserAccount` has a single `RoleId` and is assumed to belong to the local system. | Global identity decoupled from organizations via `OrganizationMembership` with per-org roles. | **HIGH** |
| **Unique Identifiers** | `MedicalRecordNumber` and `InvoiceNumber` are globally unique in DB. | Unique constraints must be scoped per organization: `(OrganizationId, MedicalRecordNumber)`. | **HIGH** |
| **Facility Scoping** | Outpatient and inpatient workflows assume a single physical facility. | Workflows support multi-facility networks with facility-level scheduling, beds, and billing. | **MEDIUM** |
| **Administration** | No user interface or API for provisioning organizations or managing branches. | Enterprise Administration portal with Organization Overview, Facility Management, and Invitations. | **MEDIUM** |
| **Reporting** | Dashboard and financial metrics aggregate all database rows without scoping. | Authoritative boundaries: Facility Operational Reports vs Organization Executive Rollups. | **HIGH** |

---

## 5. Architectural Strengths to Leverage

1. **Entity Framework Core 8:** Provides built-in support for model-level Global Query Filters (`b.HasQueryFilter(e => e.OrganizationId == _tenantContext.OrganizationId)`), enabling transparent, leak-proof data filtering.
2. **PostgreSQL Relational Engine:** High-performance indexing, JSONB configuration support, and native Row-Level Security (RLS) primitives that can provide defense-in-depth isolation.
3. **Established Clean Architecture:** Strict separation between Domain, Application, Infrastructure, and API layers ensures tenant filtering can be introduced without rewriting business logic.
4. **Comprehensive Test Suite:** 81 Vitest unit/integration tests and 22 backend domain tests guarantee that existing Hospital and Clinic workflows will not suffer regressions during multi-tenant extension.
