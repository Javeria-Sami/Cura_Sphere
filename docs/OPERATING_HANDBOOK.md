# 🏥 CuraSphere HMS - Operational Engineering & User Handbook

## 1. System Overview & Quick Reference

CuraSphere HMS is an enterprise Hospital Management System connecting clinical encounters, emergency triage, laboratory diagnostics, radiology imaging, pharmaceutical inventory, patient billing, and business intelligence analytics.

---

## 2. Default System Credentials

Upon initial launch, the system automatically seeds the default super-administrator account:

- **Login URL**: `http://localhost:3000/login`
- **Username**: `admin`
- **Password**: `Admin123!`
- **Role**: `Super Administrator`

---

## 3. Operational Workflows

### 3.1 Patient Registration & Search
1. Navigate to **Patients Management** (`/patients`).
2. Click **New Patient Registration**.
3. System automatically generates a unique Medical Record Number (`MRN-YYYY-XXXXX`).
4. Enter Patient Name, CNIC/Passport, Date of Birth, Blood Group, and Emergency Contact details.

### 3.2 Outpatient Queue & Clinical Consultation
1. Navigate to **OPD Queue** (`/opd`).
2. Assign outpatient token (`T-001`).
3. Doctor opens clinical consultation desk to record Chief Complaints, Vitals, Diagnosis, Treatment Plan, and E-Prescriptions.

### 3.3 Emergency & Trauma Triage Board
1. Navigate to **Emergency Unit** (`/emergency`).
2. Monitor real-time triage priority levels:
   - **P1 - Critical / Resuscitation** (Live red alert header)
   - **P2 - Emergent / Urgent**
   - **P3 - Standard / Non-Urgent**
3. Real-time WebSocket alerts stream instantly via SignalR connection (`/hubs/hospital`).

### 3.4 Document Management System (DMS)
1. Navigate to **Document Management** (`/documents`).
2. Upload patient lab attachments, DICOM radiology scans, and signed consent forms.
3. System automatically computes digital signature SHA-256 hash for audit compliance.

---

## 4. Maintenance & Disaster Recovery

### 4.1 Database Backup Snapshot
To take an instant backup snapshot of the PostgreSQL 16 database:
```powershell
.\backups\db-backup-restore.ps1 -Action backup
```

### 4.2 Database Point-In-Time Restoration
To restore from a backup snapshot:
```powershell
.\backups\db-backup-restore.ps1 -Action restore -BackupFile .\backups\snapshots\curasphere_backup_YYYYMMDD.sql
```

---

## 5. Verification Commands

```bash
# Run Backend Unit Tests
dotnet run --project backend/tests/CuraSphere.UnitTests/CuraSphere.UnitTests.csproj

# Run Backend Integration Tests
dotnet run --project backend/tests/CuraSphere.IntegrationTests/CuraSphere.IntegrationTests.csproj

# Run Frontend Vitest Suite
cd frontend && npx vitest run

# Run Frontend Production Build
cd frontend && npm run build
```
