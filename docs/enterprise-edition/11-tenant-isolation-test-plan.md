# CuraSphere Enterprise Edition: Tenant Isolation & Negative Authorization Test Plan
**Document ID:** `DOC-EE-011`  
**Version:** 1.0.0  
**Status:** Approved QA Test Specification  
**Session:** Session 14: Enterprise Edition Architecture & Multi-Organization Foundation  
**Audience:** QA Automation Engineers, Security Auditors, Backend Test Specialists

---

## 1. Test Harness & Synthetic Test Organization Setup

To provide empirical proof of data isolation, the test suite requires a deterministic test fixture comprising two completely distinct synthetic healthcare organizations:

```
[Synthetic Tenant Alpha: "Alpha Medical Network" (OrgId: 101)]
├── Facility 1: "Alpha Main Hospital" (FacilityId: 1001)
└── Test User: "alice@alpha.org" (Role: Doctor, Org: 101, Facility: 1001)
    - Patient: "Patient-Alpha" (PatientId: 5001, MRN: "MRN-A-001")
    - Invoice: "INV-Alpha-01" (InvoiceId: 7001)

[Synthetic Tenant Beta: "Beta Clinic Group" (OrgId: 202)]
├── Facility 2: "Beta North Clinic" (FacilityId: 2002)
└── Test User: "bob@beta.org" (Role: Doctor, Org: 202, Facility: 2002)
    - Patient: "Patient-Beta" (PatientId: 6002, MRN: "MRN-B-002")
    - Invoice: "INV-Beta-01" (InvoiceId: 8002)
```

---

## 2. Master Negative Authorization Test Matrix

| Test ID | Test Scenario | Actor & Context | Target Resource & Operation | Expected HTTP Response | Required Verification Assertion |
| :---: | :--- | :--- | :--- | :---: | :--- |
| **ISO-01** | **Direct Cross-Tenant Patient Read (IDOR)** | Authenticated as `alice@alpha.org` (Org 101) | `GET /api/patient/6002` (Patient belongs to Org 202) | **HTTP 404 Not Found** | Global Query Filter must suppress row. Server must return 404, never 200 or 403 (to avoid leaking existence). |
| **ISO-02** | **Cross-Tenant Patient Search Leakage** | Authenticated as `alice@alpha.org` (Org 101) | `GET /api/patient?search=Beta` | **HTTP 200 (Empty List)** | Result list must contain `0` items. Zero Patient-Beta records returned. |
| **ISO-03** | **Foreign Doctor Appointment Booking** | Authenticated as `alice@alpha.org` (Org 101) | `POST /api/appointments` with `DoctorId` from Org 202 | **HTTP 400 Bad Request** | Doctor lookup fails tenant filter; appointment rejected with validation error. |
| **ISO-04** | **Cross-Tenant Invoice Access** | Authenticated as `bob@beta.org` (Org 202) | `GET /api/financial/invoices/7001` (Org 101 invoice) | **HTTP 404 Not Found** | Query filter blocks record; no billing data or amounts disclosed. |
| **ISO-05** | **Cross-Tenant Payment Injection** | Authenticated as `bob@beta.org` (Org 202) | `POST /api/financial/payments` against `InvoiceId: 7001` | **HTTP 400 / 404** | Payment refused; invoice balance on Org 101 remains untouched. |
| **ISO-06** | **Cross-Facility Sibling Access** | Authenticated as `bob@beta.org` (Facility 2002) | `GET /api/opd/queue?facilityId=2003` (Sibling branch) | **HTTP 403 Forbidden** | User not assigned to Branch 2003; access explicitly denied. |
| **ISO-07** | **Revoked Membership Token Usage** | User membership in Org 101 revoked at $T_0$ | `GET /api/patient/5001` with pre-revocation token at $T_0 + 10s$ | **HTTP 401 Unauthorized** | SecurityStamp check fails; session invalidated immediately. |
| **ISO-08** | **Cache Key Isolation** | Org 101 and Org 202 request cached entity with ID `1` | Sequential requests to cache service | **PASS (Distinct)** | Cache keys resolved as `cache:org:101:1` and `cache:org:202:1`; zero collision. |
| **ISO-09** | **Cross-Organization Rollup Leakage** | Executive in Org 101 views Network Analytics | `GET /api/reports/dashboard-summary` | **PASS (Scoped)** | Financial totals strictly equal sum of Org 101 branches; Org 202 revenue omitted. |
| **ISO-10** | **Single-Tenant Backward Compatibility** | Hospital/Clinic user logs in without explicit Org | All standard workflows | **HTTP 200 OK** | System defaults seamlessly to Primary Org; zero functional regression. |

---

## 3. Automated Negative Authorization Test Specification

Example Vitest / .NET Integration test pattern:

```csharp
[Fact]
public async Task CrossTenant_PatientAccess_MustReturn404NotFound()
{
    // Arrange: Generate authenticated client for Tenant Alpha
    var clientAlpha = _factory.CreateAuthenticatedClient(orgId: 101, userId: 1);
    long foreignPatientId = 6002; // Belongs to Tenant Beta (Org 202)

    // Act
    var response = await clientAlpha.GetAsync($"/api/patient/{foreignPatientId}");

    // Assert: Must return 404 Not Found, never 200 or 500
    Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
}
```
