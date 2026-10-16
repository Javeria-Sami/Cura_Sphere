/**
 * Supported deployment editions for CuraSphere.
 */
export type EditionType = "Hospital" | "Clinic" | "Enterprise";

/**
 * Functional capabilities across all editions.
 */
export type ModuleId =
  // Shared capabilities
  | "dashboard"
  | "patients"
  | "doctors"
  | "nurses"
  | "appointments"
  | "opd"
  | "emr"
  | "laboratory"
  | "radiology"
  | "pharmacy"
  | "billing"
  | "payments"
  | "insurance"
  | "inventory"
  | "hr"
  | "attendance"
  | "reports"
  | "notifications"
  | "audit"
  | "administration"
  // Hospital-only capabilities
  | "ipd"
  | "emergency"
  | "surgery"
  | "icu"
  // Clinic-specialized capabilities
  | "clinic-workspace"
  | "clinic-queue"
  | "clinic-billing";

export type ModuleCategory = "shared" | "hospital" | "clinic";

export interface ModuleDefinition {
  id: ModuleId;
  label: string;
  category: ModuleCategory;
  defaultPath: string;
  description: string;
}

export interface EditionConfig {
  type: EditionType;
  name: string;
  badgeLabel: string;
  description: string;
  enabledModules: ModuleId[];
  disabledModules: ModuleId[];
}
