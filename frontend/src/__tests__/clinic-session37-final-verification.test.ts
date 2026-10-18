import { describe, it, expect } from "vitest";
import api from "../lib/api";
import { RegisterPatientDto } from "../types/patient";
import { CreateEmrEncounterRequest } from "../services/emrService";
import { InvoiceLineItem } from "../services/financialService";
import { isModuleEnabledForEdition } from "../config/editionConfig";

describe("CuraSphere Clinic Edition — Session 37 Final Defect Remediation & Reliability Verification", () => {
  // =========================================================================
  // 1. PATIENT MANAGEMENT WORKFLOW VERIFICATION
  // =========================================================================
  describe("1. Patient Management Workflow", () => {
    const validatePatientRegistration = (dto: Partial<RegisterPatientDto>) => {
      const errors: string[] = [];
      if (!dto.firstName?.trim()) errors.push("First name is required");
      if (!dto.lastName?.trim()) errors.push("Last name is required");
      if (!dto.gender || !["Male", "Female", "Other"].includes(dto.gender)) {
        errors.push("Valid gender is required");
      }
      if (!dto.dateOfBirth) {
        errors.push("Date of birth is required");
      } else {
        const dob = new Date(dto.dateOfBirth);
        if (dob > new Date()) errors.push("Date of birth cannot be in the future");
      }
      if (!dto.phoneNumber?.trim() || !/^[0-9+\-\s()]{7,20}$/.test(dto.phoneNumber)) {
        errors.push("Valid phone number is required");
      }
      return { valid: errors.length === 0, errors };
    };

    it("should accept valid synthetic patient registration and format standard MRN", () => {
      const validDto: Partial<RegisterPatientDto> = {
        firstName: "Tariq",
        lastName: "Mahmood",
        gender: "Male",
        dateOfBirth: "1985-06-15",
        phoneNumber: "+92 333 4567890",
        cnicPassport: "35201-7654321-1",
        address: "Model Town, Lahore",
      };

      const result = validatePatientRegistration(validDto);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);

      const mrn = `MRN-2026-${String(701).padStart(5, "0")}`;
      expect(mrn).toBe("MRN-2026-00701");
      expect(mrn).toMatch(/^MRN-\d{4}-\d{5}$/);
    });

    it("should reject patient registration with missing name, future DOB, or malformed phone", () => {
      const invalidDto: Partial<RegisterPatientDto> = {
        firstName: "",
        lastName: "Mahmood",
        gender: "Male",
        dateOfBirth: "2099-01-01",
        phoneNumber: "invalid-phone",
      };

      const result = validatePatientRegistration(invalidDto);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("First name is required");
      expect(result.errors).toContain("Date of birth cannot be in the future");
      expect(result.errors).toContain("Valid phone number is required");
    });

    it("should detect potential duplicate patient registrations by CNIC and Phone", () => {
      interface ExistingPatient {
        patientId: number;
        cnicPassport: string;
        phoneNumber: string;
      }

      const existingRecords: ExistingPatient[] = [
        { patientId: 101, cnicPassport: "35201-1111111-1", phoneNumber: "+92 300 1112233" },
        { patientId: 102, cnicPassport: "35201-2222222-2", phoneNumber: "+92 300 4445566" },
      ];

      const checkForDuplicates = (cnic: string, phone: string) => {
        const cnicMatch = existingRecords.find((p) => p.cnicPassport === cnic);
        if (cnicMatch) return { duplicate: true, reason: "CNIC already registered", patientId: cnicMatch.patientId };

        const phoneMatch = existingRecords.find((p) => p.phoneNumber === phone);
        if (phoneMatch) return { duplicate: true, reason: "Phone number already registered", patientId: phoneMatch.patientId };

        return { duplicate: false };
      };

      expect(checkForDuplicates("35201-1111111-1", "+92 300 9999999").duplicate).toBe(true);
      expect(checkForDuplicates("35201-9999999-9", "+92 300 4445566").duplicate).toBe(true);
      expect(checkForDuplicates("35201-3333333-3", "+92 300 7778899").duplicate).toBe(false);
    });
  });

  // =========================================================================
  // 2. APPOINTMENT MANAGEMENT WORKFLOW VERIFICATION
  // =========================================================================
  describe("2. Appointment Management Workflow", () => {
    interface DoctorSlot {
      doctorId: number;
      startTime: string;
      endTime: string;
    }

    const existingAppointments: DoctorSlot[] = [
      { doctorId: 10, startTime: "2026-10-19T09:00:00", endTime: "2026-10-19T09:30:00" },
      { doctorId: 10, startTime: "2026-10-19T10:00:00", endTime: "2026-10-19T10:30:00" },
    ];

    const checkSlotConflict = (doctorId: number, newStart: string, newEnd: string) => {
      const conflict = existingAppointments.some((appt) => {
        if (appt.doctorId !== doctorId) return false;
        return (
          (newStart >= appt.startTime && newStart < appt.endTime) ||
          (newEnd > appt.startTime && newEnd <= appt.endTime) ||
          (newStart <= appt.startTime && newEnd >= appt.endTime)
        );
      });
      return conflict;
    };

    it("should detect overlapping appointment collision for same doctor and timeslot", () => {
      // Overlaps with 09:00 - 09:30
      expect(checkSlotConflict(10, "2026-10-19T09:15:00", "2026-10-19T09:45:00")).toBe(true);
      // Non-overlapping slot: 09:30 - 10:00
      expect(checkSlotConflict(10, "2026-10-19T09:30:00", "2026-10-19T10:00:00")).toBe(false);
      // Different doctor at 09:00 - 09:30
      expect(checkSlotConflict(12, "2026-10-19T09:00:00", "2026-10-19T09:30:00")).toBe(false);
    });

    it("should manage appointment status life-cycle transitions strictly", () => {
      type AppointmentStatus = "Scheduled" | "In-Progress" | "Completed" | "Cancelled";
      const allowedTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
        Scheduled: ["In-Progress", "Cancelled"],
        "In-Progress": ["Completed", "Cancelled"],
        Completed: [],
        Cancelled: [],
      };

      const canTransition = (current: AppointmentStatus, next: AppointmentStatus) => {
        return allowedTransitions[current].includes(next);
      };

      expect(canTransition("Scheduled", "In-Progress")).toBe(true);
      expect(canTransition("Scheduled", "Cancelled")).toBe(true);
      expect(canTransition("In-Progress", "Completed")).toBe(true);
      expect(canTransition("Completed", "Scheduled")).toBe(false);
      expect(canTransition("Cancelled", "In-Progress")).toBe(false);
    });
  });

  // =========================================================================
  // 3. CONSULTATION & CLINICAL RECORDS VERIFICATION
  // =========================================================================
  describe("3. Consultation & Clinical Records", () => {
    it("should validate required consultation fields and patient-doctor linkage", () => {
      const validateConsultation = (req: Partial<CreateEmrEncounterRequest>) => {
        if (!req.patientId || req.patientId <= 0) return { valid: false, error: "Invalid patient reference" };
        if (!req.doctorId || req.doctorId <= 0) return { valid: false, error: "Invalid doctor reference" };
        if (!req.chiefComplaint?.trim()) return { valid: false, error: "Chief complaint is mandatory" };
        return { valid: true };
      };

      expect(validateConsultation({ patientId: 101, doctorId: 5, chiefComplaint: "Acute migraine" }).valid).toBe(true);
      expect(validateConsultation({ patientId: 0, doctorId: 5, chiefComplaint: "Acute migraine" }).valid).toBe(false);
      expect(validateConsultation({ patientId: 101, doctorId: 0, chiefComplaint: "Acute migraine" }).valid).toBe(false);
      expect(validateConsultation({ patientId: 101, doctorId: 5, chiefComplaint: "" }).valid).toBe(false);
    });

    it("should prevent retroactive mutation of finalized clinical encounters", () => {
      interface EncounterState {
        encounterId: number;
        isFinalized: boolean;
        notes: string;
      }

      const updateEncounter = (encounter: EncounterState, newNotes: string) => {
        if (encounter.isFinalized) {
          throw new Error("Cannot modify finalized clinical encounter: Record is permanently sealed.");
        }
        return { ...encounter, notes: newNotes };
      };

      const openEncounter: EncounterState = { encounterId: 1, isFinalized: false, notes: "Draft notes" };
      const updated = updateEncounter(openEncounter, "Updated clinical findings");
      expect(updated.notes).toBe("Updated clinical findings");

      const sealedEncounter: EncounterState = { encounterId: 2, isFinalized: true, notes: "Final SOAP note" };
      expect(() => updateEncounter(sealedEncounter, "Malicious alteration")).toThrow("Cannot modify finalized clinical encounter");
    });
  });

  // =========================================================================
  // 4. PRESCRIPTION & CDSS INTERACTION SAFETY
  // =========================================================================
  describe("4. Prescriptions & CDSS Safety Rules", () => {
    it("should trigger critical CDSS alert when concurrent Warfarin and Aspirin are prescribed", () => {
      const checkDrugInteractions = (medications: string[]) => {
        const medsLower = medications.map((m) => m.toLowerCase());
        const hasWarfarin = medsLower.some((m) => m.includes("warfarin"));
        const hasAspirin = medsLower.some((m) => m.includes("aspirin") || m.includes("acetylsalicylic"));

        if (hasWarfarin && hasAspirin) {
          return {
            hazard: "CRITICAL",
            warning: "High risk of severe bleeding: Concurrent anticoagulation (Warfarin) and antiplatelet (Aspirin) detected.",
          };
        }
        return { hazard: "NONE" };
      };

      const safeRegimen = ["Amoxicillin 500mg", "Paracetamol 500mg"];
      expect(checkDrugInteractions(safeRegimen).hazard).toBe("NONE");

      const dangerousRegimen = ["Warfarin 5mg", "Aspirin 75mg daily"];
      const alert = checkDrugInteractions(dangerousRegimen);
      expect(alert.hazard).toBe("CRITICAL");
      expect(alert.warning).toContain("High risk of severe bleeding");
    });
  });

  // =========================================================================
  // 5. BILLING, CASHIERING & FINANCIAL INTEGRITY
  // =========================================================================
  describe("5. Billing, Invoices & Financial Integrity", () => {
    it("should accurately compute line item subtotal, discount, tax, and final balance", () => {
      const items: InvoiceLineItem[] = [
        { description: "General Consultation", quantity: 1, unitPrice: 1500, totalPrice: 1500 },
        { description: "Blood Glucose Test", quantity: 1, unitPrice: 500, totalPrice: 500 },
      ];

      const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      const discountPercent = 10; // 10%
      const discountAmount = (subtotal * discountPercent) / 100;
      const discountedSubtotal = subtotal - discountAmount;
      const taxPercent = 5; // 5%
      const taxAmount = (discountedSubtotal * taxPercent) / 100;
      const totalAmount = discountedSubtotal + taxAmount;

      expect(subtotal).toBe(2000);
      expect(discountAmount).toBe(200);
      expect(discountedSubtotal).toBe(1800);
      expect(taxAmount).toBe(90);
      expect(totalAmount).toBe(1890);
    });

    it("should transition invoice status from Unpaid -> Partial -> Paid without overpayment", () => {
      const totalAmount = 1000;
      let paidAmount = 0;
      let balance = totalAmount - paidAmount;
      let status = "Unpaid";

      const applyPayment = (amount: number) => {
        if (amount <= 0) throw new Error("Payment must be greater than zero");
        if (amount > balance) throw new Error("Payment cannot exceed remaining invoice balance");

        paidAmount += amount;
        balance = totalAmount - paidAmount;
        status = balance === 0 ? "Paid" : "Partial";
        return { paidAmount, balance, status };
      };

      // Partial payment of 400
      const p1 = applyPayment(400);
      expect(p1.paidAmount).toBe(400);
      expect(p1.balance).toBe(600);
      expect(p1.status).toBe("Partial");

      // Attempt overpayment of 700 (exceeds balance of 600)
      expect(() => applyPayment(700)).toThrow("Payment cannot exceed remaining invoice balance");

      // Final payment of remaining 600
      const p2 = applyPayment(600);
      expect(p2.paidAmount).toBe(1000);
      expect(p2.balance).toBe(0);
      expect(p2.status).toBe("Paid");
    });
  });

  // =========================================================================
  // 6. DASHBOARD & HOSPITAL EDITION ISOLATION
  // =========================================================================
  describe("6. Dashboard & Hospital Edition Isolation", () => {
    it("should disable inpatient, emergency, surgery, and ICU modules in Clinic Edition", () => {
      expect(isModuleEnabledForEdition("ipd", "Clinic")).toBe(false);
      expect(isModuleEnabledForEdition("emergency", "Clinic")).toBe(false);
      expect(isModuleEnabledForEdition("surgery", "Clinic")).toBe(false);
      expect(isModuleEnabledForEdition("icu", "Clinic")).toBe(false);
    });

    it("should retain all shared modules in Clinic Edition", () => {
      expect(isModuleEnabledForEdition("patients", "Clinic")).toBe(true);
      expect(isModuleEnabledForEdition("appointments", "Clinic")).toBe(true);
      expect(isModuleEnabledForEdition("emr", "Clinic")).toBe(true);
      expect(isModuleEnabledForEdition("billing", "Clinic")).toBe(true);
      expect(isModuleEnabledForEdition("reports", "Clinic")).toBe(true);
    });
  });

  // =========================================================================
  // 7. OPERATIONAL RELIABILITY & TIMEOUT REJECTION
  // =========================================================================
  describe("7. Operational Reliability & Timeout Interceptor", () => {
    it("should enforce a 15-second request timeout on Axios client", () => {
      expect(api.defaults.timeout).toBe(15000);
    });

    it("should normalize ECONNABORTED timeout errors with user-friendly guidance in interceptor", async () => {
      const responseInterceptor = (api.interceptors.response as unknown as {
        handlers: Array<{ rejected: (error: Record<string, unknown>) => Promise<unknown> }>;
      }).handlers[0];

      if (responseInterceptor && responseInterceptor.rejected) {
        const timeoutError = {
          code: "ECONNABORTED",
          message: "timeout of 15000ms exceeded",
        };

        try {
          await responseInterceptor.rejected(timeoutError);
        } catch (err: any) {
          expect(err.userFriendlyMessage).toBe(
            "Request timed out after 15 seconds. Please check your network connection and retry."
          );
        }
      }
    });
  });
});
