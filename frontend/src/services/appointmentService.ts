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
  remarks?: string;
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

export interface RescheduleAppointmentRequest {
  appointmentDate: string;
  appointmentTime: string;
  doctorId?: number;
  remarks?: string;
}

export interface DoctorLookupItem {
  doctorId: number;
  doctorName: string;
  specialization: string;
  departmentId: number;
  departmentName: string;
  consultationFee: number;
  status: string;
}

export interface DepartmentLookupItem {
  departmentId: number;
  departmentName: string;
  departmentCode: string;
}

export const appointmentService = {
  getAppointments: async (search?: string, status?: string): Promise<AppointmentItem[]> => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (status && status !== "all") params.status = status;

    const res = await api.get("/appointment", { params });
    return res.data?.data ?? [];
  },

  getAppointmentById: async (id: number): Promise<AppointmentItem | null> => {
    const res = await api.get(`/appointment/${id}`);
    return res.data?.data ?? null;
  },

  createAppointment: async (data: CreateAppointmentRequest): Promise<AppointmentItem> => {
    const res = await api.post("/appointment", data);
    return res.data?.data;
  },

  updateStatus: async (id: number, status: string, remarks?: string): Promise<{ success: boolean; message?: string }> => {
    const res = await api.patch(`/appointment/${id}/status`, { status, remarks });
    return {
      success: res.data?.success ?? true,
      message: res.data?.message
    };
  },

  reschedule: async (id: number, data: RescheduleAppointmentRequest): Promise<AppointmentItem> => {
    const res = await api.patch(`/appointment/${id}/reschedule`, data);
    return res.data?.data;
  },

  getDoctors: async (): Promise<DoctorLookupItem[]> => {
    const res = await api.get("/appointment/doctors");
    return res.data?.data ?? [];
  },

  getDepartments: async (): Promise<DepartmentLookupItem[]> => {
    const res = await api.get("/appointment/departments");
    return res.data?.data ?? [];
  },
};
