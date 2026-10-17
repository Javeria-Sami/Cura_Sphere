# CuraSphere Enterprise Edition: Centralized Feature Entitlements & Licensing
**Document ID:** `DOC-EE-007`  
**Version:** 1.0.0  
**Status:** Approved Architecture Blueprint  
**Session:** Session 14: Enterprise Edition Architecture & Multi-Organization Foundation  
**Audience:** Product Managers, Software Architects, Billing Engineers

---

## 1. Feature Entitlement Architecture

CuraSphere decouples feature availability from commercial billing code. Rather than scattering ad-hoc `if (isEnterprise)` or hardcoded subscription checks across controllers and UI components, CuraSphere implements a **Centralized Feature Entitlement Engine**:

```
[Commercial Subscription / Plan] (Starter / Professional / Enterprise)
               │
               ▼
   [Feature Entitlement Registry] (Database / Cached in Redis)
               │
       ┌───────┴────────────────────────┐
       ▼                                ▼
[Backend Enforcement]           [Frontend Presentation]
[RequireEntitlement("...")]     useEntitlement("...") hook
Returns HTTP 403 Forbidden      Hides UI navigation & buttons
```

---

## 2. Master Feature Entitlement Matrix

| Feature Key | Description | Supported Editions | Scope | Subscription Required? | Backend Enforcement Point | Frontend Visibility Behavior | Default on Missing Config |
| :--- | :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| `multi_facility` | Permission to provision 2+ facilities/branches | Enterprise | Organization | **Yes** (Enterprise tier) | `FacilityController.CreateFacility` | Shows "Add Branch" button & branch selector | **Disabled** (1 facility max) |
| `cross_facility_reports`| Unified executive analytics across all branches | Enterprise | Organization | **Yes** (Professional+) | `ReportsController.GetNetworkRollup` | Shows "Network Analytics" tab in sidebar | **Disabled** |
| `advanced_audit_trail` | Comprehensive HIPAA event exports & query logs | Hospital / Enterprise | Organization | **Yes** (Professional+) | `AuditController.ExportComplianceAudit`| Shows "Compliance Export" button | **Disabled** |
| `org_user_management` | Centralized staff provisioning across branches | Enterprise | Organization | **Yes** (Enterprise tier) | `MembershipController.InviteMember` | Shows "Organization Staff" admin portal | **Disabled** |
| `custom_branding` | Organization-specific receipt logo, portal colors | Clinic / Hospital / Enterprise | Facility | **Yes** (Add-on) | `SettingsController.UploadBranding` | Shows branding configuration form | **Disabled** |
| `open_api_access` | REST API keys for third-party EHR integration | Enterprise | Organization | **Yes** (Enterprise tier) | `ApiKeyAuthenticationMiddleware` | Shows "API Keys" developer settings | **Disabled** |
| `inpatient_ipd` | Inpatient bed allocation, nursing, ward rounds | Hospital / Enterprise | Facility | No (Edition feature) | `IpdController` (`[RequireModule("ipd")]`)| Shows "Inpatient Wards" in navigation | **Disabled in Clinic** |
| `emergency_er` | Emergency triage P1-P4, trauma charts | Hospital / Enterprise | Facility | No (Edition feature) | `EmergencyController` (`[RequireModule]`) | Shows "Emergency" in navigation | **Disabled in Clinic** |
| `clinic_fast_track` | 3-field walk-in registration, thermal receipt | Clinic / Enterprise | Facility | No (Edition feature) | `PatientController.QuickIntake` | Shows "Fast Intake" modal | **Disabled in Hospital** |

---

## 3. Enforcement Implementation Pattern

### 3.1 Backend Attribute Filter
Controllers decorate sensitive administrative actions with `[RequireEntitlement]`:

```csharp
[Authorize]
[RequireEntitlement("multi_facility")]
[HttpPost("api/facilities")]
public async Task<IActionResult> CreateFacility([FromBody] CreateFacilityDto dto)
{
    // Execution proceeds only if organization has active entitlement
    var facility = await _facilityService.CreateFacilityAsync(dto);
    return CreatedAtAction(nameof(GetFacilityById), new { id = facility.BranchFacilityId }, facility);
}
```

If an organization lacks the entitlement or exceeds its allocated branch quota:
- Returns HTTP 403 Forbidden:
  ```json
  {
    "type": "https://curasphere.com/errors/entitlement-required",
    "title": "Feature Not Entitled",
    "status": 403,
    "detail": "Your organization subscription does not include the 'multi_facility' entitlement. Please contact sales to upgrade."
  }
  ```

### 3.2 Frontend Defensive Rule
> **Frontend Is Never a Security Boundary:** The frontend `useEntitlement('multi_facility')` hook purely optimizes user experience by hiding disabled buttons or showing an "Upgrade Plan" badge. All security and data boundary enforcement is executed server-side.
