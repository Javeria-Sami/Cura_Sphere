# CURASPHERE CLINIC EDITION — SECURITY & MAINTENANCE REGISTER
**Document ID:** `DOC-CE-036`  
**Execution Date:** October 18, 2026  
**Auditor / Roles:** Application Security Engineer, DevSecOps Engineer, Technical Maintenance Lead, QA Automation Lead  

---

## 1. Priority Standards & Governance

- **P0 — Critical:** Critical security vulnerability, patient data integrity compromise, or total blocker to safe deployment.
- **P1 — High:** Significant vulnerability, core clinical workflow failure, or mandatory release gate requirement.
- **P2 — Medium:** Important operational maintenance, dependency update, or reliability improvement.
- **P3 — Low:** Routine maintenance, minor refactoring, or documentation enhancement.

---

## 2. Security & Maintenance Task Register Table

| Task ID | Description & Evidence | Severity | Component | Recommended Action | Responsible Role | Verification Criteria | Status |
| :---: | :--- | :---: | :--- | :--- | :--- | :--- | :---: |
| **SEC-MNT-01** | **Axios High-Severity Prototype Pollution & ReDoS**<br>*Evidence: `npm audit` flagged GHSA-vh66-26gq-q6x8 and GHSA-68fv-2mgg-jv7q.* | **P1** | Frontend / Dependencies (`package.json`) | Upgraded `axios` to `^1.20.0` and `source-map-js` to `1.2.2`. Verified with automated test suite. | DevSecOps Lead | `npm audit` returns 0 vulnerabilities; 140 tests pass. | **RESOLVED (PASS)** |
| **SEC-MNT-02** | **Distributed Tracing Header Injection**<br>*Evidence: Need for unified client-to-backend correlation in production logs.* | **P2** | Client Networking (`lib/api.ts`) | Injected automatic `X-Correlation-ID` header generation into Axios request interceptor. | Senior Full-Stack Engineer | `security-maintenance-lifecycle.test.ts` asserts correlation ID presence. | **RESOLVED (PASS)** |
| **SEC-MNT-03** | **Defensive Window Navigation Check**<br>*Evidence: ReferenceError when running in Node/SSR environments.* | **P2** | Client Networking (`lib/api.ts`) | Guarded `window.location.href = '/login'` with `typeof window !== 'undefined' && window.location`. | QA Automation Lead | All 16 Vitest test suites pass without ReferenceError. | **RESOLVED (PASS)** |
| **SEC-MNT-04** | **Security Lifecycle Regression Test Suite**<br>*Evidence: Need for continuous verification of security invariants.* | **P2** | Test Automation (`__tests__`) | Created `security-maintenance-lifecycle.test.ts` exercising token expiration, sanitization, and edition matrix. | QA Automation Lead | 6 automated tests pass in Vitest. | **RESOLVED (PASS)** |
| **SEC-MNT-05** | **Cloud Hosting & Managed PostgreSQL Database**<br>*Evidence: `INC-STG-001` in defect register; lack of cloud accounts.* | **P0** | Infrastructure / Cloud Hosting | Provision managed PostgreSQL 15+ database and ASP.NET Core container host (Render / AWS / Azure). | Project Sponsor / Infrastructure Lead | Successful database connectivity probe (`GET /health/ready`). | **BLOCKED (EXTERNAL)** |
| **SEC-MNT-06** | **Live Database Backup Recovery Verification Drill**<br>*Evidence: Recovery readiness classified as NOT VERIFIED in DOC-CE-028.* | **P0** | Database Reliability / DR | Execute live `pg_dump` snapshot and `pg_restore` drill against isolated cloud database. | Database Reliability Engineer | Restored schema and record count match live database. | **BLOCKED (EXTERNAL)** |
| **SEC-MNT-07** | **Physical Cashier Thermal ESC/POS Printer Alignment**<br>*Evidence: Browser print preview verified; physical hardware untested.* | **P1** | Clinic Hardware / Cashier Desk | Conduct on-site test print on clinic's physical 80mm ESC/POS thermal printer. | Clinic Operations Lead / QA | Clear print, unclipped margins, and legible barcode. | **PENDING ON-SITE** |
| **SEC-MNT-08** | **Centralized Cloud Log Sink Linkage**<br>*Evidence: Logs written to container stdout; need cloud aggregation.* | **P2** | Observability / DevSecOps | Stream container stdout logs to Datadog, AWS CloudWatch, or Grafana Loki. | Senior DevOps Engineer | Structured logs searchable by `X-Correlation-ID`. | **RECOMMENDED** |
| **SEC-MNT-09** | **Real-Time SignalR Notification Push Wiring**<br>*Evidence: UI currently uses 15-second polling fallback.* | **P3** | Realtime / Frontend Backlog | Wire client-side SignalR socket listener in `NotificationsPage.tsx` for instant chime. | Frontend Engineer | WebSocket push triggers audible chime on reception. | **BACKLOG** |

---

## 3. Maintenance Verification Records

### Task SEC-MNT-01: Axios Dependency Security Patch
- **Audit Tool:** `npm audit`
- **Initial State:** 2 high-severity vulnerabilities (Axios prototype pollution & ReDoS; source-map-js event loop DoS).
- **Remediation Action:**
  - Updated `axios` in `frontend/package.json` to `"axios": "^1.20.0"`.
  - Executed targeted lockfile update.
- **Outcome:** Clean audit:
  ```
  found 0 vulnerabilities
  ```
- **Verification:** 140 frontend Vitest tests pass (100%), ESLint clean (0 errors, 0 warnings), Vite production bundle compiles cleanly in 1.01s.
- **Status:** **RESOLVED (VERIFIED PASS)**

### Task SEC-MNT-02 & SEC-MNT-03: Client Interceptor Hardening & Tracing
- **Component:** `frontend/src/lib/api.ts`
- **Remediation Action:**
  1. Added automatic generation of `X-Correlation-ID: req-<timestamp>-<random>` on every request.
  2. Guarded window redirect with `if (typeof window !== "undefined" && window.location)` to ensure universal SSR/test runtime compatibility.
- **Verification:** Tested in `security-maintenance-lifecycle.test.ts` (Tests SEC-MNT-01 through SEC-MNT-03 passing).
- **Status:** **RESOLVED (VERIFIED PASS)**

---
*Register certified by Application Security Engineer & DevSecOps Lead on October 18, 2026.*
