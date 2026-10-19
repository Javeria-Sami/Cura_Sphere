# CuraSphere Clinic Edition — Staging Infrastructure Owner Action Checklist

**Document ID:** `DOC-CE-070`  
**Project:** CuraSphere Hospital Management System  
**Edition:** Clinic Edition ONLY  
**Session:** 41  
**Date:** 2026-10-19  
**Author:** Senior DevOps Engineer, ASP.NET Core Deployment Specialist, PostgreSQL Administrator, Application Security Engineer, QA Lead & Release Manager  
**Status:** Actionable Infrastructure Handoff Package  
**Current Staging State:** **`BLOCKED — OWNER INFRASTRUCTURE NOT PROVISIONED`**

---

## 1. Purpose & Scope

This document provides a concise, provider-neutral, ordered checklist of the exact actions the project owner must perform to provision the staging environment for the **CuraSphere Clinic Edition**.

The application codebase, container configurations, and migration scripts are 100% verified and staging-ready. Remote deployment is currently held at the pre-deployment safety gate awaiting cloud infrastructure provisioning ([`DOC-CE-069`](file:///c:/Users/LENOVO/Downloads/-CuraSphere-HMS-DevelopbyUzaii-main/-CuraSphere-HMS-DevelopbyUzaii-main/docs/clinic-edition/69-session40-staging-deployment-and-verification-report.md)).

Completing this checklist provides the engineering panel with the target environment required to execute the staging deployment, run remote smoke tests, and hand off the application to the Medical Director for formal clinical UAT ([`DOC-CE-067`](file:///c:/Users/LENOVO/Downloads/-CuraSphere-HMS-DevelopbyUzaii-main/-CuraSphere-HMS-DevelopbyUzaii-main/docs/clinic-edition/67-clinical-uat-execution-and-signoff-plan.md)).

---

## 2. Ordered Owner Action Checklist

### Action 1 — Provision Managed PostgreSQL 16 Database

The project owner must provision a managed PostgreSQL instance on any modern cloud database provider (e.g., Supabase, Neon, AWS RDS, Azure Database for PostgreSQL, or DigitalOcean Managed Databases).

- [ ] **1.1 Engine Version:** Select **PostgreSQL 16** (compatible with Npgsql 8.x and EF Core 8.0).
- [ ] **1.2 Database Name:** Create an isolated staging database named `curasphere_staging_db` (must NOT share or reuse any production database).
- [ ] **1.3 Compute & Storage Sizing:** 
  - Staging compute tier: Minimum 1 vCPU / 1 GB RAM (e.g., free/hobby tier on Neon/Supabase, or `db.t4g.micro` on AWS).
  - Storage: Minimum 5 GB SSD storage with auto-expansion enabled.
- [ ] **1.4 SSL/TLS Enforcement:** Ensure SSL connections are strictly enforced (`sslmode=require`).
- [ ] **1.5 User & Role Permissions:** Create an application user `curasphere_app` with `CONNECT`, `CREATE`, and DDL privileges on `curasphere_staging_db`. Do not use the superuser account for the running application.
- [ ] **1.6 Migration Strategy Selection:** Decide whether migrations are applied:
  - *Option A (Automated on API Startup — Recommended for Staging):* Set environment variable `Database__ApplyMigrationsOnStartup=true`.
  - *Option B (Pre-Deployment CI/CD Pipeline):* Run `dotnet ef database update` via GitHub Actions before launching container.
- [ ] **1.7 Automated Backups:** Enable daily automated backups with at least 7-day point-in-time retention.
- [ ] **1.8 Secure Connection String Extraction:** Securely record the standard Npgsql connection string format:
  ```text
  Host=<host>;Port=5432;Database=curasphere_staging_db;Username=curasphere_app;Password=<secure-password>;SslMode=Require;Trust Server Certificate=false;
  ```
  *(Store securely in password manager / secret store; never commit to Git or paste in unencrypted chat).*

---

### Action 2 — Provision ASP.NET Core API Container Hosting

The backend API is an ASP.NET Core 8 Web API containerized via the multi-stage [`backend/CuraSphere.Api/Dockerfile`](file:///c:/Users/LENOVO/Downloads/-CuraSphere-HMS-DevelopbyUzaii-main/-CuraSphere-HMS-DevelopbyUzaii-main/backend/CuraSphere.Api/Dockerfile), running under Alpine Linux as non-root user `app` (UID 1654).

- [ ] **2.1 Hosting Service Selection:** Choose a container hosting platform (e.g., Render Web Service, AWS ECS Fargate, Azure Container Apps, Google Cloud Run, or Railway).
- [ ] **2.2 Source Connection:** Connect the hosting service to the GitHub repository:
  - Repository: `-CuraSphere-HMS-DevelopbyUzaii-main`
  - Target Branch: `feature/clinic-edition`
  - Dockerfile Path: `backend/CuraSphere.Api/Dockerfile`
  - Docker Context: `backend/`
- [ ] **2.3 Port Configuration:** Configure the container listening port to **`5000`** (matching `ENV ASPNETCORE_URLS=http://+:5000` defined in the Dockerfile).
- [ ] **2.4 Resource Limits:** Allocate minimum 0.5 vCPU and 512 MB RAM.
- [ ] **2.5 Health Check Endpoints:** Configure the container platform health probe:
  - Liveness Probe Path: **`/health/live`** (HTTP 200 confirms process is responsive; anonymous access).
  - Readiness Probe Path: **`/health/ready`** (HTTP 200 confirms database socket is reachable; anonymous access).
  - Composite Health Path: **`/health`** (returns overall health JSON).
- [ ] **2.6 Environment Variable Injection (Names only — inject via platform secret manager):**
  - `ASPNETCORE_ENVIRONMENT` = `Staging`
  - `ConnectionStrings__DefaultConnection` = `<Managed PostgreSQL connection string from Action 1>`
  - `Database__ApplyMigrationsOnStartup` = `true`
  - `Edition__DefaultEdition` = `Clinic`
  - `Jwt__Secret` = `<Cryptographically secure 256-bit key from Action 4>`
  - `Jwt__Issuer` = `CuraSphere.Api`
  - `Jwt__Audience` = `CuraSphere.Web`
  - `Jwt__ExpiryMinutes` = `60`
  - `Cors__AllowedOrigins` = `https://<frontend-staging-url>` *(see Action 3)*
- [ ] **2.7 Logging & Error Suppression:** Ensure platform captures stdout/stderr logs. In staging, `RequestLoggingMiddleware` strips tokens and credentials and attaches `X-Correlation-ID`.
- [ ] **2.8 Restart Policy:** Set container restart policy to `Always` or `On-Failure`.

---

### Action 3 — Configure Frontend Staging Deployment

The frontend is a React 19 + TypeScript SPA built with Vite. It compiles cleanly to `frontend/dist/` (`tsc -b && vite build` in 1.08s).

- [ ] **3.1 Hosting Platform Selection:** Connect frontend to Vercel (recommended for Vite SPAs), Cloudflare Pages, Netlify, or AWS Amplify.
- [ ] **3.2 Build Settings Configuration:**
  - Root Directory: `frontend`
  - Framework Preset: `Vite`
  - Build Command: `npm run build`
  - Output Directory: `dist`
  - Node.js Version: `20.x`
- [ ] **3.3 SPA Client Routing Fallback:** Verify SPA single-page routing:
  - If deploying to Vercel, the repository's [`frontend/vercel.json`](file:///c:/Users/LENOVO/Downloads/-CuraSphere-HMS-DevelopbyUzaii-main/-CuraSphere-HMS-DevelopbyUzaii-main/frontend/vercel.json) handles `try_files` route rewrites to `/index.html`.
- [ ] **3.4 Environment Variable Injection:**
  - `VITE_API_URL` = `https://<backend-staging-url>` *(Verified: `frontend/src/lib/api.ts` accepts `VITE_API_URL` or `VITE_API_BASE_URL` and appends `/api` automatically).*
  - `VITE_APP_EDITION` = `Clinic` *(Verified: `frontend/src/stores/editionStore.ts` enforces Clinic mode).*
- [ ] **3.5 Capture Temporary Staging URL:** Once deployed, record the generated HTTPS URL (e.g., `https://curasphere-staging.vercel.app`) to update the backend `Cors__AllowedOrigins` in Action 2.

---

### Action 4 — Cryptographic Key & Secret Security

- [ ] **4.1 Strong JWT Signing Secret:** Generate a random 256-bit (32-byte) secret key using a cryptographically secure generator:
  ```bash
  openssl rand -base64 32
  ```
  *(Verification note: `backend/CuraSphere.Api/Program.cs` and `JwtSettings.Validate()` will terminate application startup if the key is under 32 characters).*
- [ ] **4.2 Zero Secrets in Git:** Never commit secrets to repository files, `.env` files, or pull requests. Inject exclusively via the cloud platform’s environment settings / secret manager.
- [ ] **4.3 Least-Privilege Database User:** Ensure `curasphere_app` possesses DDL and DML on `curasphere_staging_db` only, with no access to system schemas or other databases.
- [ ] **4.4 Synthetic Test Data Only:** Verify no production database backups or real patient identifying information (PII/PHI) are ever restored into staging.

---

### Action 5 — DNS and TLS Strategy Decision

- [ ] **5.1 Temporary Provider HTTPS (Recommended for Initial Validation):**
  - Use default platform TLS domains:
    - Frontend: `https://curasphere-staging.vercel.app` (TLS handled automatically by Vercel).
    - Backend: `https://curasphere-staging-api.onrender.com` (TLS handled automatically by Render).
  - *Advantage:* Zero DNS modifications, zero domain registration costs, instant HTTPS.
- [ ] **5.2 Custom Staging Domain (Optional Post-Validation):**
  - If custom branding is required before clinical sign-off:
    - Frontend: `https://staging.curasphere.health` (CNAME to `cname.vercel-dns.com`).
    - Backend: `https://staging-api.curasphere.health` (CNAME to Render/AWS hostname).
  - Add DNS records only after initial staging deployment is verified.

---

### Action 6 — Owner Approvals, Budget & Clinical Panel Designation

The project owner must finalize the following decisions:

- [ ] **6.1 Provider Selection Approval:** Confirm selected hosting and database providers.
- [ ] **6.2 Cloud Budget Confirmation:** Confirm acceptance of estimated monthly staging hosting costs:
  - *Tier 1 (Free / Hobby):* $0/mo (Vercel Hobby + Render Free/Starter + Neon Free Tier).
  - *Tier 2 (Reliable Managed Staging):* ~$14–$34/mo (Vercel Pro $20 + Render Starter $7 + Neon Launch $19 or Supabase $0–$25).
- [ ] **6.3 Deployment Authorization:** Formally authorize the engineering panel to trigger the staging deployment once resources are provisioned.
- [ ] **6.4 Clinical Stakeholder Designation:** Appoint and notify the clinical walkthrough panel for the 90-minute evaluation ([`DOC-CE-067`](file:///c:/Users/LENOVO/Downloads/-CuraSphere-HMS-DevelopbyUzaii-main/-CuraSphere-HMS-DevelopbyUzaii-main/docs/clinic-edition/67-clinical-uat-execution-and-signoff-plan.md)):
  - **Medical Director / Senior Physician:** Clinical SOAP and CDSS review.
  - **Clinic Practice Manager:** Workflow orchestration and appointment management.
  - **Head Nurse / Triage Lead:** Patient check-in, vitals recording, and BMI verification.
  - **Receptionist:** Walk-in registration, scheduling, and token issuance.
  - **Cashier:** Outpatient invoice billing, multi-channel payment, and 80mm slip printing.

---

## 3. Summary of Staging Prerequisites Still Required from Owner

| Owner Action | Deliverable Expected | Impact on Release Gating |
| :--- | :--- | :--- |
| **PostgreSQL 16 Instance** | Connection string with SSL enforced | Resolves `BLK-REL-01` persistence prerequisite |
| **API Container Service** | Live backend service on port 5000 with env vars | Resolves `BLK-REL-01` application hosting prerequisite |
| **Frontend Project Link** | Vercel project with `VITE_API_URL` injected | Resolves `BLK-REL-01` client routing prerequisite |
| **Deployment Authorization** | Explicit approval to deploy to staging | Unlocks Phase E Staging Activation Gate |
| **Clinical Panel Availability** | Confirmed 90-min window for Medical Director | Unlocks Phase F Clinical Walkthrough (`BLK-REL-02`) |
