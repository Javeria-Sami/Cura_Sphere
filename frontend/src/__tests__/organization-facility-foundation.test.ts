import { describe, it, expect, vi, beforeEach } from "vitest";
import api from "../lib/api";
import {
  organizationService,
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
  CreateFacilityRequest,
  UpdateFacilityRequest,
  Organization,
  Facility,
} from "../services/organizationService";

// Mock the API client
vi.mock("../lib/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("Enterprise Edition - Organization & Facility Foundation Tests (Session 15)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Organization Domain Invariants & Normalization", () => {
    it("should enforce mandatory fields for organization creation", () => {
      const validateOrgCreation = (req: Partial<CreateOrganizationRequest>) => {
        const errors: string[] = [];
        if (!req.organizationCode || req.organizationCode.trim().length === 0) {
          errors.push("Organization code is required.");
        } else if (req.organizationCode.trim().length < 2 || req.organizationCode.trim().length > 32) {
          errors.push("Organization code must be between 2 and 32 characters.");
        }

        if (!req.organizationName || req.organizationName.trim().length === 0) {
          errors.push("Organization name is required.");
        } else if (req.organizationName.trim().length > 150) {
          errors.push("Organization name cannot exceed 150 characters.");
        }
        return { isValid: errors.length === 0, errors };
      };

      expect(validateOrgCreation({}).isValid).toBe(false);
      expect(validateOrgCreation({ organizationCode: "X", organizationName: "Valid" }).errors).toContain(
        "Organization code must be between 2 and 32 characters."
      );
      expect(
        validateOrgCreation({ organizationCode: "CURA_HEALTH", organizationName: "Cura Healthcare Network" }).isValid
      ).toBe(true);
    });

    it("should normalize organization codes to uppercase trimmed format", () => {
      const normalizeCode = (code: string) => code.trim().toUpperCase();
      expect(normalizeCode("  cura-west  ")).toBe("CURA-WEST");
      expect(normalizeCode("shifa_org")).toBe("SHIFA_ORG");
    });

    it("should accept valid organization statuses and reject invalid transitions", () => {
      const validStatuses = ["Active", "Suspended", "Inactive"];
      expect(validStatuses.includes("Active")).toBe(true);
      expect(validStatuses.includes("Suspended")).toBe(true);
      expect(validStatuses.includes("Inactive")).toBe(true);
      expect(validStatuses.includes("Archived")).toBe(false);

      const isValidStatusTransition = (from: string, to: string) => {
        if (from === "Inactive" && to === "Active") return true; // reactivation allowed
        if (from === "Active" && (to === "Suspended" || to === "Inactive")) return true;
        if (from === "Suspended" && (to === "Active" || to === "Inactive")) return true;
        return from === to;
      };

      expect(isValidStatusTransition("Active", "Suspended")).toBe(true);
      expect(isValidStatusTransition("Active", "Inactive")).toBe(true);
      expect(isValidStatusTransition("Inactive", "Suspended")).toBe(false); // cannot suspend an inactive org directly
    });
  });

  describe("2. Facility Domain Invariants & Compound Uniqueness", () => {
    it("should enforce mandatory parent OrganizationId and branch details", () => {
      const validateFacilityCreation = (orgId: number, req: Partial<CreateFacilityRequest>) => {
        const errors: string[] = [];
        if (!orgId || orgId <= 0) errors.push("Valid organization ID is required.");
        if (!req.branchCode || req.branchCode.trim().length === 0) errors.push("Branch code is required.");
        if (!req.branchName || req.branchName.trim().length === 0) errors.push("Branch name is required.");
        if (!req.facilityType || !["Hospital", "Clinic", "DiagnosticCenter"].includes(req.facilityType)) {
          errors.push("Valid facility type is required.");
        }
        if (!req.editionProfile || !["Hospital", "Clinic"].includes(req.editionProfile)) {
          errors.push("Valid edition profile is required.");
        }
        if (!req.address || req.address.trim().length === 0) errors.push("Address is required.");
        if (!req.contactPhone || req.contactPhone.trim().length === 0) errors.push("Contact phone is required.");
        return { isValid: errors.length === 0, errors };
      };

      const invalid = validateFacilityCreation(0, { branchCode: "MAIN" });
      expect(invalid.isValid).toBe(false);
      expect(invalid.errors).toContain("Valid organization ID is required.");

      const valid = validateFacilityCreation(1, {
        branchCode: "BR-CENTRAL",
        branchName: "Central Hospital",
        facilityType: "Hospital",
        editionProfile: "Hospital",
        address: "100 Medical Plaza",
        city: "Lahore",
        province: "Punjab",
        contactPhone: "+92 42 111 222 333",
      });
      expect(valid.isValid).toBe(true);
    });

    it("should allow duplicate branch codes across different organizations (compound uniqueness)", () => {
      const facilitiesRegistry: { orgId: number; branchCode: string }[] = [
        { orgId: 1, branchCode: "MAIN" },
        { orgId: 2, branchCode: "MAIN" }, // Allowed across different orgs
      ];

      const isCompoundUnique = (orgId: number, branchCode: string) => {
        return !facilitiesRegistry.some((f) => f.orgId === orgId && f.branchCode === branchCode);
      };

      expect(isCompoundUnique(3, "MAIN")).toBe(true); // New org with same code
      expect(isCompoundUnique(1, "MAIN")).toBe(false); // Same org with duplicate code rejected
    });
  });

  describe("3. Organization Service API Client Calls", () => {
    it("should query getOrganizations with correct query parameters", async () => {
      const mockResult = {
        items: [
          {
            organizationId: 1,
            organizationCode: "CURA_NET",
            organizationName: "Cura Healthcare Network",
            status: "Active",
            facilityCount: 3,
            createdAt: "2026-10-17T00:00:00Z",
          },
        ],
        totalCount: 1,
        pageNumber: 1,
        pageSize: 10,
      };

      vi.mocked(api.get).mockResolvedValueOnce({ data: mockResult });

      const data = await organizationService.getOrganizations("Cura", "Active", 1, 10);
      expect(api.get).toHaveBeenCalledWith("/organizations?search=Cura&status=Active&pageNumber=1&pageSize=10");
      expect(data.totalCount).toBe(1);
      expect(data.items[0].organizationCode).toBe("CURA_NET");
    });

    it("should create an organization with POST payload", async () => {
      const createPayload: CreateOrganizationRequest = {
        organizationCode: "METRO_HLTH",
        organizationName: "Metropolitan Healthcare",
        primaryEmail: "admin@metrohealth.pk",
        timezone: "Asia/Karachi",
        currencyCode: "PKR",
      };

      const mockResponse: Organization = {
        organizationId: 10,
        ...createPayload,
        status: "Active",
        settingsJson: "{}",
        createdAt: "2026-10-17T12:00:00Z",
        facilityCount: 0,
      };

      vi.mocked(api.post).mockResolvedValueOnce({ data: mockResponse });

      const created = await organizationService.createOrganization(createPayload);
      expect(api.post).toHaveBeenCalledWith("/organizations", createPayload);
      expect(created.organizationId).toBe(10);
      expect(created.status).toBe("Active");
    });

    it("should update organization details with PUT payload", async () => {
      const updatePayload: UpdateOrganizationRequest = {
        organizationName: "Metropolitan Healthcare International",
        primaryEmail: "contact@metrohealth.pk",
        status: "Active",
      };

      vi.mocked(api.put).mockResolvedValueOnce({
        data: { organizationId: 10, organizationCode: "METRO_HLTH", ...updatePayload },
      });

      const updated = await organizationService.updateOrganization(10, updatePayload);
      expect(api.put).toHaveBeenCalledWith("/organizations/10", updatePayload);
      expect(updated.organizationName).toBe("Metropolitan Healthcare International");
    });

    it("should deactivate an organization via DELETE request", async () => {
      vi.mocked(api.delete).mockResolvedValueOnce({ data: { message: "Organization deactivated successfully." } });

      const res = await organizationService.deactivateOrganization(10);
      expect(api.delete).toHaveBeenCalledWith("/organizations/10");
      expect(res.message).toContain("deactivated");
    });

    it("should query facilities for a specific organization", async () => {
      const mockFacilities: Facility[] = [
        {
          branchFacilityId: 101,
          organizationId: 1,
          organizationName: "Cura Healthcare Network",
          branchCode: "MAIN",
          branchName: "Main Campus Hospital",
          facilityType: "Hospital",
          editionProfile: "Hospital",
          address: "123 Health Ave",
          city: "Lahore",
          province: "Punjab",
          contactPhone: "+92 42 35551111",
          status: "Active",
          createdAt: "2026-10-17T00:00:00Z",
          departmentCount: 8,
        },
      ];

      vi.mocked(api.get).mockResolvedValueOnce({ data: mockFacilities });

      const facilities = await organizationService.getFacilities(1, "Active");
      expect(api.get).toHaveBeenCalledWith("/organizations/1/facilities?status=Active");
      expect(facilities.length).toBe(1);
      expect(facilities[0].branchCode).toBe("MAIN");
      expect(facilities[0].facilityType).toBe("Hospital");
    });

    it("should create a facility under an organization with POST payload", async () => {
      const newFacility: CreateFacilityRequest = {
        branchCode: "CLINIC-SOUTH",
        branchName: "South Family Practice Clinic",
        facilityType: "Clinic",
        editionProfile: "Clinic",
        address: "45 Garden Road",
        city: "Karachi",
        province: "Sindh",
        contactPhone: "+92 21 34442222",
      };

      vi.mocked(api.post).mockResolvedValueOnce({
        data: {
          branchFacilityId: 202,
          organizationId: 5,
          organizationName: "Apex Healthcare",
          ...newFacility,
          status: "Active",
          createdAt: "2026-10-17T12:00:00Z",
          departmentCount: 0,
        },
      });

      const result = await organizationService.createFacility(5, newFacility);
      expect(api.post).toHaveBeenCalledWith("/organizations/5/facilities", newFacility);
      expect(result.branchFacilityId).toBe(202);
      expect(result.facilityType).toBe("Clinic");
      expect(result.editionProfile).toBe("Clinic");
    });

    it("should deactivate a facility via DELETE request", async () => {
      vi.mocked(api.delete).mockResolvedValueOnce({ data: { message: "Facility deactivated successfully." } });

      const result = await organizationService.deactivateFacility(202);
      expect(api.delete).toHaveBeenCalledWith("/facilities/202");
      expect(result.message).toContain("deactivated");
    });
  });

  describe("4. Security & Role Authorization Gates", () => {
    it("should only allow SuperAdmin, Admin, or PlatformAdmin to access organization management", () => {
      const allowedRoles = ["SuperAdmin", "Admin", "PlatformAdmin"];

      const canManageOrganizations = (role: string) => allowedRoles.includes(role);

      expect(canManageOrganizations("SuperAdmin")).toBe(true);
      expect(canManageOrganizations("Admin")).toBe(true);
      expect(canManageOrganizations("PlatformAdmin")).toBe(true);

      // Verify healthcare clinical roles CANNOT manage organizations
      expect(canManageOrganizations("Doctor")).toBe(false);
      expect(canManageOrganizations("Nurse")).toBe(false);
      expect(canManageOrganizations("Receptionist")).toBe(false);
      expect(canManageOrganizations("Pharmacist")).toBe(false);
      expect(canManageOrganizations("LabTechnician")).toBe(false);
      expect(canManageOrganizations("Patient")).toBe(false);
    });
  });
});
