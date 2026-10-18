# CURASPHERE CLINIC EDITION — OPERATIONAL RUNBOOK
**Document ID:** `DOC-CE-031`  
**Version:** 1.0.0  
**Effective Date:** October 2026  
**Audience:** Site Reliability Engineers (SRE), DevOps Engineers, System Administrators, Database Administrators  
**Notice:** This runbook contains standard operating procedures. Never insert real passwords, private keys, or credentials into this document.

---

## 1. System Architecture & Component Responsibilities

The CuraSphere Clinic Edition is built upon a decoupled three-tier architecture:

```
[Outpatient Client / Browser]
          │  HTTPS / TLS 1.3 (Port 443)
          ▼
[Frontend Web Tier: Vercel / Nginx Container]
  ├── Technology: React 18.3+, TypeScript 5.x, Vite 8.x
  ├── Distribution: Static Single-Page Application (SPA)
  ├── Static Routing: Client-side routing with fall-through (/(.*) -> /index.html)
  └── Responsibilities: User interface, form validations, receipt/invoice rendering
          │  REST API + JSON / SignalR WebSockets (Distributed X-Correlation-ID)
          ▼
[Application API Tier: ASP.NET Core 8 Web API]
  ├── Technology: .NET 8.0 SDK / C# 12, Clean Architecture
  ├── Container: Alpine Linux, Non-Root USER app (UID 1654)
  ├── Security: HMAC-SHA256 JWT, PBKDF2 Password Hashing, 5-attempt lockout
  ├── Middleware: Exception masking (RFC 7231), sanitized request logging, CORS
  └── Responsibilities: Business logic, CDSS drug rules, authoritative financial calculations
          │  Encrypted TCP (Port 5432, SSL Mode Require)
          ▼
[Persistence Tier: PostgreSQL 15+]
  ├── Technology: PostgreSQL 15+ Relational Database
  ├── ORM: Entity Framework Core 8.0 with Npgsql Provider
  ├── Schemas: patient, clinical, billing, hr, security, audit
  └── Responsibilities: ACID transactions, relational foreign keys, soft-delete filters
```

---

## 2. Environment Overview

| Environment | Purpose | Target Hosting | Ingress Hostname / URL |
| :--- | :--- | :--- | :--- |
| **Development** | Feature coding & local testing | Localhost / Developer Machine | `http://localhost:5173` (UI)<br>`http://localhost:5000` (API) |
| **Staging** | Pre-production validation & smoke tests | Cloud Container (Render/AWS) + Vercel | `https://staging-clinic.<DOMAIN>` (UI)<br>`https://staging-api.<DOMAIN>` (API) |
| **Production** | Live clinical healthcare operations | Hardened Container Cluster + CDN/Vercel | `https://clinic.<DOMAIN>` (UI)<br>`https://api.<DOMAIN>` (API) |

---

## 3. Approved Deployment Procedure

### Phase A: Pre-Deployment Verification
1. Confirm Git commit SHA matches approved release tag (e.g., `v1.0.0-clinic`).
2. Verify all automated tests pass:
   ```bash
   cd frontend && npm test -- --run && npm run lint && npm run build
   ```
3. Confirm that production database backup was taken within the last 2 hours.

### Phase B: Database Schema Preparation
1. Review pending Entity Framework Core migrations:
   ```bash
   dotnet ef migrations list --project backend/CuraSphere.Infrastructure --startup-project backend/CuraSphere.Api
   ```
2. In production, execute migration via controlled release pipeline:
   ```bash
   dotnet ef database update --project backend/CuraSphere.Infrastructure --startup-project backend/CuraSphere.Api --connection "<PRODUCTION_CONNECTION_STRING>"
   ```

### Phase C: Backend Container Deployment
1. Build the production Docker container:
   ```bash
   docker build -t curasphere-api:<RELEASE_TAG> -f backend/CuraSphere.Api/Dockerfile backend
   ```
2. Deploy container to managed hosting (Render / AWS ECS / Azure App Service) with the following environment variables:
   - `ASPNETCORE_ENVIRONMENT=Production`
   - `ConnectionStrings__DefaultConnection=<SECURE_POSTGRES_CONNECTION_STRING>`
   - `JwtSettings__Secret=<GENERATE_64_CHAR_HEX_KEY>`
   - `JwtSettings__Issuer=CuraSphereProductionApi`
   - `JwtSettings__Audience=CuraSphereProductionClient`
   - `JwtSettings__ExpiryInMinutes=60`
   - `Cors__AllowedOrigins=https://clinic.<DOMAIN>`
   - `Database__ApplyMigrationsOnStartup=false`
   - `EditionSettings__CurrentEdition=Clinic`
   - `EditionSettings__FacilityName="<CLINIC_LEGAL_NAME>"`
3. Verify backend health probes:
   ```bash
   curl -i https://api.<DOMAIN>/health/live
   curl -i https://api.<DOMAIN>/health/ready
   ```

### Phase D: Frontend SPA Deployment
1. Deploy static assets from `frontend/dist/` to Vercel or production CDN.
2. In project settings, inject:
   - `VITE_API_URL=https://api.<DOMAIN>/api`
   - `VITE_APP_EDITION=Clinic`
3. Trigger deployment and confirm HTTPS availability.

---

## 4. Health-Check Locations & Interpretation

| Endpoint | HTTP Method | Expected Status | Purpose & Failure Meaning |
| :--- | :---: | :---: | :--- |
| `/health` | `GET` | `200 OK` | **Composite Health:** Returns overall system health. 503 indicates an unhealthy subsystem. |
| `/health/live` | `GET` | `200 OK` | **Process Liveness:** Validates ASP.NET Core runtime is alive. If non-200, orchestrator restarts container. |
| `/health/ready` | `GET` | `200 OK` | **Database Readiness:** Verifies PostgreSQL database connectivity. 503 indicates DB unreachable. |

---

## 5. Log Access & Troubleshooting

### 5.1 Log Characteristics
- All requests pass through [`RequestLoggingMiddleware.cs`](file:///c:/Users/LENOVO/Downloads/-CuraSphere-HMS-DevelopbyUzaii-main/-CuraSphere-HMS-DevelopbyUzaii-main/backend/CuraSphere.Api/Middleware/RequestLoggingMiddleware.cs).
- Sensitive headers (`Authorization`), user passwords, and tokens are automatically redacted.
- Every request carries an `X-Correlation-ID` header, which is echoed in response headers and logged with elapsed duration in milliseconds.

### 5.2 Diagnostic Query Commands
```bash
# Filter logs by specific request correlation ID:
grep "CorrelationId: <TARGET_UUID>" /var/log/curasphere/*.log

# Inspect slow API queries (> 500ms):
awk '$NF > 500' /var/log/curasphere/api_requests.log

# Monitor real-time container logs:
docker logs -f --tail 100 curasphere-api
```

---

## 6. Authentication & Account Management Procedures

### 6.1 Default Role Profiles
- `ClinicAdmin`: User management, clinic lookups, doctor schedules, audit logs.
- `Doctor`: Assigned patient consultations, EMR notes, electronic prescriptions.
- `Receptionist`: Patient registration, directory search, appointment scheduling.
- `Cashier`: Outpatient invoicing, payment receipt recording, POS printing.

### 6.2 Password Security & Lockout Policy
- Passwords hashed using PBKDF2 with unique cryptographic salt.
- Accounts automatically locked for **15 minutes** after **5 consecutive failed attempts**.
- Emergency unlock procedure (Database Administrator action):
  ```sql
  UPDATE security."Users"
  SET "AccessFailedCount" = 0, "LockoutEnd" = NULL
  WHERE "Email" = '<USER_EMAIL>';
  ```

---

## 7. Database Backup & Recovery Procedures

### 7.1 Automated Daily Snapshot Command
```bash
# Execute daily at 01:00 UTC
pg_dump -h <PROD_DB_HOST> -p 5432 -U <BACKUP_USER> -d curasphere_prod_db -F c -b -v -f /backups/curasphere_prod_$(date +%Y%m%d_%H%M%S).dump
```

### 7.2 Disaster Recovery / Restoration Command
```bash
# Restore snapshot into an isolated target database:
pg_restore -h <TARGET_DB_HOST> -p 5432 -U <ADMIN_USER> -d curasphere_restore_db -v -c <BACKUP_FILE>.dump
```

### 7.3 Recovery Targets
- **Recovery Point Objective (RPO):** Maximum 15 minutes of transaction data (continuous WAL archiving).
- **Recovery Time Objective (RTO):** Maximum 2 hours to provision standby host and restore data.

---

## 8. Application Rollback Process

### 8.1 Frontend Rollback (Vercel)
- **Time to Recover:** $< 60$ seconds.
- **Action:** In Vercel Project Dashboard $\to$ Deployments $\to$ locate previous stable deployment $\to$ click **Promote to Production** (or run `vercel rollback`).

### 8.2 Backend Container Rollback
- **Time to Recover:** $< 3$ minutes.
- **Action:** In container orchestrator (Render/AWS ECS), update the active service image tag to the previous stable release tag:
  ```bash
  curasphere-api:<PREVIOUS_STABLE_TAG>
  ```

### 8.3 Database Schema Rollback
- Relational schema changes in CuraSphere are strictly backward-compatible.
- If an emergency database migration revert is required:
  ```bash
  dotnet ef database update <PREVIOUS_MIGRATION_NAME> --project backend/CuraSphere.Infrastructure --connection "<CONNECTION_STRING>"
  ```

---

## 9. Incident Severity Definitions

| Severity | Definition | Target Response | Target Resolution |
| :---: | :--- | :---: | :---: |
| **SEV-1** | Critical security compromise, patient data loss, or total outage of clinical operations. | 15 Minutes | 2 Hours |
| **SEV-2** | Essential workflow failure (e.g. appointment booking or payment recording failure). | 30 Minutes | 4 Hours |
| **SEV-3** | Non-blocking operational defect with a known workaround. | 2 Hours | 24 Hours |
| **SEV-4** | Cosmetic defect or minor user-interface inconsistency. | 1 Business Day | Next Sprint |

---

## 10. Incident Escalation Steps

```
[Incident Detected: Alert / Staff Escalation]
                       │
                       ▼
             [Tier 1: Clinic Reception / Cashier]
                       │ (Unresolved in 15 min)
                       ▼
             [Tier 2: Clinic IT Administrator]
                       │ (Unresolved in 30 min / Systemic)
                       ▼
             [Tier 3: On-Call DevSecOps / SRE Lead]
                       │ (Data integrity / Major Outage)
                       ▼
             [Tier 4: Principal Architect & Clinic Medical Director]
```

---

## 11. Common Failure Symptoms & Diagnostic Actions

| Symptom | Probable Cause | Immediate Diagnostic Action |
| :--- | :--- | :--- |
| **HTTP 500 on all API calls** | Database connection timeout or bad credentials. | Check `GET /health/ready`. Inspect container logs for Npgsql connection errors. Verify database security group allows inbound port 5432. |
| **HTTP 401 Unauthorized immediately after login** | JWT secret mismatch or expired token clock skew. | Verify `JwtSettings__Secret` has not changed between app instances. Check client workstation clock sync. |
| **HTTP 409 Conflict when saving doctor consultation** | Attempting to edit an encounter that has already been finalized/sealed. | Finalized encounters are sealed by design. Verify doctor is creating an addendum or fresh encounter. |
| **Cashier receives error when recording payment** | Payment amount exceeds outstanding invoice balance. | Verify invoice remaining balance. Overpayment guard rejects amounts greater than `BalanceAmount`. |
| **Thermal receipt printer prints blank paper or garbled text** | Printer driver paper width misconfiguration or missing ESC/POS driver. | Switch browser print dialog paper size to `80mm x 297mm`. Use standard A4 printable invoice fallback. |

---

## 12. Secret Rotation Procedure

1. **JWT Signing Key Rotation:**
   - Generate a new 64-character hexadecimal key (min 256 bits).
   - In low-traffic window, update `JwtSettings__Secret` on backend container.
   - Restart container. Active users will be prompted to re-authenticate (token lifetime is 60 minutes).
2. **PostgreSQL Database Password Rotation:**
   - Connect to database as superuser:
     ```sql
     ALTER USER <APP_USER> WITH PASSWORD '<NEW_STRONG_PASSWORD>';
     ```
   - Update `ConnectionStrings__DefaultConnection` in hosting provider secret manager.
   - Restart backend container and verify `GET /health/ready`.

---

## 13. Database Migration Procedure

1. Generate migration script in dry-run mode:
   ```bash
   dotnet ef migrations script --idempotent --output /migrations/update.sql --project backend/CuraSphere.Infrastructure
   ```
2. Database Reliability Engineer reviews SQL script for table locks, column drops, or performance risks.
3. Take a snapshot backup of the database before applying script.
4. Execute SQL script against target database during scheduled maintenance window.
5. Verify schema version in EF Core history table:
   ```sql
   SELECT "MigrationId", "ProductVersion" FROM "__EFMigrationsHistory" ORDER BY "MigrationId" DESC LIMIT 5;
   ```

---

## 14. Security & Privacy Precautions

1. **Protected Health Information (PHI) Hygiene:**
   - Never log patient CNIC, medical notes, or phone numbers in plaintext log files.
   - Never export production database dumps to unencrypted laptops or external drives.
2. **TLS / HTTPS Enforcement:**
   - All HTTP traffic must redirect to HTTPS with HSTS enabled (`Strict-Transport-Security: max-age=31536000`).
3. **CORS Restrictions:**
   - Never set `Cors:AllowedOrigins` to `*`. Only whitelist explicit clinic domains.

---

## 15. Post-Deployment Verification Checklist

- [ ] `GET /health` returns HTTP 200 `{"status":"Healthy"}`.
- [ ] `GET /health/ready` confirms database connectivity.
- [ ] Receptionist can log in, search patients, and open appointment calendar.
- [ ] Doctor can log in, view consultation queue, and open EMR form.
- [ ] Cashier can view invoices and open payment modal.
- [ ] Browser print dialog renders 80mm thermal receipt correctly.
- [ ] Hospital Edition modules (`ipd`, `emergency`, `surgery`) remain accessible in Hospital mode.

---

## 16. Known Operational Limitations

1. **Local Host CLI:** Local developer machine lacks `dotnet` CLI in PATH; compilation in production occurs via containerized Dockerfile.
2. **Hardware Receipt Printer:** CSS styles are standard 80mm ESC/POS, but physical cutter alignment depends on on-site printer driver settings.
3. **SignalR Socket Fallback:** Client UI uses a 15-second polling fallback if real-time WebSockets fail across restrictive corporate firewalls.

---

## 17. Responsible Roles & Escalation Contacts

- **Principal Software Architect:** Architecture, core workflow rules, and release sign-off.
- **Senior DevOps / SRE Lead:** Container hosting, CI/CD pipeline, and uptime monitoring.
- **Database Reliability Engineer:** PostgreSQL health, backups, migrations, and disaster recovery.
- **Application Security Specialist:** JWT secrets, RBAC policies, and vulnerability management.
- **Clinic Operations Lead:** Staff accounts, on-site cashier hardware, and clinical workflow sign-off.
- **Clinic Medical Director:** Clinical governance, medical record sealing policies, and legal compliance.

---
*Runbook approved by Senior Production Reliability Engineer on October 18, 2026.*
