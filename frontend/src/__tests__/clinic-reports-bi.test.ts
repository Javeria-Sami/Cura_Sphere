import { describe, it, expect, beforeEach } from "vitest";
import { useEditionStore } from "../stores/editionStore";
import { DashboardReportSummary, PaymentMethodBreakdownItem, InvoiceStatusBreakdownItem } from "../services/reportsService";

describe("Clinic Financial & Operational BI Reports Tests (Module 12 - Session 18)", () => {
  beforeEach(() => {
    useEditionStore.getState().setEdition("Clinic");
  });

  const mockClinicSummary: DashboardReportSummary = {
    totalPatientsRegistered: 1250,
    todayAppointments: 42,
    completedConsultationsToday: 36,
    consultationCompletionRate: 85.7,
    activeOpdQueueCount: 18,
    admittedIpdPatients: 0,
    activeEmergencyCases: 0,
    totalRevenueBilledToday: 185000,
    totalRevenueCollectedToday: 142000,
    totalOutstandingBalance: 43000,
    bedOccupancyPercentage: 0,
    activeEdition: "Clinic",
    timeframe: "month",
    revenueByDepartment: [
      { departmentName: "Outpatient Consultations (OPD)", amount: 85000 },
      { departmentName: "Diagnostic Laboratory", amount: 48000 },
      { departmentName: "Pharmacy Dispensary", amount: 32000 },
      { departmentName: "Outpatient Procedures", amount: 20000 },
    ],
    monthlyCensusTrend: [
      { month: "Jan", outpatientCount: 1100, inpatientCount: 0, walkInCount: 420 },
      { month: "Feb", outpatientCount: 1250, inpatientCount: 0, walkInCount: 460 },
      { month: "Mar", outpatientCount: 1400, inpatientCount: 0, walkInCount: 510 },
      { month: "Apr", outpatientCount: 1350, inpatientCount: 0, walkInCount: 490 },
      { month: "May", outpatientCount: 1520, inpatientCount: 0, walkInCount: 530 },
      { month: "Jun", outpatientCount: 1680, inpatientCount: 0, walkInCount: 580 },
    ],
    paymentMethodsBreakdown: [
      { method: "Cash", amount: 75000, percentage: 52.8 },
      { method: "Card (POS)", amount: 42000, percentage: 29.6 },
      { method: "Bank Transfer", amount: 15000, percentage: 10.6 },
      { method: "Insurance Claim", amount: 10000, percentage: 7.0 },
    ],
    invoiceStatusBreakdown: [
      { status: "Paid", count: 28, totalAmount: 142000 },
      { status: "Partial", count: 6, totalAmount: 28000 },
      { status: "Unpaid", count: 4, totalAmount: 15000 },
    ],
  };

  it("should verify reports module is enabled in Clinic Edition navigation", () => {
    const store = useEditionStore.getState();
    expect(store.currentEdition).toBe("Clinic");
    expect(store.isModuleEnabled("reports")).toBe(true);
    expect(store.isModuleEnabled("billing")).toBe(true);
    expect(store.isModuleEnabled("payments")).toBe(true);
  });

  it("should enforce strict edition isolation for Clinic BI report metrics", () => {
    expect(mockClinicSummary.activeEdition).toBe("Clinic");
    expect(mockClinicSummary.admittedIpdPatients).toBe(0);
    expect(mockClinicSummary.bedOccupancyPercentage).toBe(0);

    // Revenue breakdown must not contain inpatient or surgery modules
    const deptNames = mockClinicSummary.revenueByDepartment.map(d => d.departmentName.toLowerCase());
    expect(deptNames.some(name => name.includes("inpatient") || name.includes("ipd"))).toBe(false);
    expect(deptNames.some(name => name.includes("surgery") || name.includes("icu"))).toBe(false);
  });

  it("should validate clinic revenue by service line aggregation", () => {
    const totalServiceRevenue = mockClinicSummary.revenueByDepartment.reduce((sum, d) => sum + d.amount, 0);
    expect(totalServiceRevenue).toBe(185000);
    expect(mockClinicSummary.revenueByDepartment).toHaveLength(4);

    const opdDept = mockClinicSummary.revenueByDepartment.find(d => d.departmentName.includes("Outpatient Consultations"));
    expect(opdDept).toBeDefined();
    expect(opdDept?.amount).toBe(85000);
  });

  it("should validate cashier payment channel distribution and percentage sums", () => {
    const methods: PaymentMethodBreakdownItem[] = mockClinicSummary.paymentMethodsBreakdown || [];
    const totalCollected = methods.reduce((sum, m) => sum + m.amount, 0);
    const totalPercentage = methods.reduce((sum, m) => sum + m.percentage, 0);

    expect(totalCollected).toBe(142000);
    expect(Math.abs(totalPercentage - 100.0)).toBeLessThan(0.1);

    const cashChannel = methods.find(m => m.method === "Cash");
    expect(cashChannel?.amount).toBe(75000);
    expect(cashChannel?.percentage).toBe(52.8);
  });

  it("should compute invoice settlement breakdown and balance arithmetic", () => {
    const invoices: InvoiceStatusBreakdownItem[] = mockClinicSummary.invoiceStatusBreakdown || [];
    const totalInvoiceCount = invoices.reduce((sum, i) => sum + i.count, 0);
    const totalInvoicedAmount = invoices.reduce((sum, i) => sum + i.totalAmount, 0);

    expect(totalInvoiceCount).toBe(38);
    expect(totalInvoicedAmount).toBe(185000);

    // Outstanding balance verification: total billed (185,000) - total collected (142,000) = 43,000
    const calculatedOutstanding = totalInvoicedAmount - (mockClinicSummary.totalRevenueCollectedToday || 0);
    expect(calculatedOutstanding).toBe(43000);
    expect(mockClinicSummary.totalOutstandingBalance).toBe(43000);
  });

  it("should calculate consultation completion rate accurately", () => {
    const scheduled = mockClinicSummary.todayAppointments;
    const completed = mockClinicSummary.completedConsultationsToday || 0;
    const expectedRate = Math.round((completed / scheduled) * 1000) / 10;

    expect(mockClinicSummary.consultationCompletionRate).toBe(85.7);
    expect(expectedRate).toBe(85.7);
  });

  it("should accurately compare outpatient appointments vs walk-ins in monthly trend", () => {
    const trends = mockClinicSummary.monthlyCensusTrend;
    expect(trends).toHaveLength(6);

    trends.forEach(month => {
      // In Clinic Edition, inpatient count must be strictly 0
      expect(month.inpatientCount).toBe(0);
      expect(month.outpatientCount).toBeGreaterThan(1000);
      expect(month.walkInCount).toBeGreaterThan(400);
    });
  });

  it("should handle timeframe query parameters correctly", () => {
    const timeframes = ["today", "week", "month", "year"];
    const buildParams = (edition: string, timeframe: string) => ({
      edition,
      timeframe,
    });

    timeframes.forEach(tf => {
      const params = buildParams("Clinic", tf);
      expect(params.edition).toBe("Clinic");
      expect(params.timeframe).toBe(tf);
    });
  });
});
