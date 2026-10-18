# CuraSphere Clinic Edition: Controlled Staging Validation Plan

**Document ID:** `DOC-CE-049`  
**Session:** 32  
**Version:** 1.0.0  
**Date:** 2026-10-18  
**Author / Lead:** Senior Software Architect, Full-Stack Engineer, QA Automation Engineer, Application Security Engineer, Release Manager  
**Scope:** Controlled Staging Validation Protocol for CuraSphere Clinic Edition  
**Target Release Artifact:** `v1.0.0-clinic`  

---

## 1. Objectives & Principles

The objective of this Controlled Staging Validation Plan is to define a secure, repeatable, and non-destructive protocol for verifying the **CuraSphere Clinic Edition** in a staging environment prior to live clinical operations.

### Core Operating Principles:
1. **Absolute Segregation from Production:** Testing shall strictly target designated staging endpoints and databases. Under no circumstances shall staging configurations connect to production databases or services.
2. **Synthetic Data Exclusivity:** Zero real patient records or protected health information (PHI) shall be used. All test records are synthetic and identifiable by artificial naming and prefixes (`STG-PAT-xxxxx`).
3. **Financial Safety Isolation:** No real monetary transactions, credit card charges, or actual electronic payment gateway settlements shall be initiated. Cashier workflows shall operate strictly on simulated local transaction ledgers.
4. **Preservation of Hospital Edition:** Shared components and database models must remain backward-compatible with Hospital Edition modules (`ipd`, `emergency`, `surgery`, `icu`).
5. **No Production Deployment:** Production deployment remains strictly prohibited without separate, explicit written authorization from the project owner.

---

## 2. Environment Prerequisites & Safety Verification

### 2.1 Staging Environment Topology
| Component | Staging Specification | Safety Verification Standard |
|:---|:---|:---|
| **Frontend SPA** | React 18, TypeScript, Vite | Deployed to staging domain (e.g., `staging-clinic.curasphere.com` or local container port 80); `VITE_API_URL` points exclusively to staging API. |
| **Backend REST API** | ASP.NET Core 8 Web API | Hosted in staging container; `ASPNETCORE_ENVIRONMENT=Staging`; Problem Details exception masking active; CORS restricted to staging domains. |
| **Database Instance** | PostgreSQL 16 (Managed Staging) | Dedicated database `curasphere_staging_db` isolated from production host; SSL Mode=Require. |
| **Secrets & Keys** | Staging JWT & Passwords | 256-bit cryptographically random staging key (`replace_with_a_secure_staging_signing_key_at_least_32_characters_long!`), strictly distinct from production. |
| **External Services** | Email / SMS / Payments | Sandbox / mock mode only; disabled or rerouted to developer sinkholes to prevent contacting real individuals. |

### 2.2 Safety Checklist Before Staging Execution
- [ ] Confirm database connection string targets `curasphere_staging_db` and NOT any production instance.
- [ ] Verify `ASPNETCORE_ENVIRONMENT` is set to `Staging`.
- [ ] Verify no live email, SMS, or third-party payment gateway keys are present in staging environment files.
- [ ] Verify automated backup script (`scripts/backup-curasphere.sh`) can capture point-in-time snapshot before running data-modifying validation.
- [ ] Ensure synthetic test records use distinct prefixes (`MRN-STG-`, `INV-STG-`, `PAY-STG-`).

---

## 3. Test Personas & Role Permissions

| Persona / Role | Staging Test Account | Permitted Workflows | Restricted Actions (Tested for 403 Forbidden) |
|:---|:---|:---|:---|
| **Clinic Administrator** | `admin.stg@curasphere.local` | Practice configuration, doctor schedules, fee structures, all financial and clinical reports | Medical diagnosis without clinician credentials |
| **Receptionist** | `reception.stg@curasphere.local` | Patient intake, appointment booking/rescheduling, OPD walk-in queue tokens | Clinical SOAP notes, diagnosis entry, prescription authoring |
| **Doctor / Clinician** | `doctor.stg@curasphere.local` | View assigned queue, vital signs entry, SOAP encounters, ICD-10 diagnosis, electronic prescriptions with CDSS | Cashier payment collection, fee adjustments, system administration |
| **Nurse / Assistant** | `nurse.stg@curasphere.local` | Patient directory search, pre-consultation triage vitals (BP, HR, Temp, Weight), view queue | Prescribing drugs, finalizing diagnoses, recording payments |
| **Cashier / Billing Staff**| `cashier.stg@curasphere.local`| Itemized invoice generation, cashier payment collection (Cash, Card, Transfer), receipt printing | Accessing private EMR doctor notes, prescribing medications |

---

## 4. Synthetic Test Dataset

All staging tests shall utilize this standardized synthetic cohort:

### 4.1 Synthetic Patient Records
| Patient Identifier | Full Name | Gender | DOB | Phone Number | CNIC / National ID | Planned Clinical Condition |
|:---|:---|:---|:---|:---|:---|:---|
| `PAT-STG-01` | Rashid Mansoor | Male | 1982-05-14 | `+92 300 5551122` | `42201-5551122-1` | Essential Hypertension |
| `PAT-STG-02` | Hina Pervez | Female | 1995-11-20 | `+92 301 6662233` | `42201-6662233-2` | Acute Allergic Rhinitis |
| `PAT-STG-03` | Daniyal Qureshi | Male | 2016-03-08 | `+92 302 7773344` | `42201-7773344-3` | Pediatric Otitis Media |

### 4.2 Synthetic Clinician Profiles
| Doctor Identifier | Clinician Name | Specialty | Consultation Fee | Available Working Days | Slot Length |
|:---|:---|:---|:---|:---|:---|
| `DOC-STG-01` | Dr. Amna Tariq | Consultant Cardiologist | $80.00 / Rs 4,000 | Mon, Wed, Fri (09:00 - 14:00) | 20 mins |
| `DOC-STG-02` | Dr. Usman Khalid | General Physician | $50.00 / Rs 2,500 | Mon through Sat (10:00 - 16:00) | 15 mins |

---

## 5. Critical Clinic Workflow Validation Scenarios

### Workflow A: Authentication & Permissions
1. **A-1 (Login & JWT Issuance):** Authenticate with valid staging credentials. Verify JWT returned contains valid HMAC-SHA256 signature, expiry, and role claims.
2. **A-2 (Protected Route Guards):** Attempt to access `/clinic/dashboard`, `/clinic/patients`, `/clinic/billing` without `Authorization` header. Verify rejection with `HTTP 401 Unauthorized`.
3. **A-3 (Least-Privilege Enforcement):** Authenticate as Receptionist; attempt `POST /api/emr/encounters` and `POST /api/billing/invoices/{id}/payments`. Verify rejection with `HTTP 403 Forbidden`.
4. **A-4 (Account Lockout Protection):** Submit 5 consecutive incorrect passwords for test account. Verify account transitions to locked state for 15 minutes.
5. **A-5 (Session Logout):** Trigger logout action. Verify client token cleared and subsequent API calls blocked.

### Workflow B: Patient Registration & Search
1. **B-1 (Demographic Intake):** Register synthetic patient `PAT-STG-01`. Verify mandatory fields (name, phone, gender, DOB) validated; verify unique `MRN-YYYY-xxxxx` generated.
2. **B-2 (Input Validation Badges):** Submit incomplete patient form (missing name, invalid phone, future DOB). Verify submission blocked with inline validation errors.
3. **B-3 (Duplicate Detection):** Submit registration with phone number identical to existing patient `PAT-STG-01`. Verify duplicate detection flag raised.
4. **B-4 (Debounced Search):** Type "Rashid" rapidly in patient directory. Verify search input debounces by 300ms, sending exactly 1 filtered request.

### Workflow C: Appointments & Reception Queue
1. **C-1 (Slot Booking):** Schedule appointment for `PAT-STG-01` with `DOC-STG-02` on valid date/time. Verify appointment created with status `Scheduled`.
2. **C-2 (Double-Booking Guard):** Attempt to book another patient for the same doctor at the identical time slot. Verify system rejects booking with scheduling conflict error.
3. **C-3 (Status Progression & Terminal Lock):** Progress appointment: `Scheduled` -> `Confirmed` -> `Completed`. Attempt to cancel completed appointment; verify rejection.
4. **C-4 (Walk-in OPD Token):** Issue walk-in queue token for `PAT-STG-02`. Verify sequential daily token number assigned (e.g., `T-021`) and added to doctor waiting board.

### Workflow D: Consultation & Longitudinal EMR
1. **D-1 (Pre-Consultation Vitals):** Nurse enters triage vitals (BP 125/80, HR 72, Temp 98.4, SpO2 99%). Verify saved to encounter record.
2. **D-2 (Doctor SOAP Encounter):** Clinician records structured SOAP notes (Subjective, Objective, Assessment, Plan); tags ICD-10 diagnosis `I10`. Verify saved to patient EMR history.
3. **D-3 (Sealed Encounter Immutability):** Finalize encounter. Attempt to modify clinical notes or vitals; verify system rejects with `HTTP 409 Conflict: Cannot modify sealed medical encounter`.

### Workflow E: Electronic Prescriptions & CDSS Drug Safety
1. **E-1 (Safe Prescription Creation):** Clinician prescribes Amoxicillin 500mg TID for 7 days + Paracetamol PRN. Verify saved with doctor signature metadata; zero CDSS alerts.
2. **E-2 (CDSS Hazard Detection):** Clinician prescribes concurrent `Warfarin` + `Aspirin`. Verify CDSS rule engine triggers critical alert banner: *"CRITICAL HAZARD: Concurrent Warfarin + Aspirin significantly increases risk of major gastrointestinal hemorrhage"*.

### Workflow F: Billing, Cashier Settlements & 80mm Printing
1. **F-1 (Itemized Invoicing):** Generate consultation invoice ($50 consultation + $20 diagnostic test). Verify subtotal and total calculated accurately ($70.00).
2. **F-2 (Cash Payment Settlement):** Cashier collects $70.00 cash payment. Verify balance reduced to $0.00 and invoice status transitions to `Paid`.
3. **F-3 (Overpayment Guard):** Attempt to record payment of $90.00 on a $70.00 invoice balance. Verify transaction blocked with validation error: *"Payment amount exceeds outstanding invoice balance"*.
4. **F-4 (80mm Thermal Receipt Slip):** Open payment receipt modal. Verify rendered slip adheres to `.thermal-receipt-slip` (80mm width, monospace font, cashier metadata, transaction confirmed badge).

### Workflow G: Executive BI Dashboard & Reporting
1. **G-1 (Metric Parity):** Verify dashboard KPI cards (Total Patients, Today's Appointments, Completed Appointments, Total Collections) match underlying synthetic records.
2. **G-2 (Financial Data Masking):** View dashboard as Receptionist. Verify operational metrics visible while financial collection cards are hidden.

### Workflow H: Hospital Edition Regression Protection
1. **H-1 (Module Segregation):** Verify inpatient wards (`ipd`), surgery (`surgery`), and ICU (`icu`) are suppressed from Clinic Edition navigation.
2. **H-2 (API Protection):** Attempt to call `/api/ipd/beds` with Clinic Edition context; verify rejection by `[RequireModule]` filter.
3. **H-3 (Hospital Non-Regression Suite):** Run `edition-navigation.test.ts` verifying all 6 cross-edition tests pass.

---

## 6. Safe Test Setup & Cleanup Protocols

1. **Non-Destructive Execution:** All tests shall execute as additive operations using synthetic IDs. No shared reference lookups (e.g., blood groups, religions, ICD codes) shall be deleted or modified.
2. **Disaster Recovery Validation:** Prior to any mass staging data load, verify backup capability by running `scripts/verify-backup-restore-drill.sh` or `scripts/verify-backup-restore-drill.ps1`.
3. **Post-Validation Reset:** If synthetic test data must be cleared, execute target deletion filtered strictly by `WHERE MedicalRecordNumber LIKE 'MRN-STG-%'`. Never run `TRUNCATE` or `DROP TABLE` on staging schemas.

---

## 7. Entry and Exit Criteria

### 7.1 Entry Criteria
- [x] Codebase is clean on `feature/clinic-edition` and `main` (commit `cc38396`).
- [x] All 181 frontend automated tests passing across 19 Vitest suites.
- [x] All 40 backend domain tests passing in `UnitTestRunner.cs`.
- [x] 0 ESLint errors/warnings; clean production build in 1.05s.
- [x] Staging templates (`.env.staging.example`, `appsettings.Staging.example.json`) available.
- [x] Automated disaster recovery drill scripts (`scripts/verify-backup-restore-drill.ps1`) ready.

### 7.2 Exit Criteria
- [ ] Staging environment availability verified (or documented as unprovisioned).
- [ ] All 8 critical workflows evaluated against documented test cases.
- [ ] No unmitigated P0 (Critical) or P1 (High) defects within tested scope.
- [ ] Controlled Staging Validation Report (`DOC-CE-050`) published with honest classification.
