# CuraSphere Clinic Edition: Clinical UAT Execution & Sign-Off Plan

**Document ID:** `DOC-CE-067`  
**Session:** 39  
**Version:** 1.0.0  
**Date:** 2026-10-19  
**Author / Governance Lead:** Clinical Systems Lead, Healthcare QA Specialist, Release Manager  
**Scope:** Staging-Based Clinical User Acceptance Testing (UAT) Protocol, Scenario Scripts & Stakeholder Sign-Off Certificate  
**Target Release Artifact:** `v1.0.0-clinic` (Commit: `f89e9a6`)  
**Staging Target URL:** `PENDING CLOUD PROVISIONING (Target: https://staging-clinic.curasphere.com)`  
**Status:** **`ACTIVE CLINICAL ACCEPTANCE PLAN (READY FOR EXECUTION UPON STAGING DEPLOYMENT)`**  

---

## 1. Clinical UAT Purpose & Governance Principles

This document establishes the structured **Clinical User Acceptance Testing (UAT) Plan** for the **CuraSphere Hospital Management System — Clinic Edition**.

In healthcare information systems, clinical adoption, patient safety, diagnostic integrity, and billing accuracy require hands-on validation by practicing medical professionals. While automated technical test suites achieved a 100% pass rate across 195 tests (`DOC-CE-062`), automated tests **cannot substitute for formal clinical acceptance**.

### Non-Negotiable Governance Principles:
1. **Zero Real Patient Data:** All test scenarios must be executed exclusively using the synthetic patient personas defined in Section 3. Real patient health records, national identity numbers, or phone numbers must never be entered into the staging system.
2. **Role-Segregated Testing:** Each participant must log in strictly using their designated role credentials to validate role-based access control (RBAC).
3. **Medical Safety Verification:** Prescribing workflows must actively verify Clinical Decision Support System (CDSS) alerts for drug-drug interactions.
4. **Physical Financial Verification:** Billing settlements must verify exact line-item math and 80mm ESC/POS thermal receipt formatting.

---

## 2. Participating Clinic Roles & Evaluation Panel

The clinical acceptance panel consists of authorized representatives from all primary outpatient clinic operational desks:

| Evaluation Role | Operational Responsibility | Primary Workflows Evaluated | Evaluation Lead / Stakeholder |
|:---|:---|:---|:---|
| **Medical Director / Lead Physician** | Clinical safety governance, EMR notes, ICD diagnostics, prescription validation. | SOAP Encounter Notes, CDSS Alerts, Patient Clinical History. | *To be appointed by Practice Owner* |
| **Clinic Practice Manager** | Overall clinic administration, doctor rosters, fee schedules, executive reports. | System Configuration, Doctor Shifts, Collections & Census Reports. | *To be appointed by Practice Owner* |
| **Head Triage Nurse** | Vital signs intake, waiting queue triage, patient calling. | Vitals Entry, OPD Token Progression, Triage Board. | *To be appointed by Practice Owner* |
| **Receptionist / Front Desk** | Patient demographic intake, appointment booking, walk-in token issuance. | Patient Registration, Search, Appointment Booking, Duplicate Detection. | *To be appointed by Practice Owner* |
| **Cashier / Billing Clerk** | Outpatient billing, discounts, cash/card payment collection, receipt printing. | Invoicing, Payment Settlements, 80mm POS Thermal Receipts. | *To be appointed by Practice Owner* |

---

## 3. Synthetic Test Data Personas

Testers must use the following pre-configured synthetic personas:

### 3.1 Patient Personas
- **Patient 1 (`PAT-STG-01`):** Muhammad Usman | DOB: 1988-04-12 | CNIC: `35201-1234567-1` | Phone: `+92 300 1234567` | Presenting: Essential Hypertension.
- **Patient 2 (`PAT-STG-02`):** Fatima Zahra | DOB: 1995-09-24 | CNIC: `35201-7654321-2` | Phone: `+92 333 9876543` | Presenting: Acute Bronchitis.
- **Patient 3 (`PAT-STG-03`):** Tariq Mahmood | DOB: 1962-11-03 | CNIC: `35201-5554443-3` | Phone: `+92 321 4443322` | Presenting: Atrial Fibrillation (On Warfarin).

### 3.2 Doctor Personas
- **Doctor 1 (`DOC-STG-01`):** Dr. Kamran Ali | Specialty: Consultant General Physician | Shift: Monday–Friday 09:00–14:00.
- **Doctor 2 (`DOC-STG-02`):** Dr. Sarah Khan | Specialty: Consultant Cardiologist | Shift: Tuesday & Thursday 14:00–18:00.

---

## 4. Clinical UAT Scenario Scripts

### Scenario 1: Patient Registration, Search & Duplicate Detection (Reception Desk)
- **Actor:** Receptionist (`receptionist@curasphere.com`)
- **Action Steps:**
  1. Navigate to `/patients` and click **"Register Patient"**.
  2. Enter demographics for synthetic patient `PAT-STG-01`.
  3. Submit registration.
  4. Attempt to re-register the same patient using the identical CNIC `35201-1234567-1`.
  5. Search for `PAT-STG-01` using phone number `+92 300 1234567`.
- **Expected Outcome:** First registration succeeds with auto-generated standard `MRN-YYYY-xxxxx`. Duplicate registration is rejected with warning alert. Patient search returns immediate debounced match.
- **Clinical Tester Observations:** `[ PASS / FAIL ]` — Notes: `________________________________________________`

---

### Scenario 2: Doctor Scheduling & Appointment Booking (Front Desk)
- **Actor:** Receptionist (`receptionist@curasphere.com`)
- **Action Steps:**
  1. Navigate to `/appointments`.
  2. Select Dr. Kamran Ali for tomorrow at 10:00 AM.
  3. Assign patient `PAT-STG-01` and confirm booking.
  4. Attempt to book a second patient for Dr. Kamran Ali at the identical time slot (10:00 AM).
  5. Issue walk-in OPD token for patient `PAT-STG-02`.
- **Expected Outcome:** First appointment confirms with status `Scheduled`. Second overlapping booking displays collision alert and blocks double-booking. OPD token generates sequential queue number.
- **Clinical Tester Observations:** `[ PASS / FAIL ]` — Notes: `________________________________________________`

---

### Scenario 3: Triage Vitals Intake & Queue Progression (Nurse Desk)
- **Actor:** Head Nurse (`nurse@curasphere.com`)
- **Action Steps:**
  1. Open Clinic Operations Dashboard (`/`).
  2. Locate patient `PAT-STG-01` in the walk-in token list.
  3. Click **"Record Vitals"** and enter: BP `145/95`, Heart Rate `82`, Temp `98.6°F`, SpO2 `98%`, Weight `78kg`.
  4. Advance queue status to `In-Consultation`.
- **Expected Outcome:** Vitals persist cleanly, queue status updates in real-time, and doctor dashboard indicates patient is ready for examination.
- **Clinical Tester Observations:** `[ PASS / FAIL ]` — Notes: `________________________________________________`

---

### Scenario 4: Doctor Consultation, EMR Narrative & Sealing (Doctor Desk)
- **Actor:** Doctor (`doctor@curasphere.com`)
- **Action Steps:**
  1. Open `/emr` and view patient `PAT-STG-01`.
  2. Verify triage vitals entered by nurse are visible.
  3. Enter SOAP narrative:
     - **Subjective:** "Occipital headache and mild dizziness for 3 days."
     - **Objective:** "BP 145/95 mmHg, S1/S2 heard, no murmurs."
     - **Assessment:** Select ICD-10 `I10` (Essential Hypertension).
     - **Plan:** Lifestyle modification, sodium restriction, ambulatory blood pressure monitoring.
  4. Finalize encounter and confirm permanent sealing.
  5. Attempt to edit or overwrite the finalized encounter.
- **Expected Outcome:** SOAP note saves cleanly. Finalizing permanently seals encounter; subsequent edit attempts are rejected with warning banner.
- **Clinical Tester Observations:** `[ PASS / FAIL ]` — Notes: `________________________________________________`

---

### Scenario 5: Electronic Prescriptions & CDSS Drug-Drug Interaction Safety (Doctor Desk)
- **Actor:** Doctor (`doctor@curasphere.com`)
- **Action Steps:**
  1. Open EMR prescription writer for patient `PAT-STG-03` (Patient currently taking Warfarin).
  2. Add medication order: `Aspirin 75mg daily`.
  3. Inspect screen for Clinical Decision Support System (CDSS) alert.
  4. Modify prescription to safe alternative: `Paracetamol 500mg SOS`.
  5. Save prescription.
- **Expected Outcome:** Adding Aspirin while on Warfarin triggers immediate **CRITICAL CDSS INTERACTION HAZARD** alert ("High risk of major gastrointestinal or intracranial hemorrhage"). Modifying to Paracetamol clears hazard banner.
- **Clinical Tester Observations:** `[ PASS / FAIL ]` — Notes: `________________________________________________`

---

### Scenario 6: Cashier Invoicing, Payment Settlement & 80mm Slip (Billing Desk)
- **Actor:** Cashier (`cashier@curasphere.com`)
- **Action Steps:**
  1. Navigate to `/billing`.
  2. Generate invoice for `PAT-STG-01`:
     - Line 1: General Consultation (PKR 1,500).
     - Line 2: Blood Glucose Test (PKR 500).
     - Discount: 10%.
     - Tax: 5%.
  3. Settle payment via Cash: PKR 1,890.
  4. Click **"Print POS Slip"** and inspect print preview.
- **Expected Outcome:** Total computes accurately to PKR 1,890. Invoice status marks `Paid` and balance equals `PKR 0`. Print preview displays constrained 80mm thermal receipt format without browser margin distortion.
- **Clinical Tester Observations:** `[ PASS / FAIL ]` — Notes: `________________________________________________`

---

### Scenario 7: Role Authorization & Patient Privacy Protection (Security Test)
- **Actor:** Cashier (`cashier@curasphere.com`) & Doctor (`doctor@curasphere.com`)
- **Action Steps:**
  1. As Cashier, attempt to navigate directly to `/emr/notes/sealed/101`.
  2. As Doctor, attempt to navigate to `/billing/settings/rates` to alter facility fee schedules.
  3. Inspect public browser console logs during API requests.
- **Expected Outcome:** Cashier is blocked with HTTP 403 Forbidden / redirected away from clinical EMR notes. Doctor is blocked from altering financial fee schedules. Zero passwords, JWT tokens, or unmasked patient records appear in browser console.
- **Clinical Tester Observations:** `[ PASS / FAIL ]` — Notes: `________________________________________________`

---

## 5. Defect Severity & Remediation Protocol

Any defect discovered during clinical UAT must be cataloged immediately:

| Severity | Definition | Release Impact | Response SLA |
|:---:|:---|:---:|:---:|
| **P0 — Critical** | Patient safety hazard (e.g. CDSS alert fails), clinical data loss, or system crash. | **STRICT RELEASE BLOCKER** | Emergency hotfix (< 4 hours) |
| **P1 — High** | Major clinical/financial workflow failure with no viable manual workaround. | **BLOCKS RELEASE** | Fix within 24 hours |
| **P2 — Medium** | Usability defect with acceptable operational workaround (e.g. print margin tweak). | **PERMITTED WITH SIGN-OFF** | Next scheduled maintenance |
| **P3 — Low** | Cosmetic alignment or non-critical styling preference. | **DOES NOT BLOCK RELEASE** | Backlog roadmap |

---

## 6. Acceptance Criteria for Formal Sign-Off

The CuraSphere Clinic Edition will be accepted for production cutover only when:
1. **100% of P0 (Critical) and P1 (High) clinical scenarios pass successfully.**
2. Zero unresolved clinical safety hazards or prescription calculation errors exist.
3. Billing math and cashier receipt printing are verified on-site.
4. The formal sign-off certificate below is executed by authorized clinical leadership.

---

## 7. Formal Clinical Acceptance Sign-Off Certificate

*(To be physically signed and countersigned on staging URL upon completion of clinical UAT)*

```
================================================================================
           CURASPHERE CLINIC EDITION — FORMAL CLINICAL ACCEPTANCE
================================================================================

Target Version / Commit: v1.0.0-clinic (f89e9a6)
Staging Environment URL: _______________________________________________________
Date of Walkthrough:     _______________________________________________________

CLINICAL & OPERATIONAL SIGN-OFFS:

1. MEDICAL DIRECTOR / LEAD PHYSICIAN:
   Name:      __________________________________________________________________
   Signature: _____________________________________ Date: ______________________
   Decision:  [  ] ACCEPTED FOR CLINICAL USE     [  ] REJECTED (DEFECTS FOUND)

2. CLINIC PRACTICE MANAGER / ADMINISTRATOR:
   Name:      __________________________________________________________________
   Signature: _____________________________________ Date: ______________________
   Decision:  [  ] ACCEPTED FOR OPERATIONAL USE  [  ] REJECTED (DEFECTS FOUND)

3. HEAD CASHIER / FINANCIAL CONTROLLER:
   Name:      __________________________________________________________________
   Signature: _____________________________________ Date: ______________________
   Decision:  [  ] ACCEPTED FOR FINANCIAL USE    [  ] REJECTED (DEFECTS FOUND)

================================================================================
```
