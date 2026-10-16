import { describe, it, expect } from "vitest";
import {
  getEditionConfig,
  isModuleEnabledForEdition,
  HOSPITAL_EDITION_CONFIG,
  CLINIC_EDITION_CONFIG,
} from "../config/editionConfig";
import { navItems, NavItem } from "../config/navigation";
import { EditionType, ModuleId } from "../types/edition";

describe("Edition Configuration & Navigation Foundations Tests (Session 4)", () => {
  it("Hospital Edition should enable all shared and hospital-only modules", () => {
    expect(HOSPITAL_EDITION_CONFIG.type).toBe("Hospital");
    expect(HOSPITAL_EDITION_CONFIG.enabledModules).toContain("dashboard");
    expect(HOSPITAL_EDITION_CONFIG.enabledModules).toContain("patients");
    expect(HOSPITAL_EDITION_CONFIG.enabledModules).toContain("opd");
    expect(HOSPITAL_EDITION_CONFIG.enabledModules).toContain("ipd");
    expect(HOSPITAL_EDITION_CONFIG.enabledModules).toContain("emergency");
    expect(HOSPITAL_EDITION_CONFIG.enabledModules).toContain("surgery");
    expect(HOSPITAL_EDITION_CONFIG.enabledModules).toContain("icu");
    expect(HOSPITAL_EDITION_CONFIG.disabledModules.length).toBe(0);
  });

  it("Clinic Edition should enable shared modules and strictly disable hospital-only modules", () => {
    expect(CLINIC_EDITION_CONFIG.type).toBe("Clinic");
    // Shared enabled
    expect(CLINIC_EDITION_CONFIG.enabledModules).toContain("dashboard");
    expect(CLINIC_EDITION_CONFIG.enabledModules).toContain("patients");
    expect(CLINIC_EDITION_CONFIG.enabledModules).toContain("appointments");
    expect(CLINIC_EDITION_CONFIG.enabledModules).toContain("opd");
    expect(CLINIC_EDITION_CONFIG.enabledModules).toContain("emr");
    expect(CLINIC_EDITION_CONFIG.enabledModules).toContain("billing");

    // Hospital-only disabled
    expect(CLINIC_EDITION_CONFIG.enabledModules).not.toContain("ipd");
    expect(CLINIC_EDITION_CONFIG.enabledModules).not.toContain("emergency");
    expect(CLINIC_EDITION_CONFIG.enabledModules).not.toContain("surgery");
    expect(CLINIC_EDITION_CONFIG.enabledModules).not.toContain("icu");

    expect(CLINIC_EDITION_CONFIG.disabledModules).toEqual(
      expect.arrayContaining(["ipd", "emergency", "surgery", "icu"])
    );
  });

  it("getEditionConfig should safely fallback to Hospital Edition on unknown or null inputs", () => {
    const unknownConfig = getEditionConfig("InvalidEditionName");
    expect(unknownConfig.type).toBe("Hospital");

    const nullConfig = getEditionConfig(null);
    expect(nullConfig.type).toBe("Hospital");

    const emptyConfig = getEditionConfig("");
    expect(emptyConfig.type).toBe("Hospital");
  });

  it("isModuleEnabledForEdition helper should accurately verify capabilities", () => {
    expect(isModuleEnabledForEdition("ipd", "Hospital")).toBe(true);
    expect(isModuleEnabledForEdition("ipd", "Clinic")).toBe(false);

    expect(isModuleEnabledForEdition("emergency", "Hospital")).toBe(true);
    expect(isModuleEnabledForEdition("emergency", "Clinic")).toBe(false);

    expect(isModuleEnabledForEdition("opd", "Hospital")).toBe(true);
    expect(isModuleEnabledForEdition("opd", "Clinic")).toBe(true);
  });

  it("Sidebar navigation items should exclude disabled hospital modules in Clinic Edition", () => {
    function filterNavForEdition(items: NavItem[], edition: EditionType, userRole: string): NavItem[] {
      return items.filter((item) => {
        // 1. Edition check
        if (item.moduleId && !isModuleEnabledForEdition(item.moduleId, edition)) {
          return false;
        }
        // 2. Role check
        if (userRole === "Super Administrator" || userRole === "Hospital Administrator") {
          return true;
        }
        if (item.roles && item.roles.includes(userRole)) {
          return true;
        }
        if (!item.permission && !item.roles) {
          return true;
        }
        return false;
      });
    }

    // When Super Administrator views Hospital Edition
    const hospitalNav = filterNavForEdition(navItems, "Hospital", "Super Administrator");
    const hospitalPaths = hospitalNav.map((n) => n.path);
    expect(hospitalPaths).toContain("/ipd");
    expect(hospitalPaths).toContain("/emergency");
    expect(hospitalPaths).toContain("/surgery");
    expect(hospitalPaths).toContain("/icu");

    // When Super Administrator views Clinic Edition
    const clinicNav = filterNavForEdition(navItems, "Clinic", "Super Administrator");
    const clinicPaths = clinicNav.map((n) => n.path);
    expect(clinicPaths).not.toContain("/ipd");
    expect(clinicPaths).not.toContain("/emergency");
    expect(clinicPaths).not.toContain("/surgery");
    expect(clinicPaths).not.toContain("/icu");
    // Shared modules are still present
    expect(clinicPaths).toContain("/dashboard");
    expect(clinicPaths).toContain("/patients");
    expect(clinicPaths).toContain("/appointments");
    expect(clinicPaths).toContain("/opd");
    expect(clinicPaths).toContain("/emr");
    expect(clinicPaths).toContain("/billing");
  });

  it("Module enablement does NOT bypass user role and permission authorization", () => {
    function canAccessModule(
      moduleId: ModuleId,
      edition: EditionType,
      userRole: string,
      userPermissions: string[],
      requiredPermission?: string
    ): boolean {
      // Must be enabled in edition
      if (!isModuleEnabledForEdition(moduleId, edition)) {
        return false;
      }
      // Must also be authorized
      if (userRole === "Super Administrator") {
        return true;
      }
      if (requiredPermission && !userPermissions.includes(requiredPermission)) {
        return false;
      }
      return true;
    }

    // Guest user in Hospital Edition lacks billing permission
    const guestAccess = canAccessModule("billing", "Hospital", "Guest", [], "billing.read");
    expect(guestAccess).toBe(false);

    // Doctor in Clinic Edition has emr permission
    const doctorAccess = canAccessModule("emr", "Clinic", "Doctor", ["emr.read"], "emr.read");
    expect(doctorAccess).toBe(true);

    // Doctor attempting to access IPD in Clinic Edition is blocked by edition even if role permits
    const doctorIpdAccess = canAccessModule("ipd", "Clinic", "Doctor", ["ipd.read"]);
    expect(doctorIpdAccess).toBe(false);
  });
});
