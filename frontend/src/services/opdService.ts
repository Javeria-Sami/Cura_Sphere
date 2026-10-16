import api from "../lib/api";

export interface OpdTokenItem {
  opdTokenId: number;
  tokenNumber: string;
  patientId: number;
  patientName: string;
  medicalRecordNumber: string;
  age: number;
  doctorId: number;
  doctorName: string;
  departmentName: string;
  queuePosition: number;
  status: string;
  vitals: string;
  chiefComplaint?: string;
}

export interface IssueTokenRequest {
  patientId: number;
  doctorId: number;
  departmentId: number;
  chiefComplaint?: string;
}

export const opdService = {
  getQueue: async (search?: string, status?: string): Promise<OpdTokenItem[]> => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (status && status !== "all") params.status = status;

    const res = await api.get("/opd/queue", { params });
    return res.data?.data ?? [];
  },

  issueToken: async (data: IssueTokenRequest): Promise<OpdTokenItem> => {
    const res = await api.post("/opd/token", data);
    return res.data?.data;
  },

  updateStatus: async (id: number, status: string): Promise<boolean> => {
    const res = await api.patch(`/opd/token/${id}/status`, { status });
    return res.data?.success ?? false;
  },
};
