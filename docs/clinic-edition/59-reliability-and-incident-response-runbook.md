# CuraSphere Clinic Edition: Reliability & Incident Response Runbook

**Document ID:** `DOC-CE-059`  
**Session:** 36  
**Version:** 1.0.0  
**Date:** 2026-10-18  
**Author / Lead SRE:** Senior Site Reliability Engineer, Software Architect, Database Reliability Engineer, Application Security Engineer  
**Scope:** Operational Incident Response, System Outage Mitigation, Disaster Recovery & Blameless RCA Runbook for CuraSphere Clinic Edition  
**Target Release Artifact:** `v1.0.0-clinic` (Commit: `eab7e65`)  
**Deployment Model:** React 18 / Vite Static Frontend (Vercel) + ASP.NET Core 8 Web API Linux Container (Render / AWS ECS) + Managed PostgreSQL 16  
**Status:** **`ACTIVE OPERATIONAL RUNBOOK (STANDARD OPERATING PROCEDURE)`**  

---

## 1. Runbook Purpose & Core SRE Principles

This runbook defines standard operating procedures for detecting, containing, mitigating, and conducting post-incident reviews for operational incidents affecting the **CuraSphere Hospital Management System — Clinic Edition**.

### 1.1 Non-Negotiable Operational Principles
1. **Patient Safety First:** Clinical workflow interruptions, prescription errors, or missing drug-allergy alerts must be treated with immediate priority.
2. **Zero Sensitive Data Exposure:** During incident triage and log collection, protected health information (PHI), passwords, JWT signing keys, and payment credentials must never be dumped into public chat channels, tickets, or unencrypted repositories.
3. **Preserve Evidence Before Remediating:** Capture container logs, database transaction states, and sanitized error traces before restarting nodes or rolling back state.
4. **Fast Rollback Over Rushed Fixes:** If an outage is triggered by a new deployment, initiate the pre-approved rollback procedure immediately rather than attempting unreviewed forward fixes in production.
5. **Blameless Culture:** Post-incident reviews focus strictly on architectural weaknesses, alerting gaps, and process improvements, never on individual blame.

---

## 2. Incident Classification & Response SLAs

All incidents must be classified according to the following matrix upon detection:

| Severity | Definition & Clinical Impact | Initial Response SLA | Status Update Cadence | Incident Commander |
|:---:|:---|:---:|:---:|:---|
| **SEV-0** | **Total Outage:** The system is inaccessible; database is down; clinical and billing operations completely halted across all clinic branches. | **< 15 Mins** | Every 15 mins | Lead SRE / Principal Architect |
| **SEV-1** | **Critical Functionality Loss:** Core module failure (e.g., EMR notes failing to save, CDSS contraindication alerts offline, payment ledger desynchronization). | **< 30 Mins** | Every 30 mins | Lead Backend Engineer / SRE |
| **SEV-2** | **Degraded Performance:** High API latency (p95 > 1500ms), thermal receipt printing failure, sporadic 5xx errors affecting < 2% of requests. | **< 2 Hours** | Every 2 hours | DevOps / On-call Engineer |
| **SEV-3** | **Minor / Non-Impacting Defect:** Non-blocking cosmetic UI alignment, slow report export during non-peak hours, low-priority log warning noise. | **< 24 Hours** | Next business day | Assigned Feature Developer |

---

## 3. Incident Workflow & Triage Roles

```
[Detection: Synthetic Alert / Health Probe / Clinical User Report]
                                │
                                ▼
               [1. Incident Commander (IC) Appointed]
           ├── Declares Severity (SEV-0 to SEV-3)
           ├── Opens War Room (Slack #clinic-incident-bridge / Google Meet)
           └── Appoints Scribe & Technical Leads
                                │
                                ▼
               [2. Immediate Containment & Isolation]
           ├── Stop harmful background jobs or malformed ingress traffic
           ├── Enable Cloudflare / Vercel Maintenance Landing Page (if SEV-0)
           └── Freeze active code and database deployments
                                │
                                ▼
               [3. Investigation & Diagnostic Collection]
           ├── Check /health, /health/live, /health/ready probes
           ├── Query stdout JSON logs by X-Correlation-ID
           └── Inspect PostgreSQL pg_stat_activity and lock queues
                                │
                                ▼
               [4. Mitigation & Service Restoration]
           ├── Execute Rollback Protocol OR Safe Forward Hotfix
           └── Validate E2E Health Check probes
                                │
                                ▼
               [5. Service Restored & Monitoring Watch]
           ├── Disable Maintenance Mode
           └── Monitor metrics for 60 minutes minimum
                                │
                                ▼
               [6. Blameless Post-Mortem & Incident Register Update]
```

### Incident Response Roles
- **Incident Commander (IC):** Directs the response, authorizes rollbacks or emergency patches, and acts as the final decision maker.
- **Operations / SRE Lead:** Executes diagnostic commands, infrastructure changes, and rollback runbooks.
- **Communications Scribe:** Documents timestamps, commands executed, and sends periodic sanitized updates to clinic stakeholders.
- **Domain Subject Matter Expert (SME):** Specialist in ASP.NET Core, EF Core, PostgreSQL, or React for rapid root-cause diagnosis.

---

## 4. Specific Incident Response Procedures

### 4.1 Procedure A: Total Service Outage (SEV-0)

**Symptoms:** Synthetics report 100% packet drop; API returns HTTP 502/503/504; frontend displays network failure banner.

1. **Verify Outage Scope:**
   - Execute health check probe:
     ```bash
     curl -I -s https://api.curasphere.com/health
     curl -I -s https://api.curasphere.com/health/live
     ```
   - Check frontend availability:
     ```bash
     curl -I -s https://clinic.curasphere.com
     ```
2. **Containment:**
   - If the backend is crash-looping due to bad configuration or a recent release, route traffic to the maintenance page:
     ```bash
     # Route traffic to static maintenance page via edge DNS / CDN
     vercel project maintenance enable
     ```
3. **Container Diagnostics:**
   - Inspect container exit codes and stderr logs:
     ```bash
     # Inspect Docker/ECS task status
     aws ecs describe-tasks --cluster curasphere-prod --tasks <TASK_ID>
     # Or Render container logs
     render logs --service srv-curasphere-api --limit 100
     ```
4. **Resolution:**
   - If triggered by recent deployment, trigger **Fast Rollback** (Section 5).
   - If container out-of-memory (OOM killed): Increase memory limits to 1024MB temporarily and restart the task.

---

### 4.2 Procedure B: API 5xx Spikes & Latency Degradation (SEV-1 / SEV-2)

**Symptoms:** HTTP 500 error rate > 0.5%; p95 latency > 1500ms; frontend requests timing out at the 15s cutoff.

1. **Identify Error Clustering:**
   - Filter logs by HTTP status 500:
     ```bash
     # Filter structured logs for unhandled exceptions
     grep '"StatusCode":500' /var/log/curasphere/api-stdout.json | jq -r '{Timestamp, Route, ExceptionMessage, CorrelationId}'
     ```
2. **Inspect Connection Pool Saturation:**
   - Verify if Npgsql pool is exhausted:
     ```sql
     -- Query active connections vs pool limits
     SELECT count(*), state FROM pg_stat_activity WHERE datname = 'curasphere_prod_db' GROUP BY state;
     ```
   - If connection count reaches `Max Pool Size` (default 100) and state is `idle in transaction`, long-running transactions are leaking.
3. **Mitigation:**
   - Terminate hung queries older than 60 seconds:
     ```sql
     SELECT pg_terminate_backend(pid) 
     FROM pg_stat_activity 
     WHERE datname = 'curasphere_prod_db' 
       AND state != 'idle' 
       AND query_start < now() - interval '60 seconds';
     ```
   - Restart the API container to re-initialize the connection pool if connection leak persists.

---

### 4.3 Procedure C: Database Connectivity & Lock Contention (SEV-1)

**Symptoms:** `/health/ready` returns HTTP 503 Unhealthy; API logs show `NpgsqlException: Timeout waiting for connection from pool`.

1. **Verify Database Process:**
   - Check PostgreSQL server status:
     ```bash
     pg_isready -h db.curasphere.internal -p 5432 -d curasphere_prod_db
     ```
2. **Identify Blocked Locks:**
   - Check for exclusive table locks or deadlocks in clinical/billing tables:
     ```sql
     SELECT blocked_locks.pid     AS blocked_pid,
            blocking_locks.pid    AS blocking_pid,
            blocked_activity.query AS blocked_statement,
            blocking_activity.query AS current_statement_in_blocking_process
     FROM  pg_catalog.pg_locks         blocked_locks
     JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
     JOIN pg_catalog.pg_locks         blocking_locks 
         ON blocking_locks.locktype = blocked_locks.locktype
         AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
         AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
         AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
         AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
         AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
         AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
         AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
         AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
         AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
         AND blocking_locks.pid != blocked_locks.pid
     JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
     WHERE NOT blocked_locks.granted;
     ```
3. **Remediation:**
   - Terminate the blocking PID:
     ```sql
     SELECT pg_cancel_backend(<blocking_pid>);
     ```

---

### 4.4 Procedure D: Security Incident & PHI Breach Containment (SEV-0 / SEV-1)

**Symptoms:** Spike in unauthorized requests (401/403); brute force detection on `/api/auth/login`; credential leak suspected.

1. **Immediate Quarantine:**
   - Block malicious origin IP address at the edge (Cloudflare WAF / AWS WAF):
     ```bash
     # Example Cloudflare IP ban via CLI
     flarectl firewall rules create --zone=curasphere.com --action=block --target=ip --value=<SUSPICIOUS_IP>
     ```
2. **Token Invalidation:**
   - If JWT secret compromise is suspected:
     - Rotate `JWT_SECRET` in production secrets manager immediately.
     - Restart API containers to force all active sessions to re-authenticate.
3. **Preserve Forensic Logs:**
   - Snapshot audit logs and Kestrel access logs before modifying any systems.
   - Run audit verification script:
     ```bash
     # Isolate authentication audit events
     grep -E 'AUTH-AUDIT|LOGIN_FAILED|LOCKOUT' /var/log/curasphere/security.log > /incident-evidence/forensics-$(date +%s).log
     ```
4. **Mandatory Breach Notification:**
   - Inform Clinic Privacy Officer and Legal Counsel within 2 hours if any patient record exfiltration is verified.

---

### 4.5 Procedure E: Clinical or Financial Data-Integrity Incident (SEV-1)

**Symptoms:** Payment amount does not match invoice total; encounter note overwritten; race condition in queue numbering.

1. **Halt Write Operations to Affected Module:**
   - Do not allow further corrupt transactions. Set affected route to read-only via feature flag or maintenance interceptor.
2. **Preserve Evidence (Zero Manual Hacks):**
   - **NEVER** run ad-hoc manual SQL updates (`UPDATE Invoices SET Balance = ...`) without an audited, peer-reviewed migration script.
   - Query transaction records and snapshot affected IDs:
     ```sql
     SELECT * FROM "Invoices" WHERE "Id" = '<AFFECTED_ID>';
     SELECT * FROM "Payments" WHERE "InvoiceId" = '<AFFECTED_ID>';
     ```
3. **Execute Reconciled Reconciliation Script:**
   - Prepare a non-destructive audit script that computes ledger differences and applies balance adjustments via verified double-entry journal records.
4. **Validation:**
   - Run financial consistency checks:
     ```bash
     ./scripts/verify-financial-integrity.sh --invoice-id <ID>
     ```

---

## 5. Rollback vs. Forward-Repair Decision Framework

When an operational failure occurs following a release, the Incident Commander must select either **Fast Rollback** or **Forward Hotfix** using this decision matrix:

```
                                  [Deployment Failure Occurred]
                                                │
                                                ▼
                          ┌───────────────────────────────────────────┐
                          │ Did the release apply destructive DB      │
                          │ schema changes (e.g. column drops)?      │
                          └─────────────────────┬─────────────────────┘
                                                │
                                ┌───────────────┴───────────────┐
                                │ YES                           │ NO
                                ▼                               ▼
                ┌──────────────────────────────┐  ┌──────────────────────────────┐
                │ DESTRUCTIVE SCHEMA APPLIED   │  │ NON-DESTRUCTIVE / CODE ONLY  │
                │                              │  │                              │
                │ 1. CANNOT FAST-ROLLBACK CODE │  │ 1. EXECUTE FAST ROLLBACK     │
                │    WITHOUT CORRUPTING DB.    │  │ 2. Frontend: Vercel Rollback │
                │ 2. REQUIRE FORWARD HOTFIX    │  │ 3. Backend: Docker Prev Tag  │
                │    OR DATABASE RESTORE       │  │ 4. Target MTTR: < 10 Minutes │
                │    FROM BACKUP.              │  │                              │
                └──────────────────────────────┘  └──────────────────────────────┘
```

### 5.1 Fast Rollback Protocol (Sub-10 Minute MTTR)
*Precondition:* Schema changes are purely additive (expand/contract pattern).
1. **Frontend Rollback:**
   ```bash
   # Revert production alias to previously verified deployment ID
   vercel rollback <PREVIOUS_HEALTHY_DEPLOYMENT_ID> --yes
   ```
2. **Backend Container Rollback:**
   ```bash
   # Redeploy previous stable Docker image tag
   docker pull curasphere/api:v1.0.0-stable
   aws ecs update-service --cluster curasphere-prod --service curasphere-api --force-new-deployment
   ```
3. **Verify Health Probes Post-Rollback:**
   ```bash
   curl -f -s https://api.curasphere.com/health/ready || echo "ROLLBACK HEALTH CHECK FAILED"
   ```

---

## 6. Post-Incident Review (PIR) & Blameless Root Cause Analysis

A Post-Incident Review must be scheduled within **48 hours** of closing any SEV-0 or SEV-1 incident.

### 6.1 Blameless Retrospective Structure
1. **Incident Summary:** High-level description of what occurred, duration, and patient/clinical impact.
2. **Chronological Timeline:** Minute-by-minute timeline from detection to full recovery.
3. **Root Cause Analysis (The 5 Whys):**
   - *Why did the API return 500 errors?* Database connections timed out.
   - *Why did database connections time out?* The connection pool was exhausted.
   - *Why was the connection pool exhausted?* A query on `PatientAppointments` was missing a composite index.
   - *Why was the index missing?* Staging query profiling did not test with 50,000 synthetic patient rows.
   - *Why was data volume low in staging?* Seed generator did not populate realistic production volumes.
4. **What Went Well:** Systems, alerts, or procedures that functioned effectively.
5. **What Went Poorly:** Alert delays, missing telemetry, or confusing error messages.
6. **Corrective Action Items (SMART):**
   - Each action item must have a specific owner, Jira issue ID, and deadline.
   - Update `docs/clinic-edition/57-production-health-and-incident-register.md` with PIR findings.
