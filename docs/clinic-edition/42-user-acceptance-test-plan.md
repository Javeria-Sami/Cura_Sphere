# CuraSphere Clinic Edition: User Acceptance Test (UAT) Plan

**Document ID:** `DOC-CE-042`  
**Session:** 29  
**Version:** 1.0.0  
**Date:** 2026-10-18  
**Author:** Senior Business Analyst, Healthcare Workflow Consultant, QA Lead, Product Owner, UAT Coordinator  
**Scope:** CuraSphere Clinic Edition Outpatient Medical Center Workflows  
**Evaluation Status:** Approved UAT Specification  

---

## 1. Purpose and Scope

The purpose of this User Acceptance Test (UAT) Plan is to establish a rigorous, standardized, and business-focused verification framework for the **CuraSphere Clinic Edition**. 

UAT evaluates whether authorized healthcare personnel (Practice Managers, Front Desk Receptionists, Doctors/Clinicians, Clinical Nurses, and Cashiers/Billing Clerks) can execute daily outpatient medical center operations accurately, safely, and efficiently.

### 1.1 In-Scope Workflows
1. **Patient Registration & Intake:** Walk-in registration, demographic capture, contact verification, medical record number (MRN) generation, duplicate patient checks, and patient directory search.
2. **Appointments & Scheduling:** Slot booking, doctor schedule/availability filtering, multi-status transitions (`Scheduled` -> `Confirmed` -> `Completed` / `Cancelled`), and queue handoff.
3. **Reception & Queue Management:** Walk-in OPD token issuance, live waiting queue management, patient calling, and no-show handling.
4. **Clinical Consultation & EMR:** Longitudinal medical records, clinical vital signs entry, structured SOAP notes (Subjective, Objective, Assessment, Plan), ICD-10 diagnosis recording, and finalized record sealing.
5. **Electronic Prescriptions & Clinical Decision Support (CDSS):** Prescription authoring, medication dosage/frequency instructions, and automated real-time drug-drug interaction alerts (e.g., Warfarin + Aspirin severe bleeding hazard).
6. **Billing & Cashier Payments:** Consultation and procedure invoice generation, itemized charges, multi-method payment receipting (Cash, Card, Bank Transfer), balance settlement, and overpayment prevention.
7. **Executive Dashboard & BI Reporting:** Clinic operational KPIs, daily appointment throughput, revenue collection summaries, and doctor consultation workload analysis.
8. **Role-Based Access Control (RBAC):** Verification that users only perform actions permitted by their operational persona (least-privilege model).
9. **Usability, Responsiveness & Accessibility:** Keyboard navigation, legible typography, mobile layout adaptation, clear validation messages, and accessible contrast.

### 1.2 Out-of-Scope Capabilities
- **Hospital Edition Inpatient Modules:** Inpatient wards (`ipd`), emergency trauma resuscitation (`emergency`), surgical suites (`surgery`), and intensive care units (`icu`).
- **Enterprise Multi-Tenant SaaS Subscriptions:** Multi-clinic tenant isolation and billing engine (deferred to Enterprise Edition).
- **Physical Thermal Receipt Printing:** Physical ESC/POS 80mm hardware feed (requires on-site physical hardware).
- **Live Real-Time WebSockets Push:** SignalR notification chime wire-up (currently operates via polling/request-response).

---

## 2. Environment and Prerequisites

### 2.1 Test Environment Topology
- **Host System:** Windows 11 Enterprise (x64) isolated development and test execution environment.
- **Frontend Stack:** React 18, TypeScript 5, Vite 5.4, Zustand state management, Axios client.
- **Backend API Stack:** ASP.NET Core 8 Web API, Entity Framework Core 8, Npgsql provider.
- **Persistence:** Local PostgreSQL relational schema with seed test fixtures.
- **Execution Mode:** Technical simulation via headless automated test harnesses (`vitest`), developer workflow simulations, and mocked API contracts.
- **Production Isolation:** Zero live production traffic, zero connection to external hospital networks, and absolute segregation from live clinical systems.

### 2.2 Operational Limitation Notice
Because external cloud staging hosting (Render / AWS ECS) and physical clinic hardware (thermal receipt printers, barcode scanners) remain pending external client procurement, all UAT scenarios are executed through rigorous **Technical UAT Simulations** using headless integration suites and isolated synthetic accounts. In accordance with strict professional ethics:
> **Business Acceptance is formally classified as `PENDING STAKEHOLDER SIGN-OFF` until clinic representatives execute hands-on verification on deployed staging infrastructure.**

---

## 3. Synthetic Test Dataset & Data Privacy Protocols

To comply with HIPAA, GDPR, and medical software safety guidelines, **no real patient data or protected health information (PHI) shall ever be utilized**.

### 3.1 Synthetic Patient Personas
| Patient ID | Synthetic Name | Gender | Age / DOB | MRN | Phone | Primary Condition |
|:---|:---|:---|:---|:---|:---|:---|
| `PAT-UAT-01` | Tariq Mahmood | Male | 48 (1978-04-12) | `MRN-90101` | `+92-300-1112233` | Type 2 Diabetes, Hypertension |
| `PAT-UAT-02` | Zainab Bibi | Female | 34 (1992-08-25) | `MRN-90102` | `+92-301-2223344` | Acute Bronchitis, Asthmatic |
| `PAT-UAT-03` | Bilal Ahmed | Male | 12 (2014-01-15) | `MRN-90103` | `+92-302-3334455` | Pediatric Viral Pharyngitis |
| `PAT-UAT-04` | Ayesha Khan | Female | 62 (1964-11-03) | `MRN-90104` | `+92-303-4445566` | Deep Vein Thrombosis, Osteoarthritis |
| `PAT-UAT-05` | Hamza Farooq | Male | 29 (1997-06-19) | `MRN-90105` | `+92-304-5556677` | Routine Pre-Employment Screening |

### 3.2 Synthetic Doctor Personas
| Doctor ID | Name | Specialty | Consultation Fee | Available Working Days | Slot Duration |
|:---|:---|:---|:---|:---|:---|
| `DOC-UAT-01` | Dr. Sarah Jenkins | General Physician | $50.00 / Rs 2,500 | Mon, Wed, Fri (09:00 - 15:00) | 15 mins |
| `DOC-UAT-02` | Dr. Farhan Ali | Cardiologist | $80.00 / Rs 4,000 | Tue, Thu, Sat (10:00 - 16:00) | 20 mins |
| `DOC-UAT-03` | Dr. Maria Santos | Pediatrician | $60.00 / Rs 3,000 | Mon, Tue, Thu (12:00 - 18:00) | 15 mins |

---

## 4. User Roles and Stakeholder Perspectives

| Role / Persona | Operational Scope | Permitted UAT Scenarios | Restricted Scenarios |
|:---|:---|:---|:---|
| **Clinic Administrator** | Practice oversight, master configuration, financial analytics, user accounts | System configuration, fee adjustments, view all reports, full audit logs | Direct medical diagnosis / prescription authoring |
| **Receptionist** | Front desk, patient intake, appointments, token queue management | Register patient, book/reschedule appointments, issue queue token | Clinical note editing, medical diagnosis, modifying clinical records |
| **Doctor / Clinician** | Patient consultations, clinical assessment, prescriptions, EMR review | View appointment queue, record vitals/SOAP, diagnose ICD-10, prescribe drugs with CDSS | Altering billing invoices, administrative system settings |
| **Nurse / Assistant** | Pre-consultation triage, initial vital signs recording | Patient search, record triage vitals (BP, HR, Temp, Weight), view queue | Prescribing drugs, altering invoice payments |
| **Cashier / Billing Staff**| Invoicing, cashiering, balance collection, receipt printing | Generate consultation invoices, record payments, print receipts, view daily collections | Accessing confidential EMR notes, prescribing medications |

---

## 5. Entry and Exit Criteria

### 5.1 Entry Criteria
- [x] Codebase is on clean Git branch `feature/clinic-edition` synchronized with `main`.
- [x] Baseline automated test suite passing (160 frontend tests across 18 Vitest suites, 40 backend domain tests).
- [x] Production asset build (`tsc -b && vite build`) executes cleanly with 0 TypeScript and 0 ESLint errors.
- [x] Security baseline verified (256-bit cryptographic JWT authentication, RBAC authorization handlers, RFC 7231 Problem Details).
- [x] Performance profiling verified (`DOC-CE-040` & `DOC-CE-041`) with 300ms search debouncing and indexed database queries.
- [x] Synthetic test dataset prepared and isolated from live systems.

### 5.2 Exit Criteria
- [ ] 100% of defined UAT test cases executed and documented in `DOC-CE-043`.
- [ ] Zero unmitigated **P0 (Critical)** or **P1 (High)** defects remaining in the UAT Defect Register (`DOC-CE-044`).
- [ ] Any discovered **P2 (Medium)** or **P3 (Low)** defects documented with clear operational workarounds.
- [ ] Technical acceptance signed off by QA Lead and Software Architect.
- [ ] Comprehensive UAT Sign-Off Report published (`DOC-CE-045`) with clear next steps for external stakeholder onboarding.

---

## 6. Defect Severity Classifications

| Severity | Definition | Operational Impact | Resolution Timeline |
|:---|:---|:---|:---|
| **P0 — Critical** | Total system crash, severe data corruption, clinical safety hazard, or unauthenticated security breach. | System cannot be operated; immediate blocker to all UAT activities. | Immediate fix required prior to continuing UAT. |
| **P1 — High** | Major workflow failure with no viable workaround (e.g., cannot save prescriptions, invoices calculate incorrect totals). | Primary clinical or financial workflow obstructed. | Fix required prior to release readiness approval. |
| **P2 — Medium** | Important functional or usability defect that has a reasonable manual workaround (e.g., search filter lag, UI alignment flaw). | Operational inconvenience; workflow can still be completed. | Scheduled for near-term maintenance patch. |
| **P3 — Low** | Minor cosmetic, phrasing, or convenience issue (e.g., button margin, minor typography discrepancy). | Cosmetic only; zero impact on clinical or financial integrity. | Backlog for future continuous improvement. |

---

## 7. Test Execution Procedure & Evidence Rules

1. **Step-by-Step Execution:** Testers execute each scenario strictly according to the documented test cases.
2. **Double Verification:** For every data-modifying action (e.g. creating patient, updating appointment, recording payment), verify persistence after page reload.
3. **Immutability Checks:** For sealed records (finalized EMR notes, paid invoices, terminal appointments), verify that edit/tamper attempts are rejected with appropriate error codes (HTTP 409 Conflict or HTTP 400 Bad Request).
4. **Evidence Logging:** All execution outcomes must reference automated test runs, terminal logs, or simulated response assertions.
