# CURASPHERE CLINIC EDITION — MAINTENANCE & SUPPORT CHECKLIST
**Document ID:** `DOC-CE-033`  
**Version:** 1.0.0  
**Effective Date:** October 2026  
**Audience:** System Administrators, DevOps Engineers, QA Automation Leads, Support Engineers  

---

## 1. Overview & Purpose

This operational checklist establishes recurring routines for maintaining the **CuraSphere Hospital Management System — Clinic Edition** in a healthy, performant, and secure state.

Operational teams must perform and log these checks according to the defined frequencies.

---

## 2. Daily Operational Checklist (Every Morning at 07:30 Local Time)

| # | Inspection Item | Verification Method | Expected Result | Action if Failed |
| :-: | :--- | :--- | :--- | :--- |
| **D.1** | **Application Process Liveness** | Query `GET https://api.<DOMAIN>/health/live` | HTTP 200 `{"status":"Healthy"}` | Check container status; inspect orchestrator restart logs. |
| **D.2** | **Database Connectivity Readiness** | Query `GET https://api.<DOMAIN>/health/ready` | HTTP 200 with DB probe healthy | Verify PostgreSQL service; check connection pool limits. |
| **D.3** | **Automated Backup Verification** | Inspect nightly `pg_dump` snapshot timestamp | Backup file generated within last 12 hours with non-zero size | Trigger manual backup immediately; alert Database Reliability Engineer. |
| **D.4** | **Unresolved Critical Alerts** | Check cloud monitoring dashboard / APM | Zero active SEV-1 or SEV-2 alerts | Escalate immediately per incident escalation ladder. |
| **D.5** | **Disk Space & Resource Limits** | Check container host & DB disk usage | Disk utilization $< 75\%$ | Clear temp logs or expand cloud storage volume. |
| **D.6** | **Cashier Hardware Readiness** | Test print receipt on physical cashier station | Clean 80mm receipt feed without jams | Inspect thermal paper roll and driver alignment. |

---

## 3. Weekly Maintenance Checklist (Every Monday Morning)

| # | Inspection Item | Verification Method | Expected Result | Action if Failed |
| :-: | :--- | :--- | :--- | :--- |
| **W.1** | **API Error Rate & Trend Analysis** | Filter APM logs for HTTP 5xx responses | HTTP 5xx rate $< 0.1\%$ of total requests | Identify failing routes and trace with `X-Correlation-ID`. |
| **W.2** | **Failed Authentication Audit** | Query audit log for failed login attempts | Normal distribution; no automated dictionary spikes | Identify source IP; apply firewall / WAF block if brute force. |
| **W.3** | **Database Connection Saturation** | Inspect PostgreSQL active connections: `SELECT count(*) FROM pg_stat_activity;` | Active connections $< 50\%$ of max pool limit | Inspect for connection leaks or long-running queries. |
| **W.4** | **Backup Retention Compliance** | Check backup storage bucket | Daily backups retained for 30 days; older snapshots rotated | Adjust automated backup lifecycle retention policy. |
| **W.5** | **Outstanding Defect Register Review** | Review `DOC-CE-030` | All open defects have assigned owners and target dates | Review in weekly engineering triage standup. |

---

## 4. Monthly System Governance Checklist (First Week of Each Month)

| # | Inspection Item | Verification Method | Expected Result | Action if Failed |
| :-: | :--- | :--- | :--- | :--- |
| **M.1** | **Dependency Vulnerability Scan** | Execute `npm audit` in `frontend/` and scan NuGet dependencies | Zero High or Critical security advisories | Patch or update vulnerable packages and re-run test suite. |
| **M.2** | **Database Recovery Drill** | Execute test restore of nightly snapshot into isolated test schema | Clean schema recreation and matching record counts | Review disaster recovery procedure with DBA team. |
| **M.3** | **User Access & Role Audit** | Review active user accounts in `security."Users"` | Deactivate accounts for former or relocated staff | Revoke unused administrator and clinician permissions. |
| **M.4** | **Operational Capacity & Latency Trends** | Review 95th percentile (P95) API response time | P95 latency $< 300\text{ms}$ for core clinical endpoints | Review database table indexes and slow query logs. |
| **M.5** | **Disaster Recovery Documentation** | Review `DOC-CE-031` (Operational Runbook) | All procedures, contact roles, and commands up to date | Revise runbook and publish updated version. |

---

## 5. Pre-Release & Deployment Checklist (Before Every Release)

Before promoting any software build to production, the Release Manager must certify:

- [ ] **Release Identification:** Approved Git commit SHA and release tag (e.g., `v1.0.0-clinic`) recorded.
- [ ] **Automated Testing:** All unit and integration test suites pass (134/134 Vitest tests passing).
- [ ] **Backend Compilation:** Domain logic unit tests pass (32/32 tests in `UnitTestRunner.cs`).
- [ ] **Static Code Analysis:** `npm run lint` returns 0 errors and 0 warnings.
- [ ] **Production Bundling:** `tsc -b && vite build` succeeds cleanly with Rollup chunk splitting.
- [ ] **Database Migration Review:** Pending EF Core migrations reviewed for data-loss risk and table locks.
- [ ] **Backup Snapshot:** Fresh pre-deployment database backup captured and verified.
- [ ] **Rollback Readiness:** Previous container image and Vercel deployment SHA confirmed ready for instant rollback.
- [ ] **Hospital Edition Non-Regression:** Verified that all 24 medical enterprise modules remain 100% operational in Hospital mode.
- [ ] **Operational Approvals:** Written authorization obtained from Clinic Operations Lead and Project Sponsor.

---
*Checklist approved by Senior Production Reliability Engineer & QA Lead on October 18, 2026.*
