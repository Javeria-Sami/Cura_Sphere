# CURASPHERE CLINIC EDITION — ROLE & PERMISSION MATRIX
**Document ID:** `SEC-CE-003`  
**Version:** 1.0.0  
**Status:** Approved Security Specification  

---

## 1. Clinic Edition Roles

The Clinic Edition defines five core operational roles tailored for outpatient medical centers:

1. **`Clinic Administrator` (Clinic Owner / Practice Manager):**
   Full operational control over the clinic facility, clinician profiles, working schedules, consultation pricing, staff accounts, financial ledgers, and operational reports.
2. **`Receptionist` (Front Desk Officer):**
   Handles patient lookup, intake registration, appointment booking/rescheduling, walk-in token issuance, and queue status coordination.
3. **`Doctor` (Consultant / Clinician):**
   Views assigned patient appointments and queue, enters clinical vitals and SOAP notes, diagnoses conditions, creates electronic prescriptions, and reviews historical encounter charts.
4. **`Nurse / Clinical Assistant`:**
   Pre-consultation intake: measures and records patient vitals, reviews allergies, assists with minor procedures, and assists doctors in managing patient flow.
5. **`Billing / Cashier Staff`:**
   Manages invoices, creates consultation bills, collects payments (Cash, Credit Card, Bank Transfer), settles balances, and prints patient receipts.

---

## 2. Granular Permission Catalog

Permissions adhere strictly to the established `resource.action` naming standard:

| Permission Code | Module | Description |
| :--- | :--- | :--- |
| `clinic.dashboard.view` | Dashboard | View operational KPIs and real-time clinic activity |
| `clinic.dashboard.revenue` | Dashboard | View revenue figures and daily cash collection totals |
| `patients.read` | Patient Management | Search patient directory, view contact details and visit history |
| `patients.create` | Patient Management | Register new walk-in or booked patients |
| `patients.update` | Patient Management | Modify demographic, contact, or guardian records |
| `patients.delete` | Patient Management | Soft-delete erroneous or duplicate patient profiles |
| `appointments.read` | Appointments | View appointment calendar and booking lists |
| `appointments.create` | Appointments | Book new appointment slots for patients |
| `appointments.update` | Appointments | Reschedule, adjust time, or update appointment notes |
| `appointments.cancel` | Appointments | Cancel scheduled bookings |
| `queue.view` | Reception & Queue | View daily OPD token queue status |
| `queue.issue` | Reception & Queue | Issue consultation token to patient |
| `queue.manage` | Reception & Queue | Call patient, update queue position, mark completed or no-show |
| `doctors.read` | Doctor Roster | View doctor directory, specialties, and fee structures |
| `doctors.schedule.manage`| Doctor Roster | Create/edit working days, shift hours, and consultation durations |
| `emr.read` | Clinical / EMR | View patient electronic health records and previous visits |
| `emr.create` | Clinical / EMR | Record clinical notes, symptoms, and vital signs |
| `emr.diagnose` | Clinical / EMR | Assign clinical diagnoses and ICD classifications |
| `emr.prescribe` | Clinical / EMR | Create electronic prescriptions and dosage instructions |
| `billing.read` | Billing & Cashier | Search and view consultation invoices |
| `billing.create` | Billing & Cashier | Generate itemized consultation invoices |
| `billing.pay` | Billing & Cashier | Record payment transactions and issue receipts |
| `reports.view` | BI & Reporting | Access clinic volume, doctor load, and financial reports |
| `settings.manage` | Administration | Configure clinic profile, address, taxes, and system users |

---

## 3. Role-to-Permission Mapping Matrix

| Permission | Clinic Administrator | Receptionist | Doctor | Nurse / Assistant | Cashier / Billing |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `clinic.dashboard.view` | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| `clinic.dashboard.revenue`| :white_check_mark: | :x: | :x: | :x: | :white_check_mark: |
| `patients.read` | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| `patients.create` | :white_check_mark: | :white_check_mark: | :x: | :white_check_mark: | :x: |
| `patients.update` | :white_check_mark: | :white_check_mark: | :x: | :white_check_mark: | :x: |
| `patients.delete` | :white_check_mark: | :x: | :x: | :x: | :x: |
| `appointments.read` | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| `appointments.create` | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | :x: |
| `appointments.update` | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | :x: |
| `appointments.cancel` | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | :x: |
| `queue.view` | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| `queue.issue` | :white_check_mark: | :white_check_mark: | :x: | :white_check_mark: | :x: |
| `queue.manage` | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: |
| `doctors.read` | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| `doctors.schedule.manage`| :white_check_mark: | :x: | :white_check_mark: *(own)* | :x: | :x: |
| `emr.read` | :white_check_mark: | :x: | :white_check_mark: | :white_check_mark: | :x: |
| `emr.create` | :white_check_mark: | :x: | :white_check_mark: | :white_check_mark: *(vitals)*| :x: |
| `emr.diagnose` | :x: | :x: | :white_check_mark: | :x: | :x: |
| `emr.prescribe` | :x: | :x: | :white_check_mark: | :x: | :x: |
| `billing.read` | :white_check_mark: | :x: | :x: | :x: | :white_check_mark: |
| `billing.create` | :white_check_mark: | :white_check_mark: *(POS)* | :x: | :x: | :white_check_mark: |
| `billing.pay` | :white_check_mark: | :x: | :x: | :x: | :white_check_mark: |
| `reports.view` | :white_check_mark: | :x: | :x: | :x: | :white_check_mark: *(finance)*|
| `settings.manage` | :white_check_mark: | :x: | :x: | :x: | :x: |

---

## 4. API Endpoint Protection Mapping

All API endpoints are defended with the declarative [`[HasPermission("...")]`](file:///c:/Users/LENOVO/Downloads/-CuraSphere-HMS-DevelopbyUzaii-main/-CuraSphere-HMS-DevelopbyUzaii-main/backend/CuraSphere.Api/Middleware/HasPermissionAttribute.cs) filter:

| Endpoint | HTTP Method | Required Permission Claim | Allowed Roles |
| :--- | :---: | :--- | :--- |
| `/api/patients` | `GET` | `patients.read` | Admin, Receptionist, Doctor, Nurse, Cashier |
| `/api/patients` | `POST` | `patients.create` | Admin, Receptionist, Nurse |
| `/api/patients/{id}` | `PUT` | `patients.update` | Admin, Receptionist, Nurse |
| `/api/appointments` | `GET` | `appointments.read` | All Staff |
| `/api/appointments` | `POST` | `appointments.create` | Admin, Receptionist, Doctor |
| `/api/appointments/{id}/status` | `PATCH` | `appointments.update` | Admin, Receptionist, Doctor |
| `/api/opd/queue` | `GET` | `queue.view` | All Staff |
| `/api/opd/token` | `POST` | `queue.issue` | Admin, Receptionist, Nurse |
| `/api/opd/token/{id}/status` | `PATCH` | `queue.manage` | Admin, Receptionist, Doctor, Nurse |
| `/api/doctors` | `GET` | `doctors.read` | All Staff |
| `/api/doctors/{id}/schedule` | `POST` | `doctors.schedule.manage`| Admin, Doctor |
| `/api/emr/encounters` | `POST` | `emr.create` | Doctor, Nurse (Vitals only) |
| `/api/emr/encounters/patient/{id}`| `GET` | `emr.read` | Admin, Doctor, Nurse |
| `/api/billing/invoices` | `GET` | `billing.read` | Admin, Cashier |
| `/api/billing/consultation-invoice`| `POST` | `billing.create` | Admin, Receptionist, Cashier |
| `/api/billing/payments` | `POST` | `billing.pay` | Admin, Cashier |
| `/api/clinic/dashboard/summary` | `GET` | `clinic.dashboard.view` | All Staff (Revenue redacted if claim missing) |
| `/api/clinic/settings` | `PUT` | `settings.manage` | Clinic Administrator |

---

## 5. Organization Isolation Defense Rules

1. **Tenant Stamping:**
   Whenever a user authenticates, their claims principal carries `org_id`.
2. **Context Resolution:**
   The `ICurrentTenantService` resolves `OrganizationId` directly from the validated JWT token (`ClaimTypes.NameIdentifier` / `org_id`). If the claim is missing, requests to tenant-scoped endpoints immediately abort with `HTTP 401 Unauthorized`.
3. **ORM Auto-Scoping:**
   EF Core query filters guarantee that no query can return records where `e.OrganizationId != currentTenantId`.
4. **Cross-Tenant Attack Prevention:**
   If a malicious client submits a `POST` or `PUT` referencing a foreign `PatientId` belonging to another clinic, EF Core's tenant filter renders the foreign record non-existent (`null`), yielding a safe `HTTP 404 Not Found` rather than exposing unauthorized data.
