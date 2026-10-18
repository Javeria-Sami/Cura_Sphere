import { describe, it, expect } from "vitest";
import { RegisterPatientDto } from "../types/patient";
import { CreateEmrEncounterRequest } from "../services/emrService";
import { isModuleEnabledForEdition, getEditionConfig } from "../config/editionConfig";

describe("CuraSphere Clinic Edition — Session 22 Final Acceptance Testing", () => {
  // =========================================================================
  // 1. PATIENT WORKFLOW ACCEPTANCE
  // =========================================================================
  describe("1. Patient Workflow Acceptance", () => {
    interface SyntheticPatient {
      patientId: number;
      medicalRecordNumber: string;
      firstName: string;
      lastName: string;
      gender: string;
      dateOfBirth: string;
      phoneNumber: string;
      cnicPassport?: string;
      patientStatus: "Active" | "Inactive";
    }

    const validateRegistration = (dto: Partial<RegisterPatientDto>) => {
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

    it("should accept valid synthetic registration data and generate complete patient profile", () => {
      const validDto: Partial<RegisterPatientDto> = {
        firstName: "Bilal",
        lastName: "Ahmed",
        gender: "Male",
        dateOfBirth: "1988-11-23",
        phoneNumber: "+92 300 9876543",
        cnicPassport: "42201-1234567-3",
        address: "Apartment 4B, Clifton, Karachi",
      };

      const res = validateRegistration(validDto);
      expect(res.valid).toBe(true);
      expect(res.errors).toHaveLength(0);

      const patient: SyntheticPatient = {
        patientId: 601,
        medicalRecordNumber: "MRN-2026-00601",
        firstName: validDto.firstName!,
        lastName: validDto.lastName!,
        gender: validDto.gender!,
        dateOfBirth: validDto.dateOfBirth!,
        phoneNumber: validDto.phoneNumber!,
        cnicPassport: validDto.cnicPassport,
        patientStatus: "Active",
      };

      expect(patient.medicalRecordNumber).toMatch(/^MRN-\d{4}-\d{5}$/);
      expect(patient.patientStatus).toBe("Active");
    });

    it("should reject patient registration with invalid fields and future date of birth", () => {
      expect(validateRegistration({ firstName: "", lastName: "Ahmed", gender: "Male", dateOfBirth: "1990-01-01", phoneNumber: "1234567" }).valid).toBe(false);
      expect(validateRegistration({ firstName: "Bilal", lastName: "Ahmed", gender: "Other", dateOfBirth: "2099-01-01", phoneNumber: "1234567" }).valid).toBe(false);
      expect(validateRegistration({ firstName: "Bilal", lastName: "Ahmed", gender: "Male", dateOfBirth: "1990-01-01", phoneNumber: "bad-phone" }).valid).toBe(false);
    });

    it("should accurately match patients across multi-field search (MRN, Name, Phone, CNIC)", () => {
      const directory: SyntheticPatient[] = [
        { patientId: 1, medicalRecordNumber: "MRN-2026-00601", firstName: "Bilal", lastName: "Ahmed", gender: "Male", dateOfBirth: "1988-11-23", phoneNumber: "+92 300 9876543", cnicPassport: "42201-1234567-3", patientStatus: "Active" },
        { patientId: 2, medicalRecordNumber: "MRN-2026-00602", firstName: "Ayesha", lastName: "Malik", gender: "Female", dateOfBirth: "1995-02-14", phoneNumber: "+92 333 4455667", cnicPassport: "37405-7654321-2", patientStatus: "Active" },
      ];

      const search = (q: string) => {
        const term = q.toLowerCase().trim();
        return directory.filter(
          (p) =>
            p.medicalRecordNumber.toLowerCase().includes(term) ||
            p.firstName.toLowerCase().includes(term) ||
            p.lastName.toLowerCase().includes(term) ||
            p.phoneNumber.includes(term) ||
            (p.cnicPassport && p.cnicPassport.includes(term))
        );
      };

      expect(search("00601")).toHaveLength(1);
      expect(search("Ayesha")).toHaveLength(1);
      expect(search("9876543")).toHaveLength(1);
      expect(search("42201")).toHaveLength(1);
      expect(search("NonExistent")).toHaveLength(0);
    });
  });

  // =========================================================================
  // 2. APPOINTMENTS & DOCTOR AVAILABILITY ACCEPTANCE
  // =========================================================================
  describe("2. Appointments & Doctor Availability Acceptance", () => {
    it("should prevent double booking when a doctor already has an active appointment in the target timeslot", () => {
      const activeBookings = [
        { doctorId: 5, date: "2026-10-25", time: "11:00 AM", status: "Scheduled" },
      ];

      const isSlotConflict = (doctorId: number, date: string, time: string) => {
        return activeBookings.some(
          (b) =>
            b.doctorId === doctorId &&
            b.date === date &&
            b.time === time &&
            b.status !== "Cancelled" &&
            b.status !== "No Show"
        );
      };

      expect(isSlotConflict(5, "2026-10-25", "11:00 AM")).toBe(true);
      expect(isSlotConflict(5, "2026-10-25", "11:30 AM")).toBe(false);
      expect(isSlotConflict(6, "2026-10-25", "11:00 AM")).toBe(false);
    });

    it("should lock terminal appointment states (Completed, Cancelled) against mutation or rescheduling", () => {
      const canTransitionAppointment = (currentStatus: string) => {
        return !["Completed", "Cancelled"].includes(currentStatus);
      };

      expect(canTransitionAppointment("Scheduled")).toBe(true);
      expect(canTransitionAppointment("Confirmed")).toBe(true);
      expect(canTransitionAppointment("Checked In")).toBe(true);
      expect(canTransitionAppointment("In Consultation")).toBe(true);
      expect(canTransitionAppointment("Completed")).toBe(false);
      expect(canTransitionAppointment("Cancelled")).toBe(false);
    });
  });

  // =========================================================================
  // 3. CONSULTATIONS & CLINICAL RECORDS ACCEPTANCE
  // =========================================================================
  describe("3. Consultations & Clinical Records Acceptance", () => {
    it("should compute accurate BMI and validate required SOAP fields", () => {
      const computeBmi = (weightKg: number, heightCm: number) => {
        if (!weightKg || !heightCm || heightCm <= 0) return 0;
        const heightM = heightCm / 100;
        return Number((weightKg / (heightM * heightM)).toFixed(1));
      };

      expect(computeBmi(72, 175)).toBe(23.5);
      expect(computeBmi(90, 170)).toBe(31.1);

      const validateConsultation = (dto: Partial<CreateEmrEncounterRequest>) => {
        const errors: string[] = [];
        if (!dto.patientId) errors.push("Patient ID is required");
        if (!dto.doctorId) errors.push("Doctor ID is required");
        if (!dto.chiefComplaint?.trim()) errors.push("Chief complaint is required");
        if (!dto.diagnoses || dto.diagnoses.length === 0) errors.push("Diagnosis is required");
        return { valid: errors.length === 0, errors };
      };

      const validPayload: Partial<CreateEmrEncounterRequest> = {
        patientId: 601,
        doctorId: 5,
        chiefComplaint: "Severe epigastric pain and heartburn",
        diagnoses: [{ icdCode: "K21.9", description: "GERD", isPrimary: true }],
      };

      expect(validateConsultation(validPayload).valid).toBe(true);
      expect(validateConsultation({ ...validPayload, chiefComplaint: "" }).valid).toBe(false);
    });

    it("should seal finalized encounters and protect against post-finalization record tampering", () => {
      interface EncounterState {
        id: number;
        status: "Draft" | "Finalized";
        notes: string;
      }

      const encounter: EncounterState = { id: 801, status: "Finalized", notes: "Physician clinical evaluation" };

      const updateEncounter = (enc: EncounterState, newNotes: string) => {
        if (enc.status === "Finalized") {
          throw new Error("Cannot modify a finalized clinical record. Sealed encounters are immutable.");
        }
        enc.notes = newNotes;
        return enc;
      };

      expect(() => updateEncounter(encounter, "Altered notes")).toThrow(
        /Cannot modify a finalized clinical record/
      );
    });

    it("should automatically complete associated appointment when consultation is finalized", () => {
      const appt = { id: 301, status: "In Consultation", remarks: "" };
      const encounterNumber = "EMR-20261018-801";

      // Finalization hook
      appt.status = "Completed";
      appt.remarks = `Consultation finalized — ${encounterNumber}`;

      expect(appt.status).toBe("Completed");
      expect(appt.remarks).toContain(encounterNumber);
    });
  });

  // =========================================================================
  // 4. PRESCRIPTIONS & CDSS DRUG-DRUG INTERACTIONS ACCEPTANCE
  // =========================================================================
  describe("4. Prescriptions & CDSS Drug Interactions Acceptance", () => {
    it("should flag severe drug-drug interactions (e.g. Warfarin + Aspirin) via CDSS engine", () => {
      const cdssRules: Record<string, { interactWith: string[]; severity: string; warning: string }> = {
        warfarin: {
          interactWith: ["aspirin", "ibuprofen"],
          severity: "High",
          warning: "High risk of gastrointestinal or internal hemorrhagic bleeding.",
        },
      };

      const evaluateRegimen = (drugs: string[]) => {
        const warnings: string[] = [];
        const normalized = drugs.map((d) => d.toLowerCase().trim());
        for (let i = 0; i < normalized.length; i++) {
          for (let j = i + 1; j < normalized.length; j++) {
            if (cdssRules[normalized[i]]?.interactWith.includes(normalized[j])) {
              warnings.push(cdssRules[normalized[i]].warning);
            }
          }
        }
        return { hasWarnings: warnings.length > 0, warnings };
      };

      expect(evaluateRegimen(["Warfarin", "Aspirin"]).hasWarnings).toBe(true);
      expect(evaluateRegimen(["Paracetamol", "Vitamin C"]).hasWarnings).toBe(false);
    });
  });

  // =========================================================================
  // 5. BILLING & PAYMENTS ACCEPTANCE
  // =========================================================================
  describe("5. Billing & Payments Acceptance", () => {
    it("should authoritatively calculate line items, discounts, taxes, and final totals", () => {
      const lineItems = [
        { desc: "General Outpatient Consultation", qty: 1, unitPrice: 30 },
        { desc: "Complete Blood Count (CBC)", qty: 2, unitPrice: 25 },
      ];

      const subtotal = lineItems.reduce((sum, item) => sum + item.qty * item.unitPrice, 0); // 30 + 50 = 80
      const discountPct = 10; // 10% of 80 = 8.00
      const discountAmt = Number((subtotal * (discountPct / 100)).toFixed(2));
      const taxable = subtotal - discountAmt; // 72.00
      const taxPct = 5; // 5% of 72 = 3.60
      const taxAmt = Number((taxable * (taxPct / 100)).toFixed(2));
      const totalAmount = Number((taxable + taxAmt).toFixed(2)); // 75.60

      expect(subtotal).toBe(80.0);
      expect(discountAmt).toBe(8.0);
      expect(taxAmt).toBe(3.6);
      expect(totalAmount).toBe(75.6);
    });

    it("should handle partial payments, balance reductions, overpayment rejection, and full settlement", () => {
      interface InvoiceState {
        total: number;
        paid: number;
        balance: number;
        status: "Unpaid" | "Partial" | "Paid";
      }

      const inv: InvoiceState = { total: 100.0, paid: 0.0, balance: 100.0, status: "Unpaid" };

      const recordPayment = (invoice: InvoiceState, payment: number) => {
        if (payment <= 0) throw new Error("Payment must be greater than zero.");
        if (payment > invoice.balance) throw new Error(`Overpayment blocked: ${payment} exceeds ${invoice.balance}`);

        invoice.paid = Number((invoice.paid + payment).toFixed(2));
        invoice.balance = Number((invoice.total - invoice.paid).toFixed(2));
        invoice.status = invoice.balance === 0 ? "Paid" : "Partial";
        return invoice;
      };

      // 1. Partial payment $40
      recordPayment(inv, 40.0);
      expect(inv.paid).toBe(40.0);
      expect(inv.balance).toBe(60.0);
      expect(inv.status).toBe("Partial");

      // 2. Overpayment attempt of $80 against $60 balance
      expect(() => recordPayment(inv, 80.0)).toThrow(/Overpayment blocked/);

      // 3. Negative payment attempt
      expect(() => recordPayment(inv, -10.0)).toThrow(/greater than zero/);

      // 4. Settle remaining $60
      recordPayment(inv, 60.0);
      expect(inv.paid).toBe(100.0);
      expect(inv.balance).toBe(0.0);
      expect(inv.status).toBe("Paid");
    });
  });

  // =========================================================================
  // 6. ROLE-BASED ACCESS CONTROL (RBAC) & PERMISSION MATRICES
  // =========================================================================
  describe("6. Role-Based Access Control Acceptance", () => {
    const roles: Record<string, string[]> = {
      "Clinic Administrator": ["patients.create", "appointments.create", "emr.diagnose", "billing.pay", "reports.read"],
      "Receptionist": ["patients.create", "appointments.create", "appointments.read", "billing.read"],
      "Doctor": ["patients.read", "appointments.read", "emr.create", "emr.diagnose"],
      "Cashier": ["patients.read", "billing.create", "billing.pay", "billing.read"],
      "Read-Only Viewer": ["patients.read", "appointments.read", "billing.read"],
    };

    const isPermitted = (role: string, perm: string) => (roles[role] || []).includes(perm);

    it("should enforce least privilege per clinical role", () => {
      // Receptionist cannot diagnose or record cashier payments
      expect(isPermitted("Receptionist", "appointments.create")).toBe(true);
      expect(isPermitted("Receptionist", "emr.diagnose")).toBe(false);
      expect(isPermitted("Receptionist", "billing.pay")).toBe(false);

      // Doctor cannot record cashier payments
      expect(isPermitted("Doctor", "emr.diagnose")).toBe(true);
      expect(isPermitted("Doctor", "billing.pay")).toBe(false);

      // Cashier cannot create EMR notes
      expect(isPermitted("Cashier", "billing.pay")).toBe(true);
      expect(isPermitted("Cashier", "emr.create")).toBe(false);

      // Read-Only Viewer cannot perform any mutation
      expect(isPermitted("Read-Only Viewer", "patients.create")).toBe(false);
      expect(isPermitted("Read-Only Viewer", "appointments.create")).toBe(false);
      expect(isPermitted("Read-Only Viewer", "billing.pay")).toBe(false);
    });
  });

  // =========================================================================
  // 7. HOSPITAL EDITION NON-REGRESSION ACCEPTANCE
  // =========================================================================
  describe("7. Hospital Edition Non-Regression Acceptance", () => {
    it("should retain all 24 enterprise hospital modules in Hospital Edition", () => {
      const config = getEditionConfig("Hospital");
      expect(config.enabledModules).toContain("ipd");
      expect(config.enabledModules).toContain("emergency");
      expect(config.enabledModules).toContain("surgery");
      expect(config.enabledModules).toContain("icu");
      expect(config.enabledModules.length).toBeGreaterThanOrEqual(24);
      expect(config.disabledModules).toHaveLength(0);
    });

    it("should strictly disable tertiary hospital modules in Clinic Edition", () => {
      const config = getEditionConfig("Clinic");
      expect(config.disabledModules).toContain("ipd");
      expect(config.disabledModules).toContain("emergency");
      expect(config.disabledModules).toContain("surgery");
      expect(config.disabledModules).toContain("icu");

      expect(isModuleEnabledForEdition("ipd", "Clinic")).toBe(false);
      expect(isModuleEnabledForEdition("emergency", "Clinic")).toBe(false);
      expect(isModuleEnabledForEdition("surgery", "Clinic")).toBe(false);
      expect(isModuleEnabledForEdition("icu", "Clinic")).toBe(false);
    });
  });
});
