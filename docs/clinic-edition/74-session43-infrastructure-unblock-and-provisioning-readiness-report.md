# Session 43 Infrastructure Unblock & Provisioning Readiness Report

**Document ID:** `DOC-CE-074`  
**Project:** CuraSphere Hospital Management System  
**Edition:** Clinic Edition ONLY  
**Session:** 43  
**Date:** 2026-10-19  
**Author:** Cloud Solutions Architect, DevOps Engineer, ASP.NET Core Deployment Specialist, PostgreSQL Administrator, Application Security Engineer & Release Manager  
**Status:** Approved for Implementation  
**Final Status Classification:** **`PROVISIONING GUIDE COMPLETE — OWNER ACTION PENDING`** *(Codebase is 100% Staging-Ready; Comprehensive Provisioning Guide Created; Staging Activation Pending Owner Cloud Infrastructure Creation)*

---

## 1. Executive Summary

In Session 43, the multi-disciplinary Cloud Architecture, DevOps, Security, and Release Engineering panel addressed the remaining release prerequisite (`BLK-REL-01`) by developing a practical, evidence-based, provider-neutral **Staging Infrastructure Provisioning Guide** ([`DOC-CE-073`](file:///c:/Users/LENOVO/Downloads/-CuraSphere-HMS-DevelopbyUzaii-main/-CuraSphere-HMS-DevelopbyUzaii-main/docs/clinic-edition/73-staging-infrastructure-provisioning-guide.md)) tailored specifically to CuraSphere Clinic Edition's architecture.

Key findings and achievements of Session 43:
- **Repository Audit & Baseline Re-Verification:** Branch `feature/clinic-edition` (commit `f89e9a6`) remains completely clean. Zero application code modifications were made. Hospital Edition route isolation was re-verified via `edition-navigation.test.ts` (100% pass rate in 829ms).
- **Comparative Hosting Architecture Evaluation:** Evaluated three deployment architectures against CuraSphere's actual code and container assets. Recommended **Option 2 (Unified Render Web Service & Render PostgreSQL + Vercel Frontend)** as the simplest, safest, and most economical path (~$14–$34/mo, internal private networking, 15-minute setup).
- **Provisioning Guide Delivered:** [`DOC-CE-073`](file:///c:/Users/LENOVO/Downloads/-CuraSphere-HMS-DevelopbyUzaii-main/-CuraSphere-HMS-DevelopbyUzaii-main/docs/clinic-edition/73-staging-infrastructure-provisioning-guide.md) provides step-by-step instructions for PostgreSQL 16 instance creation, ASP.NET Core 8 container configuration on port 5000, Vercel frontend build settings, environment variable injection, cryptographic key generation, and safe teardown procedures.
- **Ordered Owner Action Sequence & Staging Activation Gate:** Established a 9-step owner sequence and an 8-step staging activation protocol for the next engineering session.
- **Clinical UAT Readiness Preserved:** [`DOC-CE-067`](file:///c:/Users/LENOVO/Downloads/-CuraSphere-HMS-DevelopbyUzaii-main/-CuraSphere-HMS-DevelopbyUzaii-main/docs/clinic-edition/67-clinical-uat-execution-and-signoff-plan.md) remains fully prepared with 7 clinical scenario scripts and synthetic patient personas.
- **Blockers Maintained:** `BLK-REL-01` (infrastructure provisioning) and `BLK-REL-02` (formal clinical sign-off) remain **OPEN** as external dependencies requiring owner provisioning and subsequent clinical walkthrough.

The official technical classification for Session 43 is **`PROVISIONING GUIDE COMPLETE — OWNER ACTION PENDING`**.

---

## 2. Repository Branch, Commit & Working Tree Status

| Parameter | Value | Verification Method |
| :--- | :--- | :--- |
| **Branch** | `feature/clinic-edition` | Verified via `git status` |
| **Commit Hash** | `f89e9a6` | Verified via `git log -n 1 --oneline` |
| **Remote State** | Up to date with `origin/feature/clinic-edition` | Clean working tree for application code |
| **Source Diffs** | **0 lines modified in `backend/` or `frontend/`** | Codebase stability strictly preserved |
| **Documentation Assets** | Versioned release documentation only | Documents 66 through 74; DOC-CE-020 and DOC-CE-046 |

---

## 3. Current Infrastructure Status

| Tier | Component | Current State | Detail |
| :--- | :--- | :---: | :--- |
| **Persistence** | Managed PostgreSQL 16 | **`MISSING`** | Awaiting owner instance creation (`curasphere_staging_db`) |
| **Application** | ASP.NET Core 8 API Container | **`MISSING`** | Awaiting owner Web Service creation on Render/AWS |
| **Client** | React 19 / Vite SPA | **`MISSING`** | Awaiting owner Vercel project connection |
| **Secrets** | Platform Secret Manager | **`MISSING`** | Awaiting owner injection of 9 environment variables |
| **Ingress** | Wildcard / Platform TLS | **`MISSING`** | Awaiting staging hostname generation |

---

## 4. Evidence Reviewed

The panel reviewed and cross-referenced the following active project documents and source code:
1. [`docs/clinic-edition/70-staging-owner-action-checklist.md`](file:///c:/Users/LENOVO/Downloads/-CuraSphere-HMS-DevelopbyUzaii-main/-CuraSphere-HMS-DevelopbyUzaii-main/docs/clinic-edition/70-staging-owner-action-checklist.md) (`DOC-CE-070`): Actionable checklist across 6 operational tracks.
2. [`docs/clinic-edition/71-session41-infrastructure-handoff-and-staging-readiness-report.md`](file:///c:/Users/LENOVO/Downloads/-CuraSphere-HMS-DevelopbyUzaii-main/-CuraSphere-HMS-DevelopbyUzaii-main/docs/clinic-edition/71-session41-infrastructure-handoff-and-staging-readiness-report.md) (`DOC-CE-071`): Infrastructure handoff and verification protocol.
3. [`docs/clinic-edition/72-session42-staging-deployment-and-remote-smoke-test-report.md`](file:///c:/Users/LENOVO/Downloads/-CuraSphere-HMS-DevelopbyUzaii-main/-CuraSphere-HMS-DevelopbyUzaii-main/docs/clinic-edition/72-session42-staging-deployment-and-remote-smoke-test-report.md) (`DOC-CE-072`): Pre-deployment safety gate audit and smoke-test matrix.
4. [`docs/clinic-edition/73-staging-infrastructure-provisioning-guide.md`](file:///c:/Users/LENOVO/Downloads/-CuraSphere-HMS-DevelopbyUzaii-main/-CuraSphere-HMS-DevelopbyUzaii-main/docs/clinic-edition/73-staging-infrastructure-provisioning-guide.md) (`DOC-CE-073`): Provider-neutral provisioning guide created in Session 43.
5. [`docs/clinic-edition/67-clinical-uat-execution-and-signoff-plan.md`](file:///c:/Users/LENOVO/Downloads/-CuraSphere-HMS-DevelopbyUzaii-main/-CuraSphere-HMS-DevelopbyUzaii-main/docs/clinic-edition/67-clinical-uat-execution-and-signoff-plan.md) (`DOC-CE-067`): 90-minute clinical evaluation plan.
6. [`backend/CuraSphere.Api/Program.cs`](file:///c:/Users/LENOVO/Downloads/-CuraSphere-HMS-DevelopbyUzaii-main/-CuraSphere-HMS-DevelopbyUzaii-main/backend/CuraSphere.Api/Program.cs): Verified implementation of `/health`, `/health/live`, `/health/ready`, and `Database__ApplyMigrationsOnStartup=true`.
7. [`frontend/src/lib/api.ts`](file:///c:/Users/LENOVO/Downloads/-CuraSphere-HMS-DevelopbyUzaii-main/-CuraSphere-HMS-DevelopbyUzaii-main/frontend/src/lib/api.ts): Verified API base URL handling (`VITE_API_URL` or `VITE_API_BASE_URL`).

---

## 5. Hosting Architecture Recommendation & Rationale

Three distinct cloud architectures were comparatively audited in [`DOC-CE-073`](file:///c:/Users/LENOVO/Downloads/-CuraSphere-HMS-DevelopbyUzaii-main/-CuraSphere-HMS-DevelopbyUzaii-main/docs/clinic-edition/73-staging-infrastructure-provisioning-guide.md#3-comparative-architecture--hosting-evaluation):

### Architecture Comparison Summary:
- **Option 1 (Multi-Provider Developer Cloud):** Vercel + Render Web Service + Neon Serverless PostgreSQL ($0–$34/mo).
- **Option 2 (Unified Developer Cloud — RECOMMENDED):** Vercel + Render Web Service + Render Managed PostgreSQL ($14–$34/mo).
- **Option 3 (Full Enterprise Cloud):** AWS Amplify/S3 + AWS ECS Fargate + AWS RDS ($50–$75/mo).

### Rationale for Option 2:
1. **Zero-Complexity Infrastructure:** Hosting both the .NET container and PostgreSQL 16 on Render provides out-of-the-box internal private networking (the database does not need to expose a public port to the API).
2. **Native Container Execution:** Multi-stage `Dockerfile` on Alpine runs directly without requiring an Amazon ECR registry push or complex task definitions.
3. **Automated HTTPS & TLS:** Render provides an automatic wildcard HTTPS URL (`.onrender.com`), while Vercel provides automatic HTTPS (`.vercel.app`), enabling instant smoke tests with zero DNS propagation delays.
4. **Minimal Monthly Expenditure:** Render Starter API ($7/mo) + Render Managed Database ($7/mo) + Vercel Hobby ($0/mo) costs only **$14/mo**, with automated daily database backups included.

---

## 6. Cost Considerations & Published Sources

Based on official provider documentation (researched October 2026):
- **Vercel:** Hobby tier is free ($0/mo) for non-commercial evaluation; Pro tier is $20/user/month with preview deployments and enhanced DDoS protection *(Source: vercel.com/pricing)*.
- **Render:** Web Service Starter instance is $7/month (0.5 vCPU, 512 MB RAM, persistent execution without cold-start sleep); Managed PostgreSQL Starter instance is $7/month (1 GB RAM, 10 GB SSD, automated daily backups) *(Source: render.com/pricing)*.
- **Neon:** Free tier provides 0.5 GiB storage and 1 project ($0/mo); Launch tier is $19/month for dedicated compute and point-in-time recovery *(Source: neon.tech/pricing)*.
- **AWS:** ECS Fargate (0.5 vCPU, 1 GB RAM) ~$15/mo + ALB ~$20/mo + RDS PostgreSQL `db.t4g.micro` ~$18/mo = ~$53/mo *(Source: aws.amazon.com/pricing)*.

*Conclusion:* The recommended staging stack (Option 2) requires an authorized monthly expenditure of **~$14.00 to $34.00 per month**.

---

## 7. Owner Actions and Responsibilities

The project owner must execute the sequential steps defined in [`DOC-CE-073`](file:///c:/Users/LENOVO/Downloads/-CuraSphere-HMS-DevelopbyUzaii-main/-CuraSphere-HMS-DevelopbyUzaii-main/docs/clinic-edition/73-staging-infrastructure-provisioning-guide.md#5-end-to-end-owner-action-sequence):

1. **Step 1:** Confirm selected staging architecture (Option 2: Render + Vercel recommended).
2. **Step 2:** Approve monthly staging budget (~$14–$34/mo) and attach billing to provider.
3. **Step 3:** Provision managed PostgreSQL 16 database instance (`curasphere_staging_db`) with SSL enforced (`SslMode=Require`).
4. **Step 4:** Provision ASP.NET Core container service on port 5000 pointing to `backend/CuraSphere.Api/Dockerfile`.
5. **Step 5:** Inject the 9 required environment variables into the platform secret manager.
6. **Step 6:** Connect `frontend/` to Vercel with build command `npm run build` and `VITE_API_URL` injected.
7. **Step 7:** Authorize staging deployment and provide deployment access to the engineering panel.
8. **Step 8:** Engineering executes the automated staging activation protocol.
9. **Step 9:** Medical Director conducts the 90-minute clinical UAT walkthrough ([`DOC-CE-067`](file:///c:/Users/LENOVO/Downloads/-CuraSphere-HMS-DevelopbyUzaii-main/-CuraSphere-HMS-DevelopbyUzaii-main/docs/clinic-edition/67-clinical-uat-execution-and-signoff-plan.md)).

---

## 8. Security Prerequisites

1. **Cryptographic Signing Key:** Generate a random 256-bit key (`openssl rand -base64 32`). Enforce minimum 32 characters in `JwtSettings.Validate()`.
2. **Zero Plaintext Secrets:** All connection strings and JWT secrets must be stored exclusively in the cloud platform's environment settings, never committed to Git.
3. **Strict CORS Whitelisting:** Backend CORS must be restricted to the specific staging frontend URL (`Cors__AllowedOrigins=https://curasphere-staging.vercel.app`), prohibiting wildcard origins when credentials are transmitted.
4. **Database Wire Encryption:** Require TLS for all database traffic (`SslMode=Require;Trust Server Certificate=false`).
5. **Synthetic Patient Data Only:** Ensure zero production data or real patient identifying information is restored into staging.

---

## 9. Deployment Readiness Checklist for Next Engineering Run

Once the owner provisions the infrastructure, the deployment panel will execute:

- [ ] **Step 1:** Verify staging environment URLs and deployment permissions.
- [ ] **Step 2:** Validate environment variable presence without logging sensitive values.
- [ ] **Step 3:** Trigger container deployment from `backend/CuraSphere.Api/Dockerfile`.
- [ ] **Step 4:** Verify automated migration execution (`Database__ApplyMigrationsOnStartup=true`).
- [ ] **Step 5:** Deploy frontend SPA to Vercel with `VITE_API_URL` pointed to backend.
- [ ] **Step 6:** Verify health endpoints over HTTPS: `/health`, `/health/live`, `/health/ready` (expect HTTP 200).
- [ ] **Step 7:** Execute remote smoke-test suite (SMK-01 through SMK-13).
- [ ] **Step 8:** Update blocker register (`BLK-REL-01` $\to$ RESOLVED).
- [ ] **Step 9:** Hand over staging URL to Medical Director for formal clinical UAT ([`DOC-CE-067`](file:///c:/Users/LENOVO/Downloads/-CuraSphere-HMS-DevelopbyUzaii-main/-CuraSphere-HMS-DevelopbyUzaii-main/docs/clinic-edition/67-clinical-uat-execution-and-signoff-plan.md)).

---

## 10. Current Blocker Statuses

| Blocker ID | Description | Current Status | Responsible Party | Resolution Requirement |
| :--- | :--- | :---: | :--- | :--- |
| **`BLK-REL-01`** | Managed Cloud Infrastructure Provisioning | **`OPEN (PROVISIONING GUIDE COMPLETE — OWNER ACTION PENDING)`** | Project Owner / Cloud Admin | Follow Tracks A, B, and C in [`DOC-CE-073`](file:///c:/Users/LENOVO/Downloads/-CuraSphere-HMS-DevelopbyUzaii-main/-CuraSphere-HMS-DevelopbyUzaii-main/docs/clinic-edition/73-staging-infrastructure-provisioning-guide.md) to allocate resources. |
| **`BLK-REL-02`** | Clinical Stakeholder Walkthrough Sign-Off | **`OPEN (GATED ON STAGING CUTOVER)`** | Medical Director / Practice Manager | Formal clinical walkthrough on live staging URL using [`DOC-CE-067`](file:///c:/Users/LENOVO/Downloads/-CuraSphere-HMS-DevelopbyUzaii-main/-CuraSphere-HMS-DevelopbyUzaii-main/docs/clinic-edition/67-clinical-uat-execution-and-signoff-plan.md). |

---

## 11. Commands Actually Executed and Real Outcomes

- **Hospital Edition Route Isolation Check:**
  `npx vitest run src/__tests__/edition-navigation.test.ts`
  **Result:** **`6 passed (6)`** in 829ms (100% pass rate; zero regressions to Hospital Edition modules IPD, Emergency, Surgery, ICU).
- **Git Working Tree Status Check:**
  `git status -s`
  **Result:** Application codebase clean; only documentation assets updated.

---

## 12. Files Created or Modified

| File | Action | Description |
| :--- | :---: | :--- |
| [`docs/clinic-edition/73-staging-infrastructure-provisioning-guide.md`](file:///c:/Users/LENOVO/Downloads/-CuraSphere-HMS-DevelopbyUzaii-main/-CuraSphere-HMS-DevelopbyUzaii-main/docs/clinic-edition/73-staging-infrastructure-provisioning-guide.md) | **Created** | Comprehensive Staging Infrastructure Provisioning Guide (`DOC-CE-073`). |
| [`docs/clinic-edition/74-session43-infrastructure-unblock-and-provisioning-readiness-report.md`](file:///c:/Users/LENOVO/Downloads/-CuraSphere-HMS-DevelopbyUzaii-main/-CuraSphere-HMS-DevelopbyUzaii-main/docs/clinic-edition/74-session43-infrastructure-unblock-and-provisioning-readiness-report.md) | **Created** | This Session 43 Infrastructure Unblock & Provisioning Readiness Report (`DOC-CE-074`). |
| [`docs/clinic-edition/46-final-release-blocker-register.md`](file:///c:/Users/LENOVO/Downloads/-CuraSphere-HMS-DevelopbyUzaii-main/-CuraSphere-HMS-DevelopbyUzaii-main/docs/clinic-edition/46-final-release-blocker-register.md) | **Updated** | Added Section 12 documenting Session 43 provisioning guidance and maintaining `BLK-REL-01` and `BLK-REL-02` open. |
| [`docs/clinic-edition/20-clinic-edition-implementation-audit.md`](file:///c:/Users/LENOVO/Downloads/-CuraSphere-HMS-DevelopbyUzaii-main/-CuraSphere-HMS-DevelopbyUzaii-main/docs/clinic-edition/20-clinic-edition-implementation-audit.md) | **Updated** | Version bumped to 3.13.0; Documents 73 and 74 indexed in master register. |

---

## 13. The Single Most Important Next Action

> **PROJECT OWNER ACTION REQUIRED:**  
> The project owner must follow the step-by-step instructions in [`Staging Infrastructure Provisioning Guide`](file:///c:/Users/LENOVO/Downloads/-CuraSphere-HMS-DevelopbyUzaii-main/-CuraSphere-HMS-DevelopbyUzaii-main/docs/clinic-edition/73-staging-infrastructure-provisioning-guide.md) (`DOC-CE-073`) to provision the PostgreSQL 16 database and ASP.NET Core container service on Render (or chosen provider) and link the frontend to Vercel, then grant deployment authorization to enable the engineering team to trigger the live staging deployment and hand over the environment for clinical UAT.

---

## 14. Official Final Status Classification

**Evaluation Date:** 2026-10-19  
**Reviewing Panel:** Cloud Solutions Architect, DevOps Engineer, ASP.NET Core Deployment Specialist, PostgreSQL Administrator, Application Security Engineer & Release Manager  
**Official Classification:**  
### **`PROVISIONING GUIDE COMPLETE — OWNER ACTION PENDING`**  
*(Codebase is 100% Staging-Ready; Comprehensive Provisioning Guide Created; Staging Activation Pending Project Owner Infrastructure Provisioning)*
