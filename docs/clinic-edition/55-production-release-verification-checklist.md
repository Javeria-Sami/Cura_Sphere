# CuraSphere Clinic Edition: Production Release Verification Checklist

**Document ID:** `DOC-CE-055`  
**Session:** 34  
**Version:** 1.0.0  
**Date:** 2026-10-18  
**Auditing & Release Panel:** Senior Release Engineer, Software Architect, .NET Deployment Engineer, React/Vite Deployment Engineer, Database Reliability Engineer, Application Security Engineer, QA Lead  
**Scope:** Post-Deployment Operational Verification Protocol, Smoke Testing Matrix & Production Sign-Off Gate  
**Target Release Artifact:** `v1.0.0-clinic` (Commit: `581ba4f`)  
**Operational Status:** **`STANDBY — PENDING CLOUD INFRASTRUCTURE PROVISIONING & PRODUCTION DEPLOYMENT`**  

---

> [!IMPORTANT]
> **SYNTHETIC TEST DATA MANDATE**  
> All post-deployment verification checks must use strictly synthetic, non-clinical test records (`PAT-PROD-VERIFY`). Never enter real patient names, national identity numbers, actual telephone numbers, or genuine clinical diagnoses into verification runs.

---

## 1. Required Verification Roles & Test Accounts

Post-deployment verification requires the following role-based test accounts configured in the authentication store:

| Role Name | Test Account Identifier | Required Permissions | Scope of Verification |
|:---|:---|:---|:---|
| **System Administrator** | `admin.verify@clinic.curasphere.com` | `System.Admin`, `Users.Manage`, `Audit.View` | System configuration, health inspection, user management |
| **Practice Manager** | `manager.verify@clinic.curasphere.com` | `Reports.View`, `Billing.View`, `Appointments.Manage` | Clinic dashboard, financial summaries, schedule oversight |
| **Clinic Doctor** | `doctor.verify@clinic.curasphere.com` | `Clinical.Write`, `Prescriptions.Write`, `Patients.View` | Consultation notes, SOAP narratives, CDSS prescriptions |
| **Clinic Nurse** | `nurse.verify@clinic.curasphere.com` | `Triage.Write`, `Queue.Manage`, `Patients.View` | Vitals intake, triage categorization, queue call |
| **Receptionist** | `reception.verify@clinic.curasphere.com` | `Patients.Write`, `Appointments.Write`, `Queue.Manage` | Patient registration, debounced search, walk-in tokens |
| **Cashier** | `cashier.verify@clinic.curasphere.com` | `Billing.Write`, `Payments.Process`, `Invoices.View` | Outpatient invoicing, settlement, 80mm thermal receipts |

---

## 2. Post-Deployment Verification Steps

Execute these steps in strict chronological order once the deployment operator confirms the hosting containers and frontend assets have been deployed:

### Stage 1: Infrastructure & Network Connectivity
- [ ] **1.1. HTTPS & TLS Certificate:** Verify `https://clinic.curasphere.com` loads over valid TLS/SSL (HTTP strictly redirects to HTTPS; zero mixed-content warnings in console).
- [ ] **1.2. SPA Routing Integrity:** Directly refresh deep URLs (e.g., `/patients`, `/appointments`, `/billing`) to confirm Vercel rewrites to `/index.html` without HTTP 404.
- [ ] **1.3. API Health Probes:** Execute curl against backend health endpoints:
  ```bash
  # Liveness probe (must return HTTP 200 OK):
  curl -s -i https://api.curasphere.com/health/live
  # Readiness probe (must return HTTP 200 OK with PostgreSQL connection pool healthy):
  curl -s -i https://api.curasphere.com/health/ready
  ```
- [ ] **1.4. CORS Enforcement:** Confirm that browser cross-origin requests from `https://clinic.curasphere.com` receive header `Access-Control-Allow-Origin: https://clinic.curasphere.com` and arbitrary origins are rejected.

---

### Stage 2: Authentication, Authorization & Session Security
- [ ] **2.1. Admin Sign-In:** Sign in as `admin.verify@clinic.curasphere.com`. Confirm cryptographic JWT is issued and stored in memory.
- [ ] **2.2. Cross-Role Privilege Restriction:** Sign in as `reception.verify`. Attempt to navigate to `/emr` or access clinical diagnosis endpoints; confirm server returns HTTP 403 Forbidden.
- [ ] **2.3. Account Lockout Verification:** Submit 5 consecutive incorrect passwords for a test account; verify that the 5th attempt triggers a 15-minute account lock.
- [ ] **2.4. Exception Masking:** Trigger an intentional client-side validation error; confirm API returns RFC 7231 Problem Details JSON with zero SQL syntax or stack traces leaked.

---

### Stage 3: End-to-End Clinic Workflow Smoke Testing

Use synthetic persona:
- **Full Name:** `Zaid Synthetic Verifier`
- **Phone:** `+1-555-0199`
- **DOB:** `1985-05-15`
- **Gender:** `Male`

- [ ] **3.1. Patient Registration:** Register `Zaid Synthetic Verifier`. Confirm deterministic MRN format (`MRN-YYYY-xxxxx`) is generated.
- [ ] **3.2. Debounced Search:** In the global patient search bar, type `Zaid`. Confirm request triggers only after 300ms pause and returns the record within 200ms.
- [ ] **3.3. Appointment Scheduling:** Book a consultation slot with Doctor `DOC-01`. Confirm appointment status is `Scheduled`.
- [ ] **3.4. Double-Booking Guard:** Attempt to book a second patient into the exact same doctor slot; confirm application blocks the request with a conflict alert.
- [ ] **3.5. Queue Token Issuance:** Transition appointment to `Checked-In`; confirm sequential daily queue token (e.g., `T-001`) is assigned.
- [ ] **3.6. Clinical Encounter & Triage:** Sign in as `nurse.verify`. Enter triage vitals (BP: 120/80, Pulse: 72, Temp: 98.6°F, SpO2: 98%). Confirm vitals persist.
- [ ] **3.7. SOAP Narrative & CDSS Safety:** Sign in as `doctor.verify`. Record SOAP narrative and prescribe medication. Test drug-interaction safety by adding conflicting medication; verify hazard banner displays.
- [ ] **3.8. Encounter Sealing:** Finalize clinical encounter. Attempt to edit the note; confirm encounter is permanently locked (HTTP 409 Conflict).
- [ ] **3.9. Outpatient Invoicing:** Generate invoice for the encounter ($50.00). Confirm line-item math and total calculate accurately.
- [ ] **3.10. Cashier Payment Settlement:** Process synthetic payment of $50.00. Confirm balance updates to $0.00 atomically. Rapidly click submit; confirm payment idempotency prevents double charging.
- [ ] **3.11. 80mm ESC/POS Thermal Receipt:** Click "Print Receipt". Verify print preview conforms to 80mm POS slip dimensions without page margin overflow.
- [ ] **3.12. Synthetic Data Cleanup:** Soft-delete or mark synthetic record as `Status: Archived/Test` to prevent corrupting practice financial metrics.

---

### Stage 4: Hospital Edition Regression Protection
- [ ] **4.1. Navigation Segregation:** Verify that the navigation sidebar in Clinic Edition displays only outpatient modules and completely excludes `Inpatient (IPD)`, `Emergency`, `Operation Theaters (OT)`, and `ICU`.
- [ ] **4.2. API Route Protection:** Attempt direct API request to `/api/ipd/admissions`; confirm backend `[RequireModule("Hospital")]` filter rejects request with HTTP 403 Forbidden.

---

## 3. Post-Deployment Monitoring & Telemetry (First 2 Hours)

The DevOps engineer and Application Security Lead must monitor application metrics for 120 minutes post-release:

| Telemetry Dimension | Normal Operational Level | Warning Level | Critical Rollback Threshold | Actual Observed Level |
|:---|:---|:---|:---|:---:|
| **API Error Rate (HTTP 5xx)** | < 0.05% of requests | 0.20% | **> 0.50% (HALT & ROLLBACK)** | `PENDING DEPLOYMENT` |
| **API Response Latency (p95)** | < 250ms | 500ms | **> 1500ms (INVESTIGATE)** | `PENDING DEPLOYMENT` |
| **Database Connection Pool** | < 20% active connections | > 60% | **Active Pool Exhaustion** | `PENDING DEPLOYMENT` |
| **Client Exceptions (Sentry/Logs)** | 0 per minute | > 2 per min | **> 5 per min (ROLLBACK)** | `PENDING DEPLOYMENT` |
| **Readiness Health Probe** | HTTP 200 OK | Transient drop | **2 Consecutive Non-200s** | `PENDING DEPLOYMENT` |

---

## 4. Stop Conditions & Emergency Escalation

If any of the following conditions occur during post-deployment verification:
1. **Critical Stop 1:** API readiness probe (`/health/ready`) fails to return HTTP 200 within 60 seconds of container launch.
2. **Critical Stop 2:** Relational database data corruption or unhandled migration failure occurs.
3. **Critical Stop 3:** HTTP 5xx error rate exceeds 0.50% over any 5-minute sampling window.
4. **Critical Stop 4:** Patient authorization fails, allowing cross-role record access.

**IMMEDIATE ACTION:**
- Halt incoming traffic via reverse proxy maintenance mode.
- Initiate instant frontend rollback via `vercel rollback <PREVIOUS_ID>`.
- Redeploy previous backend container image tag.
- Follow database recovery procedure documented in `DOC-CE-052` Section 6.

---

## 5. Final Operational Sign-Off Fields

This verification checklist must be countersigned upon completion of all Stage 1–4 checks and 2 hours of stable monitoring:

| Role | Nominated Representative | Verification Signature | Date & Timestamp |
|:---|:---|:---:|:---:|
| **Lead Release Engineer** | Senior DevOps / Release Engineer | ___________________________ | _____ / _____ / 2026 |
| **Database Reliability Engineer** | SRE / Database Engineer | ___________________________ | _____ / _____ / 2026 |
| **Application Security Engineer** | Security Auditor | ___________________________ | _____ / _____ / 2026 |
| **QA Automation Lead** | Quality Assurance Lead | ___________________________ | _____ / _____ / 2026 |
| **Clinic Practice Manager** | Clinical Operations Lead | ___________________________ | _____ / _____ / 2026 |
| **Lead Physician** | Medical Director | ___________________________ | _____ / _____ / 2026 |
| **Overall Release Manager** | Final Release Authority | ___________________________ | _____ / _____ / 2026 |
