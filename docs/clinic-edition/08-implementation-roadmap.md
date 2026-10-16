# CURASPHERE CLINIC EDITION — ORDERED IMPLEMENTATION ROADMAP
**Document ID:** `ROAD-CE-008`  
**Version:** 1.0.0  
**Status:** Approved Master Roadmap  

---

## 1. Roadmap Architecture & Execution Principles

This roadmap organizes the development of the Clinic Edition into **12 incremental, test-backed sessions** (Sessions 3 through 14).

### Key Safety Rules
- Each session produces a deployable, testable increment.
- Hospital Edition workflows are continually protected by regression verification.
- No session introduces speculative dependencies or unverified mock data.
- Every session defines explicit acceptance criteria, tests, and rollback procedures.

---

## 2. Detailed Session-by-Session Implementation Plan

### Session 3: Security and Configuration Hardening
- **Objective:** Eliminate critical authentication backdoors, remove hardcoded credentials, fix client-side bypasses, configure CORS, and stabilize the lint baseline.
- **Files Expected to Change:**
  - [`backend/CuraSphere.Infrastructure/Services/AuthService.cs`](file:///c:/Users/LENOVO/Downloads/-CuraSphere-HMS-DevelopbyUzaii-main/-CuraSphere-HMS-DevelopbyUzaii-main/backend/CuraSphere.Infrastructure/Services/AuthService.cs)
  - [`backend/CuraSphere.Infrastructure/Persistence/Seed/DbContextSeed.cs`](file:///c:/Users/LENOVO/Downloads/-CuraSphere-HMS-DevelopbyUzaii-main/-CuraSphere-HMS-DevelopbyUzaii-main/backend/CuraSphere.Infrastructure/Persistence/Seed/DbContextSeed.cs)
  - [`backend/CuraSphere.Api/Program.cs`](file:///c:/Users/LENOVO/Downloads/-CuraSphere-HMS-DevelopbyUzaii-main/-CuraSphere-HMS-DevelopbyUzaii-main/backend/CuraSphere.Api/Program.cs)
  - [`frontend/src/routes/ProtectedRoute.tsx`](file:///c:/Users/LENOVO/Downloads/-CuraSphere-HMS-DevelopbyUzaii-main/-CuraSphere-HMS-DevelopbyUzaii-main/frontend/src/routes/ProtectedRoute.tsx)
  - [`frontend/src/components/layout/Sidebar.tsx`](file:///c:/Users/LENOVO/Downloads/-CuraSphere-HMS-DevelopbyUzaii-main/-CuraSphere-HMS-DevelopbyUzaii-main/frontend/src/components/layout/Sidebar.tsx)
  - [`frontend/package.json`](file:///c:/Users/LENOVO/Downloads/-CuraSphere-HMS-DevelopbyUzaii-main/-CuraSphere-HMS-DevelopbyUzaii-main/frontend/package.json)
- **Dependencies:** None.
- **Acceptance Criteria:**
  - Backdoor `"admin"`/`"Admin123!"` bypass in `AuthService.cs` is removed.
  - Client-side `!user` bypass in `ProtectedRoute.tsx` is eliminated.
  - Startup seed does not overwrite existing password hashes.
  - CORS policy is configured in `Program.cs`.
  - `npm run lint` executes and passes cleanly.
- **Tests:** Auth unit test validating credential rejection; lint check execution.
- **Risks:** Unseeded demo logins failing in disconnected dev mode (mitigated by seeding explicit demo accounts with hashed passwords).
- **Rollback Approach:** Revert branch commit on `feature/clinic-edition`.

---

### Session 4: Edition Configuration and Navigation Foundations
- **Objective:** Establish the dynamic edition switcher, organization scoping interface (`ITenantScopedEntity`), and edition-aware navigation filtering.
- **Files Expected to Change:**
  - `backend/CuraSphere.Domain/Entities/ClinicOrganization.cs` *(New)*
  - `backend/CuraSphere.Domain/Interfaces/ITenantScopedEntity.cs` *(New)*
  - `backend/CuraSphere.Infrastructure/Persistence/CuraSphereDbContext.cs`
  - `frontend/src/stores/authStore.ts`
  - `frontend/src/components/layout/Sidebar.tsx`
  - `frontend/src/app/App.tsx`
- **Dependencies:** Session 3.
- **Acceptance Criteria:**
  - System switches between Clinic and Hospital navigation layouts based on active organization edition.
  - Hospital-only routes (`/ipd`, `/emergency`, `/surgery`, `/icu`) are cleanly hidden in Clinic mode and accessible in Hospital mode.
- **Tests:** Unit test navigation filter functions in frontend; verify route permission gates.
- **Risks:** Broken hospital links if edition tags are misapplied.
- **Rollback Approach:** Git revert.

---

### Session 5: Clinic Dashboard and Shared Layout
- **Objective:** Build the high-performance Clinic Dashboard with outpatient KPI stats, real-time waiting counters, and quick walk-in action triggers.
- **Files Expected to Change:**
  - `backend/CuraSphere.Api/Controllers/ClinicDashboardController.cs` *(New)*
  - `backend/CuraSphere.Application/DTOs/ClinicDashboardDtos.cs` *(New)*
  - `frontend/src/features/dashboard/pages/ClinicDashboardPage.tsx` *(New)*
  - `frontend/src/services/clinicDashboardService.ts` *(New)*
- **Dependencies:** Session 4.
- **Acceptance Criteria:**
  - Displays real-time counts for Today's Appointments, Waiting Patients, Active Consultations, and Collections.
  - Revenue stats are automatically redacted for non-financial staff roles.
- **Tests:** API endpoint unit test; Vitest component render test.
- **Risks:** Slow dashboard queries (mitigated by indexed counts).
- **Rollback Approach:** Fallback to legacy dashboard.

---

### Session 6: Clinic Settings and Doctor Schedules
- **Objective:** Implement doctor availability modeling, shift schedules, and clinic profile configuration.
- **Files Expected to Change:**
  - `backend/CuraSphere.Domain/Entities/DoctorSchedule.cs` *(New)*
  - `backend/CuraSphere.Domain/Entities/ClinicSetting.cs` *(New)*
  - `backend/CuraSphere.Api/Controllers/DoctorController.cs` *(New)*
  - `frontend/src/features/doctors/pages/DoctorsPage.tsx`
  - `frontend/src/features/clinic/pages/ClinicSettingsPage.tsx` *(New)*
- **Dependencies:** Session 4, 5.
- **Acceptance Criteria:**
  - Practice managers can set doctor working hours (e.g. Mon–Fri, 9:00 AM – 1:00 PM, 15-min slots).
  - Clinic identity, address, and receipt notes are customizable.
- **Tests:** EF Core migration test; schedule generation logic test.
- **Risks:** Invalid time ranges (mitigated by DTO validation).
- **Rollback Approach:** Rollback migration and endpoint.

---

### Session 7: Appointment Scheduling Engine
- **Objective:** Deliver interactive slot selection, booking workflow, and atomic double-booking prevention.
- **Files Expected to Change:**
  - `backend/CuraSphere.Domain/Entities/DoctorTimeSlot.cs` *(New)*
  - `backend/CuraSphere.Infrastructure/Services/AppointmentService.cs`
  - `backend/CuraSphere.Api/Controllers/AppointmentController.cs`
  - `frontend/src/features/appointments/pages/AppointmentsPage.tsx`
  - `frontend/src/services/appointmentService.ts`
- **Dependencies:** Session 6.
- **Acceptance Criteria:**
  - Patients can be booked into available 15-min slots.
  - Concurrent booking of the same slot throws `HTTP 409 Conflict`.
  - Frontend form submits directly to the API (no in-memory mock bypass).
- **Tests:** Concurrency test verifying slot locking; appointment cancellation test.
- **Risks:** Slot generation performance on long date horizons (capped to 30 days).
- **Rollback Approach:** Revert appointment service changes.

---

### Session 8: Reception and Waiting Queue
- **Objective:** Streamline outpatient walk-in registration, token issuance, and live queue status updates.
- **Files Expected to Change:**
  - `backend/CuraSphere.Infrastructure/Services/OpdService.cs`
  - `backend/CuraSphere.Api/Controllers/OpdController.cs`
  - `frontend/src/features/opd/pages/OPDPage.tsx`
  - `frontend/src/services/opdService.ts`
- **Dependencies:** Session 7.
- **Acceptance Criteria:**
  - Walk-in patients receive sequential daily tokens (`T-001`, `T-002`).
  - Status updates (`Waiting` -> `Called` -> `Consulting` -> `Completed`) save to database.
  - Model binding bug for `{ status }` is resolved.
- **Tests:** Queue numbering sequence test; token status transition test.
- **Risks:** Queue number collisions under simultaneous walk-ins (handled via database sequence).
- **Rollback Approach:** Git revert.

---

### Session 9: Consultation and Clinical Records (EMR + Rx)
- **Objective:** Implement the Doctor Consultation Workspace, SOAP notes, vital signs, ICD diagnoses, and electronic prescription generator.
- **Files Expected to Change:**
  - `backend/CuraSphere.Domain/Entities/Prescription.cs` *(New)*
  - `backend/CuraSphere.Domain/Entities/PrescriptionItem.cs` *(New)*
  - `backend/CuraSphere.Api/Controllers/EmrController.cs` *(New)*
  - `backend/CuraSphere.Infrastructure/Services/EmrService.cs` *(New)*
  - `frontend/src/features/emr/pages/ConsultationWorkspacePage.tsx` *(New)*
  - `frontend/src/features/emr/components/PrescriptionPrintModal.tsx` *(New)*
- **Dependencies:** Session 7, 8.
- **Acceptance Criteria:**
  - Doctors document consultation, select diagnosis, and write multi-drug prescriptions.
  - Printable prescription layout renders cleanly on standard A4 / A5 paper.
  - All clinical encounter details commit in a single transactional write.
- **Tests:** Transaction rollback test on invalid prescription lines; EMR query test.
- **Risks:** Lengthy notes causing UI overflow (mitigated by responsive layout).
- **Rollback Approach:** Revert EMR module files.

---

### Session 10: Itemized Billing and Thermal Receipts
- **Objective:** Deliver point-of-sale consultation invoicing, procedure charge lines, payment settlement, and 80mm thermal receipt printing.
- **Files Expected to Change:**
  - `backend/CuraSphere.Domain/Entities/InvoiceItem.cs` *(New)*
  - `backend/CuraSphere.Infrastructure/Services/FinancialService.cs`
  - `backend/CuraSphere.Api/Controllers/FinancialController.cs`
  - `frontend/src/features/billing/pages/BillingPage.tsx`
  - `frontend/src/features/billing/components/ThermalReceiptModal.tsx` *(New)*
- **Dependencies:** Session 9.
- **Acceptance Criteria:**
  - Invoices automatically itemize consultation fees and additional procedures.
  - Cashier records payment and system computes accurate outstanding balances.
  - Thermal receipt prints with clinic header, tax number, items, and barcode.
- **Tests:** Financial ledger arithmetic unit tests; invoice creation integration test.
- **Risks:** Rounding errors (decimal type enforced throughout C# and SQL).
- **Rollback Approach:** Revert financial service changes.

---

### Session 11: Reports, Notifications, and Optional Integrations
- **Objective:** Finalize clinic executive reports, real-time queue audio/visual cues, and optional diagnostic test order slips.
- **Files Expected to Change:**
  - `backend/CuraSphere.Infrastructure/Services/ReportsService.cs`
  - `frontend/src/features/reports/pages/ReportsPage.tsx`
  - `frontend/src/features/notifications/`
- **Dependencies:** Session 10.
- **Acceptance Criteria:**
  - Replace hardcoded report placeholders with live database aggregation queries.
  - Real-time SignalR notifications when patients are called for consultation.
- **Tests:** Reporting query accuracy against known seed data.
- **Risks:** Heavy aggregation queries (mitigated by date range constraints).
- **Rollback Approach:** Git revert.

---

### Session 12: Integration Tests and Regression Testing
- **Objective:** Comprehensive testing of all clinic workflows, end-to-end patient journeys, and full regression verification of existing Hospital Edition modules.
- **Files Expected to Change:**
  - `backend/tests/CuraSphere.UnitTests/`
  - `backend/tests/CuraSphere.IntegrationTests/`
  - `frontend/src/__tests__/`
  - `frontend/e2e/patient-journey.spec.ts`
- **Dependencies:** Sessions 3–11.
- **Acceptance Criteria:**
  - 100% pass rate across backend and frontend unit test suites.
  - Zero regression in Hospital Edition modules (IPD, Emergency, Surgery, ICU).
- **Tests:** Vitest suite, Playwright e2e run, .NET test execution.
- **Risks:** Flaky e2e tests (mitigated by deterministic test selectors).
- **Rollback Approach:** Fix detected defects before deployment.

---

### Session 13: Vercel Preview and Backend Deployment Validation
- **Objective:** Configure production environment variables, execute isolated database migrations, deploy API container to hosting, and publish Vercel preview deployment.
- **Files Expected to Change:**
  - `frontend/vercel.json`
  - Deployment configuration & environment variables in Vercel and container host.
- **Dependencies:** Session 12.
- **Acceptance Criteria:**
  - Vercel preview deploys without build errors.
  - SPA deep-link routing succeeds on Vercel edge.
  - Cross-origin requests from Vercel to backend succeed without CORS errors.
- **Tests:** Live smoke test on deployed preview URL.
- **Risks:** CORS misconfiguration (pre-tested in staging).
- **Rollback Approach:** Redeploy previous Vercel deployment instant rollback.

---

### Session 14: Release-Readiness Verification
- **Objective:** Final operational audit, security pen-test review, documentation synchronization, and release sign-off.
- **Files Expected to Change:**
  - `docs/`
  - `README.md`
- **Dependencies:** Session 13.
- **Acceptance Criteria:**
  - Full system operational sign-off.
  - Zero critical or high vulnerabilities.
  - Documentation aligned with actual delivered implementation.
- **Tests:** Final release verification checklist.
- **Risks:** None.
- **Rollback Approach:** N/A.
