import api from "../lib/api";

export interface IpdAdmissionItem {
  admissionId: number;
  admissionNumber: string;
  patientId: number;
  patientName: string;
  medicalRecordNumber: string;
  wardName: string;
  bedNumber: string;
  doctorId: number;
  doctorName: string;
  admissionDate: string;
  daysAdmitted: number;
  primaryDiagnosis: string;
  patientCondition: string;
  status: string;
}

export interface AdmitPatientRequest {
  patientId: number;
  doctorId: number;
  bedId: number;
  primaryDiagnosis: string;
  patientCondition?: string;
}

export const ipdService = {
  getAdmissions: async (search?: string, ward?: string): Promise<IpdAdmissionItem[]> => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (ward) params.ward = ward;

    const res = await api.get("/ipd/admissions", { params });
    return res.data?.data ?? [];
  },

  admitPatient: async (data: AdmitPatientRequest): Promise<IpdAdmissionItem> => {
    const res = await api.post("/ipd/admit", data);
    return res.data?.data;
  },

  dischargePatient: async (admissionId: number): Promise<boolean> => {
    const res = await api.post(`/ipd/discharge/${admissionId}`);
    return res.data?.success ?? false;
  },
};
