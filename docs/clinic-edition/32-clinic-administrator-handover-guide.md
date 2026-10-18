# CURASPHERE CLINIC EDITION — CLINIC ADMINISTRATOR HANDOVER GUIDE
**Document ID:** `DOC-CE-032`  
**Version:** 1.0.0  
**Effective Date:** October 2026  
**Target Audience:** Clinic Administrators, Operations Managers, Reception Supervisors, Medical Directors  

---

## 1. Introduction & Welcome

Welcome to the **CuraSphere Hospital Management System — Clinic Edition**.

This guide is designed for Clinic Administrators and operational supervisors. It provides step-by-step instructions for managing day-to-day outpatient operations, including staff onboarding, patient registration, doctor scheduling, clinical consultations, billing, payments, and reporting.

---

## 2. Signing In Securely & Account Hygiene

1. Open your clinic web browser (Google Chrome, Microsoft Edge, or Mozilla Firefox) and navigate to the clinic portal URL:
   ```
   https://clinic.<YOUR_DOMAIN>.com
   ```
2. Enter your authorized clinic administrator email address and password.
3. Click **Sign In**.
4. **Brute-Force Protection Notice:** If an incorrect password is entered **5 times consecutively**, the system will automatically lock the account for **15 minutes** to protect against unauthorized access.
5. **Session Security:** Your authenticated session remains active for 60 minutes. If left idle, you will be prompted to re-enter your credentials. Always click **Logout** from the top-right profile menu when stepping away from your desk.

---

## 3. Understanding the Clinic Dashboard

Upon signing in, you are greeted by the **Clinic Dashboard** (`/clinic-dashboard`):

- **Today's Appointments:** Total number of outpatient visits scheduled for the current calendar day.
- **Patients Waiting:** Real-time queue count of patients currently in the reception waiting area (`Checked In` status).
- **In Consultation:** Number of patients actively being seen by doctors (`In Consultation` status).
- **Revenue Today:** Financial summary of today's billed charges vs. cash/card payments collected.
- **Reception Patient Queue:** An interactive list showing patient names, token numbers, assigned clinicians, and elapsed wait times.
- **Clinician Duty Status:** A quick widget displaying on-duty specialists and current room allocations.

---

## 4. Managing Staff Accounts & Role-Based Permissions

As a Clinic Administrator, you are responsible for assigning appropriate roles to staff members according to the principle of least privilege:

| Role Name | Permitted Capabilities | Restricted Operations |
| :--- | :--- | :--- |
| **Clinic Administrator** | Full operational access: HR doctor directory, system lookups, audit logs, and reports. | Cannot conduct medical examinations on behalf of doctors without clinical credentials. |
| **Receptionist** | Register new patients, search patient directory, book/reschedule appointments. | Cannot view or edit clinical SOAP notes; cannot record payments or cancel invoices. |
| **Doctor / Clinician** | View assigned appointment queue, conduct consultations, write SOAP notes, prescribe medications. | Cannot view clinic financial ledgers or process cashier payments. |
| **Cashier** | Generate outpatient invoices, record payments (Cash, Card, Bank, Insurance), print receipts. | Cannot modify medical diagnoses, prescribe drugs, or alter clinical records. |

To manage staff accounts:
1. Navigate to **HR / Staff Management** (`/hr`) from the navigation sidebar.
2. Click **Add New Staff Member**.
3. Enter legal name, contact email, phone number, department, and select their designated role.
4. An automated onboarding credential notification will be generated.

---

## 5. Registering and Searching Patients

### 5.1 Registering a New Patient
1. Navigate to **Patients** (`/patients`) from the sidebar.
2. Click the **Register Patient** button.
3. Complete the required demographic fields:
   - Full Name
   - Date of Birth & Gender
   - Contact Phone (format: international or standard mobile)
   - National ID / CNIC (checked for accidental duplicates)
   - Blood Group and Known Drug Allergies (if known)
4. Click **Save Patient**.
5. The system will auto-generate a unique Medical Record Number formatted as:
   ```
   MRN-YYYY-XXXXX  (e.g., MRN-2026-00142)
   ```

### 5.2 Searching the Patient Directory
1. In the **Patients** directory view, use the universal search bar.
2. You can search by **MRN**, **Full Name**, **Phone Number**, or **National ID/CNIC**.
3. Results are paginated and appear instantly with debounced search filtering.

---

## 6. Managing Doctors & Availability Schedules

1. Navigate to **Doctors** (`/doctors`) from the sidebar.
2. **Specialist Directory:** View all affiliated general practitioners, pediatricians, cardiologists, and other specialists.
3. **Duty Toggle:** Toggle a doctor between **On Duty** and **Off Duty** to reflect real-time attendance.
4. **Consultation Fees:** Review and update standard outpatient consultation fees.
5. **Adding a Specialist:** Click **Add Doctor**, select their medical specialization, consultation room number, and default shift times.

---

## 7. Scheduling and Updating Appointments

### 7.1 Booking an Appointment
1. Navigate to **Appointments** (`/appointments`).
2. Click **Book Appointment**.
3. Select the patient (by searching name or MRN) and the target doctor.
4. Select the appointment date and pick an available 15-minute or 30-minute timeslot.
5. **Double-Booking Guard:** If the chosen clinician already has a confirmed appointment at that time, the system will block the booking and display a schedule conflict warning.
6. Click **Confirm Appointment**.

### 7.2 Managing Appointment Lifecycle
As the patient progresses through the clinic, receptionists update status badges:
- `Scheduled`: Initial booking confirmed.
- `Checked In`: Patient has arrived at reception and is in the waiting room.
- `In Consultation`: Patient has entered the doctor's consultation room.
- `Completed`: Doctor has finished examination and sealed the encounter.
- `Cancelled`: Patient cancelled visit.

> **Important Rule (Terminal State Lock):** Once an appointment reaches **`Completed`** or **`Cancelled`**, it is locked by the system and cannot be rescheduled or re-opened.

---

## 8. Clinical Consultations & EMR Notes (Clinician Workflow)

Doctors navigate to **Consultations / EMR** (`/emr`):
1. **Patient Vitals:** Record Height (cm), Weight (kg), Blood Pressure, Heart Rate, and Temperature. The system automatically computes and displays the **BMI (Body Mass Index)**.
2. **SOAP Clinical Note:**
   - **Subjective:** Chief complaint and patient-reported symptoms.
   - **Objective:** Physical examination findings and lab observations.
   - **Assessment:** Clinical diagnosis and ICD-10 diagnostic tagging.
   - **Plan:** Therapeutic plan, investigations, and follow-up advice.
3. **Sealing the Record:** When the visit is finished, the doctor clicks **Finalize & Sign Off**.
   - **Record Immutability Notice:** Once finalized, medical records are sealed. The system will strictly reject any post-finalization edits via HTTP 409 Conflict. If additional notes are needed later, an addendum must be created.

---

## 9. Electronic Prescriptions (Rx) & Drug Safety Alerts

1. Within the consultation screen, click **Add Prescription**.
2. Search the clinic formulary for the medication name.
3. Specify dosage (e.g. `500 mg`), route (`Oral`), frequency (`TID / Three times daily`), and duration (`5 Days`).
4. **Clinical Decision Support (CDSS) Alert:** If the doctor prescribes two medications known to have severe adverse interactions (for example, *Warfarin + Aspirin* creating severe hemorrhage risk), the system will immediately display a high-priority warning modal.
5. Click **Generate Prescription Slip** to print a signed outpatient prescription slip for the patient.

---

## 10. Billing, Invoices & Cashier Payments

### 10.1 Creating an Outpatient Invoice
1. Navigate to **Billing** (`/billing`).
2. Click **Create Invoice**, select the patient, and add billable items (Consultation Fee, Rapid Blood Glucose Test, ECG, etc.).
3. The server automatically calculates item subtotals, applicable discounts, and taxes with exact 2-decimal precision.
4. Click **Issue Invoice**. The invoice status is initialized as `Unpaid`.

### 10.2 Recording Cashier Payments
1. Cashiers navigate to **Payments** (`/payments`).
2. Select the outstanding invoice.
3. Click **Record Payment**. Choose the payment channel: **Cash**, **Credit/Debit Card**, **Bank Transfer**, or **Insurance Co-pay**.
4. Enter the amount paid.
   - **Overpayment Prevention Guard:** If a cashier accidentally inputs an amount greater than the outstanding invoice balance, the system will block the transaction and display an error.
   - **Partial Settlement:** If the patient pays a portion of the bill, the status updates to `Partial` and the balance is reduced accordingly.
   - **Full Settlement:** When the full amount is settled, the status advances to `Paid`.
5. Click **Print Thermal Receipt** to produce an 80mm ESC/POS thermal cashier receipt.

---

## 11. Interpreting Reports & Executive Analytics

Navigate to **Reports & BI** (`/reports`):
- **Revenue Summary:** Outpatient revenue billed vs. cash collected over selectable timeframes (Today, Last 7 Days, Month to Date).
- **Payment Method Distribution:** Pie-chart breakdown of Cash vs. Card vs. Insurance collections.
- **Top Outpatient Services:** Ranking of most frequent clinic services (Consultations, Diagnostic Tests, Minor Procedures).
- **Consultation Completion Rate:** Percentage of scheduled appointments successfully completed.
- **Print / Export:** Click **Print Report** to generate an executive-ready A4 summary report.

---

## 12. Handling Validation Errors & Common Prompts

| User Prompt / Error | Cause | Recommended Action |
| :--- | :--- | :--- |
| **"CNIC / National ID already exists"** | Patient is already registered. | Search patient by CNIC in directory instead of creating a duplicate profile. |
| **"Selected timeslot is no longer available"** | Doctor already has an appointment. | Choose an adjacent 15-minute timeslot or select another specialist. |
| **"Cannot alter a completed appointment"** | Attempting to reschedule an old visit. | Completed appointments cannot be altered. Create a new appointment for the follow-up visit. |
| **"Payment amount exceeds outstanding balance"** | Input error in payment field. | Verify remaining balance displayed on invoice and re-enter correct payment amount. |
| **"Record is finalized and sealed"** | Trying to edit a signed medical note. | Finalized EMR notes are legally sealed. Create a new consultation encounter for new findings. |

---

## 13. Protecting Patient Privacy & Confidentiality

- **Confidentiality:** Patient health records, diagnoses, and medical histories are confidential legal records. Never share passwords or leave unlocked screens unattended.
- **Minimum Necessary Rule:** Staff should only access records for patients they are actively treating or billing.
- **Audit Trails:** All record lookups, edits, and financial transactions are automatically logged with timestamp and user ID in the system audit log.

---

## 14. Support & Technical Escalation

If you encounter a software bug, network connectivity issue, or unexpected system behavior:
1. Note the exact time, the action being performed, and any error message displayed.
2. Contact your Clinic IT Administrator or designated support contact.
3. For emergency technical escalation, refer to the **Operational Runbook** ([`DOC-CE-031`](file:///c:/Users/LENOVO/Downloads/-CuraSphere-HMS-DevelopbyUzaii-main/-CuraSphere-HMS-DevelopbyUzaii-main/docs/clinic-edition/31-clinic-edition-operational-runbook.md)).

---
*Guide certified for Clinic Operations Handover on October 18, 2026.*
