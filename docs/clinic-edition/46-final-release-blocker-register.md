# CuraSphere Clinic Edition: Final Release Blocker Register

**Document ID:** `DOC-CE-046`  
**Session:** 30  
**Version:** 1.0.0  
**Date:** 2026-10-18  
**Release Manager & Lead Auditor:** Principal Software Architect, Release Manager, Security Auditor, QA Lead  
**Scope:** Consolidated Final Release Gating & Blocker Tracking  
**Target Release Artifact:** `v1.0.0-clinic`  

---

## 1. Blocker Severity Definitions & Gating Boundaries

Blockers are classified by severity and their impact on staging vs. production deployment:

- **P0 — Critical Blocker:** Severe security vulnerability, patient data corruption, core workflow failure, or unprovisioned primary production infrastructure. **Strictly blocks live production deployment.**
- **P1 — High Blocker:** Major operational, compliance, hardware, or stakeholder dependency required before live patient traffic cutover. **Blocks production cutover; does not block staging verification.**
- **P2 — Medium Issue:** Usability defect or non-critical operational capability with an approved, documented workaround. **Permitted for staging and controlled production release.**
- **P3 — Low Issue / Backlog:** Minor visual enhancement or future scalability optimization. **Does not block release.**

---

## 2. Consolidated Release Blocker Register

| Blocker ID | Severity | Affected Module | Title / Summary | Blocks Staging | Blocks Production | Responsible Role | Current Status |
|:---:|:---:|:---|:---|:---:|:---:|:---|:---:|
| **BLK-REL-01** | **P0** | Infrastructure | Managed Cloud PostgreSQL 16 & Container Cluster Hosting Unprovisioned | **NO** | **YES** | Project Owner / Cloud Infra Lead | `OPEN (EXTERNAL DEPENDENCY)` |
| **BLK-REL-02** | **P1** | UAT & Governance | Formal Hands-On Clinic Stakeholder Sign-Off Pending Cloud Staging Cutover | **NO** | **YES** | Clinic Practice Manager / Clinical Lead | `PENDING STAGING CUTOVER` |
| **BLK-REL-03** | **P1** | Cashier / Hardware | Physical 80mm ESC/POS Thermal Receipt Printer On-Site Alignment Unverified | **NO** | **YES** | Clinic Operations Lead / IT Tech | `DOCUMENTED (HARDWARE FALLBACK ACTIVE)` |
| **BLK-REL-04** | **P1** | Database / SRE | Remote Cloud Staging Database Backup & Restoration Drill (`pg_dump`/`pg_restore`) | **NO** | **YES** | Database Reliability Engineer | `PENDING CLOUD DB PROVISIONING` |
| **BLK-REL-05** | **P2** | Queue / Reception | Real-Time SignalR Notification Audio Chime Unwired in React Client | **NO** | **NO** | Frontend Engineer | `RESOLVED VIA POLLING WORKAROUND` |
| **BLK-REL-06** | **P2** | Billing / Finance | Clinic Operating Expense / Petty Cash Ledger Excluded from MVP Scope | **NO** | **NO** | Product Owner / Architect | `DOCUMENTED (ROADMAP CLINIC v1.1)` |
| **BLK-REL-07** | **P3** | Database / Perf | PostgreSQL Substring Search Lacks GIN Trigram (`pg_trgm`) Index | **NO** | **NO** | Database Specialist | `DOCUMENTED (ROADMAP CLINIC v1.2)` |

---

## 3. Detailed Blocker Analysis

### Blocker 1: Managed Cloud Infrastructure Provisioning
- **Blocker ID:** `BLK-REL-01`
- **Severity:** `P0 — Critical Infrastructure Prerequisite`
- **Affected Module:** Staging & Production Cloud Deployment
- **Description:** Managed cloud PostgreSQL 16 database (`curasphere_prod_db`) and ASP.NET Core 8 container cluster (Render / AWS ECS / Azure App Service) have not yet been provisioned by the project owner.
- **Evidence:** `docs/clinic-edition/16-deployment-and-release-guide.md`, `docs/clinic-edition/26-staging-defect-register.md` (`DEF-STG-04`), `docs/clinic-edition/44-uat-defect-register.md` (`DEF-UAT-01`).
- **Impact:** Live external HTTP endpoints (`https://clinic.curasphere.com`) cannot receive remote network traffic until cloud resources are purchased and provisioned.
- **Required Corrective Action:** Infrastructure owner provisions managed PostgreSQL 16 and Linux container cluster; injects production environment secrets (`ConnectionStrings__DefaultConnection`, `Jwt__SecretKey`).
- **Verification Criteria:** `GET /health/ready` returns HTTP 200 OK with PostgreSQL connection pool healthy; frontend SPA resolves on remote staging URL.
- **Blocks Staging:** No (automated simulation and local containerization verified).
- **Blocks Production:** Yes.
- **Responsible Role:** Project Owner / Cloud Infrastructure Lead.
- **Current Status:** `OPEN (EXTERNAL DEPENDENCY)`.

---

### Blocker 2: Formal Hands-On Clinic Stakeholder Sign-Off
- **Blocker ID:** `BLK-REL-02`
- **Severity:** `P1 — High Governance Dependency`
- **Affected Module:** User Acceptance & Medical Governance
- **Description:** While technical UAT simulations achieved a 100% pass rate across 24 test cases (`DOC-CE-043`), formal business sign-off by authorized clinic representatives (Practice Manager, Head Nurse, Lead Physician) remains pending remote staging access.
- **Evidence:** `docs/clinic-edition/45-clinic-edition-uat-sign-off-report.md` (`DOC-CE-045`), Section 14.
- **Impact:** Deploying directly to live patient care without hands-on clinical stakeholder approval violates healthcare quality management protocols.
- **Required Corrective Action:** Conduct a 90-minute structured walkthrough with authorized clinic representatives on live staging URL using test protocol in `DOC-CE-042`.
- **Verification Criteria:** Written and countersigned UAT Acceptance Certificate executed by Clinic Practice Manager and Clinical Director.
- **Blocks Staging:** No.
- **Blocks Production:** Yes.
- **Responsible Role:** Clinic Practice Manager / UAT Coordinator.
- **Current Status:** `PENDING STAGING CUTOVER`.

---

### Blocker 3: Physical Thermal Receipt Printer Alignment On-Site
- **Blocker ID:** `BLK-REL-03`
- **Severity:** `P1 — High Hardware Dependency`
- **Affected Module:** Billing & Cashier Desk
- **Description:** Physical ESC/POS 80mm thermal receipt roll feed, cutter alignment, and cashier drawer kick cannot be tested in virtual or remote developer environments.
- **Evidence:** `docs/clinic-edition/44-uat-defect-register.md` (`DEF-UAT-02`), `frontend/src/features/billing/pages/BillingPage.tsx`.
- **Impact:** Printed receipts on physical thermal paper may experience margin cutoff or feed misalignment during initial physical checkout.
- **Required Corrective Action:** On-site clinic IT coordinator executes physical test print using checklist in `DOC-CE-033`.
- **Verification Criteria:** Physical 80mm receipt prints with clear headers, barcode/MRN readability, itemized totals, and clean roll tear-off.
- **Operational Fallback:** Standard browser print dialog (`window.print`) with `@media print` CSS layout and PDF export is fully verified and available immediately.
- **Blocks Staging:** No.
- **Blocks Production:** Yes (for physical thermal printing only; fallback active).
- **Responsible Role:** Clinic Operations Lead / On-Site IT Support.
- **Current Status:** `DOCUMENTED (HARDWARE FALLBACK ACTIVE)`.

---

### Blocker 4: Remote Cloud Database Backup & Restoration Drill
- **Blocker ID:** `BLK-REL-04`
- **Severity:** `P1 — High Reliability Dependency`
- **Affected Module:** Disaster Recovery & Database Reliability
- **Description:** Automated backup scripts (`backup-curasphere.sh` / `backup-curasphere.ps1`) and documentation exist, but an end-to-end `pg_dump` and `pg_restore` drill must be executed against the newly provisioned remote cloud PostgreSQL database prior to live cutover.
- **Evidence:** `docs/clinic-edition/31-clinic-edition-operational-runbook.md`, Section 4.
- **Impact:** Ensures point-in-time recovery and database restoration are proven against actual cloud network firewalls and storage volumes.
- **Required Corrective Action:** Database Reliability Engineer executes automated backup and restore drill against isolated staging database.
- **Verification Criteria:** `pg_restore` completes with exit code 0; checksum verification validates row count and relational integrity parity.
- **Blocks Staging:** No.
- **Blocks Production:** Yes.
- **Responsible Role:** Database Reliability Engineer.
- **Current Status:** `PENDING CLOUD DB PROVISIONING`.

---

### Blocker 5: Live SignalR Notification Chime
- **Blocker ID:** `BLK-REL-05`
- **Severity:** `P2 — Medium Usability Limitation`
- **Affected Module:** Reception Queue & Doctor Notifications
- **Description:** Real-time WebSocket audio chime for patient calling is not actively wired to an HTML5 audio element in `NotificationsPage.tsx`.
- **Evidence:** `docs/clinic-edition/44-uat-defect-register.md` (`DEF-UAT-03`).
- **Operational Workaround:** Reception queue board updates reliably upon route navigation, user action, and periodic fetch.
- **Blocks Staging:** No.
- **Blocks Production:** No.
- **Responsible Role:** Frontend Engineer (Clinic v1.1).
- **Current Status:** `RESOLVED VIA POLLING WORKAROUND`.

---

### Blocker 6: Outpatient Clinic Operating Expense Ledger
- **Blocker ID:** `BLK-REL-06`
- **Severity:** `P2 — Medium Scope Boundary`
- **Affected Module:** Financial Reports & General Ledger
- **Description:** Outgoing clinic expenses (supplies, utility bills) are not recorded; system tracks 100% of patient revenue billed and collected.
- **Evidence:** `docs/clinic-edition/02-feature-matrix.md`, `docs/clinic-edition/44-uat-defect-register.md` (`DEF-UAT-04`).
- **Operational Workaround:** Clinic practice manages outgoing overhead expenses in external accounting ledger (e.g., QuickBooks); net revenue equals collections.
- **Blocks Staging:** No.
- **Blocks Production:** No.
- **Responsible Role:** Product Owner (Clinic v1.1).
- **Current Status:** `DOCUMENTED (ROADMAP CLINIC v1.1)`.

---

### Blocker 7: PostgreSQL Patient Substring Search Index
- **Blocker ID:** `BLK-REL-07`
- **Severity:** `P3 — Low Scalability Optimization`
- **Affected Module:** Patient Search Performance
- **Description:** Standard B-tree indexes optimize prefix matching; arbitrary substring searches (`ILIKE '%term%'`) on databases exceeding 100k rows require `pg_trgm` GIN index.
- **Evidence:** `docs/clinic-edition/41-performance-optimization-and-verification-report.md`.
- **Operational Workaround:** At current clinic scale (< 10,000 patients), queries execute in ~4ms.
- **Blocks Staging:** No.
- **Blocks Production:** No.
- **Responsible Role:** Database Specialist (Clinic v1.2).
- **Current Status:** `DOCUMENTED (ROADMAP CLINIC v1.2)`.
