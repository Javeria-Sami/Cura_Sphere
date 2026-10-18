# CuraSphere Clinic Edition: Final Project Handover Package

**Document ID:** `DOC-CE-063`  
**Session:** 38  
**Version:** 1.0.0  
**Date:** 2026-10-19  
**Author / Handover Panel:** Senior Software Architect, .NET Technical Lead, QA Lead, Security Reviewer, DevOps Engineer, Technical Documentation Specialist  
**Target Release Artifact:** `v1.0.0-clinic` (Commit: `eab7e65`)  
**Scope:** Complete Operational, Architectural, and Engineering Handover for CuraSphere Clinic Edition  
**Deployment State:** **`NOT DEPLOYED (CODEBASE PRODUCTION-CERTIFIED — AWAITING CLOUD HOSTING PROVISIONING)`**  

---

## 1. Project Overview & Clinic Edition Scope

The **CuraSphere Hospital Management System (HMS) — Clinic Edition** is a specialized, streamlined variant of the CuraSphere healthcare platform designed specifically for outpatient polyclinics, ambulatory care centers, and private clinical practices.

### 1.1 Scope Delivered (Clinic Edition)
- **Patient Management:** Demographic intake, phone validation, sequential Medical Record Number (`MRN-YYYY-xxxxx`) generation, duplicate detection via national identity (CNIC/passport) and phone numbers, and profile timeline management.
- **Doctor Consultation & Availability:** Weekly scheduling rosters, consultation slot configuration, doctor profile board, and on-duty status indicators.
- **Reception Queue Management:** Daily walk-in token generation, live status board (`Waiting`, `In-Consultation`, `Completed`), and triage vitals recording.
- **Electronic Medical Records (EMR):** Clinician consultation notes (SOAP structure), triage vitals persistence, ICD diagnosis cataloging, and immutable sealing of finalized clinical encounters.
- **Electronic Prescriptions & CDSS:** Medication orders with dosage, route, frequency, duration, and Clinical Decision Support System (CDSS) drug-drug interaction alerts (e.g., Warfarin + Aspirin hazard warning).
- **Billing & Cashier Settlements:** Outpatient service invoicing, itemized line totals, percentage discount and tax calculation, payment state machine (`Unpaid` -> `Partial` -> `Paid`), and 80mm ESC/POS thermal receipt print formatting.
- **Executive BI & Financial Reports:** Aggregated patient census trends, revenue billed vs. collections, consultation completion rates, and department revenue breakdowns.
- **Edition Isolation:** Runtime edition switcher (`Clinic` vs. `Hospital`) preserving all shared components while strictly disabling tertiary inpatient hospital modules.

### 1.2 Scope Excluded
- **Hospital Tertiary Inpatient Modules:** Inpatient Wards (`ipd`), Emergency Room (`emergency`), Operating Theaters & Surgical Schedules (`surgery`), and Intensive Care Units (`icu`) are disabled in Clinic Edition.
- **Enterprise Multi-Tenancy:** Multi-facility tenant database partitioning, centralized enterprise billing hubs, and cross-clinic roaming records are excluded from the single-facility Clinic Edition.
- **Retail Pharmacy POS Barcode Scanner:** Hardware barcode scanner integration deferred to Clinic v1.2.
- **Clinic Overhead Expense Ledger:** Petty cash and facility utility expenses are managed externally (e.g., QuickBooks) in Clinic v1.0; native ledger planned for Clinic v1.1.

---

## 2. Verified Architecture & Technology Stack

The CuraSphere codebase adheres to Clean Architecture with strict separation of concerns across presentation, application logic, domain entities, and persistence:

```
[Presentation Tier: React 18.3+ SPA]
  ├── Framework: React 18, TypeScript 5.x, Vite 5.4+ / 8.2+
  ├── State Management: Zustand (authStore.ts, editionStore.ts)
  ├── Networking: Axios with baseURL resolution, 15s timeout, and X-Correlation-ID tracing
  └── UI Styling: Tailwind CSS & Lucide React Iconography
                                │ (HTTPS / REST JSON)
                                ▼
[Application API Tier: ASP.NET Core 8 Web API]
  ├── Runtime: .NET 8 SDK / C# 12 / Kestrel Web Server
  ├── Authentication: JwtBearer HMAC-SHA256 (256-bit cryptographic validation enforced at startup)
  ├── Middleware Pipeline:
  │     1. UseForwardedHeaders (Reverse proxy header normalization)
  │     2. RequestLoggingMiddleware (Sanitized duration and X-Correlation-ID logging)
  │     3. UseExceptionHandler (RFC 7231 Problem Details without stack traces)
  │     4. UseCors ("CuraSphereCorsPolicy" with explicit origins)
  │     5. UseAuthentication & UseAuthorization ([HasPermission], [RequireModule])
  └── Health Probes: /health (Composite), /health/live (Liveness), /health/ready (Readiness)
                                │ (EF Core 8 / Npgsql)
                                ▼
[Persistence Tier: PostgreSQL 16 Relational Engine]
  ├── Baseline Migration: 20260819114531_InitialCreate.cs
  ├── Schemas: audit, patient, hr, security, clinical, billing
  └── Indexes: 16 explicit B-tree foreign key and composite search indexes
```

---

## 3. Repository Structure & Key File Map

### 3.1 Frontend (`frontend/`)
- `frontend/src/app/App.tsx`: Top-level application shell and React Query provider.
- `frontend/src/routes/AppRoutes.tsx`: Role-based route definitions and module isolation guards.
- `frontend/src/lib/api.ts`: Central Axios client configured with 15-second timeout, `X-Correlation-ID` header injection, and `ECONNABORTED` error normalization.
- `frontend/src/stores/authStore.ts`: Zustand store for user session and JWT storage.
- `frontend/src/stores/editionStore.ts`: Zustand store for active edition state (`Clinic` vs. `Hospital`).
- `frontend/src/features/dashboard/pages/ClinicDashboardPage.tsx`: Dedicated Clinic Edition operational dashboard.
- `frontend/src/features/patients/components/`: `PatientList.tsx`, `PatientProfile.tsx`, `PatientRegistration.tsx`.
- `frontend/src/features/appointments/pages/AppointmentsPage.tsx`: Consultation scheduling, doctor shifts, and walk-in token queue.
- `frontend/src/features/emr/pages/EMRPage.tsx`: Doctor consultation notes, SOAP narrative, and electronic prescription writer.
- `frontend/src/features/billing/pages/BillingPage.tsx`: Cashier desk, invoice generation, payment settlement, and 80mm thermal receipt container (`.thermal-receipt-slip`).
- `frontend/src/features/reports/pages/ReportsPage.tsx`: Clinic BI analytics, collections aggregations, and print-ready reports.
- `frontend/src/__tests__/`: 20 Vitest automated test suites containing 195 passing tests.

### 3.2 Backend (`backend/`)
- `backend/CuraSphere.Api/Program.cs`: ASP.NET Core 8 entry point, middleware pipeline, health check endpoints, and CORS configuration.
- `backend/CuraSphere.Api/Controllers/`: `AuthController.cs`, `PatientsController.cs`, `AppointmentsController.cs`, `EmrController.cs`, `FinancialController.cs`, `ReportsController.cs`, `SystemController.cs`.
- `backend/CuraSphere.Application/Common/JwtSettings.cs`: Strongly-typed JWT configuration enforcing minimum 32-character (256-bit) secret key validation at startup.
- `backend/CuraSphere.Application/Common/ModuleId.cs`: Enumeration defining Shared, Hospital-only, and Clinic-specific modules.
- `backend/CuraSphere.Infrastructure/Services/EditionService.cs`: Authoritative service governing module registry and feature toggles based on active edition.
- `backend/CuraSphere.Infrastructure/Data/CuraSphereDbContext.cs`: EF Core DbContext mapping schemas, relationships, and 16 B-tree indexes.
- `backend/tests/CuraSphere.UnitTests/UnitTestRunner.cs`: 40 domain and query performance unit tests.

### 3.3 Infrastructure & Automation Scripts
- `docker-compose.yml`: Multi-container orchestration (PostgreSQL 16, ASP.NET Core 8, React Nginx SPA) with environment variable injection.
- `vercel.json`: Single Page Application (SPA) deep routing rewrite configuration.
- `scripts/backup-curasphere.sh`: Automated compressed PostgreSQL `pg_dump` utility.
- `scripts/restore-curasphere.sh`: Automated clean PostgreSQL `pg_restore` utility.
- `scripts/verify-backup-restore-drill.ps1` & `.sh`: Automated disaster recovery verification drill asserting row count and relational parity across all 7 core clinical tables.

---

## 4. Database & Migration Approach

1. **ORM & Database Engine:** Entity Framework Core 8.0 targeting PostgreSQL 15+.
2. **Schema Baseline:** Initial migration `20260819114531_InitialCreate.cs` provisions all primary tables across schemas (`patient`, `clinical`, `billing`, `hr`, `security`, `audit`).
3. **Index Optimization:** 16 B-tree indexes defined in `CuraSphereDbContext.cs` accelerate:
   - Foreign keys: `PatientId`, `DoctorId`, `AppointmentId`, `InvoiceId`.
   - Search columns: `PhoneNumber`, `CnicPassport`, `MedicalRecordNumber`, `InvoiceNumber`.
   - Composite queries: `(DoctorId, AppointmentDate)`, `(Status, InvoiceDate)`.
4. **Disaster Recovery Parity:** Verified via `scripts/verify-backup-restore-drill.ps1`, confirming **100% row count and relational parity** across `Patients`, `Appointments`, `OpdTokens`, `EmrEncounters`, `Invoices`, `PaymentRecords`, and `PatientDocuments`.

---

## 5. Authentication, Authorization & Roles

Authentication uses stateless JWT (JSON Web Tokens) signed with HMAC-SHA256:

| Role Name | Scope & Responsibilities | Accessible Clinic Features |
|:---|:---|:---|
| **SuperAdmin** | Full system ownership, system configuration, audit logs, and user management. | All clinic and administrative features. |
| **ClinicAdmin** | Clinic practice manager; manages doctor schedules, fee schedules, and staff accounts. | Dashboard, Patients, Appointments, Reports, User Management. |
| **Doctor** | Attending physician; conducts consultations, writes SOAP notes, and orders prescriptions. | Dashboard, Appointments, EMR, Prescriptions, Patient Profiles. |
| **Nurse** | Clinical nurse; records patient triage vitals and updates waiting queue tokens. | Dashboard, Patient Intake, Queue Board, Vitals Entry. |
| **Receptionist** | Front-desk officer; registers patients, books appointments, and issues OPD tokens. | Patient Registration, Search, Appointment Booking, Queue Desk. |
| **Cashier** | Billing clerk; settles invoices, collects payments, and prints 80mm thermal receipts. | Billing Counter, Cashier Invoicing, Payment Processing, Receipt Printing. |

---

## 6. Environment Configuration Requirements

### 6.1 Frontend Environment Variables (`frontend/.env`)
```bash
# Backend API Base URL
VITE_API_URL=http://localhost:5000/api
# Default Active Edition (Clinic or Hospital)
VITE_DEFAULT_EDITION=Clinic
```

### 6.2 Backend Configuration (`backend/CuraSphere.Api/appsettings.json` or Environment Variables)
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=curasphere_hms_db;Username=postgres;Password=${POSTGRES_PASSWORD};Port=5432"
  },
  "JwtSettings": {
    "Secret": "${JWT_SECRET}",
    "Issuer": "CuraSphereApi",
    "Audience": "CuraSphereClient",
    "ExpiryInMinutes": 60
  },
  "Cors": {
    "AllowedOrigins": "http://localhost:3000,http://localhost:5173"
  },
  "EditionSettings": {
    "CurrentEdition": "Clinic",
    "FacilityName": "CuraSphere Medical Clinic"
  }
}
```

> [!IMPORTANT]
> **CRYPTOGRAPHIC KEY REQUIREMENT**  
> `JwtSettings:Secret` must be at least 32 characters (256 bits) in length. Application startup validates this rule and immediately halts execution if the secret is missing or insufficient.

---

## 7. Local Setup & Verification Instructions

### 7.1 Prerequisites
- Node.js 20.x or higher & npm.
- .NET 8.0 SDK (for local backend compilation).
- PostgreSQL 15+ or Docker Engine.

### 7.2 Running Frontend Locally
```bash
cd frontend
npm install
npm run dev
# Application accessible at http://localhost:3000
```

### 7.3 Executing Verification & Test Suites
```bash
# 1. Run full automated unit/integration test suite (20 suites, 195 tests)
cd frontend
npx vitest run

# 2. Run static code quality and lint checks
npm run lint

# 3. Compile production Rollup bundle
npm run build

# 4. Check for dependency supply chain vulnerabilities
npm audit

# 5. Execute disaster recovery backup and restore verification drill
cd ..
powershell -ExecutionPolicy Bypass -File .\scripts\verify-backup-restore-drill.ps1
```

---

## 8. Deployment Architecture & Considerations

```
[Vercel / Cloudflare Pages CDN]
       │
       ▼
 [Static SPA Bundle] (dist/index.html, dist/assets/*)
       │ (HTTPS / CORS)
       ▼
[Render / AWS ECS Linux Container Cluster]
       │
       ▼
 [ASP.NET Core 8 Kestrel API] (Unprivileged user 'app', UID 1654)
       │ (Encrypted PostgreSQL Connection)
       ▼
[Managed PostgreSQL 16 Cluster] (Private VPC)
```

1. **Frontend Hosting (Vercel):** Single Page Application static deployment. `vercel.json` rewrite rule ensures all deep routes (e.g. `/patients`, `/billing`) route to `/index.html`.
2. **Backend Hosting (Render / AWS ECS):** Multi-stage Dockerfile (`backend/CuraSphere.Api/Dockerfile`) compiles on `mcr.microsoft.com/dotnet/sdk:8.0` and runs on lightweight Alpine runtime executing as unprivileged user `app` (UID 1654).
3. **Database Hosting:** Managed PostgreSQL 16 with automatic daily snapshots and SSL connection enforcement (`SSL Mode=Require`).

---

## 9. Backup, Monitoring & Incident Runbooks

- **Operational Monitoring & Alerting Plan:** [`58-operational-monitoring-and-alerting-plan.md`](file:///c:/Users/LENOVO/Downloads/-CuraSphere-HMS-DevelopbyUzaii-main/-CuraSphere-HMS-DevelopbyUzaii-main/docs/clinic-edition/58-operational-monitoring-and-alerting-plan.md) (`DOC-CE-058`). Details probe semantics (`/health/live`, `/health/ready`), warning/critical thresholds, and zero-PHI logging rules.
- **Reliability & Incident Response Runbook:** [`59-reliability-and-incident-response-runbook.md`](file:///c:/Users/LENOVO/Downloads/-CuraSphere-HMS-DevelopbyUzaii-main/-CuraSphere-HMS-DevelopbyUzaii-main/docs/clinic-edition/59-reliability-and-incident-response-runbook.md) (`DOC-CE-059`). Details step-by-step containment procedures for total outages, 5xx spikes, database locks, security incidents, and sub-10 minute rollback commands.
- **Clinic Administrator Handover Guide:** [`32-clinic-administrator-handover-guide.md`](file:///c:/Users/LENOVO/Downloads/-CuraSphere-HMS-DevelopbyUzaii-main/-CuraSphere-HMS-DevelopbyUzaii-main/docs/clinic-edition/32-clinic-administrator-handover-guide.md) (`DOC-CE-032`).
- **Maintenance & Support Checklist:** [`33-maintenance-and-support-checklist.md`](file:///c:/Users/LENOVO/Downloads/-CuraSphere-HMS-DevelopbyUzaii-main/-CuraSphere-HMS-DevelopbyUzaii-main/docs/clinic-edition/33-maintenance-and-support-checklist.md) (`DOC-CE-033`).

---

## 10. Outstanding Blockers Prior to Live Traffic Cutover

1. **`BLK-REL-01` (Managed Cloud Hosting Unprovisioned):** The project owner must provision managed PostgreSQL 16 (`curasphere_prod_db`) and container hosting service (Render / AWS ECS).
2. **`BLK-REL-02` (Clinical Stakeholder Walkthrough Sign-Off):** Authorized clinic representatives (Practice Manager, Medical Director) must execute their structured 90-minute acceptance walkthrough on the live staging URL.
