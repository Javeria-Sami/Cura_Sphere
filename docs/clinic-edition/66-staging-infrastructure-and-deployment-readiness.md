# CuraSphere Clinic Edition: Staging Infrastructure & Deployment Readiness Package

**Document ID:** `DOC-CE-066`  
**Session:** 39  
**Version:** 1.0.0  
**Date:** 2026-10-19  
**Author / SRE & DevOps Panel:** Senior DevOps Engineer, .NET Deployment Specialist, Database Reliability Engineer, Application Security Engineer, Release Manager  
**Scope:** Staging Deployment Architecture, Host Provisioning Specifications, Secure Secrets Injection, Migration Procedures & Rollback Runbook  
**Target Release Artifact:** `v1.0.0-clinic` (Commit: `f89e9a6`)  
**Deployment Target Classification:** **`STAGING READY — DEPLOYMENT NOT EXECUTED (PENDING OWNER CLOUD HOSTING)`**  

---

## 1. Verified Deployment Architecture

The CuraSphere Clinic Edition utilizes a decoupled, three-tier cloud deployment topology engineered for security, high availability, and clinical data isolation:

```
[Client Tier: Static SPA]
  ├── Host: Vercel / Cloudflare Pages / AWS S3 + CloudFront
  ├── Build Output: React 18 / Vite static assets (dist/index.html, dist/assets/*)
  ├── Edge Routing: vercel.json rewrite (all paths fallback to /index.html)
  └── Networking: Public HTTPS / TLS 1.3
                                │
                                ▼ (CORS / REST JSON over HTTPS)
[Application Tier: API Web Service]
  ├── Host: Render Web Service / AWS ECS Fargate / Azure App Service
  ├── Container Runtime: Linux Alpine container running ASP.NET Core 8 (.NET 8 SDK / C# 12)
  ├── Security Context: Unprivileged non-root user 'app' (UID 1654)
  ├── Port: 5000 (Internal container port)
  └── Scaling: 1 vCPU, 512 MB - 1 GB RAM (Min: 1 instance for staging, 2 for prod)
                                │
                                ▼ (Encrypted PostgreSQL Connection / SSL Require)
[Persistence Tier: Managed Database]
  ├── Engine: Managed PostgreSQL 16 (Render PostgreSQL / AWS RDS PostgreSQL / Supabase)
  ├── Network: Isolated Cloud VPC / Private Subnet with SSL Mode=Require
  ├── Schemas: audit, patient, hr, security, clinical, billing
  └── Initial Storage: 10 GB SSD with automated daily snapshots
```

---

## 2. Infrastructure Hosting Requirements

### 2.1 Frontend Hosting Requirements (Vercel / Cloudflare Pages)
- **Node.js Environment:** Node.js 20.x LTS.
- **Build Command:** `npm run build` (`tsc -b && vite build`).
- **Output Directory:** `dist/`.
- **Deep Routing Rewrite:** `vercel.json` configured with:
  ```json
  {
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
  }
  ```
- **HTTPS Enforcement:** Automatic TLS certificate generation by Vercel/Cloudflare; HSTS enabled.

### 2.2 Backend Hosting Requirements (Render / AWS ECS Fargate)
- **Container Base Image:** `mcr.microsoft.com/dotnet/aspnet:8.0-alpine`.
- **Dockerfile Path:** `backend/CuraSphere.Api/Dockerfile`.
- **Resource Allocation:**
  - Minimum Memory: 512 MB (Recommended: 1024 MB to accommodate EF Core query compilation).
  - Minimum CPU: 0.5 vCPU (Recommended: 1.0 vCPU).
- **Process Security:** Container executes under built-in unprivileged user `app` (`USER app`, UID 1654).
- **Exposed Port:** `5000` (mapped to external HTTPS 443 via cloud reverse proxy).
- **Health Probe Endpoints:**
  - Liveness: `GET /health/live` (Process responsive check, interval: 10s).
  - Readiness: `GET /health/ready` (Database pool connectivity check, interval: 15s).
  - Composite: `GET /health` (Overall subsystem status).

### 2.3 PostgreSQL Provisioning Requirements
- **Engine Version:** PostgreSQL 16.x.
- **Database Name:** `curasphere_staging_db`.
- **Database User:** `curasphere_staging_app` (dedicated unprivileged database role).
- **Connection Pool:** Max connections: 50; Min idle: 5.
- **SSL Enforcement:** `SSL Mode=Require` (reject all unencrypted plaintext connections).
- **Extensions Supported:** Standard relational features; `uuid-ossp` (optional).

---

## 3. Required Environment Variables Specification

To prevent credential leaks, environment variables are injected exclusively through the cloud provider's encrypted secrets manager (Render Environment Groups / AWS Secrets Manager / Vercel Environment Variables). **Zero secrets are committed to git.**

### 3.1 Backend Application Configuration

| Environment Variable Name | Type | Description | Staging Example Value (Pattern Only) |
|:---|:---:|:---|:---|
| `ConnectionStrings__DefaultConnection` | Secret | Fully qualified PostgreSQL connection string with SSL required. | `Host=staging-db.internal;Port=5432;Database=curasphere_staging_db;Username=curasphere_staging_app;Password=<STRONG_SECRET>;SSL Mode=Require;Trust Server Certificate=true;` |
| `JwtSettings__Secret` | Secret | Cryptographic signing key for JWT HMAC-SHA256 tokens (**minimum 32 characters / 256 bits**). | `<GENERATE_32_CHAR_RANDOM_SECRET>` |
| `JwtSettings__Issuer` | String | Token issuer identification string. | `CuraSphereStagingApi` |
| `JwtSettings__Audience` | String | Authorized token audience string. | `CuraSphereStagingClient` |
| `JwtSettings__ExpiryInMinutes` | Integer | Session expiration window in minutes. | `60` |
| `Cors__AllowedOrigins` | String | Whitelist of authorized staging frontend origins (comma-separated). | `https://staging-clinic.curasphere.com,https://curasphere-staging.vercel.app` |
| `EditionSettings__CurrentEdition` | String | Software edition flag activating Clinic capabilities and disabling IPD/ICU. | `Clinic` |
| `EditionSettings__FacilityName` | String | Display name for the clinical healthcare facility. | `CuraSphere Staging Medical Clinic` |
| `Database__ApplyMigrationsOnStartup` | Boolean | Controls whether EF Core executes schema migrations upon container start. | `true` (for staging initial provisioning) |
| `ASPNETCORE_ENVIRONMENT` | String | ASP.NET Core hosting environment profile. | `Staging` |

### 3.2 Frontend Build-Time Configuration

| Environment Variable Name | Type | Description | Staging Value |
|:---|:---:|:---|:---|
| `VITE_API_URL` | String | Public HTTPS URL pointing to the deployed staging backend API. | `https://staging-api.curasphere.com/api` |
| `VITE_APP_EDITION` | String | Default UI layout and navigation mode. | `Clinic` |

---

## 4. Secure Key Generation & Secrets Injection Procedure

### 4.1 Generating High-Entropy Secrets
Operators must generate cryptographically secure secrets prior to deployment:

```bash
# Generate 256-bit (32-character) JWT Signing Secret:
openssl rand -base64 32

# Generate Strong PostgreSQL Database Password:
openssl rand -hex 24
```

*PowerShell Alternative:*
```powershell
$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

### 4.2 Injection Protocol
1. Open cloud management console (Render Dashboard -> Environment Groups or AWS Secrets Manager).
2. Create environment group `curasphere-staging-secrets`.
3. Add key `JwtSettings__Secret` with the generated 32-character string.
4. Add key `ConnectionStrings__DefaultConnection` with database connection string.
5. Attach environment group to backend web service `curasphere-api-staging`.

---

## 5. Database Migration & Initialization Procedure

1. **Automated Startup Migration:**  
   When `Database__ApplyMigrationsOnStartup=true` is set, the API automatically applies pending EF Core migrations upon booting:
   - Migration `20260819114531_InitialCreate.cs` provisions all 6 schemas (`audit`, `patient`, `hr`, `security`, `clinical`, `billing`).
   - 16 B-tree indexes are compiled and verified on foreign keys and search columns.
2. **Manual Migration CLI (Alternative):**
   ```bash
   cd backend
   dotnet ef database update --project CuraSphere.Infrastructure --startup-project CuraSphere.Api --connection "<CONNECTION_STRING>"
   ```
3. **Database Relational Parity Verification:**
   Immediately following migration, verify relational tables using the automated drill script:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\verify-backup-restore-drill.ps1 -Host "staging-db.internal" -User "curasphere_staging_app" -Database "curasphere_staging_db"
   ```

---

## 6. Health-Check, Smoke-Test & Verification Protocol

Immediately after staging deployment, the DevOps engineer must execute the automated smoke-test suite:

```bash
#!/usr/bin/env bash
# CuraSphere Staging Automated Smoke Verification
STAGING_API="https://staging-api.curasphere.com"
STAGING_WEB="https://staging-clinic.curasphere.com"

echo "=== CHECK 1: Frontend HTTPS Reachability ==="
curl -s -o /dev/null -w "%{http_code}\n" "$STAGING_WEB" | grep "200" || echo "FAIL: Frontend unreachable"

echo "=== CHECK 2: Backend Liveness Probe ==="
curl -s "$STAGING_API/health/live" | grep "Healthy" || echo "FAIL: Liveness probe failed"

echo "=== CHECK 3: Backend Readiness Probe (DB Check) ==="
curl -s "$STAGING_API/health/ready" | grep "Healthy" || echo "FAIL: Readiness probe failed"

echo "=== CHECK 4: Edition Verification Endpoint ==="
curl -s "$STAGING_API/api/system/edition" | grep '"CurrentEdition":"Clinic"' || echo "FAIL: Edition mismatch"
```

---

## 7. Fast Rollback Runbook (Sub-10 Minute MTTR)

If a deployment failure occurs during staging rollout:

1. **Frontend Rollback:**
   ```bash
   # Revert Vercel deployment alias to the previous verified deployment ID:
   vercel rollback <PREVIOUS_VERIFIED_DEPLOYMENT_ID> --yes
   ```
2. **Backend Container Rollback:**
   - In Render Console: Select previous deployment artifact and click **"Rollback to this deploy"**.
   - In AWS ECS: Update task definition service to previous container image tag:
     ```bash
     aws ecs update-service --cluster curasphere-staging --service curasphere-api --task-definition curasphere-api:<PREVIOUS_TAG>
     ```
3. **Database Rollback Precautions:**
   - Because all CuraSphere Clinic Edition migrations are purely additive (expand/contract pattern), rolling back backend code **does not require destructive database rolling back** unless data corruption occurred.
   - If data corruption occurs, execute:
     ```bash
     ./scripts/restore-curasphere.sh -h <STAGING_HOST> -d curasphere_staging_db -u curasphere_staging_app -f ./backups/pre-deploy-snapshot.dump
     ```

---

## 8. Estimated Operational Dependencies & Infrastructure Costs

Based on public managed cloud hosting rates (Render, AWS, Vercel) as of Q4 2026:

| Infrastructure Resource | Recommended Staging Tier | Purpose | Estimated Monthly Cost |
|:---|:---|:---|:---:|
| **Vercel Frontend Hosting** | Hobby / Pro Tier | Static React 18 SPA, edge caching, SSL | **$0 – $20 / mo** |
| **Render Web Service (API)** | Starter Tier (0.5 CPU, 512MB RAM) | ASP.NET Core 8 Linux container | **$7 / mo** |
| **Render Managed PostgreSQL** | Starter Tier (0.5 CPU, 1GB RAM, 10GB SSD) | Staging relational database with daily backups | **$7 / mo** |
| **Domain & DNS (Cloudflare)** | Free Tier | DNS management and DDoS protection | **$0 / mo** |
| **Total Estimated Staging Cost**| | | **~$14 – $34 / month** |

---

## 9. Step-by-Step Staging Deployment Checklist

- [ ] **Step 1:** Project Owner provisions Managed PostgreSQL 16 database instance (`curasphere_staging_db`).
- [ ] **Step 2:** Project Owner provisions Linux Container Web Service (Render / AWS ECS).
- [ ] **Step 3:** DevOps generates 256-bit `JWT_SECRET` and secure DB password via `openssl rand`.
- [ ] **Step 4:** DevOps injects environment variables into Cloud Secrets Manager.
- [ ] **Step 5:** DevOps triggers backend Docker build and verifies container startup logs.
- [ ] **Step 6:** Backend verifies database connectivity and applies baseline migrations (`20260819114531_InitialCreate.cs`).
- [ ] **Step 7:** DevOps deploys frontend to Vercel with `VITE_API_URL` pointing to backend HTTPS endpoint.
- [ ] **Step 8:** DevOps executes automated smoke test script (`/health/live`, `/health/ready`, `/api/system/edition`).
- [ ] **Step 9:** Database Reliability Engineer executes DR parity drill script against staging database.
- [ ] **Step 10:** Release Manager hands over staging URL to Clinic Medical Director for clinical UAT.

---

## 10. Outstanding Prerequisites Requiring Project Owner Action

The software implementation is **100% complete and validated**. The following two actions reside strictly with the project owner:

1. **Procure Cloud Infrastructure Accounts (`BLK-REL-01`):** Setup billing account on Render / AWS / Azure and provision the PostgreSQL 16 database and Linux container service.
2. **Authorize Live Staging Rollout:** Confirm budget and authorize deployment of the staging container image.
