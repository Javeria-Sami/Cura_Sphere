import api from "../lib/api";

export interface VitalSigns {
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  respiratoryRate?: number;
  spO2?: number;
  weightKg?: number;
  heightCm?: number;
  bmi?: number;
}

export interface DiagnosisItem {
  icdCode: string;
  description: string;
  isPrimary: boolean;
  notes?: string;
}

export interface PrescriptionItem {
  medicationName: string;
  genericName?: string;
  dosage: string;
  route: string;
  frequency: string;
  duration: string;
  quantity?: number;
  instructions?: string;
}

export interface CreateEmrEncounterRequest {
  patientId: number;
  doctorId: number;
  appointmentId?: number;
  encounterType?: string;
  chiefComplaint: string;
  historyOfPresentIllness?: string;
  examinationFindings?: string;
  vitals?: VitalSigns;
  diagnoses?: DiagnosisItem[];
  prescriptions?: PrescriptionItem[];
  clinicalNotes?: string;
  followUpDays?: number;
  followUpInstructions?: string;
  isFinalized?: boolean;
}

export interface EmrEncounter {
  encounterId: number;
  encounterNumber: string;
  patientId: number;
  patientName: string;
  medicalRecordNumber: string;
  patientAge?: number;
  patientGender?: string;
  doctorId: number;
  doctorName: string;
  specialization: string;
  appointmentId?: number;
  encounterDate: string;
  encounterType: string;
  chiefComplaint: string;
  historyOfPresentIllness?: string;
  examinationFindings?: string;
  vitals?: VitalSigns;
  diagnoses: DiagnosisItem[];
  prescriptions: PrescriptionItem[];
  clinicalNotes?: string;
  followUpDays?: number;
  followUpInstructions?: string;
  status: "Draft" | "Finalized" | "SignedOff" | string;
  createdAt: string;
  updatedAt?: string;
}

export interface InteractionAlert {
  drugA: string;
  drugB: string;
  severity: string;
  description: string;
}

export interface DrugInteractionResponse {
  hasInteractions: boolean;
  alerts: InteractionAlert[];
}

export const emrService = {
  getAllEncounters: async (search?: string): Promise<EmrEncounter[]> => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    const res = await api.get("/emr/encounters", { params });
    return res.data?.data ?? [];
  },

  getEncounterById: async (id: number): Promise<EmrEncounter | null> => {
    const res = await api.get(`/emr/encounters/${id}`);
    return res.data?.data ?? null;
  },

  getPatientEncounters: async (patientId: number): Promise<EmrEncounter[]> => {
    const res = await api.get(`/emr/encounters/patient/${patientId}`);
    return res.data?.data ?? [];
  },

  createEncounter: async (data: CreateEmrEncounterRequest): Promise<EmrEncounter> => {
    const res = await api.post("/emr/encounters", data);
    return res.data?.data;
  },

  updateEncounter: async (id: number, data: CreateEmrEncounterRequest): Promise<EmrEncounter> => {
    const res = await api.put(`/emr/encounters/${id}`, data);
    return res.data?.data;
  },

  finalizeEncounter: async (id: number): Promise<EmrEncounter> => {
    const res = await api.post(`/emr/encounters/${id}/finalize`);
    return res.data?.data;
  },

  checkInteractions: async (medications: string[]): Promise<DrugInteractionResponse> => {
    const res = await api.post("/emr/check-interactions", { medications });
    return res.data?.data ?? { hasInteractions: false, alerts: [] };
  },
};
