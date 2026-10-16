import api from "../lib/api";

export interface PharmacyStockItem {
  drugId: number;
  drugCode: string;
  drugName: string;
  genericName: string;
  dosageForm: string;
  quantityInStock: number;
  minimumThreshold: number;
  unitPrice: number;
  expiryDate: string;
  status: string;
}

export interface SurgicalScheduleItem {
  surgeryId: number;
  surgeryNumber: string;
  patientId: number;
  patientName: string;
  medicalRecordNumber: string;
  procedureName: string;
  otRoomNumber: string;
  leadSurgeonName: string;
  anesthetistName: string;
  scheduledStartTime: string;
  status: string;
}

export interface IcuPatientVitalItem {
  vitalId: number;
  patientId: number;
  patientName: string;
  medicalRecordNumber: string;
  bedNumber: string;
  bloodPressure: string;
  heartRate: number;
  spO2: number;
  gcsScore: number;
  temperature: number;
  recordedAt: string;
  alertStatus: string;
}

export const clinicalServices = {
  getPharmacyStock: async (search?: string): Promise<PharmacyStockItem[]> => {
    const params: Record<string, string> = {};
    if (search) params.search = search;

    const res = await api.get("/clinicalservices/pharmacy/stock", { params });
    return res.data?.data ?? [];
  },

  getSurgerySchedules: async (search?: string): Promise<SurgicalScheduleItem[]> => {
    const params: Record<string, string> = {};
    if (search) params.search = search;

    const res = await api.get("/clinicalservices/surgery/schedules", { params });
    return res.data?.data ?? [];
  },

  getIcuVitals: async (search?: string): Promise<IcuPatientVitalItem[]> => {
    const params: Record<string, string> = {};
    if (search) params.search = search;

    const res = await api.get("/clinicalservices/icu/vitals", { params });
    return res.data?.data ?? [];
  },
};
