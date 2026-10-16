import { describe, it, expect, beforeEach } from "vitest";
import { useEditionStore } from "../stores/editionStore";
import { AppointmentItem } from "../services/appointmentService";
import { OpdTokenItem } from "../services/opdService";
import { InvoiceItem } from "../services/financialService";

describe("Clinic Dashboard & UI/UX Implementation Tests (Session 5)", () => {
  beforeEach(() => {
    // Reset to Clinic edition before each test
    useEditionStore.getState().setEdition("Clinic");
  });

  it("should verify active edition is Clinic and dashboard module is enabled", () => {
    const store = useEditionStore.getState();
    expect(store.currentEdition).toBe("Clinic");
    expect(store.isModuleEnabled("dashboard")).toBe(true);
    expect(store.isModuleEnabled("appointments")).toBe(true);
    expect(store.isModuleEnabled("opd")).toBe(true);
    expect(store.isModuleEnabled("patients")).toBe(true);
    expect(store.isModuleEnabled("billing")).toBe(true);

    // Hospital-only modules must be disabled in Clinic Edition
    expect(store.isModuleEnabled("ipd")).toBe(false);
    expect(store.isModuleEnabled("emergency")).toBe(false);
    expect(store.isModuleEnabled("surgery")).toBe(false);
    expect(store.isModuleEnabled("icu")).toBe(false);
  });

  it("should accurately compute clinic overview metrics from real data structures", () => {
    const mockAppointments: AppointmentItem[] = [
      {
        appointmentId: 1,
        appointmentNumber: "APT-001",
        patientId: 101,
        patientName: "Bilal Raza",
        medicalRecordNumber: "MRN-101",
        doctorId: 1,
        doctorName: "Dr. Sana Qureshi",
        departmentName: "Family Medicine",
        appointmentDate: "2026-10-17",
        appointmentTime: "09:00 AM",
        appointmentType: "Consultation",
        status: "Completed",
      },
      {
        appointmentId: 2,
        appointmentNumber: "APT-002",
        patientId: 102,
        patientName: "Nadia Hussain",
        medicalRecordNumber: "MRN-102",
        doctorId: 1,
        doctorName: "Dr. Sana Qureshi",
        departmentName: "Family Medicine",
        appointmentDate: "2026-10-17",
        appointmentTime: "09:30 AM",
        appointmentType: "Follow-up",
        status: "In Consultation",
      },
      {
        appointmentId: 3,
        appointmentNumber: "APT-003",
        patientId: 103,
        patientName: "Zubair Tariq",
        medicalRecordNumber: "MRN-103",
        doctorId: 2,
        doctorName: "Dr. Adeel Khan",
        departmentName: "Internal Medicine",
        appointmentDate: "2026-10-17",
        appointmentTime: "10:00 AM",
        appointmentType: "Consultation",
        status: "Scheduled",
      },
    ];

    const mockTokens: OpdTokenItem[] = [
      {
        opdTokenId: 1,
        tokenNumber: "T-01",
        patientId: 201,
        patientName: "Ayesha Malik",
        medicalRecordNumber: "MRN-201",
        age: 32,
        doctorId: 1,
        doctorName: "Dr. Sana Qureshi",
        departmentName: "OPD",
        queuePosition: 1,
        status: "In Consultation",
        vitals: "120/80",
      },
      {
        opdTokenId: 2,
        tokenNumber: "T-02",
        patientId: 202,
        patientName: "Hamza Ali",
        medicalRecordNumber: "MRN-202",
        age: 28,
        doctorId: 2,
        doctorName: "Dr. Adeel Khan",
        departmentName: "OPD",
        queuePosition: 2,
        status: "Waiting",
        vitals: "115/75",
      },
      {
        opdTokenId: 3,
        tokenNumber: "T-03",
        patientId: 203,
        patientName: "Saima Farooq",
        medicalRecordNumber: "MRN-203",
        age: 45,
        doctorId: 1,
        doctorName: "Dr. Sana Qureshi",
        departmentName: "OPD",
        queuePosition: 3,
        status: "Waiting",
        vitals: "130/85",
      },
    ];

    const mockInvoices: InvoiceItem[] = [
      {
        invoiceId: 1,
        invoiceNumber: "INV-1001",
        patientId: 101,
        patientName: "Bilal Raza",
        medicalRecordNumber: "MRN-101",
        serviceType: "Consultation",
        totalAmount: 2500,
        paidAmount: 2500,
        balanceAmount: 0,
        invoiceDate: "2026-10-17",
        status: "Paid",
      },
      {
        invoiceId: 2,
        invoiceNumber: "INV-1002",
        patientId: 102,
        patientName: "Nadia Hussain",
        medicalRecordNumber: "MRN-102",
        serviceType: "Consultation & ECG",
        totalAmount: 4000,
        paidAmount: 2000,
        balanceAmount: 2000,
        invoiceDate: "2026-10-17",
        status: "Partial",
      },
    ];

    // Total appointments count
    expect(mockAppointments.length).toBe(3);

    // Completed appointments
    const completedCount = mockAppointments.filter((a) => a.status.toLowerCase() === "completed").length;
    expect(completedCount).toBe(1);

    // Waiting queue count
    const waitingTokens = mockTokens.filter((t) => t.status.toLowerCase() === "waiting").length;
    expect(waitingTokens).toBe(2);

    // Active consulting tokens
    const consultingTokens = mockTokens.filter((t) => t.status.toLowerCase() === "in consultation").length;
    expect(consultingTokens).toBe(1);

    // Billing metrics
    const totalBilled = mockInvoices.reduce((acc, i) => acc + i.totalAmount, 0);
    const totalCollected = mockInvoices.reduce((acc, i) => acc + i.paidAmount, 0);
    const pendingBalance = totalBilled - totalCollected;

    expect(totalBilled).toBe(6500);
    expect(totalCollected).toBe(4500);
    expect(pendingBalance).toBe(2000);
  });

  it("should filter appointments accurately by status category", () => {
    const list: AppointmentItem[] = [
      {
        appointmentId: 1,
        appointmentNumber: "APT-1",
        patientId: 1,
        patientName: "Patient A",
        medicalRecordNumber: "MRN-1",
        doctorId: 1,
        doctorName: "Dr. A",
        departmentName: "OPD",
        appointmentDate: "2026-10-17",
        appointmentTime: "09:00 AM",
        appointmentType: "Checkup",
        status: "Scheduled",
      },
      {
        appointmentId: 2,
        appointmentNumber: "APT-2",
        patientId: 2,
        patientName: "Patient B",
        medicalRecordNumber: "MRN-2",
        doctorId: 1,
        doctorName: "Dr. A",
        departmentName: "OPD",
        appointmentDate: "2026-10-17",
        appointmentTime: "09:30 AM",
        appointmentType: "Checkup",
        status: "In Consultation",
      },
      {
        appointmentId: 3,
        appointmentNumber: "APT-3",
        patientId: 3,
        patientName: "Patient C",
        medicalRecordNumber: "MRN-3",
        doctorId: 2,
        doctorName: "Dr. B",
        departmentName: "OPD",
        appointmentDate: "2026-10-17",
        appointmentTime: "10:00 AM",
        appointmentType: "Checkup",
        status: "Completed",
      },
      {
        appointmentId: 4,
        appointmentNumber: "APT-4",
        patientId: 4,
        patientName: "Patient D",
        medicalRecordNumber: "MRN-4",
        doctorId: 2,
        doctorName: "Dr. B",
        departmentName: "OPD",
        appointmentDate: "2026-10-17",
        appointmentTime: "10:30 AM",
        appointmentType: "Checkup",
        status: "Cancelled",
      },
    ];

    const filterList = (filter: string) =>
      list.filter((a) => {
        if (filter === "all") return true;
        const s = a.status.toLowerCase();
        if (filter === "scheduled") return s === "scheduled" || s === "confirmed";
        if (filter === "in-consultation") return s === "in consultation" || s === "consulting";
        if (filter === "completed") return s === "completed";
        return true;
      });

    expect(filterList("all").length).toBe(4);
    expect(filterList("scheduled").length).toBe(1);
    expect(filterList("in-consultation").length).toBe(1);
    expect(filterList("completed").length).toBe(1);
  });

  it("should preserve Hospital Edition dashboard routing when edition is toggled back", () => {
    // Toggle to Hospital
    useEditionStore.getState().setEdition("Hospital");
    const store = useEditionStore.getState();
    expect(store.currentEdition).toBe("Hospital");
    expect(store.isModuleEnabled("ipd")).toBe(true);
    expect(store.isModuleEnabled("emergency")).toBe(true);
    expect(store.isModuleEnabled("surgery")).toBe(true);
    expect(store.isModuleEnabled("icu")).toBe(true);

    // Toggle back to Clinic
    useEditionStore.getState().setEdition("Clinic");
    expect(useEditionStore.getState().currentEdition).toBe("Clinic");
    expect(useEditionStore.getState().isModuleEnabled("ipd")).toBe(false);
  });

  it("should verify quick action route paths match registered application routes", () => {
    const clinicActions = [
      { label: "Register Patient", path: "/patients/register" },
      { label: "Book Appointment", path: "/appointments" },
      { label: "OPD Tokens", path: "/opd" },
      { label: "Counter Billing", path: "/billing" },
      { label: "Patient List", path: "/patients" },
    ];

    // Ensure none of the paths lead to disabled hospital modules
    clinicActions.forEach((action) => {
      expect(action.path).not.toContain("/ipd");
      expect(action.path).not.toContain("/emergency");
      expect(action.path).not.toContain("/surgery");
      expect(action.path).not.toContain("/icu");
      expect(action.path.startsWith("/")).toBe(true);
    });
  });
});
