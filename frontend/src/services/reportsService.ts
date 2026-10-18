import api from "../lib/api";

export interface PaymentMethodBreakdownItem {
  method: string;
  amount: number;
  percentage: number;
}

export interface InvoiceStatusBreakdownItem {
  status: string;
  count: number;
  totalAmount: number;
}

export interface MonthlyCensusTrendItem {
  month: string;
  outpatientCount: number;
  inpatientCount: number;
  walkInCount?: number;
}

export interface DashboardReportSummary {
  totalPatientsRegistered: number;
  todayAppointments: number;
  completedConsultationsToday?: number;
  consultationCompletionRate?: number;
  activeOpdQueueCount: number;
  admittedIpdPatients: number;
  activeEmergencyCases: number;
  totalRevenueBilledToday: number;
  totalRevenueCollectedToday: number;
  totalOutstandingBalance?: number;
  bedOccupancyPercentage: number;
  activeEdition?: string;
  timeframe?: string;
  revenueByDepartment: { departmentName: string; amount: number }[];
  monthlyCensusTrend: MonthlyCensusTrendItem[];
  paymentMethodsBreakdown?: PaymentMethodBreakdownItem[];
  invoiceStatusBreakdown?: InvoiceStatusBreakdownItem[];
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
  getDashboardSummary: async (edition?: string, timeframe?: string): Promise<DashboardReportSummary | null> => {
    const params: Record<string, string> = {};
    if (edition) params.edition = edition;
    if (timeframe) params.timeframe = timeframe;

    const res = await api.get("/reports/dashboard", { params });
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
