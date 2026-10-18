# CuraSphere Clinic Edition: Controlled Production Release Runbook

**Document ID:** `DOC-CE-052`  
**Session:** 33  
**Version:** 1.0.0  
**Date:** 2026-10-18  
**Author / Release Manager:** Principal Software Architect, Senior DevOps Engineer, Database Reliability Engineer, Application Security Engineer, Release Manager  
**Scope:** Step-by-Step Controlled Production Release Execution Protocol for CuraSphere Clinic Edition  
**Target Release Artifact:** `v1.0.0-clinic` (Commit: `68813c0` / Tag: `v1.0.0-clinic`)  
**Architecture Context:** React 18 / TypeScript / Vite Frontend (Vercel / Static CDN) + ASP.NET Core 8 Web API Linux Container (Render / AWS ECS / Azure App Service) + Managed PostgreSQL 16  
**Operational Status:** **`CONTROLLED RUNBOOK READY (EXECUTION PROHIBITED WITHOUT EXPLICIT AUTHORIZATION)`**  

---

> [!IMPORTANT]
> **PRODUCTION EXECUTION PROHIBITION NOTICE**  
> This runbook defines the exact, verified deployment sequence for the CuraSphere Clinic Edition. **NO PRODUCTION DEPLOYMENT MAY BE INITIATED WITHOUT EXPLICIT, FORMAL WRITTEN AUTHORIZATION FROM THE PROJECT OWNER AND RELEASE MANAGER.** Preparing this runbook does NOT constitute deployment permission.

---

## 1. Release Architecture & Responsibilities

The verified CuraSphere hosting architecture separates presentation, API processing, and persistence into distinct tiers:

```
[Client Tier]
  ├── Technology: React 18.3.1, TypeScript 5.5, Vite 5.4, Tailwind CSS
  ├── Hosting Target: Vercel (or static Nginx / AWS S3 + CloudFront CDN)
  ├── Base URL: https://clinic.curasphere.com [PLACEHOLDER - CONFIRMATION REQUIRED]
  └── Configuration: VITE_API_URL, VITE_APP_EDITION=Clinic

[API Service Tier]
  ├── Technology: ASP.NET Core 8 Web API (.NET 8 Runtime, C# 12)
  ├── Hosting Target: Linux Docker Container (Render / AWS ECS / Azure App Service)
  ├── Base URL: https://api.curasphere.com/api [PLACEHOLDER - CONFIRMATION REQUIRED]
  ├── Execution Identity: Unprivileged user 'app' (UID 1654)
  └── Reverse Proxy: ForwardedHeaders enabled for HTTPS termination

[Persistence Tier]
  ├── Technology: Managed PostgreSQL 16 (AWS RDS / Render Postgres / Azure Flexible Server)
  ├── Database Name: curasphere_prod_db [PLACEHOLDER - CONFIRMATION REQUIRED]
  ├── High Availability: Automated daily snapshots, SSL mode required
  └── Migrations: EF Core 8 forward migrations (InitialCreate + 16 B-tree indexes)
```

### Release Roles & Escalation Chain:
1. **Release Manager (Overall Release Authority):** Approves stage gates, enforces stop conditions, declares Go/No-Go.
2. **DevOps / Cloud Infrastructure Lead (Deployment Operator):** Provisions cloud resources, injects secrets, executes container deployments, monitors CDN cutover.
3. **Database Reliability Engineer (DB Operator):** Applies migrations, verifies pre-release database snapshots, executes database recovery if required.
4. **Lead QA Engineer (Verification Lead):** Executes post-release synthetic smoke tests and verifies health probes.
5. **Clinical Practice Manager (Business Verifier):** Conducts high-level business workflow confirmation.

---

## 2. Stage A: Pre-Release Verification Checklist

Execute these verification checks before touching any deployment interface:

- [ ] **1. Source Revision Freeze:** Verify target git commit hash on `main` or release tag `v1.0.0-clinic`.
- [ ] **2. Automated Test Parity:** Confirm all 181 frontend integration tests pass (`npm test -- --run`) and 40 domain tests pass (`UnitTestRunner.cs`).
- [ ] **3. Static Analysis & Build:** Confirm `eslint .` reports 0 errors and `tsc -b && vite build` succeeds cleanly.
- [ ] **4. Staging Validation Sign-Off:** Confirm staging environment has been validated and UAT sign-off certificate has been signed (`DOC-CE-051`).
- [ ] **5. Cloud Infrastructure Active:** Verify managed PostgreSQL 16 cluster and container host are provisioned, reachable, and healthy.
- [ ] **6. Production Secrets Stored in Secure Vault:** Verify `ConnectionStrings__DefaultConnection` and 256-bit `JwtSettings__Secret` are stored in cloud environment secrets (AWS Secrets Manager / Render Environment / Azure Key Vault).
- [ ] **7. Verified Pre-Release Database Backup:** Execute pre-release backup:
  ```bash
  # Execute pre-release backup snapshot
  ./scripts/backup-curasphere.sh \
    -h <PROD_DB_HOST> \
    -p 5432 \
    -d curasphere_prod_db \
    -u curasphere_prod_app \
    -o ./backups/pre_release_$(date +%Y%m%d_%H%M%S).dump
  ```
- [ ] **8. Maintenance Window Active:** Confirm announcement banner or maintenance window is communicated to clinic staff if upgrading from a running system.

---

## 3. Stage B: Controlled Deployment Sequence

Follow the deployment sequence strictly in order. Do not skip steps.

### Step 1: Database Migration Verification & Execution
Database migrations must be applied forward-only before deploying new application code.

1. **Verify Connection String:**
   Ensure `ConnectionStrings__DefaultConnection` connects using an unprivileged application user (`curasphere_prod_app`) with SSL enabled (`Ssl Mode=Require;Trust Server Certificate=false;`).
2. **Run Schema Migration:**
   ```bash
   # From backend project directory with production environment set:
   export ASPNETCORE_ENVIRONMENT=Production
   export ConnectionStrings__DefaultConnection="<PRODUCTION_CONNECTION_STRING>"

   # Verify pending migrations without applying:
   dotnet ef migrations list --project CuraSphere.Infrastructure --startup-project CuraSphere.Api

   # Apply pending migration (InitialCreate + Indexes):
   dotnet ef database update --project CuraSphere.Infrastructure --startup-project CuraSphere.Api
   ```
3. **Verify Database Health:**
   ```sql
   -- Verify core tables and indexes exist in PostgreSQL:
   SELECT count(*) FROM information_schema.tables WHERE table_schema IN ('patient', 'clinical', 'billing', 'security');
   -- Verify index count:
   SELECT count(*) FROM pg_indexes WHERE schemaname = 'public' OR schemaname = 'patient';
   ```

### Step 2: Backend API Container Deployment
Deploy the ASP.NET Core 8 container to the designated container hosting service (Render / AWS ECS / Azure App Service).

1. **Build and Tag Multi-Stage Docker Image:**
   ```bash
   # Build production image targeting unprivileged user 'app'
   docker build -t curasphere-api:v1.0.0-clinic -f backend/CuraSphere.Api/Dockerfile backend/
   docker tag curasphere-api:v1.0.0-clinic <CONTAINER_REGISTRY_URL>/curasphere-api:v1.0.0-clinic
   docker push <CONTAINER_REGISTRY_URL>/curasphere-api:v1.0.0-clinic
   ```
2. **Configure Production Environment Variables:**
   Configure environment variables in the cloud container management interface:
   - `ASPNETCORE_ENVIRONMENT`: `Production`
   - `ConnectionStrings__DefaultConnection`: `<SECURE_POSTGRES_CONNECTION_STRING>`
   - `JwtSettings__Secret`: `<CRYPTOGRAPHIC_256BIT_SECRET_MIN_32_CHARS>`
   - `JwtSettings__Issuer`: `CuraSphereProductionApi`
   - `JwtSettings__Audience`: `CuraSphereProductionClient`
   - `JwtSettings__ExpiryInMinutes`: `60`
   - `Cors__AllowedOrigins`: `https://clinic.curasphere.com` [CONFIRMATION REQUIRED]
   - `EditionSettings__CurrentEdition`: `Clinic`
   - `EditionSettings__FacilityName`: `CuraSphere Medical Clinic`
   - `AllowedHosts`: `api.curasphere.com` [CONFIRMATION REQUIRED]
3. **Launch Container Instance & Verify Health Probe:**
   Once container starts, test health endpoints immediately:
   ```bash
   # Composite health check:
   curl -s -i https://api.curasphere.com/health
   # Liveness probe (HTTP 200 OK):
   curl -s -i https://api.curasphere.com/health/live
   # Readiness probe (HTTP 200 OK with database connectivity):
   curl -s -i https://api.curasphere.com/health/ready
   ```
   **STOP CONDITION:** If `/health/ready` does not return HTTP 200 within 60 seconds, halt deployment and inspect container logs.

### Step 3: Frontend Static Asset Deployment
Deploy the static React 18 SPA to Vercel or designated static CDN.

1. **Inject Frontend Production Environment Variables:**
   - `VITE_API_URL`: `https://api.curasphere.com/api` [CONFIRMATION REQUIRED]
   - `VITE_APP_EDITION`: `Clinic`
2. **Execute Clean Build & Deploy:**
   - If using **Vercel**: Deploy via Vercel CLI or linked Git commit on `main`:
     ```bash
     vercel --prod
     ```
   - If using **Docker / Static Nginx**:
     ```bash
     docker build -t curasphere-frontend:v1.0.0-clinic -f frontend/Dockerfile frontend/
     docker push <CONTAINER_REGISTRY_URL>/curasphere-frontend:v1.0.0-clinic
     ```
3. **Verify SPA Routing & Headers:**
   Verify that deep links (e.g., `/patients`, `/appointments`, `/billing`) rewrite properly to `/index.html` without 404 errors.

---

## 4. Stage C: Post-Release Verification & Smoke Testing

Execute these live synthetic smoke tests immediately following deployment. **DO NOT USE REAL PATIENT DATA.**

### Smoke Test Matrix:
1. **Frontend Availability & HTTPS Inspection:**
   - Navigate to `https://clinic.curasphere.com`.
   - Confirm TLS certificate is valid, HTTP redirects to HTTPS, and no mixed-content warnings appear in browser console.
2. **Authentication & Session Handling:**
   - Sign in with synthetic administrator account (`admin@clinic.curasphere.com`).
   - Confirm JWT token is received and stored in session memory (not localStorage).
   - Verify role-based navigation sidebar displays only Clinic Edition modules (Dashboard, Patients, Appointments, Queue, Consultations, Prescriptions, Billing, Reports).
   - Confirm tertiary hospital modules (`ipd`, `emergency`, `surgery`, `icu`) are hidden.
3. **Synthetic Patient Intake & Search:**
   - Register synthetic patient: `PAT-PROD-VERIFY` (DOB: 1985-05-15, Phone: `+1-555-0199`).
   - Confirm deterministic MRN format (`MRN-YYYY-xxxxx`) is assigned.
   - Search for `PAT-PROD-VERIFY` via patient search bar; verify debounced query returns record within 200ms.
4. **Appointment Booking & Conflict Guard:**
   - Book a 15-minute consultation slot with Doctor `DOC-01`.
   - Attempt to book a concurrent overlapping slot for the same doctor; verify the application displays a double-booking conflict warning.
5. **Clinical Consultation & Prescription (CDSS):**
   - Open consultation encounter for `PAT-PROD-VERIFY`.
   - Enter triage vitals (BP: 120/80, Pulse: 72, Temp: 98.6°F) and SOAP narrative.
   - Prescribe a safe medication; verify prescription attaches immutably to the encounter.
   - Finalize encounter; verify encounter transitions to sealed state.
6. **Outpatient Invoicing & Cashier Payment:**
   - Generate outpatient invoice for consultation encounter ($50.00).
   - Process full synthetic cash payment ($50.00).
   - Confirm balance updates to $0.00 atomically.
   - Click "Print Receipt"; verify print preview renders cleanly formatted 80mm POS thermal receipt slip.
7. **Clean Up Synthetic Verification Records:**
   - Mark synthetic test patient as `Status: Test/Archived` using administrative soft-delete to prevent skewing operational clinic metrics.

---

## 5. Stage D: Monitoring, Error Rate & Stop Conditions

For the first 2 hours post-release, monitor system logs and telemetry:

| Metric | Target Threshold | Warning Threshold | Critical Stop Threshold |
|:---|:---|:---|:---|
| **API Error Rate (HTTP 5xx)** | < 0.05% | 0.20% | **> 0.50% (TRIGGER ROLLBACK)** |
| **API Response Latency (p95)** | < 250ms | 500ms | **> 1500ms (INVESTIGATE)** |
| **Database Connection Pool Exhaustion** | 0 active waits | > 5 waits | **Active Pool Exhaustion** |
| **Uncaught Frontend Exceptions** | 0 / min | > 2 / min | **> 5 / min (TRIGGER ROLLBACK)** |
| **Health Check Endpoint (`/health/ready`)** | HTTP 200 OK | Transient non-200 | **2 Consecutive Non-200s** |

---

## 6. Rollback & Forward-Recovery Protocol

If any **Critical Stop Threshold** is breached or a data-corruption defect is discovered:

### Application Rollback (< 10 Minutes):
1. **Halt Incoming Traffic:**
   Redirect frontend routing or DNS to the maintenance page:
   ```bash
   # If using Cloudflare / Reverse Proxy:
   # Enable maintenance mode worker / page
   ```
2. **Revert Frontend Deployment:**
   - In Vercel dashboard or CLI: Instant rollback to previous production deployment:
     ```bash
     vercel rollback <PREVIOUS_DEPLOYMENT_ID>
     ```
3. **Revert Backend Container Image:**
   - Redeploy the previous known-healthy container image tag:
     ```bash
     docker tag <CONTAINER_REGISTRY_URL>/curasphere-api:<PREVIOUS_STABLE_TAG> ...
     # Redeploy container service in Render / AWS ECS
     ```
4. **Verify Health of Rolled-Back System:**
   - Check `/health/ready` to confirm the previous version is serving requests.

### Database Forward-Recovery vs. Restore Decision:
- **Case A — No Schema Breaking Changes (Standard Case):**
  Because the Clinic Edition schema additions are strictly additive (new tables and non-null defaults), **do NOT restore the database** unless data corruption occurred. Simply leave the schema intact; the rolled-back code will continue to function safely.
- **Case B — Severe Data Corruption / Failed Release:**
  If data corruption occurred during deployment before live patient records were created:
  ```bash
  # Restore pre-release database snapshot
  ./scripts/restore-curasphere.sh \
    -h <PROD_DB_HOST> \
    -p 5432 \
    -d curasphere_prod_db \
    -u curasphere_prod_app \
    -f ./backups/pre_release_<TIMESTAMP>.dump
  ```

---

## 7. Post-Release Communication & Sign-Off

Upon successful completion of Stage C and 2 hours of stable Stage D monitoring:

1. **Release Lead:** Issue official release completion notification to clinic leadership.
2. **Clinic Operations Lead:** Notify clinic staff that the Clinic Edition is live and operational.
3. **Archive Release Artifacts:** Log deployment timestamps, git commit hashes, and backup artifact URIs in `docs/clinic-edition/`.
