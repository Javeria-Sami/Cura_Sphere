# CURASPHERE CLINIC EDITION — UI/UX DESIGN & WORKSPACE SPECIFICATION
**Document ID:** `UIUX-CE-006`  
**Version:** 1.0.0  
**Status:** Approved Design Specification  

---

## 1. Visual Language & Design System Tokens

The Clinic Edition builds directly upon the existing Tailwind CSS design tokens defined in [`tailwind.config.js`](file:///c:/Users/LENOVO/Downloads/-CuraSphere-HMS-DevelopbyUzaii-main/-CuraSphere-HMS-DevelopbyUzaii-main/frontend/tailwind.config.js) and [`index.css`](file:///c:/Users/LENOVO/Downloads/-CuraSphere-HMS-DevelopbyUzaii-main/-CuraSphere-HMS-DevelopbyUzaii-main/frontend/src/index.css):

### Color System
- **Primary Brand (Clinical Cyan/Blue):**
  - `primary-50`: `#eff6ff` (Subtle active backgrounds)
  - `primary-100`: `#dbeafe` (Badges, tag fills)
  - `primary-500`: `#3b82f6` (Interactive links, active focus rings)
  - `primary-600`: `#2563eb` (Primary action buttons, brand accents)
  - `primary-700`: `#1d4ed8` (Hover states)
- **Status & Feedback:**
  - **Success / Completed:** `emerald-600` (`#059669`) with `emerald-50` fill
  - **Warning / Waiting:** `amber-600` (`#d97706`) with `amber-50` fill
  - **Consulting / Active:** `indigo-600` (`#4f46e5`) with `indigo-50` fill
  - **Danger / Cancelled:** `rose-600` (`#e11d48`) with `rose-50` fill
- **Neutrals & Surfaces:**
  - Application Canvas: `slate-50` (`#f8fafc`)
  - Elevated Cards: `white` (`#ffffff`) with border `slate-200` (`#e2e8f0`)
  - Typography Primary: `slate-900` (`#0f172a`)
  - Typography Muted: `slate-500` (`#64748b`)

---

## 2. Layout Structure & Responsive Grids

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [CuraSphere Clinic]  [Branch: Main Clinic]        [Search Patients]  [Profile]│
├──────────────┬───────────────────────────────────────────────────────────────┤
│ • Dashboard  │  PageHeader: Breadcrumbs + Title + Primary Action Button      │
│ • Reception  ├───────────────────────────────────────────────────────────────┤
│ • Calendar   │  [ KPI Stat 1 ]  [ KPI Stat 2 ]  [ KPI Stat 3 ]  [ KPI Stat 4 ]│
│ • EMR Desk   ├───────────────────────────────────────────────────────────────┤
│ • Billing    │                                                               │
│ • Doctors    │  Main Functional Grid / Table / Split-Screen Workspace        │
│ • Settings   │                                                               │
│ [◄ Collapse] │                                                               │
└──────────────┴───────────────────────────────────────────────────────────────┘
```

1. **Collapsible Sidebar:**
   - 240px expanded mode with categorized sections: `CLINIC WORKSPACE`, `PATIENTS & QUEUE`, `FINANCE`, `SETTINGS`.
   - 68px collapsed mode featuring interactive hover tooltips.
2. **TopNavBar:**
   - Instant global patient search (`Ctrl+K` shortcut).
   - Real-time notification center (SignalR queue updates).
   - Active clinic facility selector and user role profile chip.

---

## 3. Screen-by-Screen UI/UX Specifications

### A. Clinic Dashboard (`/dashboard`)
- **Top Row KPI Stats:**
  - Today's Appointments (with scheduled vs completed ratio).
  - Patients Waiting in Queue (with average wait time indicator).
  - Active Consultations (doctors currently consulting).
  - Today's Collections (Cash collected vs outstanding balance).
- **Split Overview:**
  - **Left (60%): Live Queue Ticker:** Card list of currently consulting and top waiting patients with direct "Call Patient" trigger.
  - **Right (40%): Doctor Status Board:** Real-time indicator of on-duty doctors, their current room/cabin, and total patients seen today.
  - **Quick Action Bar:** `+ New Walk-in Patient`, `+ Book Appointment`, `+ Issue Token`.

---

### B. Reception & Waiting Queue (`/opd`)
- **Queue Status Filters:** `All`, `Waiting`, `Consulting`, `Completed`, `No Show`.
- **Fast-Track Walk-in Intake Modal:**
  - Minimal 30-second form: Phone Number (auto-searches existing records), Full Name, Age/Gender, Doctor Selection, Chief Complaint.
  - One-click "Issue Token & Print Slip" button.
- **Interactive Queue Actions:**
  - "Call Patient": Emits SignalR event, updates status to `Called`, flashes row with subtle blue pulse.
  - "Start Consultation": Shifts token to `Consulting`.
  - "Mark No Show": Moves patient to end of queue or archives.

---

### C. Appointment Calendar & Slot Picker (`/appointments`)
- **Calendar Toolbar:** Day view, Week view, and List view toggles; Date selector with "Today" quick button; Doctor filter dropdown.
- **Interactive Time Slot Grid:**
  - Clean card-based time blocks (e.g., `09:00 AM - 09:15 AM`).
  - Available slots rendered with green border and hover elevation.
  - Booked slots display patient name and status badge.
  - Clicking an available slot opens the "Confirm Booking" modal pre-populated with doctor, date, and selected time.

---

### D. Doctor Consultation Workspace (`/consultations`)
Designed for minimum doctor typing and high ergonomic speed:
- **Two-Column Split Layout:**
  - **Left Column (35%): Patient Chart Summary:**
    - Demographic banner (Name, Age, MRN, Gender, Contact).
    - Prominent red alert banner for Allergies (e.g. `Penicillin Allergy`).
    - Accordion of Previous Visits with one-click view of historical SOAP notes.
  - **Right Column (65%): Active Encounter Form:**
    - **Vitals Strip:** Compact inputs for BP (mmHg), Pulse (bpm), Temp (°F), Weight (kg).
    - **SOAP Clinical Notes:** Clean auto-expanding textareas for Subjective complaints, Objective examination findings, and Assessment.
    - **Diagnosis Picker:** Quick searchable dropdown with popular ICD-10 diagnostic codes.
    - **Prescription Builder:**
      - Searchable drug name input.
      - One-click frequency chips (`1-0-1`, `1-1-1`, `1-0-0`, `Once Daily`).
      - Duration selector (`3 Days`, `5 Days`, `7 Days`, `Custom`).
      - Instruction chips (`After meals`, `Before meals`, `At bedtime`).
    - **Footer Action Bar:** Fixed bottom bar with "Complete & Print Rx" (primary) and "Order Lab Test" (secondary).

---

### E. Consultation Billing & Thermal Receipt (`/billing`)
- **Fast POS-Style Bill Generator:**
  - Automatically imports consultation fee based on doctor and patient encounter.
  - Option to add extra procedure lines (e.g. `Nebulization`, `Wound Dressing`).
  - Total calculation with instantaneous change/balance preview.
  - Payment method chips: `Cash`, `Card`, `Digital Wallet`.
- **Thermal Receipt Layout (80mm Width):**
  - Crisp typography with clinic logo, clinic address, and tax registration number.
  - Itemized table with item description, quantity, and amount.
  - Barcode / QR code encoding invoice number for rapid follow-up verification.
  - Optimized browser `@media print` CSS ensuring zero margins and instant thermal printing.

---

## 4. Reusable Component Conventions & A11y Standards

1. **State Feedback:**
   - **Loading:** Subtle skeleton placeholders ([`Skeleton.tsx`](file:///c:/Users/LENOVO/Downloads/-CuraSphere-HMS-DevelopbyUzaii-main/-CuraSphere-HMS-DevelopbyUzaii-main/frontend/src/components/ui/Skeleton.tsx)) rather than jarring full-screen spinners.
   - **Empty States:** Friendly contextual illustrations with a clear call-to-action button (e.g. `No patients waiting. Click "Issue Token" to register walk-ins`).
   - **Error Handling:** Inline form field validation messages using `Zod` schemas.
2. **Keyboard Navigation & Accessibility (a11y):**
   - Full keyboard accessibility for modal dialogs (Focus trap + `Escape` to close).
   - High color contrast ratio (WCAG AA compliant) on all clinical data fields.
   - Distinctive iconography paired with text labels for color-blind accessibility.
