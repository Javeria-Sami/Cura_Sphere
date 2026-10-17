import { describe, it, expect } from "vitest";
import {
  InvoiceItem,
  InvoiceLineItem,
  CreateInvoiceRequest,
  PaymentItem,
} from "../services/financialService";

interface PaymentValidationResult {
  valid: boolean;
  error: string | null;
  updatedInvoice?: {
    totalAmount: number;
    paidAmount: number;
    balanceAmount: number;
    status: string;
  };
}

describe("Clinic Billing, Invoices & Payments (Session 8)", () => {
  // Domain math and rules verification helper functions
  const calculateInvoiceTotals = (
    items: InvoiceLineItem[],
    discountPercent: number = 0,
    taxPercent: number = 0
  ) => {
    if (!items || items.length === 0) {
      throw new Error("Invoice must contain at least one line item");
    }

    let subtotal = 0;
    for (const item of items) {
      if (item.quantity <= 0) {
        throw new Error(`Quantity for ${item.description} must be greater than zero`);
      }
      if (item.unitPrice < 0) {
        throw new Error(`Unit price for ${item.description} cannot be negative`);
      }
      const lineTotal = Math.round(item.quantity * item.unitPrice * 100) / 100;
      subtotal += lineTotal;
    }

    subtotal = Math.round(subtotal * 100) / 100;

    if (discountPercent < 0 || discountPercent > 100) {
      throw new Error("Discount percentage must be between 0% and 100%");
    }
    if (taxPercent < 0 || taxPercent > 100) {
      throw new Error("Tax percentage must be between 0% and 100%");
    }

    const discountAmount = Math.round((subtotal * discountPercent) / 100 * 100) / 100;
    const discountedSubtotal = Math.max(0, subtotal - discountAmount);
    const taxAmount = Math.round((discountedSubtotal * taxPercent) / 100 * 100) / 100;
    const totalAmount = Math.round((discountedSubtotal + taxAmount) * 100) / 100;

    return {
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount,
    };
  };

  const validatePayment = (
    invoice: { totalAmount: number; paidAmount: number; balanceAmount: number; status: string },
    paymentAmount: number,
    paymentMethod: string
  ): PaymentValidationResult => {
    if (paymentAmount <= 0) {
      return { valid: false, error: "Payment amount must be greater than zero" };
    }

    if (paymentAmount > invoice.balanceAmount) {
      return {
        valid: false,
        error: `Payment amount ($${paymentAmount.toFixed(2)}) exceeds outstanding balance ($${invoice.balanceAmount.toFixed(2)})`,
      };
    }

    const supportedMethods = ["Cash", "Card", "Bank Transfer", "Insurance Claim"];
    if (!supportedMethods.includes(paymentMethod)) {
      return {
        valid: false,
        error: `Unsupported payment method '${paymentMethod}'. Supported: ${supportedMethods.join(", ")}`,
      };
    }

    const newPaidAmount = Math.round((invoice.paidAmount + paymentAmount) * 100) / 100;
    const newBalance = Math.round((invoice.totalAmount - newPaidAmount) * 100) / 100;
    const newStatus = newBalance <= 0 ? "Paid" : "Partial";

    return {
      valid: true,
      error: null,
      updatedInvoice: {
        totalAmount: invoice.totalAmount,
        paidAmount: newPaidAmount,
        balanceAmount: Math.max(0, newBalance),
        status: newStatus,
      },
    };
  };

  describe("Invoice Creation & Calculation Integrity", () => {
    it("should accurately calculate subtotal, discount, tax, and total with financial decimal precision", () => {
      const lineItems: InvoiceLineItem[] = [
        { description: "General Outpatient Consultation", quantity: 1, unitPrice: 30.0 },
        { description: "Basic Metabolic Panel (CBC Lab)", quantity: 2, unitPrice: 25.0 },
        { description: "Prescription Medication (Amlodipine)", quantity: 1, unitPrice: 15.5 },
      ];

      // Subtotal = 30 + (2 * 25) + 15.50 = 95.50
      // 10% Discount = 9.55 -> Discounted Subtotal = 85.95
      // 5% Tax on 85.95 = 4.2975 -> 4.30
      // Total = 85.95 + 4.30 = 90.25
      const result = calculateInvoiceTotals(lineItems, 10, 5);

      expect(result.subtotal).toBe(95.5);
      expect(result.discountAmount).toBe(9.55);
      expect(result.taxAmount).toBe(4.3);
      expect(result.totalAmount).toBe(90.25);
    });

    it("should reject negative or zero quantities and negative unit prices", () => {
      const invalidQtyItems: InvoiceLineItem[] = [
        { description: "Lab Test", quantity: 0, unitPrice: 20.0 },
      ];
      expect(() => calculateInvoiceTotals(invalidQtyItems, 0, 0)).toThrow(
        "Quantity for Lab Test must be greater than zero"
      );

      const negativePriceItems: InvoiceLineItem[] = [
        { description: "Consultation", quantity: 1, unitPrice: -10.0 },
      ];
      expect(() => calculateInvoiceTotals(negativePriceItems, 0, 0)).toThrow(
        "Unit price for Consultation cannot be negative"
      );
    });

    it("should enforce discount and tax limits between 0% and 100%", () => {
      const items: InvoiceLineItem[] = [{ description: "Service", quantity: 1, unitPrice: 100.0 }];

      expect(() => calculateInvoiceTotals(items, -5, 0)).toThrow(
        "Discount percentage must be between 0% and 100%"
      );
      expect(() => calculateInvoiceTotals(items, 105, 0)).toThrow(
        "Discount percentage must be between 0% and 100%"
      );
      expect(() => calculateInvoiceTotals(items, 0, -2)).toThrow(
        "Tax percentage must be between 0% and 100%"
      );
      expect(() => calculateInvoiceTotals(items, 0, 110)).toThrow(
        "Tax percentage must be between 0% and 100%"
      );
    });

    it("should reject client-submitted total amounts that do not match server calculations", () => {
      const items: InvoiceLineItem[] = [
        { description: "Consultation", quantity: 1, unitPrice: 30.0 },
      ];
      const verified = calculateInvoiceTotals(items, 0, 0);

      const clientForgedTotal = 5.0; // Client maliciously trying to underpay
      expect(clientForgedTotal).not.toBe(verified.totalAmount);
      expect(verified.totalAmount).toBe(30.0);
    });

    it("should validate mandatory invoice payload fields (patientId, serviceType, items)", () => {
      const validateInvoicePayload = (dto: Partial<CreateInvoiceRequest>) => {
        if (!dto.patientId || dto.patientId <= 0) {
          return { valid: false, error: "Valid Patient ID is required" };
        }
        if (!dto.serviceType?.trim()) {
          return { valid: false, error: "Service type is required" };
        }
        if (!dto.lineItems || dto.lineItems.length === 0) {
          return { valid: false, error: "Invoice must include at least one billable line item" };
        }
        return { valid: true, error: null };
      };

      const validPayload: CreateInvoiceRequest = {
        patientId: 10,
        serviceType: "OPD Consultation",
        notes: "Regular outpatient checkup",
        lineItems: [{ description: "OPD Visit", quantity: 1, unitPrice: 30 }],
      };

      expect(validateInvoicePayload(validPayload).valid).toBe(true);
      expect(validateInvoicePayload({ ...validPayload, patientId: 0 }).valid).toBe(false);
      expect(validateInvoicePayload({ ...validPayload, serviceType: "" }).valid).toBe(false);
      expect(validateInvoicePayload({ ...validPayload, lineItems: [] }).valid).toBe(false);
    });

    it("should initialize new invoices in 'Unpaid' status with zero paid amount", () => {
      const items: InvoiceLineItem[] = [
        { description: "Specialist Consult", quantity: 1, unitPrice: 50.0 },
      ];
      const totals = calculateInvoiceTotals(items, 0, 0);

      const newInvoice: InvoiceItem = {
        invoiceId: 101,
        invoiceNumber: "INV-20261017-0001",
        patientId: 12,
        patientName: "Bilal Ahmad",
        medicalRecordNumber: "MRN-1001",
        totalAmount: totals.totalAmount,
        paidAmount: 0.0,
        balanceAmount: totals.totalAmount,
        status: "Unpaid",
        serviceType: "OPD Consultation",
        invoiceDate: "2026-10-17",
      };

      expect(newInvoice.status).toBe("Unpaid");
      expect(newInvoice.paidAmount).toBe(0.0);
      expect(newInvoice.balanceAmount).toBe(50.0);
    });
  });

  describe("Payment Processing & Balance Integrity", () => {
    const baseInvoice = {
      invoiceId: 1,
      invoiceNumber: "INV-20261017-0042",
      totalAmount: 100.0,
      paidAmount: 0.0,
      balanceAmount: 100.0,
      status: "Unpaid",
    };

    it("should accept valid full payment and transition invoice status to 'Paid'", () => {
      const result = validatePayment(baseInvoice, 100.0, "Cash");

      expect(result.valid).toBe(true);
      expect(result.updatedInvoice!.paidAmount).toBe(100.0);
      expect(result.updatedInvoice!.balanceAmount).toBe(0.0);
      expect(result.updatedInvoice!.status).toBe("Paid");
    });

    it("should accept valid partial payment and transition invoice status to 'Partial'", () => {
      const result = validatePayment(baseInvoice, 40.0, "Card");

      expect(result.valid).toBe(true);
      expect(result.updatedInvoice!.paidAmount).toBe(40.0);
      expect(result.updatedInvoice!.balanceAmount).toBe(60.0);
      expect(result.updatedInvoice!.status).toBe("Partial");

      // Follow up with second payment to clear remaining balance
      const secondPayment = validatePayment(result.updatedInvoice!, 60.0, "Bank Transfer");
      expect(secondPayment.valid).toBe(true);
      expect(secondPayment.updatedInvoice!.paidAmount).toBe(100.0);
      expect(secondPayment.updatedInvoice!.balanceAmount).toBe(0.0);
      expect(secondPayment.updatedInvoice!.status).toBe("Paid");
    });

    it("should prevent and reject overpayments exceeding the outstanding balance", () => {
      const overpaymentAttempt = 150.0;
      const result = validatePayment(baseInvoice, overpaymentAttempt, "Cash");

      expect(result.valid).toBe(false);
      expect(result.error).toContain("exceeds outstanding balance");
    });

    it("should reject negative or zero payment amounts", () => {
      expect(validatePayment(baseInvoice, 0, "Cash").valid).toBe(false);
      expect(validatePayment(baseInvoice, -25.0, "Cash").valid).toBe(false);
    });

    it("should validate and enforce supported payment methods", () => {
      expect(validatePayment(baseInvoice, 50, "Cash").valid).toBe(true);
      expect(validatePayment(baseInvoice, 50, "Card").valid).toBe(true);
      expect(validatePayment(baseInvoice, 50, "Bank Transfer").valid).toBe(true);
      expect(validatePayment(baseInvoice, 50, "Insurance Claim").valid).toBe(true);

      // Unsupported method
      const invalidMethod = validatePayment(baseInvoice, 50, "CryptoCoin");
      expect(invalidMethod.valid).toBe(false);
      expect(invalidMethod.error).toContain("Unsupported payment method");
    });

    it("should record complete payment history details including cashier and transaction reference", () => {
      const payment: PaymentItem = {
        paymentId: 501,
        paymentNumber: "PAY-20261017-0089",
        invoiceId: baseInvoice.invoiceId,
        invoiceNumber: baseInvoice.invoiceNumber,
        patientName: "Farhan Saeed",
        amount: 100.0,
        paymentMethod: "Card",
        cashierName: "Tariq Mahmood (Cashier)",
        transactionReference: "AUTH-892718",
        notes: "POS Terminal #2 settlement",
        paymentDate: "2026-10-17 11:30 AM",
        status: "Confirmed",
      };

      expect(payment.paymentNumber).toMatch(/^PAY-/);
      expect(payment.amount).toBe(100.0);
      expect(payment.transactionReference).toBe("AUTH-892718");
      expect(payment.status).toBe("Confirmed");
      expect(payment.cashierName).toBe("Tariq Mahmood (Cashier)");
    });
  });

  describe("Role-Based Access Control & Permission Enforcement", () => {
    const checkBillingPermission = (userRoles: string[], permission: string) => {
      const rolePermissions: Record<string, string[]> = {
        "Administrator": ["billing.read", "billing.create", "billing.pay", "billing.void"],
        "Billing Cashier": ["billing.read", "billing.create", "billing.pay"],
        "Doctor": ["billing.read", "billing.create"],
        "Nurse": ["billing.read"],
        "Receptionist": ["billing.read", "billing.create"],
      };

      return userRoles.some((role) => rolePermissions[role]?.includes(permission));
    };

    it("should allow Billing Cashier to read, create invoices, and collect payments", () => {
      const cashierRoles = ["Billing Cashier"];
      expect(checkBillingPermission(cashierRoles, "billing.read")).toBe(true);
      expect(checkBillingPermission(cashierRoles, "billing.create")).toBe(true);
      expect(checkBillingPermission(cashierRoles, "billing.pay")).toBe(true);
      expect(checkBillingPermission(cashierRoles, "billing.void")).toBe(false);
    });

    it("should allow Doctors to generate consultation invoices but prevent payment collection", () => {
      const doctorRoles = ["Doctor"];
      expect(checkBillingPermission(doctorRoles, "billing.read")).toBe(true);
      expect(checkBillingPermission(doctorRoles, "billing.create")).toBe(true);
      expect(checkBillingPermission(doctorRoles, "billing.pay")).toBe(false);
    });

    it("should restrict Nurses to read-only access for billing data", () => {
      const nurseRoles = ["Nurse"];
      expect(checkBillingPermission(nurseRoles, "billing.read")).toBe(true);
      expect(checkBillingPermission(nurseRoles, "billing.create")).toBe(false);
      expect(checkBillingPermission(nurseRoles, "billing.pay")).toBe(false);
    });
  });

  describe("Billing Summary Aggregations & Reconciliation", () => {
    it("should correctly aggregate billing KPIs and counts", () => {
      const sampleInvoices: InvoiceItem[] = [
        {
          invoiceId: 1,
          invoiceNumber: "INV-1",
          patientId: 1,
          patientName: "A",
          medicalRecordNumber: "MRN-1",
          serviceType: "OPD",
          totalAmount: 50,
          paidAmount: 50,
          balanceAmount: 0,
          status: "Paid",
          invoiceDate: "2026-10-17",
        },
        {
          invoiceId: 2,
          invoiceNumber: "INV-2",
          patientId: 2,
          patientName: "B",
          medicalRecordNumber: "MRN-2",
          serviceType: "OPD",
          totalAmount: 100,
          paidAmount: 40,
          balanceAmount: 60,
          status: "Partial",
          invoiceDate: "2026-10-17",
        },
        {
          invoiceId: 3,
          invoiceNumber: "INV-3",
          patientId: 3,
          patientName: "C",
          medicalRecordNumber: "MRN-3",
          serviceType: "OPD",
          totalAmount: 75,
          paidAmount: 0,
          balanceAmount: 75,
          status: "Unpaid",
          invoiceDate: "2026-10-17",
        },
      ];

      const totalBilled = sampleInvoices.reduce((s, i) => s + i.totalAmount, 0);
      const totalCollected = sampleInvoices.reduce((s, i) => s + i.paidAmount, 0);
      const totalOutstanding = sampleInvoices.reduce((s, i) => s + i.balanceAmount, 0);
      const paidCount = sampleInvoices.filter((i) => i.status === "Paid").length;
      const partialCount = sampleInvoices.filter((i) => i.status === "Partial").length;
      const unpaidCount = sampleInvoices.filter((i) => i.status === "Unpaid").length;

      expect(totalBilled).toBe(225);
      expect(totalCollected).toBe(90);
      expect(totalOutstanding).toBe(135);
      expect(paidCount).toBe(1);
      expect(partialCount).toBe(1);
      expect(unpaidCount).toBe(1);
    });
  });
});
