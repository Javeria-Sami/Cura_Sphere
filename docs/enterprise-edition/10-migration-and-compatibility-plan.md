# CuraSphere Enterprise Edition: Migration Strategy & Backward Compatibility Plan
**Document ID:** `DOC-EE-010`  
**Version:** 1.0.0  
**Status:** Approved Migration Specification  
**Session:** Session 14: Enterprise Edition Architecture & Multi-Organization Foundation  
**Audience:** Database Administrators, Site Reliability Engineers, Enterprise Architects

---

## 1. Migration Philosophy: Zero Data Loss, Zero Downtime

Transitioning from a single-tenant database schema to a multi-tenant enterprise schema is one of the highest-risk operations in software engineering. CuraSphere mandates a **Strictly Non-Destructive, 4-Stage Phased Migration**:

```
[Stage 1: Additive Schema Creation]
- Create Organization, Membership, Entitlement tables.
- Add nullable OrganizationId & BranchFacilityId columns to existing tables.
                 │
                 ▼
[Stage 2: Deterministic Data Backfill]
- Create "Default Healthcare Organization" and "Main Hospital Facility".
- Backfill OrganizationId & BranchFacilityId across all existing records.
- Run orphan detection queries to ensure 100% data association.
                 │
                 ▼
[Stage 3: Constraint Enforcement & Schema Hardening]
- Alter OrganizationId to NOT NULL.
- Recreate unique indexes as compound (organization_id, medical_record_number).
- Add foreign key constraints with ON DELETE RESTRICT.
                 │
                 ▼
[Stage 4: Application Multi-Tenant Switch]
- Deploy multi-tenant backend with EF Core Global Query Filters active.
- Existing single-tenant deployments operate on Default Organization automatically.
```

---

## 2. Default Organization Seeding & Mapping Protocol

1. **Seed Primary Default Tenant:**
   ```sql
   INSERT INTO security.organization (organization_id, organization_code, organization_name, status, created_at, created_by)
   VALUES (1, 'ORG-DEFAULT', 'CuraSphere Primary Health Network', 'Active', NOW(), 1)
   ON CONFLICT (organization_id) DO NOTHING;

   INSERT INTO hr.branch_facility (branch_facility_id, organization_id, branch_code, branch_name, facility_type, status, created_at, created_by)
   VALUES (1, 1, 'BR-MAIN', 'Main Facility', 'Hospital', 'Active', NOW(), 1)
   ON CONFLICT (branch_facility_id) DO NOTHING;
   ```
2. **Deterministic Data Backfill Sequence:**
   ```sql
   -- Update Patients
   UPDATE patient.patient SET organization_id = 1 WHERE organization_id IS NULL;

   -- Update Appointments
   UPDATE patient.appointment SET organization_id = 1, branch_facility_id = 1 WHERE organization_id IS NULL;

   -- Update Clinical EMR Encounters
   UPDATE clinical.emr_encounter SET organization_id = 1, branch_facility_id = 1 WHERE organization_id IS NULL;

   -- Update Financial Invoices & Payments
   UPDATE billing.invoice SET organization_id = 1, branch_facility_id = 1 WHERE organization_id IS NULL;
   UPDATE billing.payment_record SET organization_id = 1, branch_facility_id = 1 WHERE organization_id IS NULL;

   -- Update Staff & User Accounts
   UPDATE hr.department SET organization_id = 1, branch_facility_id = 1 WHERE organization_id IS NULL;
   UPDATE hr.employee SET organization_id = 1 WHERE organization_id IS NULL;
   
   -- Populate Initial Organization Memberships for Existing Users
   INSERT INTO security.organization_membership (organization_id, user_id, role_id, membership_status, created_at, created_by)
   SELECT 1, u.user_id, u.role_id, 'Active', NOW(), 1
   FROM security.user_account u
   ON CONFLICT DO NOTHING;
   ```

---

## 3. Orphan Detection & Pre-Constraint Verification Queries

Before tightening foreign key constraints to `NOT NULL`, execution of these pre-flight validation queries is mandatory:

```sql
-- 1. Check for unassigned patients
SELECT COUNT(*) AS unassigned_patients FROM patient.patient WHERE organization_id IS NULL;

-- 2. Check for appointments with invalid facility
SELECT COUNT(*) AS orphaned_appointments FROM patient.appointment 
WHERE organization_id NOT IN (SELECT organization_id FROM security.organization);

-- 3. Check for invoices with missing organization
SELECT COUNT(*) AS orphaned_invoices FROM billing.invoice WHERE organization_id IS NULL;
```
If any query returns a count $> 0$, migration execution halts immediately and rolls back.

---

## 4. Constraint Evolution & Unique Index Transitions

```sql
-- Drop old global unique index
DROP INDEX IF EXISTS patient.ix_patient_medical_record_number;

-- Create new compound tenant-scoped unique index
CREATE UNIQUE INDEX ix_patient_org_mrn ON patient.patient (organization_id, medical_record_number);

-- Same for invoices
DROP INDEX IF EXISTS billing.ix_invoice_invoice_number;
CREATE UNIQUE INDEX ix_invoice_org_invoice_number ON billing.invoice (organization_id, invoice_number);
```

---

## 5. Backward Compatibility Guarantee

- **Single-Tenant Hospital/Clinic Instances:** In single-facility deployments where `CURASPHERE_EDITION` is `Hospital` or `Clinic`, the application automatically resolves `OrganizationId = 1` and `BranchFacilityId = 1` behind the scenes.
- **Zero Breaking Workflow Changes:** Clinical workflows (intake, calendar, doctor notes, billing) behave identically for end users. The multi-tenant foundation functions invisibly until multi-organization features are explicitly activated.
