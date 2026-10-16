import api from "../lib/api";

export interface AppointmentItem {
  appointmentId: number;
  appointmentNumber: string;
  patientId: number;
  patientName: string;
  medicalRecordNumber: string;
  doctorId: number;
  doctorName: string;
  departmentName: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  status: string;
  reasonForVisit?: string;
}

export interface CreateAppointmentRequest {
  patientId: number;
  doctorId: number;
  departmentId: number;
  appointmentDate: string;
  appointmentTime?: string;
  appointmentType?: string;
  reasonForVisit?: string;
}

export const appointmentService = {
  getAppointments: async (search?: string, status?: string): Promise<AppointmentItem[]> => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (status && status !== "all") params.status = status;

    const res = await api.get("/appointment", { params });
    return res.data?.data ?? [];
  },

  createAppointment: async (data: CreateAppointmentRequest): Promise<AppointmentItem> => {
    const res = await api.post("/appointment", data);
    return res.data?.data;
  },

  updateStatus: async (id: number, status: string): Promise<boolean> => {
    const res = await api.patch(`/appointment/${id}/status`, { status });
    return res.data?.success ?? false;
  },
};
