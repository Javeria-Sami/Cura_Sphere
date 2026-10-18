# CuraSphere Clinic Edition: Operational Monitoring & Alerting Plan

**Document ID:** `DOC-CE-058`  
**Session:** 36  
**Version:** 1.0.0  
**Date:** 2026-10-18  
**Author / SRE Lead:** Senior Site Reliability Engineer, Software Architect, DevOps Engineer, Application Security Engineer  
**Scope:** Production & Staging Telemetry Architecture, Health Check Strategy, Alerting Thresholds & Operational Escalation  
**Target Release Artifact:** `v1.0.0-clinic` (Commit: `eab7e65`)  
**Operational Context:** React 18 / Vite Static Frontend (Vercel) + ASP.NET Core 8 Web API Linux Container (Render / AWS ECS) + Managed PostgreSQL 16  
**Status:** **`ACTIVE OPERATIONAL PLAN (PRE-PRODUCTION BASELINE ESTABLISHED)`**  

---

## 1. Executive Summary & Monitoring Architecture

This document establishes the comprehensive **Operational Monitoring and Alerting Plan** for the **CuraSphere Hospital Management System — Clinic Edition**.

In clinical operations, system reliability directly impacts patient care, medication delivery, and financial accuracy. The monitoring architecture combines **application-layer health probes**, **structured distributed tracing**, **database connection telemetry**, and **client-side error tracking** without exposing protected patient health information (PHI) or system credentials.

```
[Client Tier (React 18 / Vite)]
  ├── Error Boundary & Network Timeout: 15s request cutoff (frontend/src/lib/api.ts)
  ├── Tracing: Client generates & injects X-Correlation-ID header
  └── Telemetry Sink: Browser Console / Sanitized Client Exception Logger

[API Application Tier (ASP.NET Core 8)]
  ├── Health Probes:
  │     ├── /health (Composite System Health)
  │     ├── /health/live (Process Liveness Probe)
  │     └── /health/ready (Database Pool & Dependency Readiness)
  ├── Logging Middleware: RequestLoggingMiddleware (sanitizes tokens/passwords, tracks latency)
  ├── Exception Handling: UseExceptionHandler (RFC 7231 Problem Details JSON)
  └── Telemetry Sink: Standard Output (stdout JSON) -> Cloud Logging (CloudWatch / Render Logs)

[Persistence Tier (PostgreSQL 16)]
  ├── Health Signal: pg_isready & SELECT 1 connectivity probe
  ├── Connection Pool: Active vs. Idle connections in Npgsql pool
  ├── Query Profiling: Slow query log (> 200ms) & B-tree index scan efficiency
  └── Telemetry Sink: Cloud Managed PostgreSQL Metrics (RDS Insights / Render Telemetry)
```

---

## 2. Health-Check Strategy & Probes

The ASP.NET Core 8 API exposes three standard, lightweight health endpoints (`Program.cs:114-144`):

| Probe Endpoint | Purpose | External Dependencies | Polling Frequency | Success Criteria |
|:---|:---|:---|:---:|:---|
| **`/health/live`** | **Liveness Probe:** Validates that the .NET Kestrel process is running and accepting HTTP requests. | None (Isolated in-memory check) | Every 10 seconds | HTTP 200 OK |
| **`/health/ready`** | **Readiness Probe:** Validates that the application is ready to receive clinical traffic and database connectivity is operational. | PostgreSQL connection pool | Every 15 seconds | HTTP 200 OK |
| **`/health`** | **Composite Health:** Full diagnostic summary for external uptime monitors (Datadog / Pingdom / Cloudflare). | All registered dependencies | Every 60 seconds | HTTP 200 OK |

> [!IMPORTANT]
> **HEALTH CHECK EFFICIENCY RULE**  
> Health check endpoints must **never execute heavy transactional queries** or table scans. The readiness check performs a lightweight connection pool probe to avoid inducing database load during high traffic.

---

## 3. Key Telemetry Signals & Proposed Alert Thresholds

Alert thresholds are defined based on pre-production engineering baselines and clinical SLA requirements:

| Telemetry Signal | Metric Source | Normal Baseline | Proposed Warning Threshold | Proposed Critical Threshold (Paging) | Evaluation Window |
|:---|:---|:---:|:---:|:---:|:---:|
| **API Error Rate (5xx)** | Kestrel Request Logger | < 0.05% | **> 0.20%** of requests | **> 0.50% (TRIGGER INCIDENT)** | 5 Minutes |
| **API Latency (p95)** | RequestLoggingMiddleware | < 150ms | **> 500ms** | **> 1500ms** | 5 Minutes |
| **API Latency (p99)** | RequestLoggingMiddleware | < 300ms | **> 1000ms** | **> 3000ms** | 5 Minutes |
| **Readiness Probe Drop** | Container Orchestrator | 100% Up | **1 failed probe** | **2 consecutive failed probes** | 30 Seconds |
| **DB Connection Saturation** | PostgreSQL Connection Pool | < 25% pool | **> 70% active pool** | **> 90% (Pool Exhaustion)** | 2 Minutes |
| **Slow Database Queries** | PostgreSQL Slow Query Log | 0 queries | **> 5 queries > 250ms/min** | **> 1 query > 1000ms** | 5 Minutes |
| **Failed Logins (Brute Force)** | `AuthService.cs` Audit Events | < 2 / hour | **> 5 failed logins / IP** | **> 15 failed logins / IP** | 10 Minutes |
| **Account Lockouts** | Security Audit Log | 0 / day | **> 2 lockouts / hour** | **> 5 lockouts / hour** | 1 Hour |
| **Payment Inconsistency** | `FinancialService.cs` | 0 anomalies | **1 validation rejection** | **Any balance discrepancy** | Immediate |
| **Client Request Timeouts** | Axios 15s Timeout Handler | 0 / day | **> 3 timeouts / hour** | **> 10 timeouts / hour** | 15 Minutes |
| **Database Backup Job** | Automated Backup Script | Daily exit 0 | **Job duration > 15 mins** | **Job failed / exit code != 0** | Immediate |

---

## 4. Alert Severity Levels & Notification Channels

| Severity | Impact | Paging Mechanism | Response SLA | Target Recipients |
|:---:|:---|:---|:---:|:---|
| **SEV-0** | Complete system downtime; database unreachable; all clinical workflows halted. | PagerDuty / Opsgenie phone call + SMS | **< 15 Mins** | Lead SRE, Release Manager, Principal Architect |
| **SEV-1** | Core clinical module failing (e.g., EMR notes cannot save, billing locked). | PagerDuty high-priority notification + Slack `#clinic-alerts` | **< 30 Mins** | On-call Backend Engineer, Database Engineer |
| **SEV-2** | Elevated latency; transient API errors; thermal receipt formatting failure. | Slack `#clinic-alerts` | **< 2 Hours** | Frontend Engineer, DevOps Engineer |
| **SEV-3** | Non-critical warning; scheduled backup job lag; minor UI styling flaw. | Slack `#clinic-notifications` / Jira issue | **< 24 Hours** | Assigned Feature Engineer |

---

## 5. Sensitive Data Protections in Logs and Alerts

To maintain strict compliance with healthcare data privacy standards:
1. **Zero PHI in Telemetry:** Patient names, national IDs, phone numbers, and clinical diagnostic narratives are strictly prohibited from logs, metric labels, and alert payloads.
2. **Zero Credentials in Alerts:** Alert notifications must never print database connection strings, JWT signing keys, passwords, or Authorization header contents.
3. **Correlation Tracking Only:** Logs and alerts record exclusively:
   - Timestamp (ISO 8601 UTC)
   - HTTP method & sanitized route (e.g., `POST /api/emr/encounters`)
   - HTTP status code (e.g., `500 Internal Server Error`)
   - `X-Correlation-ID` (e.g., `req-1729288123-abc1234`)
   - Elapsed execution duration (e.g., `45ms`)

---

## 6. Documented Monitoring Gaps & Next Steps

Because managed cloud infrastructure (Render / AWS ECS + managed PostgreSQL 16) has not yet been provisioned by the project owner (`BLK-REL-01`):
1. **Live Production Telemetry is Currently Unmetered:** Metrics reported in this plan represent local verified baselines and proposed operational thresholds.
2. **Action Item Upon Cloud Provisioning:**
   - Configure container log forwarding to CloudWatch Logs or Render Log Streams.
   - Attach Prometheus metrics scrape endpoints or Datadog APM agent.
   - Configure external synthetic uptime check targeting `https://clinic.curasphere.com` and `https://api.curasphere.com/health`.
