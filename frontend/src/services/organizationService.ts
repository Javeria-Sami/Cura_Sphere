import api from "../lib/api";

export interface Organization {
  organizationId: number;
  organizationCode: string;
  organizationName: string;
  legalRegistrationNumber?: string;
  taxId?: string;
  primaryEmail?: string;
  primaryPhone?: string;
  timezone: string;
  currencyCode: string;
  status: "Active" | "Suspended" | "Inactive";
  settingsJson: string;
  createdAt: string;
  facilityCount: number;
}

export interface CreateOrganizationRequest {
  organizationCode: string;
  organizationName: string;
  legalRegistrationNumber?: string;
  taxId?: string;
  primaryEmail?: string;
  primaryPhone?: string;
  timezone?: string;
  currencyCode?: string;
}

export interface UpdateOrganizationRequest {
  organizationName: string;
  legalRegistrationNumber?: string;
  taxId?: string;
  primaryEmail?: string;
  primaryPhone?: string;
  timezone?: string;
  currencyCode?: string;
  status?: "Active" | "Suspended" | "Inactive";
  settingsJson?: string;
}

export interface Facility {
  branchFacilityId: number;
  organizationId: number;
  organizationName: string;
  branchCode: string;
  branchName: string;
  facilityType: "Hospital" | "Clinic" | "DiagnosticCenter";
  editionProfile: "Hospital" | "Clinic";
  address: string;
  city: string;
  province: string;
  contactPhone: string;
  contactEmail?: string;
  status: "Active" | "Inactive" | "Maintenance";
  createdAt: string;
  departmentCount: number;
}

export interface CreateFacilityRequest {
  branchCode: string;
  branchName: string;
  facilityType: "Hospital" | "Clinic" | "DiagnosticCenter";
  editionProfile: "Hospital" | "Clinic";
  address: string;
  city: string;
  province: string;
  contactPhone: string;
  contactEmail?: string;
}

export interface UpdateFacilityRequest {
  branchName: string;
  facilityType?: "Hospital" | "Clinic" | "DiagnosticCenter";
  editionProfile?: "Hospital" | "Clinic";
  address?: string;
  city?: string;
  province?: string;
  contactPhone?: string;
  contactEmail?: string;
  status?: "Active" | "Inactive" | "Maintenance";
}

export const organizationService = {
  async getOrganizations(search?: string, status?: string, pageNumber = 1, pageSize = 20) {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (status) params.append("status", status);
    params.append("pageNumber", pageNumber.toString());
    params.append("pageSize", pageSize.toString());

    const response = await api.get(`/organizations?${params.toString()}`);
    return response.data;
  },

  async getOrganizationById(id: number) {
    const response = await api.get(`/organizations/${id}`);
    return response.data;
  },

  async createOrganization(data: CreateOrganizationRequest) {
    const response = await api.post("/organizations", data);
    return response.data;
  },

  async updateOrganization(id: number, data: UpdateOrganizationRequest) {
    const response = await api.put(`/organizations/${id}`, data);
    return response.data;
  },

  async deactivateOrganization(id: number) {
    const response = await api.delete(`/organizations/${id}`);
    return response.data;
  },

  async getFacilities(organizationId: number, status?: string) {
    const params = status ? `?status=${encodeURIComponent(status)}` : "";
    const response = await api.get(`/organizations/${organizationId}/facilities${params}`);
    return response.data;
  },

  async getFacilityById(id: number) {
    const response = await api.get(`/facilities/${id}`);
    return response.data;
  },

  async createFacility(organizationId: number, data: CreateFacilityRequest) {
    const response = await api.post(`/organizations/${organizationId}/facilities`, data);
    return response.data;
  },

  async updateFacility(id: number, data: UpdateFacilityRequest) {
    const response = await api.put(`/facilities/${id}`, data);
    return response.data;
  },

  async deactivateFacility(id: number) {
    const response = await api.delete(`/facilities/${id}`);
    return response.data;
  },
};
