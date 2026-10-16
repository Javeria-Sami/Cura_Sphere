import api from "../lib/api";

export interface DashboardReportSummary {
  totalPatientsRegistered: number;
  todayAppointments: number;
  activeOpdQueueCount: number;
  admittedIpdPatients: number;
  activeEmergencyCases: number;
  totalRevenueBilledToday: number;
  totalRevenueCollectedToday: number;
  bedOccupancyPercentage: number;
  revenueByDepartment: { departmentName: string; amount: number }[];
  monthlyCensusTrend: { month: string; outpatientCount: number; inpatientCount: number }[];
}

export interface UserAccountManagementItem {
  userId: number;
  username: string;
  employeeName: string;
  departmentName: string;
  roleName: string;
  lastLogin: string;
  accountStatus: string;
}

export interface AuditLogItem {
  auditLogId: number;
  timestamp: string;
  username: string;
  action: string;
  module: string;
  ipAddress: string;
  details: string;
}

export const reportsService = {
  getDashboardSummary: async (): Promise<DashboardReportSummary | null> => {
    const res = await api.get("/reports/dashboard");
    return res.data?.data ?? null;
  },

  getUserAccounts: async (search?: string): Promise<UserAccountManagementItem[]> => {
    const params: Record<string, string> = {};
    if (search) params.search = search;

    const res = await api.get("/reports/users", { params });
    return res.data?.data ?? [];
  },

  getAuditLogs: async (search?: string, module?: string): Promise<AuditLogItem[]> => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (module && module !== "all") params.module = module;

    const res = await api.get("/reports/audit-logs", { params });
    return res.data?.data ?? [];
  },
};
