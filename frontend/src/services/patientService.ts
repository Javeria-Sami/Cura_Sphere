import api from "../lib/api";
import {
  Lookup,
  PatientListDto,
  PatientDetailDto,
  RegisterPatientDto,
  DuplicateCheckRequest,
  DuplicateCheckResponse,
  PagedResultDto
} from "../types/patient";

export const patientService = {
  // Lookup Endpoints
  async getBloodGroups(): Promise<Lookup[]> {
    const response = await api.get<{ success: boolean; data: Lookup[] }>("/lookups/blood-groups");
    return response.data.data;
  },

  async getMaritalStatuses(): Promise<Lookup[]> {
    const response = await api.get<{ success: boolean; data: Lookup[] }>("/lookups/marital-statuses");
    return response.data.data;
  },

  async getReligions(): Promise<Lookup[]> {
    const response = await api.get<{ success: boolean; data: Lookup[] }>("/lookups/religions");
    return response.data.data;
  },

  async getNationalities(): Promise<Lookup[]> {
    const response = await api.get<{ success: boolean; data: Lookup[] }>("/lookups/nationalities");
    return response.data.data;
  },

  // Patient CRUD & Verification
  async getPagedPatients(search = "", pageNumber = 1, pageSize = 10): Promise<PagedResultDto<PatientListDto>> {
    const response = await api.get<{ success: boolean; data: PagedResultDto<PatientListDto> }>("/patients", {
      params: { search, pageNumber, pageSize }
    });
    return response.data.data;
  },

  async getPatientById(id: number): Promise<PatientDetailDto> {
    const response = await api.get<{ success: boolean; data: PatientDetailDto }>(`/patients/${id}`);
    return response.data.data;
  },

  async registerPatient(data: RegisterPatientDto): Promise<PatientDetailDto> {
    const response = await api.post<{ success: boolean; data: PatientDetailDto }>("/patients", data);
    return response.data.data;
  },

  async checkDuplicate(data: DuplicateCheckRequest): Promise<DuplicateCheckResponse> {
    const response = await api.post<{ success: boolean; data: DuplicateCheckResponse }>("/patients/check-duplicates", data);
    return response.data.data;
  },

  async updatePatient(id: number, data: RegisterPatientDto): Promise<PatientDetailDto> {
    const response = await api.put<{ success: boolean; data: PatientDetailDto }>(`/patients/${id}`, data);
    return response.data.data;
  }
};
