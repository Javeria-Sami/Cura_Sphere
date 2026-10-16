# CURASPHERE CLINIC EDITION — API CONTRACTS & DTO SPECIFICATIONS
**Document ID:** `API-CE-005`  
**Version:** 1.0.0  
**Status:** Approved API Contract  

---

## 1. Global API Standards

- **Base URL:** `/api`
- **Transport:** HTTPS Required
- **Authentication:** `Authorization: Bearer <JWT>`
- **Content-Type:** `application/json`

### Standard Response Envelope
All API endpoints adhere to the unified JSON envelope:

```typescript
// Success Response
interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
}

// Error Response
interface ApiErrorResponse {
  success: false;
  error: {
    code: string;       // e.g., "SLOT_ALREADY_BOOKED", "PERMISSION_DENIED"
    message: string;    // User-friendly message
    details?: unknown;  // Validation dictionary if applicable
  };
}
```

---

## 2. Clinic Dashboard Endpoint

### `GET /api/clinic/dashboard/summary`
Retrieves daily operational KPIs, queue counts, and financial summaries for the clinic.

- **Required Permission:** `clinic.dashboard.view`
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "todayAppointmentsCount": 24,
      "waitingInQueueCount": 7,
      "currentlyConsultingCount": 2,
      "completedConsultationsCount": 15,
      "todayBilledRevenue": 48500.00,
      "todayCollectedCash": 42000.00,
      "outstandingBalance": 6500.00,
      "activeDoctorsOnDuty": 4
    }
  }
  ```
  *(Note: Revenue fields are redacted to null if caller lacks `clinic.dashboard.revenue`)*.

---

## 3. Doctor Management & Scheduling Endpoints

### `GET /api/doctors`
Returns list of clinic doctors with their specialties and consultation fees.

- **Required Permission:** `doctors.read`
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": [
      {
        "doctorId": 1,
        "doctorCode": "DOC-001",
        "fullName": "Dr. Kamran Ahmed",
        "specializationName": "General Medicine",
        "qualification": "MBBS, FCPS",
        "consultationFee": 2000.00,
        "consultationDuration": 15,
        "status": "Active",
        "isAvailableToday": true
      }
    ]
  }
  ```

---

### `GET /api/doctors/{id}/availability?date=YYYY-MM-DD`
Retrieves generated calendar slots for a doctor on a specific date, indicating availability.

- **Required Permission:** `appointments.read`
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "doctorId": 1,
      "doctorName": "Dr. Kamran Ahmed",
      "date": "2026-10-18",
      "workingHours": "09:00 AM - 01:00 PM",
      "slots": [
        {
          "timeSlotId": 1001,
          "startTime": "09:00 AM",
          "endTime": "09:15 AM",
          "isBooked": false
        },
        {
          "timeSlotId": 1002,
          "startTime": "09:15 AM",
          "endTime": "09:30 AM",
          "isBooked": true
        }
      ]
    }
  }
  ```

---

### `POST /api/doctors/{id}/schedule`
Configures or updates a doctor's weekly working schedule.

- **Required Permission:** `doctors.schedule.manage`
- **Request Body:**
  ```json
  {
    "schedules": [
      {
        "dayOfWeek": 1,
        "startTime": "09:00:00",
        "endTime": "13:00:00",
        "slotDurationMinutes": 15,
        "maxPatientsPerShift": 16,
        "isActive": true
      }
    ]
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "message": "Doctor schedule updated and upcoming slots refreshed successfully."
  }
  ```

---

## 4. Appointment & Queue Endpoints

### `POST /api/appointments`
Books an appointment slot with atomic conflict check.

- **Required Permission:** `appointments.create`
- **Request Body:**
  ```json
  {
    "patientId": 105,
    "doctorId": 1,
    "departmentId": 1,
    "timeSlotId": 1001,
    "appointmentDate": "2026-10-18",
    "appointmentType": "OPD",
    "reasonForVisit": "Persistent seasonal cough"
  }
  ```
- **Response `201 Created`:**
  ```json
  {
    "success": true,
    "data": {
      "appointmentId": 501,
      "appointmentNumber": "APT-20261018-0501",
      "patientName": "Zainab Bibi",
      "doctorName": "Dr. Kamran Ahmed",
      "appointmentDate": "2026-10-18",
      "appointmentTime": "09:00 AM",
      "status": "Scheduled"
    }
  }
  ```
- **Error `409 Conflict` (If slot was booked concurrently):**
  ```json
  {
    "success": false,
    "error": {
      "code": "SLOT_ALREADY_BOOKED",
      "message": "The selected time slot has already been booked. Please choose another time."
    }
  }
  ```

---

### `PATCH /api/appointments/{id}/status`
Updates appointment state (`Scheduled`, `Checked In`, `Completed`, `Cancelled`, `No Show`).

- **Resolved Model Binding Fix:** Accepts strongly typed JSON request object:
  ```json
  {
    "status": "Checked In"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "message": "Appointment status updated to Checked In."
  }
  ```

---

### `POST /api/opd/token`
Issues a daily fast-track walk-in consultation token.

- **Required Permission:** `queue.issue`
- **Request Body:**
  ```json
  {
    "patientId": 105,
    "doctorId": 1,
    "departmentId": 1,
    "chiefComplaint": "Fever for 2 days"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "opdTokenId": 42,
      "tokenNumber": "T-015",
      "queuePosition": 15,
      "patientName": "Zainab Bibi",
      "doctorName": "Dr. Kamran Ahmed",
      "status": "Waiting"
    }
  }
  ```

---

## 5. Consultation & EMR Endpoints

### `POST /api/emr/encounters`
Conducts and commits a full doctor consultation encounter in a single atomic transaction.

- **Required Permission:** `emr.create`
- **Request Body:**
  ```json
  {
    "patientId": 105,
    "doctorId": 1,
    "appointmentId": 501,
    "opdTokenId": 42,
    "encounterDate": "2026-10-18T09:12:00Z",
    "vitals": {
      "bloodPressure": "120/80",
      "heartRate": 74,
      "temperature": "98.6 F",
      "respiratoryRate": 16,
      "weightKg": 68.5
    },
    "symptoms": "Cough with clear sputum, mild sore throat",
    "diagnosis": "Acute Upper Respiratory Tract Infection",
    "icdCode": "J06.9",
    "clinicalNotes": "Chest clear on auscultation. Throat mild erythema. Hydration advised.",
    "prescriptions": [
      {
        "medicineName": "Amoxicillin / Clavulanate",
        "dosage": "625mg",
        "frequency": "1-0-1",
        "durationDays": 5,
        "instructions": "Take after meals"
      },
      {
        "medicineName": "Paracetamol",
        "dosage": "500mg",
        "frequency": "1-1-1",
        "durationDays": 3,
        "instructions": "Take for fever or pain"
      }
    ],
    "followUpDate": "2026-10-25"
  }
  ```
- **Response `201 Created`:**
  ```json
  {
    "success": true,
    "data": {
      "encounterId": 901,
      "encounterNumber": "ENC-20261018-0901",
      "patientId": 105,
      "prescriptionNumber": "RX-20261018-0901",
      "status": "Completed"
    }
  }
  ```

---

## 6. Itemized Billing & Receipt Endpoints

### `POST /api/billing/consultation-invoice`
Generates an itemized bill for a consultation and records settlement.

- **Required Permission:** `billing.create`
- **Request Body:**
  ```json
  {
    "patientId": 105,
    "encounterId": 901,
    "serviceType": "Consultation",
    "items": [
      {
        "itemDescription": "Consultation Fee (Dr. Kamran Ahmed)",
        "itemCategory": "Consultation",
        "quantity": 1,
        "unitPrice": 2000.00
      },
      {
        "itemDescription": "Blood Glucose Rapid Test",
        "itemCategory": "Diagnostic",
        "quantity": 1,
        "unitPrice": 300.00
      }
    ],
    "discountAmount": 0.00,
    "payment": {
      "amount": 2300.00,
      "paymentMethod": "Cash"
    }
  }
  ```
- **Response `201 Created`:**
  ```json
  {
    "success": true,
    "data": {
      "invoiceId": 1201,
      "invoiceNumber": "INV-2026-1201",
      "receiptNumber": "REC-2026-1201",
      "totalAmount": 2300.00,
      "paidAmount": 2300.00,
      "balanceAmount": 0.00,
      "status": "Paid"
    }
  }
  ```

---

### `GET /api/billing/invoices/{id}/receipt`
Retrieves pre-formatted thermal receipt data (optimized for 80mm ESC/POS or browser print).

- **Required Permission:** `billing.read`
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "clinicName": "CuraSphere Family Health Clinic",
      "clinicAddress": "Main Boulevard, Phase 5, DHA, Lahore",
      "clinicPhone": "+92 42 3500 1234",
      "taxNumber": "NTN-8765432-1",
      "invoiceNumber": "INV-2026-1201",
      "receiptDate": "2026-10-18 09:35 AM",
      "patientName": "Zainab Bibi",
      "mrn": "MRN-2026-00105",
      "doctorName": "Dr. Kamran Ahmed",
      "cashierName": "Sara Ahmed",
      "items": [
        { "name": "Consultation Fee", "qty": 1, "price": 2000.00 },
        { "name": "Blood Glucose Test", "qty": 1, "price": 300.00 }
      ],
      "subtotal": 2300.00,
      "discount": 0.00,
      "total": 2300.00,
      "paid": 2300.00,
      "balance": 0.00,
      "paymentMethod": "Cash",
      "footerNote": "Get well soon! Please present this receipt for follow-up within 7 days."
    }
  }
  ```
