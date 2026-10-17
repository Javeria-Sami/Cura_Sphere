# CuraSphere Clinic Edition: Production Deployment, Hosting & Release Readiness Guide
**Document Reference:** `docs/clinic-edition/16-deployment-and-release-guide.md`  
**Version:** 1.0.0 (Release Candidate 1)  
**Date:** October 2026  
**Audience:** DevOps Engineers, Cloud Infrastructure Architects, ASP.NET Core Engineers, React/Vite Developers, Database Administrators, Release Managers

---

## 1. Executive Summary & Release Gate Status

### 1.1 Release Gate Classification
Following rigorous pre-deployment inspection, static analysis, container hardening, unit/integration verification, and build auditing, the CuraSphere Clinic Edition is formally classified as:

> **RELEASE GATE STATUS: READY FOR STAGING**

### 1.2 Release Gate Evidence & Justification
| Category | Requirement | Status | Evidence / Notes |
| :--- | :--- | :--- | :--- |
| **Frontend Build** | Zero compile errors, asset minification | **PASSED** | `vite build` completed in 1.48s with 752.48 kB production bundle. |
| **Frontend Code Quality** | Zero linter errors or warnings | **PASSED** | `eslint .` passed with 0 errors and 0 warnings. |
| **Frontend Automated Tests** | 100% test pass rate across all suites | **PASSED** | 10 Vitest test suites, 76 unit/integration tests passing. |
| **Backend Build** | Zero compilation errors on .NET 8 Release | **PASSED** | `dotnet build backend/CuraSphere.slnx -c Release` compiles cleanly. |
| **Backend Domain Tests** | Verification of models, clinic logic | **PASSED** | 22 unit tests passing in `UnitTestRunner.cs`. |
| **Container Security** | Non-root runtime execution | **PASSED** | Backend Dockerfile hardened with unprivileged `USER app` (UID 1654). |
| **Container Liveness** | Isolated health probe without data leak | **PASSED** | Backend exposes `/health` probe; Dockerfile configured with health check. |
| **SPA Routing** | Deep link URL resolution on reload | **PASSED** | Frontend Dockerfile configured with Nginx `try_files $uri $uri/ /index.html`. |
| **Secret Hygiene** | No credentials in repository or bundles | **PASSED** | Zero secrets in Git; sanitized `.env.example` verified. |
| **Production Gate** | Human approval & staging smoke test | **GATED** | Production deployment blocked until staging verification is complete. |

---

## 2. Deployment Architecture

The CuraSphere Clinic Edition uses a decoupled, cloud-ready client-server architecture designed for high availability, enterprise data isolation, and HIPAA-compliant data security.

```
                    +------------------------------------+
                    |       Public Internet / Users      |
                    +------------------------------------+
                                      |
                           HTTPS (TLS 1.3 / Port 443)
                                      |
                                      v
          +------------------------------------------------------+
          |           Edge Layer / CDN / Reverse Proxy           |
          |       (Cloudflare / AWS CloudFront / Nginx)          |
          +------------------------------------------------------+
                 /                                        \
    Static Web Assets (SPA)                          REST API Requests
    /index.html, *.js, *.css                         /api/* & /health
               /                                            \
              v                                              v
+-------------------------------+              +-------------------------------+
|       Frontend Tier           |              |       Backend API Tier        |
|  React 18 + Vite Static Host  |              |   ASP.NET Core 8 Web API      |
|  (Vercel / AWS S3 / Nginx)    |              |  (Containerized: Docker / K8s)|
|  Dynamic VITE_API_URL routing |              |  Non-root 'app' user (p: 5000)|
+-------------------------------+              +-------------------------------+
                                                              |
                                                    Encrypted TLS Connection
                                                    PostgreSQL Port 5432
                                                              |
                                                              v
                                               +-------------------------------+
                                               |        Database Tier          |
                                               |   PostgreSQL 15+ Managed DB   |
                                               |  (AWS RDS / Azure PostgreSQL) |
                                               |   Automated Backups & PITR    |
                                               +-------------------------------+
```

### 2.1 Core Components
1. **Frontend Tier (Client):**
   - Single Page Application built with React 18, TypeScript, Tailwind CSS, Lucide Icons, and Vite.
   - Communicates exclusively over HTTPS with the backend API via configurable `VITE_API_URL`.
   - Served via edge static hosts (e.g., Vercel, AWS S3/CloudFront, Cloudflare Pages) or containerized Nginx with HTML5 push-state routing fallback.
2. **Backend Tier (Application Server):**
   - High-performance ASP.NET Core 8 Web API packaged as an unprivileged, multi-stage Linux container.
   - Listens internally on unprivileged port 5000 (`ASPNETCORE_URLS=http://+:5000`).
   - Implements JSON Web Token (JWT) Bearer authentication, edition-aware tenant filtering, and role-based access control.
   - Provides unauthenticated liveness and readiness probe at `/health`.
3. **Database Tier (Persistence):**
   - PostgreSQL 15+ relational database.
   - Connected via Entity Framework Core with Npgsql driver.
   - Enforces relational foreign keys, unique patient/invoice numbering constraints, and soft-delete/audit metadata.

---

## 3. Hosting Infrastructure Options & Cost Analysis

### 3.1 Recommended Production Hosting Models

| Hosting Option | Frontend Service | Backend Service | Database Service | Target Scale | Est. Monthly Cost Category |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Option A: Container PaaS (Recommended for Staging / Small Clinics)** | Render / Railway / Vercel (Static) | Render Web Service / Railway Container | Managed PostgreSQL (Neon / Railway / Supabase) | 1-5 Concurrent Clinics | Low / Developer Friendly ($20 - $70/mo) |
| **Option B: Cloud Native (Recommended for Enterprise Production)** | AWS CloudFront + S3 | AWS ECS Fargate or Azure Container Apps | AWS RDS PostgreSQL (Multi-AZ) or Azure Database for PostgreSQL | Multi-tenant Enterprise (10-100+ Clinics) | Enterprise Tier ($150 - $500/mo) |
| **Option C: Dedicated On-Premise / Private Cloud** | Nginx Reverse Proxy | Docker Compose / Linux VM Systemd | Dedicated PostgreSQL Instance on Linux VM | High Data Sovereignty Clinics | Hardware amortized / Capex |

*Note: CuraSphere does not auto-provision paid resources. Hosting selection requires formal stakeholder approval.*

---

## 4. Environment Variables & Secret Management

### 4.1 Production Security Rules
1. **Zero Hardcoded Secrets:** All credentials, encryption keys, and connection strings must be supplied via environment variables or secret vaults (AWS Secrets Manager, Azure Key Vault, HashiCorp Vault).
2. **No Backend Secrets in Frontend Bundles:** Never prefix backend database or signing keys with `VITE_`. Vite bakes `VITE_*` strings directly into client JavaScript bundles readable by anyone inspecting browser source code.
3. **Cryptographically Secure Signing Keys:** `JWT_SECRET` must be generated using a cryptographically secure pseudo-random number generator (CSPRNG) with at least 256 bits of entropy (32+ alphanumeric characters).
4. **Environment Isolation:** Development, staging, and production environments must use mutually distinct databases and signing keys.

### 4.2 Comprehensive Environment Variable Reference

#### Backend & Infrastructure Variables
| Variable Name | Environment | Required | Example / Description |
| :--- | :--- | :---: | :--- |
| `ASPNETCORE_ENVIRONMENT` | All | Yes | `Staging` or `Production` |
| `ConnectionStrings__DefaultConnection` | All | Yes | `Host=postgres;Port=5432;Database=curasphere_db;Username=curasphere_app;Password=<STRONG_SECRET>;Ssl Mode=Require;Trust Server Certificate=false;` |
| `JWT_SECRET` | All | Yes | Strong 32+ character random string (HMAC-SHA256). |
| `JWT_ISSUER` | All | Yes | Identity provider URL or string, e.g., `https://api.curasphere.com` |
| `JWT_AUDIENCE` | All | Yes | Target audience, e.g., `https://clinic.curasphere.com` |
| `JWT_EXPIRY_MINUTES` | All | No | Token lifetime in minutes (Default: `60`). |
| `CORS_ALLOWED_ORIGINS` | All | Yes | Comma-delimited list of permitted domains, e.g., `https://clinic.curasphere.com,https://curasphere.com` |
| `CURASPHERE_EDITION` | All | Yes | `Clinic` (activates clinic-optimized flows) or `Hospital` |
| `APPLY_MIGRATIONS` | All | Yes | Set to `false` in production. Migrations must be run via release pipelines. |

#### Frontend Variables (Build-time)
| Variable Name | Required | Default | Description |
| :--- | :---: | :---: | :--- |
| `VITE_API_URL` | Yes | `/api` | Fully qualified HTTPS backend URL, e.g., `https://api.curasphere.com/api`. |
| `VITE_APP_EDITION` | Yes | `Hospital` | Default client-side navigation mode (`Clinic` or `Hospital`). |

---

## 5. Frontend Deployment Guide (React 18 + Vite)

### 5.1 Static Hosting via Vercel / Netlify / Cloudflare Pages
1. **Repository Linkage:**
   - Connect the repository to your hosting dashboard.
   - Set **Root Directory** to `frontend`.
2. **Build Settings:**
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Node.js Version: `20.x` or `22.x`
3. **Environment Variables:**
   - Define `VITE_API_URL` (e.g., `https://staging-api.curasphere.com/api`).
   - Define `VITE_APP_EDITION` (`Clinic`).
4. **SPA Route Fallback (Vercel Configuration):**
   Ensure `frontend/vercel.json` contains:
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```

### 5.2 Containerized Frontend (Docker + Nginx)
The repository includes a production multi-stage `frontend/Dockerfile` leveraging `nginx:alpine`:
```bash
# Build the frontend container image
docker build -t curasphere-frontend:latest \
  --build-arg VITE_API_URL=https://api.curasphere.com/api \
  --build-arg VITE_APP_EDITION=Clinic \
  ./frontend

# Run container exposing port 80
docker run -d -p 80:80 --name curasphere-web curasphere-frontend:latest
```
Nginx is preconfigured with:
- `try_files $uri $uri/ /index.html;` to prevent 404 errors when users refresh deep links (e.g. `/clinic/appointments`).
- Security headers (`X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`).
- Container liveness health check at `/health`.

---

## 6. Backend Deployment Guide (.NET 8 Web API)

### 6.1 Containerized Deployment (Docker / Kubernetes / AWS ECS)
The backend is packaged using a multi-stage `backend/CuraSphere.Api/Dockerfile`:
- Base: `mcr.microsoft.com/dotnet/aspnet:8.0-alpine`
- Hardened unprivileged execution: `USER app` (UID 1654).
- Internal port: 5000.
- Health probe: `HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD wget -q --spider http://localhost:5000/health || exit 1`

```bash
# Build backend image
docker build -f backend/CuraSphere.Api/Dockerfile -t curasphere-api:1.0.0 .

# Run container with environment configuration
docker run -d \
  --name curasphere-api \
  -p 5000:5000 \
  -e ASPNETCORE_ENVIRONMENT=Production \
  -e ConnectionStrings__DefaultConnection="Host=db.host;Port=5432;Database=curasphere;Username=app;Password=secret;Ssl Mode=Require;" \
  -e JWT_SECRET="your-256-bit-cryptographically-secure-key-here" \
  -e JWT_ISSUER="https://api.curasphere.com" \
  -e JWT_AUDIENCE="https://clinic.curasphere.com" \
  -e CORS_ALLOWED_ORIGINS="https://clinic.curasphere.com" \
  -e CURASPHERE_EDITION="Clinic" \
  -e APPLY_MIGRATIONS="false" \
  curasphere-api:1.0.0
```

### 6.2 Reverse Proxy Configuration (Nginx / Caddy / Cloudflare)
Because Kestrel runs behind reverse proxies or load balancers, ensure forwarded headers are honored:
```nginx
server {
    listen 443 ssl http2;
    server_name api.curasphere.com;

    ssl_certificate /etc/letsencrypt/live/api.curasphere.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.curasphere.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection keep-alive;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 7. Database Migration & Data Safety Procedures

### 7.1 Golden Rules for Healthcare Data
1. **Never Drop Databases:** `DropTable`, `EnsureDeleted()`, or reset commands are strictly forbidden in staging and production.
2. **No Uncontrolled Auto-Migrations:** `APPLY_MIGRATIONS=false` must be set in production containers to prevent race conditions during horizontal pod autoscaling.
3. **Idempotent SQL Generation:** Production schema changes must be applied via verifiable, idempotent SQL scripts inspected by a Database Administrator.
4. **Pre-Migration Restore Points:** A verified snapshot or point-in-time recovery checkpoint must be established immediately prior to applying schema modifications.

### 7.2 Generating Production SQL Migration Scripts
Execute from the backend directory using the `dotnet ef` CLI:
```bash
# Generate idempotent SQL migration script across all versions
dotnet ef migrations script \
  --project backend/CuraSphere.Infrastructure \
  --startup-project backend/CuraSphere.Api \
  --idempotent \
  --output migrations_release_v1.0.0.sql
```

### 7.3 Applying Migrations to Staging & Production
```bash
# Apply script using psql with SSL enforcement
psql "sslmode=require host=your-db-host dbname=curasphere user=postgres" -f migrations_release_v1.0.0.sql
```

---

## 8. Backup, Disaster Recovery & Rollback Protocols

### 8.1 Automated Backup Policy
- **Full Database Dumps:** Scheduled daily at off-peak hours (02:00 UTC).
- **WAL Archiving (Write-Ahead Logging):** Continuous streaming enabling Point-in-Time Recovery (PITR) with a 5-minute Recovery Point Objective (RPO).
- **Retention Period:** 35 days continuous PITR; monthly archives retained for 7 years to fulfill clinical audit compliance.
- **Storage Location:** Geographically separated, encrypted cold storage (e.g., AWS S3 Glacier with Object Lock).

### 8.2 Database Backup Command
```bash
# Execute compressed binary backup
pg_dump -h <DB_HOST> -p 5432 -U <DB_USER> -d <DB_NAME> -F c -b -v -f "curasphere_backup_$(date +%Y%m%d_%H%M%S).dump"
```

### 8.3 Disaster Recovery Verification (Quarterly Drill)
```bash
# Restore backup to an isolated staging validation database
pg_restore -h <STAGING_DB_HOST> -p 5432 -U <DB_USER> -d curasphere_staging_verify -v "curasphere_backup_<TIMESTAMP>.dump"
```

### 8.4 Application Rollback Protocol
In the event of an unrecoverable failure during a release:
1. **Traffic Diversion:** Revert the DNS CNAME or load balancer target group to the previous stable release container image / build hash.
2. **Database Rollback:**
   - If the migration is backwards-compatible (additive columns only), leave database intact and run previous application version.
   - If schema changes broke backwards compatibility, restore database to the pre-release PITR snapshot timestamp.
3. **Post-Mortem Analysis:** Export container logs, notify incident team, and record root cause in the post-release incident log.

---

## 9. Continuous Integration & Delivery (CI/CD)

The repository workflow `.github/workflows/ci.yml` automates end-to-end quality assurance on all pushes to `main`, `master`, `develop`, and `feature/**` branches.

### Pipeline Stages:
1. **Backend Validation Job:**
   - Sets up .NET 8 SDK.
   - Restores dependencies (`dotnet restore`).
   - Builds solution in `Release` configuration (`dotnet build`).
   - Executes Unit Test Suite (`UnitTestRunner.cs` with 22 clinic validation tests).
   - Executes Integration Tests.
2. **Frontend Validation Job:**
   - Sets up Node.js 20 environment.
   - Clean installs dependencies (`npm ci`).
   - Runs ESLint static analysis (`npm run lint`).
   - Runs full Vitest suite (10 suites, 76 tests).
   - Verifies TypeScript types (`npx tsc --noEmit`).
   - Compiles production distribution bundle (`npm run build`).

---

## 10. Staging Deployment Procedure & Smoke Test Protocol

Before approving production release, execute this step-by-step verification on the isolated staging environment.

### 10.1 Staging Provisioning Checklist
- [ ] Staging database provisioned on PostgreSQL 15+.
- [ ] Initial database schema applied via idempotent SQL script.
- [ ] Synthetic test seed data populated (zero real patient records).
- [ ] Staging backend container deployed with `ASPNETCORE_ENVIRONMENT=Staging`.
- [ ] Staging frontend deployed with `VITE_API_URL=https://staging-api.curasphere.com/api` and `VITE_APP_EDITION=Clinic`.

### 10.2 Staging Smoke Test Verification Sequence
| Step | Workflow | Test Action | Expected Result | Verified |
| :---: | :--- | :--- | :--- | :---: |
| **1** | System Liveness | Probe `GET /health` on backend | HTTP 200 `Healthy` returned within 50ms | [ ] |
| **2** | Authentication | Login as `admin@curasphere.com` / `Admin@123` | JWT token issued, stored in Auth store | [ ] |
| **3** | Navigation | Verify Clinic Edition navigation bar | Shows Dashboard, Appointments, Consultations, Billing, Patients | [ ] |
| **4** | Patient Intake | Register synthetic patient "John Test-Doe" | Patient ID assigned, record visible in directory | [ ] |
| **5** | Appointment | Book appointment with Doctor for today | Status set to `Scheduled`; appears in Today's Queue | [ ] |
| **6** | Status Change | Check in patient via quick-action button | Status transitions smoothly to `CheckedIn` | [ ] |
| **7** | Consultation | Open consultation notes, add diagnosis & Rx | Clinical record saved, history locked | [ ] |
| **8** | Billing | Generate invoice from completed consultation | Total calculated, items lineated, invoice created | [ ] |
| **9** | Payment | Record payment (Cash / Card) | Payment receipt generated, invoice marked `Paid` | [ ] |
| **10** | Print Preview | Open thermal receipt & prescription print view | Formats cleanly without screen artifacts | [ ] |
| **11** | Error Masking | Trigger an intentional invalid request | API returns structured error; no stack trace leaked | [ ] |
| **12** | Log Audit | Inspect backend logs in container stdout | Structured JSON log recorded; zero passwords/PHI leaked | [ ] |

---

## 11. Production Release Checklist

Execute in strict chronological order on the day of production release.

### Phase 1: Pre-Release Gate (T - 24 Hours)
- [ ] Release branch created and all CI checks green.
- [ ] Release Gate classified as `Ready for production review`.
- [ ] Production Database snapshot created and restore verified on staging.
- [ ] Production secrets loaded into cloud secrets manager (never checked into Git).
- [ ] Stakeholder and clinical lead approval recorded.

### Phase 2: Execution (Release Window)
- [ ] Place maintenance banner if downtime is required (or initiate zero-downtime blue/green deployment).
- [ ] Run idempotent SQL schema migration against production database:
  ```bash
  psql "<PROD_DB_URL>" -f migrations_release_v1.0.0.sql
  ```
- [ ] Deploy backend container to production cluster.
- [ ] Probe production backend `/health` endpoint until HTTP 200 is confirmed.
- [ ] Deploy frontend static assets to CDN / edge host.
- [ ] Flush edge CDN cache (Cloudflare / CloudFront).

### Phase 3: Post-Release Verification (T + 15 Minutes)
- [ ] Execute non-destructive smoke tests with designated test clinic account.
- [ ] Confirm CORS headers only accept authorized production origins.
- [ ] Verify production monitoring dashboards (CPU, memory, database connection pool).
- [ ] Lift maintenance banner; record official release timestamp and Git commit SHA.

---

## 12. Monitoring, Observability & Incident Response

### 12.1 Metrics & Telemetry Thresholds
- **Health Checks:** Liveness/readiness polled every 30 seconds. 3 consecutive failures trigger auto-restart.
- **API Error Rates:** Any sustained 5xx rate exceeding 1% over 5 minutes triggers PagerDuty/Slack emergency alert.
- **Response Latency:** 95th percentile API response time must remain under 300ms.
- **Database Connection Pool:** Alert if active connections exceed 80% of max pool size.

### 12.2 Security Auditing & Log Sanitization
- Passwords, credit card numbers, JWT tokens, and identifiable patient health information (PHI) are strictly scrubbed from application logs.
- Failed authentication attempts are logged with client IP and username to detect brute-force attacks.
- Sensitive clinical modifications (prescription issuance, diagnosis changes, invoice voids) record timestamp, user ID, and IP in the audit log.

---

## 13. Verification Records & Current Test Results

### 13.1 Frontend Production Build
```
Command: npm run build (in ./frontend)
Output:
  vite v5.4.14 building for production...
  ✓ 2038 modules transformed.
  dist/index.html                   1.44 kB │ gzip:   0.62 kB
  dist/assets/index-D_u5wVkW.css   62.18 kB │ gzip:  10.42 kB
  dist/assets/index-D8_Lh07w.js   752.48 kB │ gzip: 211.23 kB
  ✓ built in 1.48s
Exit Code: 0 (SUCCESS)
```

### 13.2 Frontend Linter Verification
```
Command: npm run lint (in ./frontend)
Output: 0 errors, 0 warnings
Exit Code: 0 (SUCCESS)
```

### 13.3 Frontend Vitest Suite
```
Command: npx vitest run (in ./frontend)
Test Files: 10 passed (10)
Tests:      76 passed (76)
Duration:   4.12s
Exit Code:  0 (SUCCESS)
```

### 13.4 Backend Test Verification
```
Command: dotnet run --project backend/tests/CuraSphere.UnitTests/CuraSphere.UnitTests.csproj
Output: All 22 domain unit tests passed successfully.
Exit Code: 0 (SUCCESS)
```

---

## 14. Remaining Blockers & Next Action Items

### Current Blockers to Immediate Production Deployment:
1. **Staging Environment Smoke Test:** The release is currently classified as `Ready for staging`. A real staging deployment on a cloud provider (e.g., AWS, Azure, Render, or Railway) must be performed and validated against Section 10's smoke test checklist before promoting to production.
2. **External Hardware Printing Verification:** While print stylesheets and thermal receipt layouts are implemented, physical verification on thermal POS printers (58mm/80mm ESC/POS) requires a hardware-connected staging test.
3. **Formal Human Release Authorization:** In accordance with enterprise healthcare software standards, production release requires explicit sign-off from designated clinical and technical release managers.

### Next Recommended Action:
Provision staging infrastructure (Option A or Option B), deploy the staging container bundle with synthetic test data, and execute the 12-point staging smoke test protocol.
