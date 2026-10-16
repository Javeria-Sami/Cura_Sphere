import { EditionType, ModuleId, EditionConfig, ModuleDefinition } from "../types/edition";

export const ALL_MODULE_DEFINITIONS: ModuleDefinition[] = [
  // Shared
  { id: "dashboard", label: "Dashboard", category: "shared", defaultPath: "/dashboard", description: "Operational overview & statistics" },
  { id: "patients", label: "Patients", category: "shared", defaultPath: "/patients", description: "Demographics & patient registry" },
  { id: "doctors", label: "Doctors Directory", category: "shared", defaultPath: "/doctors", description: "Physicians, specialties & schedules" },
  { id: "nurses", label: "Nurses Desk", category: "shared", defaultPath: "/nurses", description: "Nursing roster & vital checks" },
  { id: "appointments", label: "Appointments", category: "shared", defaultPath: "/appointments", description: "Consultation bookings & calendar" },
  { id: "opd", label: "OPD Queue", category: "shared", defaultPath: "/opd", description: "Outpatient token queue & consultation rooms" },
  { id: "emr", label: "EMR Desk", category: "shared", defaultPath: "/emr", description: "Electronic medical records & clinical SOAP notes" },
  { id: "laboratory", label: "Laboratory", category: "shared", defaultPath: "/laboratory", description: "Lab diagnostic sample tests & reports" },
  { id: "radiology", label: "Radiology / PACS", category: "shared", defaultPath: "/radiology", description: "Medical imaging, scans & studies" },
  { id: "pharmacy", label: "Pharmacy", category: "shared", defaultPath: "/pharmacy", description: "Medication dispensary & inventory" },
  { id: "billing", label: "Billing & Invoices", category: "shared", defaultPath: "/billing", description: "Fee calculations, invoices & statements" },
  { id: "payments", label: "Payments Cashier", category: "shared", defaultPath: "/payments", description: "Payment processing & receipts" },
  { id: "insurance", label: "Insurance Claims", category: "shared", defaultPath: "/insurance", description: "Panel pre-approvals & claims" },
  { id: "inventory", label: "Store Inventory", category: "shared", defaultPath: "/inventory", description: "Hospital stock & consumables" },
  { id: "hr", label: "HR Staff", category: "shared", defaultPath: "/hr", description: "Employee management & records" },
  { id: "attendance", label: "Attendance Roster", category: "shared", defaultPath: "/attendance", description: "Duty shifts & time tracking" },
  { id: "reports", label: "BI Reports", category: "shared", defaultPath: "/reports", description: "Clinical & financial summaries" },
  { id: "notifications", label: "Notifications", category: "shared", defaultPath: "/notifications", description: "System alerts & clinical notifications" },
  { id: "audit", label: "Audit Logs", category: "shared", defaultPath: "/audit", description: "HIPAA security access logs" },
  { id: "administration", label: "System Config", category: "shared", defaultPath: "/administration", description: "Lookups & system settings" },

  // Hospital-Only
  { id: "ipd", label: "IPD Wards", category: "hospital", defaultPath: "/ipd", description: "Inpatient admissions, ward beds & discharge" },
  { id: "emergency", label: "Emergency Triage", category: "hospital", defaultPath: "/emergency", description: "Acute emergency trauma & P1/P2/P3 triage" },
  { id: "surgery", label: "Surgery OT", category: "hospital", defaultPath: "/surgery", description: "Operation theaters & surgical schedules" },
  { id: "icu", label: "ICU Telemetry", category: "hospital", defaultPath: "/icu", description: "Intensive care vitals & ventilator monitoring" },

  // Clinic-Specialized
  { id: "clinic-workspace", label: "Clinic Desk", category: "clinic", defaultPath: "/clinic", description: "Streamlined single-screen consultation desk" },
  { id: "clinic-queue", label: "Walk-in Tokens", category: "clinic", defaultPath: "/clinic/queue", description: "Fast walk-in patient token queue" },
  { id: "clinic-billing", label: "Quick Fee Slip", category: "clinic", defaultPath: "/clinic/billing", description: "Rapid clinic counter billing receipts" }
];

const SHARED_MODULE_IDS: ModuleId[] = ALL_MODULE_DEFINITIONS
  .filter((m) => m.category === "shared")
  .map((m) => m.id);

const HOSPITAL_ONLY_MODULE_IDS: ModuleId[] = ALL_MODULE_DEFINITIONS
  .filter((m) => m.category === "hospital")
  .map((m) => m.id);

const CLINIC_SPECIALIZED_MODULE_IDS: ModuleId[] = ALL_MODULE_DEFINITIONS
  .filter((m) => m.category === "clinic")
  .map((m) => m.id);

export const HOSPITAL_EDITION_CONFIG: EditionConfig = {
  type: "Hospital",
  name: "Hospital Edition",
  badgeLabel: "Hospital",
  description: "Comprehensive inpatient, surgical, ICU, emergency, and outpatient healthcare management.",
  enabledModules: [...SHARED_MODULE_IDS, ...HOSPITAL_ONLY_MODULE_IDS],
  disabledModules: []
};

export const CLINIC_EDITION_CONFIG: EditionConfig = {
  type: "Clinic",
  name: "Clinic Edition",
  badgeLabel: "Clinic",
  description: "Streamlined outpatient consultations, appointment scheduling, and rapid counter billing.",
  enabledModules: [...SHARED_MODULE_IDS, ...CLINIC_SPECIALIZED_MODULE_IDS],
  disabledModules: [...HOSPITAL_ONLY_MODULE_IDS]
};

export const ENTERPRISE_EDITION_CONFIG: EditionConfig = {
  type: "Enterprise",
  name: "Enterprise Edition",
  badgeLabel: "Enterprise",
  description: "Multi-facility hospital & clinic network with centralized administration (Future Architecture).",
  enabledModules: [...SHARED_MODULE_IDS, ...HOSPITAL_ONLY_MODULE_IDS, ...CLINIC_SPECIALIZED_MODULE_IDS],
  disabledModules: []
};

const EDITION_REGISTRY: Record<EditionType, EditionConfig> = {
  Hospital: HOSPITAL_EDITION_CONFIG,
  Clinic: CLINIC_EDITION_CONFIG,
  Enterprise: ENTERPRISE_EDITION_CONFIG
};

/**
 * Resolves configuration for a given edition name, with strict, safe fallback to Hospital Edition.
 */
export function getEditionConfig(rawEdition?: string | null): EditionConfig {
  if (!rawEdition) {
    return HOSPITAL_EDITION_CONFIG;
  }

  const normalized = (rawEdition.trim().charAt(0).toUpperCase() +
    rawEdition.trim().slice(1).toLowerCase()) as EditionType;

  if (normalized in EDITION_REGISTRY) {
    return EDITION_REGISTRY[normalized];
  }

  // Fail-safe backward-compatible default
  return HOSPITAL_EDITION_CONFIG;
}

/**
 * Determines whether a module is enabled for a given edition.
 */
export function isModuleEnabledForEdition(moduleId: ModuleId, edition: EditionType): boolean {
  const config = EDITION_REGISTRY[edition] ?? HOSPITAL_EDITION_CONFIG;
  return config.enabledModules.includes(moduleId);
}
