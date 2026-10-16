import api from "../lib/api";

export interface InvoiceItem {
  invoiceId: number;
  invoiceNumber: string;
  patientId: number;
  patientName: string;
  medicalRecordNumber: string;
  serviceType: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  invoiceDate: string;
  status: string;
}

export interface PaymentItem {
  paymentId: number;
  paymentNumber: string;
  invoiceId: number;
  invoiceNumber: string;
  patientName: string;
  amount: number;
  paymentMethod: string;
  cashierName: string;
  paymentDate: string;
  status: string;
}

export interface InsuranceClaimItem {
  claimId: number;
  claimNumber: string;
  patientId: number;
  patientName: string;
  medicalRecordNumber: string;
  insurerName: string;
  policyNumber: string;
  serviceCategory: string;
  claimedAmount: number;
  approvedAmount: number;
  status: string;
}

export const financialService = {
  getInvoices: async (search?: string, status?: string): Promise<InvoiceItem[]> => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (status && status !== "all") params.status = status;

    const res = await api.get("/financial/invoices", { params });
    return res.data?.data ?? [];
  },

  createInvoice: async (data: { patientId: number; serviceType: string; totalAmount: number }): Promise<InvoiceItem> => {
    const res = await api.post("/financial/invoice", data);
    return res.data?.data;
  },

  getPayments: async (search?: string): Promise<PaymentItem[]> => {
    const params: Record<string, string> = {};
    if (search) params.search = search;

    const res = await api.get("/financial/payments", { params });
    return res.data?.data ?? [];
  },

  processPayment: async (data: { invoiceId: number; amount: number; paymentMethod: string }): Promise<PaymentItem> => {
    const res = await api.post("/financial/payment", data);
    return res.data?.data;
  },

  getInsuranceClaims: async (search?: string, status?: string): Promise<InsuranceClaimItem[]> => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (status && status !== "all") params.status = status;

    const res = await api.get("/financial/insurance/claims", { params });
    return res.data?.data ?? [];
  },
};
