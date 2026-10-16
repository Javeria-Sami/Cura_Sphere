# 🏥 CuraSphere HMS - Enterprise Centralized Hospital Management System

CuraSphere HMS is an enterprise-grade, centralized Hospital Management System designed to handle end-to-end clinical workflows, patient administration, outpatient/inpatient operations, emergency triage, diagnostic imaging, pharmaceutical inventory, multi-channel financial billing, and executive business intelligence analytics.

---

## 📐 System Architecture

CuraSphere HMS is built using modern **Clean Architecture** (.NET 8) combined with a high-performance **React 18 Single Page Application (SPA)**.

```
┌────────────────────────────────────────────────────────────────────────┐
│               Frontend: React 18 + Vite + Tailwind CSS v4              │
│               - 24 Enterprise Subsystem Modules & Pages                │
│               - Centralized Design Tokens, Lucide Icons & Components   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP REST APIs (JSON + JWT Auth)
┌───────────────────────────────────▼────────────────────────────────────┐
│              Backend: ASP.NET Core 8 Web API (Clean Architecture)      │
│                                                                        │
│   ┌─────────────────────┐  ┌─────────────────────┐  ┌──────────────┐   │
│   │   CuraSphere.Api    │  │CuraSphere.Applica...│  │ CuraSphere.  │   │
│   │ (Controllers/Middle)│  │ (DTOs / Services)   │  │   Domain     │   │
│   └──────────┬──────────┘  └──────────┬──────────┘  └──────┬───────┘   │
│              └────────────────────────┼────────────────────┘           │
│   ┌───────────────────────────────────▼────────────────────────────┐   │
│   │                 CuraSphere.Infrastructure                      │   │
│   │    - Entity Framework Core 8 PostgreSQL Object Relational      │   │
│   │    - Service Implementations, JWT Token Generator, Seeding     │   │
│   └───────────────────────────────────┬────────────────────────────┘   │
└───────────────────────────────────────┼────────────────────────────────┘
                                        │ Npgsql Provider (Port 5432)
┌───────────────────────────────────────▼────────────────────────────────┐
│                 Database Engine: PostgreSQL 16                         │
│   Schemas: patient.*, hr.*, security.*, audit.*, public.*              │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🌟 Key Features & Subsystems (24 Modules)

### 1. Clinical Subsystem
- **Patients Management**: Medical Record Number (`MRN-XXXXX`) auto-generation, CNIC/passport validation, blood group, emergency contacts, demographic history.
- **Appointments Scheduling**: Multi-doctor appointment scheduling, time slot locking, status lifecycle (`Scheduled`, `Checked In`, `Completed`, `Cancelled`).
- **OPD Consultation & Queue**: Daily outpatient queue tokens (`T-001`), doctor consultation desk, chief complaint entry, waiting list tracking.
- **IPD Admission & Bed Allocation**: Inpatient ward bed management (`Available` $\rightarrow$ `Occupied`), primary diagnosis, length-of-stay tracking, and discharge summary.
- **Emergency & Triage Unit**: Live triage priority board (P1 Critical, P2 Urgent, P3 Standard), trauma team dispatch, and real-time arrival monitor.

### 2. Clinical Services & Diagnostics
- **Laboratory Diagnostics**: Test ordering (`Hematology`, `Biochemistry`, `Urinalysis`), sample processing, and lab result entry.
- **Radiology & Imaging**: Imaging modality study tracking (`X-Ray`, `MRI`, `CT Scan`, `Ultrasound`), radiologist reports, and PACs accession numbers.
- **Pharmacy & Dispensary**: Drug formulary catalog, batch expiry tracking, reorder alert thresholds, and electronic prescription fulfillment.
- **Operation Theatre & Surgery**: OT room bookings, surgical procedure scheduling, lead surgeon & anesthetist team assignment.
- **ICU & Bedside Telemetry**: Real-time vital signs monitoring (BP, HR, SpO₂, GCS coma score, Temperature) and automated alert badges.

### 3. Financial & Revenue Cycle
- **Patient Billing & Ledgers**: Automated itemized invoice generation (`INV-2026-XXXX`), balance ledgers, and service fee calculation.
- **Payment Collection & Cashier**: Multi-channel payment recording (`Cash`, `Credit Card`, `Bank Transfer`, `Insurance Claim`) with instant receipt generation.
- **Insurance Claims & TPAs**: Third-party pre-authorization policy claims, claim submittal tracking, and approved payout ledgers.

### 4. Operations & Supply Chain
- **Inventory & Medical Supplies**: Medical consumable SKU stock tracking, PPE, surgical instruments, reorder thresholds, and unit cost ledgers.
- **HR & Staff Management**: Employee profiles, doctor designation master, department allocation, and staff payroll data.
- **Attendance & Shift Roster**: Daily staff check-in/out logging, work hours calculation, and overtime tracking.

### 5. Administration & BI Analytics
- **Executive BI Dashboard**: Aggregated hospital KPIs (Daily Revenue, Patient Census, Bed Occupancy Rate, Departmental Revenue Contribution).
- **Security & User Access**: User account management, credential status, and Role-Based Access Control (RBAC).
- **System Audit Logs**: Immutable audit log of all system transactions, user logins, patient registrations, and invoice collections.

---

## 🚀 Quickstart Guide

### Prerequisites
- **.NET 8 SDK** (`dotnet --version` $\ge 8.0$)
- **Node.js** (`node --version` $\ge 18.0$)
- **PostgreSQL 16 Engine** (listening on `localhost:5432`)
- **Docker & Docker Compose** (optional for containerized setup)

---

### Running Locally

#### 1. Start Database Server
Ensure PostgreSQL 16 is running on port `5432` with database `curasphere`.

#### 2. Start Backend API (.NET 8)
```bash
cd backend
$env:DOTNET_ROLL_FORWARD="Major"
dotnet run --project CuraSphere.Api
```
The API server will automatically run migrations, seed initial master data, and start listening on:
`http://localhost:5000`

#### 3. Start Frontend App (React 18 + Vite)
```bash
cd frontend
npm install
npm run dev
```
The Vite development server will open at:
`http://localhost:3000`

---

### Running via Docker Compose

To spin up the entire system (PostgreSQL 16 + ASP.NET Core API + Nginx Web SPA) in isolated production containers:

```bash
docker-compose up --build
```

- **Frontend Application**: `http://localhost`
- **Backend API**: `http://localhost:5000`
- **PostgreSQL Database**: `localhost:5432`

---

## 🔐 Credentials & Default Seeding

Upon first startup, the database automatically seeds default credentials:

- **Username**: `admin`
- **Password**: `Admin123!`
- **Assigned Role**: `Super Administrator`

---

## 🛠️ Tech Stack & Dependencies

- **Backend**: C# 12, ASP.NET Core 8, Entity Framework Core 8, Npgsql PostgreSQL Provider, JWT Bearer Authentication, PasswordHasher.
- **Frontend**: TypeScript, React 18, Vite 8, Tailwind CSS v4, Lucide Icons, Axios.
- **Deployment**: Docker, Nginx, Docker Compose.


## 🔑 Default Credentials Seeded in Repository
Super Administrator: Username admin | Password Admin123!
Consultant Physician: Username dr.kamran | Password Doctor123!
Head Nurse: Username nurse.amina | Password Nurse123!
Billing Cashier: Username cashier.kamran | Password Cashier123!
