import api from "../lib/api";

export interface InvoiceLineItem {
  description: string;
  category?: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
}

export interface InvoiceItem {
  invoiceId: number;
  invoiceNumber: string;
  patientId: number;
  patientName: string;
  medicalRecordNumber: string;
  patientPhone?: string;
  serviceType: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  invoiceDate: string;
  status: "Paid" | "Partial" | "Unpaid" | "Cancelled" | string;
}

export interface InvoiceDetailItem extends InvoiceItem {
  subTotal: number;
  discountPercent?: number;
  discountAmount?: number;
  taxPercent?: number;
  taxAmount?: number;
  dueDate?: string;
  notes?: string;
  lineItems: InvoiceLineItem[];
  payments: PaymentItem[];
}

export interface CreateInvoiceRequest {
  patientId: number;
  serviceType?: string;
  doctorId?: number;
  appointmentId?: number;
  encounterId?: number;
  discountPercent?: number;
  taxPercent?: number;
  notes?: string;
  lineItems?: InvoiceLineItem[];
  totalAmount?: number;
}

export interface PaymentItem {
  paymentId: number;
  paymentNumber: string;
  invoiceId: number;
  invoiceNumber: string;
  patientName: string;
  amount: number;
  paymentMethod: "Cash" | "Card" | "Bank Transfer" | "Insurance Claim" | string;
  cashierName: string;
  transactionReference?: string;
  notes?: string;
  paymentDate: string;
  status: string;
}

export interface ProcessPaymentRequest {
  invoiceId: number;
  amount: number;
  paymentMethod: string;
  cashierName?: string;
  transactionReference?: string;
  notes?: string;
}

export interface BillingSummary {
  totalBilled: number;
  totalCollected: number;
  totalOutstanding: number;
  paidCount: number;
  partialCount: number;
  unpaidCount: number;
  totalTransactions: number;
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

  getInvoiceById: async (id: number): Promise<InvoiceDetailItem | null> => {
    const res = await api.get(`/financial/invoices/${id}`);
    return res.data?.data ?? null;
  },

  getPatientInvoices: async (patientId: number): Promise<InvoiceItem[]> => {
    const res = await api.get(`/financial/patient/${patientId}/invoices`);
    return res.data?.data ?? [];
  },

  createInvoice: async (data: CreateInvoiceRequest): Promise<InvoiceItem> => {
    const res = await api.post("/financial/invoice", data);
    return res.data?.data;
  },

  getPayments: async (search?: string): Promise<PaymentItem[]> => {
    const params: Record<string, string> = {};
    if (search) params.search = search;

    const res = await api.get("/financial/payments", { params });
    return res.data?.data ?? [];
  },

  processPayment: async (data: ProcessPaymentRequest): Promise<PaymentItem> => {
    const res = await api.post("/financial/payment", data);
    return res.data?.data;
  },

  getBillingSummary: async (): Promise<BillingSummary> => {
    const res = await api.get("/financial/summary");
    return res.data?.data ?? {
      totalBilled: 0,
      totalCollected: 0,
      totalOutstanding: 0,
      paidCount: 0,
      partialCount: 0,
      unpaidCount: 0,
      totalTransactions: 0,
    };
  },

  getInsuranceClaims: async (search?: string, status?: string): Promise<InsuranceClaimItem[]> => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (status && status !== "all") params.status = status;

    const res = await api.get("/financial/insurance/claims", { params });
    return res.data?.data ?? [];
  },
};
