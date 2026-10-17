# CuraSphere Enterprise Edition: Enterprise Administration UI/UX Specification
**Document ID:** `DOC-EE-008`  
**Version:** 1.0.0  
**Status:** Approved Design System Blueprint  
**Session:** Session 14: Enterprise Edition Architecture & Multi-Organization Foundation  
**Audience:** UI/UX Engineers, Product Designers, Frontend Developers

---

## 1. Design System Continuity & Principles

The Enterprise Edition user experience builds directly upon CuraSphere's established modern design language (React 18, Tailwind CSS, Lucide Icons, Outfit/Inter typography). It introduces multi-facility and multi-organization controls without cluttering existing clinic workflows.

### Core UX Principles:
1. **Persistent Context Awareness:** The user must always clearly perceive their active Organization and active Facility via a top-bar context pill.
2. **Context Switching Without Full Reloads:** Switching branches or organizations preserves unsaved state where possible and updates navigation asynchronously.
3. **Graceful Permission Degradation:** Unauthorized actions show clear, non-punitive explanations and disabled states rather than jarring 403 crashes.
4. **WCAG 2.1 AA Accessibility:** 4.5:1 color contrast, keyboard-focusable interactive elements, semantic HTML5, and screen-reader ARIA tags.

---

## 2. Global Navigation & Context Switcher Blueprint

```
+----------------------------------------------------------------------------------------------------+
|  [LOGO] CuraSphere HMS     [Org: Beacon Health Network v]  [Branch: Downtown Clinic v]   [User Icon]|
+----------------------------------------------------------------------------------------------------+
|  SIDEBAR               |  MAIN CONTENT WORKSPACE                                                   |
|                        |                                                                           |
|  ENTERPRISE SUITE      |  Breadcrumbs: Home > Organization > Facilities                            |
|  - Network Overview    |  -----------------------------------------------------------------------  |
|  - Facilities (14)     |  FACILITIES & SATELLITE CLINICS                               [+ Add Site]|
|  - Organization Staff  |                                                                           |
|  - Roles & Permissions |  [Search site...] [Filter: All Types v] [Filter: Active v]                |
|  - Entitlements        |                                                                           |
|  - Network Analytics   |  +--------------------+  +--------------------+  +--------------------+   |
|  - Compliance Audit    |  | Main Hospital      |  | Downtown Clinic    |  | North Diagnostic   |   |
|                        |  | Type: Tertiary     |  | Type: Outpatient   |  | Type: Lab/Imaging  |   |
|  CLINIC / HOSPITAL OPS |  | Beds: 250 Occupied |  | Today Appts: 42    |  | Tests Today: 180   |   |
|  - Dashboard           |  | Status: Active     |  | Status: Active     |  | Status: Active     |   |
|  - Appointments        |  +--------------------+  +--------------------+  +--------------------+   |
|  - Patients            |                                                                           |
+------------------------+---------------------------------------------------------------------------+
```

---

## 3. Detailed Administrative Views

### 3.1 Organization Overview (`/enterprise/overview`)
- **Key Metrics:** Total active facilities, network-wide active clinicians, aggregate patient volume, active subscription tier.
- **Quick Links:** Add new facility, invite administrator, download network compliance report.

### 3.2 Facilities & Branches (`/enterprise/facilities`)
- **Facility Table / Card View:** Shows `BranchCode`, `BranchName`, `FacilityType` (`Hospital` vs `Clinic`), active `EditionProfile`, primary contact, and operating status.
- **Facility Creation Modal:** Form collecting Branch Code, Name, Address, Timezone, and Edition Profile (Hospital or Clinic).

### 3.3 Users & Memberships (`/enterprise/users`)
- **Staff Roster:** Displays global email, employee designation, membership role, assigned branches, and invitation status (`Active`, `Invited`, `Suspended`).
- **Multi-Branch Assignment Dialog:** Allows selecting which specific facilities a clinician is authorized to consult or schedule appointments in.

### 3.4 Roles & Permissions (`/enterprise/roles`)
- **Interactive RBAC Grid:** View and customize permissions (`Resource.Action`) assigned to each standard or custom organizational role.

### 3.5 Cross-Facility Analytics (`/enterprise/analytics`)
- **Rollup Charts:** Interactive Recharts visualizations comparing daily outpatient traffic, inpatient census, and revenue across branches.

---

## 4. UI States & Failure Handling Standards

- **Empty State:** Shows an illustrative Lucide icon (e.g. `Building2`, `Users`), an explanation ("No facilities provisioned yet"), and a primary action button ("Create Your First Branch").
- **Loading State:** Smooth pulse skeleton loaders matching the exact table/card layout to avoid layout shifts (Cumulative Layout Shift = 0).
- **Permission Denied State:** Renders an inline alert: "You do not have administrative permissions to modify organization settings. Contact your Organization Owner."
