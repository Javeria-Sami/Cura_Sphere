# CuraSphere Enterprise Edition: Multi-Tenant Architecture & Isolation Strategy
**Document ID:** `DOC-EE-003`  
**Version:** 1.0.0  
**Status:** Approved Architectural Decision Record (ADR)  
**Session:** Session 14: Enterprise Edition Architecture & Multi-Organization Foundation  
**Audience:** Principal Architects, Database Administrators, Cloud Infrastructure Engineers

---

## 1. Architectural Challenge

Healthcare data requires uncompromising privacy, strict HIPAA/GDPR regulatory compliance, and near-zero risk of cross-organization leakage. Concurrently, a multi-tenant healthcare SaaS must remain operationally manageable, cost-effective for small clinic groups, and capable of aggregating analytics across dozens of facilities within a network.

This document evaluates three architectural isolation paradigms and defines CuraSphere's definitive multi-tenant database strategy.

---

## 2. Comparative Evaluation of Multi-Tenant Strategies

### Architecture 1: Shared Database, Shared Schema with Discriminator Column (`OrganizationId`)
Every table includes an indexed `OrganizationId` column. Data isolation is enforced at the ORM layer via Entity Framework Core Global Query Filters, complemented by PostgreSQL Row-Level Security (RLS) policies.

### Architecture 2: Shared Database, Separate Schemas per Organization
A single PostgreSQL database instance where each organization is allocated its own schema (e.g., `org_beacon.*`, `org_metro.*`). Tables are duplicated across schemas.

### Architecture 3: Database-per-Tenant (Isolated Databases)
Each organization is provisioned with a physically separate PostgreSQL database (e.g., `curasphere_tenant_01`, `curasphere_tenant_02`).

---

## 3. Comprehensive Multi-Tenant Evaluation Matrix

| Architectural Dimension | Option 1: Shared DB + Discriminator Column | Option 2: Shared DB + Schema-per-Tenant | Option 3: Database-per-Tenant |
| :--- | :--- | :--- | :--- |
| **Security & Isolation** | **High** (When backed by EF Core Query Filters + PostgreSQL RLS). | **High** (Schema namespaces provide logical separation). | **Maximum** (Physical database and connection string isolation). |
| **Implementation Complexity** | **Low to Moderate** (Native support via EF Core 8 `HasQueryFilter`). | **High** (Requires dynamic migration runners for hundreds of schemas). | **Very High** (Requires dynamic connection pooling, routing, and tenant catalogs). |
| **Hosting Infrastructure Cost** | **Lowest** (Consolidated connection pools and shared buffer cache). | **Moderate** (Large catalog overhead in PostgreSQL `pg_catalog`). | **Highest** (Substantial idle memory and compute cost per database instance). |
| **Operational Maintenance** | **Simplest** (Single migration command migrates all data instantly). | **Complex** (Failed migration midway leaves schema version drift). | **Extremely Complex** (Running 500 migrations on release windows). |
| **Backup & Recovery** | Point-in-time recovery affects all tenants. Tenant-specific restore requires export/import scripts. | Individual schema dump (`pg_dump -n org_id`) possible. | Independent backup and restore per tenant without affecting other clients. |
| **Scalability (Tenants)** | Scales smoothly to thousands of organizations. | Performance degrades after ~200 schemas due to PostgreSQL catalog bloat. | Scales out horizontally, but high resource overhead for small clinics. |
| **Cross-Facility Reporting** | **Native & High-Performance** (Standard SQL `GROUP BY OrganizationId`). | **Difficult** (Requires dynamic cross-schema queries or dblink). | **Extremely Difficult** (Requires dedicated ETL pipeline and data warehouse). |
| **Migration Complexity** | **Low** (Standard `dotnet ef database update`). | **High** (Iterative schema looping scripts). | **High** (Distributed orchestration tooling required). |
| **EF Core 8 Compatibility** | **100% Native & Idiomatic** | Requires dynamic schema interceptors on `OnModelCreating`. | Requires dynamic `DbContext` factory and connection caching. |

---

## 4. The Recommended Architecture: Hybrid Tiered Strategy

CuraSphere adopts a **Tiered Hybrid Architecture**:

```
[Standard & Professional Tiers]                [Enterprise Dedicated Tier]
(Small Clinics, Outpatient Groups)              (Large Hospital Networks, Government)
               │                                                  │
               ▼                                                  ▼
     +-------------------+                              +-------------------+
     | Shared PostgreSQL |                              | Dedicated Database|
     | Shared Tables     |                              | Isolated DB per   |
     | OrganizationId    |                              | Enterprise Org    |
     | EF Core Filters   |                              | Custom Encryption |
     +-------------------+                              +-------------------+
```

### Primary Model (Tier 1 & 2): Shared Database with Discriminator Column (`OrganizationId`)
For over 95% of deployments, CuraSphere implements a shared database with `OrganizationId` scoping:
1. **EF Core 8 Global Query Filters:** Enforced at model compilation time across every tenant-scoped entity. Developers cannot accidentally forget a `Where(e => e.OrganizationId == currentOrgId)` clause.
2. **PostgreSQL Row-Level Security (RLS):** Activated as a defense-in-depth safeguard at the database engine level, verifying `current_setting('app.current_org_id')`.
3. **Compound Indexes:** Critical lookup indexes are compound-indexed with `OrganizationId` as the leading column (e.g., `(organization_id, medical_record_number)`).

### Premium Model (Tier 3): Dedicated Database Isolation
For enterprise hospital networks with strict legal data-residency mandates:
- The exact same domain code and EF Core configuration connects to a dedicated database instance by mapping the tenant's connection string from an encrypted secrets catalog (`ITenantConnectionProvider`).

---

## 5. Rationale & Trade-Off Justification for CuraSphere

1. **Alignment with Healthcare Economics:** Small outpatient clinics cannot bear the cost of dedicated cloud PostgreSQL instances ($30–$100/mo per database). Shared tables with discriminator columns allow small clinics to be onboarded at near-zero marginal infrastructure cost.
2. **Operational Reliability:** Database migrations can be verified and applied in a single transactional operation, eliminating the danger of partial schema drift across hundreds of independent schemas.
3. **Native Cross-Facility Reporting:** An enterprise health network requires executive dashboards comparing revenue, appointment volume, and bed census across all 15 of its regional facilities. A shared database allows rapid relational joins without complex ETL data pipelines.
