# CuraSphere Clinic Edition — Staging Infrastructure Provisioning Guide

**Document ID:** `DOC-CE-073`  
**Project:** CuraSphere Hospital Management System  
**Edition:** Clinic Edition ONLY  
**Session:** 43  
**Date:** 2026-10-19  
**Author:** Cloud Solutions Architect, DevOps Engineer, ASP.NET Core Deployment Specialist, PostgreSQL Administrator, Application Security Engineer & Release Manager  
**Status:** Approved for Implementation  
**Target Audience:** Project Owner, Cloud Infrastructure Administrator & Deployment Engineering Panel

---

## 1. Architecture Overview

The CuraSphere Clinic Edition is built on a decoupled, cloud-ready three-tier architecture. To establish a secure and isolated staging environment, the three tiers must be provisioned and interconnected as follows:

```
[Client Tier]
  Vercel Edge Network (or Static CDN)
  React 19 + TypeScript + Vite SPA
  Staging Host: https://curasphere-staging.vercel.app
         │
         │  HTTPS / REST / JSON (Bearer JWT + X-Correlation-ID)
         ▼
[Application Tier]
  Render Web Service / AWS ECS Fargate
  ASP.NET Core 8 Web API (Alpine Container, USER app UID 1654, Port 5000)
  Staging Host: https://curasphere-staging-api.onrender.com
  Health Probes: /health, /health/live, /health/ready
         │
         │  PostgreSQL TCP Wire Protocol (SSL Required: sslmode=require)
         ▼
[Persistence Tier]
  Managed PostgreSQL 16 (Render / Neon / Supabase / AWS RDS)
  Database: curasphere_staging_db
  User: curasphere_app (Least-privilege DDL/DML)
  Automated Daily Backups & Point-in-Time Recovery
```

### Critical Architecture Principles:
1. **Strict Staging Isolation:** The staging database (`curasphere_staging_db`) must be completely isolated from production. No production backups, patient identifying data (PII), or live credentials may ever enter this environment.
2. **Explicit Communication Paths:** The frontend communicates strictly with the staging API endpoint. The backend API communicates strictly with the staging PostgreSQL database.
3. **Provider-Generated HTTPS:** Initial staging validation utilizes the hosting platform's automatic, managed TLS certificates (`.vercel.app` and `.onrender.com`), eliminating DNS propagation delays and domain acquisition costs.

---

## 2. Prerequisite Checklist

Before starting the provisioning sequence, the project owner must ensure the following are available:

- [ ] **GitHub Repository Access:** Administrative or collaborator access to the `-CuraSphere-HMS-DevelopbyUzaii-main` repository on branch `feature/clinic-edition`.
- [ ] **Cloud Hosting Accounts:** An account on the chosen hosting providers (e.g., Render and Vercel, or AWS).
- [ ] **Staging Budget Approval:** Confirmation of the chosen hosting tier (e.g., $0/mo free tier for initial smoke tests, or ~$14–$34/mo for reliable managed staging).
- [ ] **Designated Cloud Admin:** The person responsible for holding the master billing and administrative credentials.
- [ ] **Zero Secrets in Chat/Git:** Commitment to store credentials exclusively in platform secret managers, never in Git, unencrypted chat, or public repositories.

---

## 3. Comparative Architecture & Hosting Evaluation

To identify the simplest, most cost-effective path to an operational staging environment, three architectures were evaluated against CuraSphere's actual repository requirements:

| Evaluation Dimension | Option 1: Multi-Provider Developer Cloud (Vercel + Render + Neon/Supabase) | Option 2: Unified Developer Cloud (Vercel + Render Web Service & Render PostgreSQL) | Option 3: Full Enterprise Cloud (AWS S3/CloudFront + ECS Fargate + AWS RDS) |
| :--- | :--- | :--- | :--- |
| **Code Compatibility** | **100% Native** (Vite preset, Dockerfile on Alpine, Npgsql 8.x) | **100% Native** (Same as Option 1) | **100% Native** (Requires ECR push + task def) |
| **Setup Complexity** | **Low** (Web UI dashboard setup; ~25 minutes) | **Very Low** (Single platform for API & DB; ~15 minutes) | **High** (VPC, subnets, IAM, security groups, ALB; ~3 hours) |
| **Estimated Monthly Cost** | Free Tier: **$0/mo**; Paid: **~$26–$34/mo** *(Vercel $20 + Render $7 + Neon $19)* | Free/Starter: **~$14–$34/mo** *(Render Starter API $7 + Render DB $7 + Vercel $0–$20)* | Standard Staging: **~$50–$75/mo** *(ECS Fargate $25 + RDS db.t4g.micro $20 + ALB $20)* |
| **Free-Tier Limits** | Render free tier spins down after 15m; Neon free tier sleeps | Render free DB expires in 30 days; Starter DB ($7/mo) persistent | AWS 12-month free tier (t4g.micro / 750 hrs), then standard rates |
| **Database Backups** | Automated daily snapshots + PITR on Neon/Supabase | Automated daily backups on Render paid tiers | Automated daily snapshots + PITR on AWS RDS |
| **Security Controls** | Secret Manager, TLS 1.3, SSL-enforced DB wire | Internal private networking between API and DB | IAM, security groups, private VPC subnets |
| **Ease of Teardown** | 1-click project deletion | 1-click service & database deletion | Multi-step deletion (ALB, target groups, ECS, RDS, VPC) |
| **Recommendation** | **Highly Viable (Alternative)** | **RECOMMENDED (Simplest & Best Value)** | **Over-engineered for Staging UAT** |

### Recommended Choice: Option 2 (Unified Render + Vercel)
**Rationale:** Hosting both the ASP.NET Core API and the managed PostgreSQL database on Render minimizes operational overhead, provides automatic internal private networking (avoiding public database exposure), costs only ~$14/mo on reliable starter tiers, and pairs seamlessly with Vercel's zero-config Vite frontend hosting.

---

## 4. Step-by-Step Provisioning Instructions

### Track A: Managed PostgreSQL 16 Provisioning

1. **Create the Database Instance:**
   - Log in to your database provider (e.g., Render Dashboard $\to$ **New +** $\to$ **PostgreSQL**, or Neon Console $\to$ **Create Project**).
   - **Name:** `curasphere-staging-postgres`
   - **Database Name:** `curasphere_staging_db`
   - **User:** `curasphere_app`
   - **PostgreSQL Version:** **16**
   - **Region:** Select the region closest to your clinic (e.g., `Frankfurt (EU Central)` or `Oregon (US West)`).
   - **Plan Tier:** Starter tier ($7/mo on Render, or Launch on Neon) to ensure persistent storage without 30-day trial deletion.
2. **Enforce SSL/TLS:**
   - Ensure the database connection mode mandates SSL (`sslmode=require`).
3. **Capture Connection Strings:**
   - Provider will generate two connection strings:
     - **Internal Connection String:** Used if API is on the same platform (Render $\to$ Render).
     - **External Connection String:** Standard Npgsql format for external migrations:
       ```text
       Host=<host>;Port=5432;Database=curasphere_staging_db;Username=curasphere_app;Password=<password>;SslMode=Require;Trust Server Certificate=false;
       ```
   - Store this string immediately in a secure password manager.

---

### Track B: ASP.NET Core 8 API Container Provisioning

1. **Create the Web Service:**
   - On Render Dashboard $\to$ **New +** $\to$ **Web Service**.
   - Connect repository: `-CuraSphere-HMS-DevelopbyUzaii-main`.
   - Branch: `feature/clinic-edition`.
   - **Runtime:** **Docker**.
   - **Dockerfile Path:** `backend/CuraSphere.Api/Dockerfile`.
   - **Docker Context:** `backend/`.
   - **Region:** Match database region.
   - **Instance Type:** Starter (0.5 vCPU, 512 MB RAM, $7/mo).
2. **Configure Port & Health Probes:**
   - Environment variables / settings $\to$ Port: **`5000`**.
   - Health Check Path: **`/health/live`**.
3. **Inject Environment Variables (via Platform Environment Settings):**
   *(Do NOT commit these values to Git)*

   | Variable Name | Staging Value | Purpose |
   | :--- | :--- | :--- |
   | `ASPNETCORE_ENVIRONMENT` | `Staging` | Activates staging logging, ProblemDetails error masking, and CORS |
   | `ConnectionStrings__DefaultConnection` | `<PostgreSQL Connection String from Track A>` | Primary database connection with SSL enforced |
   | `Database__ApplyMigrationsOnStartup` | `true` | Triggers automatic idempotent EF Core schema creation on launch |
   | `Edition__DefaultEdition` | `Clinic` | Enforces Clinic Edition feature matrix and route filtering |
   | `Jwt__Secret` | `<Generated 256-bit Key from Track D>` | Cryptographic token signing (minimum 32 characters) |
   | `Jwt__Issuer` | `CuraSphere.Api` | Token issuer claim validation |
   | `Jwt__Audience` | `CuraSphere.Web` | Token audience claim validation |
   | `Jwt__ExpiryMinutes` | `60` | Token session validity |
   | `Cors__AllowedOrigins` | `https://curasphere-staging.vercel.app` | Restricts API access exclusively to the staging frontend |

4. **Deploy and Capture API Hostname:**
   - Click **Create Web Service**.
   - Once deployed, copy the service URL: `https://curasphere-staging-api.onrender.com`.

---

### Track C: Frontend SPA Provisioning (Vercel)

1. **Import Project into Vercel:**
   - On Vercel Dashboard $\to$ **Add New...** $\to$ **Project**.
   - Import repository: `-CuraSphere-HMS-DevelopbyUzaii-main`.
2. **Configure Build Settings:**
   - **Framework Preset:** `Vite`
   - **Root Directory:** Edit $\to$ select `frontend` $\to$ Continue.
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm ci`
3. **Inject Environment Variables:**
   - `VITE_API_URL` = `https://curasphere-staging-api.onrender.com`
   - `VITE_APP_EDITION` = `Clinic`
4. **Deploy and Verify:**
   - Click **Deploy**. Vercel will build and deploy the SPA in ~45 seconds.
   - Record the production staging URL: `https://curasphere-staging.vercel.app`.
5. **Cross-Update CORS:**
   - If the generated Vercel URL differs from the value set in Track B, update `Cors__AllowedOrigins` on Render and trigger a zero-downtime redeploy.

---

### Track D: Cryptographic Key Generation

Before configuring the backend container, generate a cryptographically strong 256-bit signing key on any terminal:

```bash
openssl rand -base64 32
```
*Example generated key (Format illustration only — generate your own):*
`d8G7vK9+mX4qW2zP1rT8yU3vN6bA5cE0xZ9lQ8wK7jM=`

*Security Rule:* Startup validation in `JwtSettings.Validate()` will immediately terminate the application if this key is shorter than 32 characters.

---

## 5. End-to-End Owner Action Sequence

| Step | Responsible Party | Action Required | Verification Evidence | Blocker if Incomplete |
| :-: | :--- | :--- | :--- | :--- |
| **1** | **Project Owner** | Select provider architecture (Option 2 recommended). | Confirmed choice. | Blocks resource creation. |
| **2** | **Project Owner** | Approve monthly staging budget (~$14–$34/mo). | Billing method attached to provider. | Blocks cloud instance allocation. |
| **3** | **Project Owner** | Provision PostgreSQL 16 database (`curasphere_staging_db`). | Connection string in password manager. | Blocks database schema migration. |
| **4** | **Project Owner** | Provision ASP.NET Core container service on port 5000. | Service URL generated on Render/AWS. | Blocks API execution. |
| **5** | **Project Owner** | Inject environment variables securely via dashboard. | All 9 variables present in dashboard. | Blocks API startup & DB link. |
| **6** | **Project Owner** | Link `frontend/` to Vercel with `VITE_API_URL`. | Vercel URL generated and live. | Blocks client access. |
| **7** | **Project Owner** | Provide deployment engineer with deployment access. | Access granted / deployment triggered. | Blocks verification smoke tests. |
| **8** | **Engineering Panel** | Execute Phase E Staging Activation Protocol. | All 13 smoke tests passed (SMK-01 to 13). | Blocks clinical handover. |
| **9** | **Medical Director** | Execute 90-minute Clinical UAT Walkthrough ([`DOC-CE-067`](file:///c:/Users/LENOVO/Downloads/-CuraSphere-HMS-DevelopbyUzaii-main/-CuraSphere-HMS-DevelopbyUzaii-main/docs/clinic-edition/67-clinical-uat-execution-and-signoff-plan.md)). | Signed acceptance certificate. | Blocks production traffic cutover. |

---

## 6. Staging Activation & Verification Protocol for Next Engineering Run

Once Steps 1–7 are completed by the project owner, the engineering panel will immediately execute the following verified protocol:

```
[Step 1: Ingress Verification]
  curl -I https://curasphere-staging.vercel.app
  Expected: HTTP 200, Content-Type: text/html, TLS 1.3 active

[Step 2: Backend Liveness Probe]
  curl -i https://curasphere-staging-api.onrender.com/health/live
  Expected: HTTP 200, "Healthy"

[Step 3: Backend Readiness & DB Socket Probe]
  curl -i https://curasphere-staging-api.onrender.com/health/ready
  Expected: HTTP 200, "Database connectivity operational"

[Step 4: Composite Health Check]
  curl -s https://curasphere-staging-api.onrender.com/health
  Expected: {"status":"Healthy","totalDuration":"...","entries":{...}}

[Step 5: Automated Schema & Seed Verification]
  Inspect container logs for:
  "Applying database migrations..."
  "Seeding database lookups..."
  "Database initialization completed successfully."

[Step 6: Synthetic Authentication & Token Issue]
  POST /api/auth/login with synthetic admin credentials
  Expected: HTTP 200, Bearer token returned with 60-minute expiry

[Step 7: Clinical Workflow Smoke Tests (SMK-01 to SMK-13)]
  Execute automated smoke-test suite against live staging endpoints:
  - Patient registration (MRN auto-generation)
  - Doctor schedule lookup & slot conflict prevention
  - Vitals recording & BMI calculation
  - SOAP narrative consultation encounter creation
  - Electronic prescription issuance with CDSS interaction alert
  - Cashier invoice generation & 80mm thermal receipt rendering
  - RBAC protection (rejection of unauthorized endpoints)

[Step 8: Blocker Register Resolution]
  Update DOC-CE-046: mark BLK-REL-01 as RESOLVED.
  Notify Medical Director that staging is verified and ready for clinical walkthrough.
```

---

## 7. Safe Teardown & Cost Control Instructions

If the staging environment is temporarily decommissioned after clinical acceptance or project milestones:

1. **Non-Destructive Database Dump:** Always execute a full backup before teardown:
   ```bash
   pg_dump "Host=<host>;Port=5432;Database=curasphere_staging_db;Username=curasphere_app;Password=<pwd>;SslMode=Require" -Fc -f staging_teardown_backup.dump
   ```
2. **Pause Web Service:** On Render, click **Suspend Web Service**. Compute billing stops immediately while container definitions and environment variables remain saved.
3. **Retain Staging Database:** Retain the database instance ($7/mo) to preserve test datasets, or export the dump and delete the instance if zero monthly cost is mandated.
4. **Zero Production Risk:** Because staging credentials and infrastructure are isolated, teardown actions have zero impact on local code or production environments.
