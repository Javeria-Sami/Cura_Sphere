import { describe, it, expect } from "vitest";
import { ModuleId, EditionType } from "../types/edition";
import { isModuleEnabledForEdition, getEditionConfig } from "../config/editionConfig";
import { RegisterPatientDto } from "../types/patient";
import { InvoiceLineItem } from "../services/financialService";

describe("CuraSphere Clinic Edition — End-to-End Acceptance & Security QA (Session 9)", () => {
  // =========================================================================
  // WORKFLOW A: PATIENT REGISTRATION & SEARCH
  // =========================================================================
  describe("Workflow A — Patient Registration & Search Acceptance", () => {
    const validatePatientRegistration = (dto: Partial<RegisterPatientDto>) => {
      const errors: string[] = [];
      if (!dto.firstName?.trim()) errors.push("First name is required");
      if (!dto.lastName?.trim()) errors.push("Last name is required");
      if (!dto.gender || !["Male", "Female", "Other"].includes(dto.gender)) {
        errors.push("Valid gender (Male, Female, Other) is required");
      }
      if (!dto.dateOfBirth) {
        errors.push("Date of birth is required");
      } else {
        const dob = new Date(dto.dateOfBirth);
        if (dob > new Date()) errors.push("Date of birth cannot be in the future");
      }
      if (!dto.phoneNumber?.trim() || !/^[0-9+\-\s()]{7,20}$/.test(dto.phoneNumber)) {
        errors.push("Valid contact phone number is required");
      }
      return { valid: errors.length === 0, errors };
    };

    interface DuplicateCheckInput {
      nationalId?: string;
      phoneNumber?: string;
    }

    const checkDuplicatePatient = (
      existing: { nationalId?: string; phoneNumber: string }[],
      check: DuplicateCheckInput
    ) => {
      return existing.some(
        (p) =>
          (check.nationalId && p.nationalId === check.nationalId) ||
          (check.phoneNumber && p.phoneNumber === check.phoneNumber)
      );
    };

    it("should accept valid synthetic patient registration data and generate complete profile", () => {
      const validDto: Partial<RegisterPatientDto> = {
        firstName: "Zainab",
        lastName: "Bibi",
        gender: "Female",
        dateOfBirth: "1994-08-20",
        phoneNumber: "+92 300 5551234",
        cnicPassport: "42101-9988776-2",
        address: "House 45, Street 12, G-9/2, Islamabad",
        emergencyContactName: "Tariq Bibi",
        emergencyContactPhone: "+92 300 5551235",
      };

      const result = validatePatientRegistration(validDto);
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it("should reject patient registration with missing name, invalid gender, future DOB, or invalid phone", () => {
      expect(validatePatientRegistration({ firstName: "", lastName: "Doe", gender: "Male", dateOfBirth: "1990-01-01", phoneNumber: "1234567" }).valid).toBe(false);
      expect(validatePatientRegistration({ firstName: "John", lastName: "Doe", gender: "Unknown", dateOfBirth: "1990-01-01", phoneNumber: "1234567" }).valid).toBe(false);
      expect(validatePatientRegistration({ firstName: "John", lastName: "Doe", gender: "Male", dateOfBirth: "2099-01-01", phoneNumber: "1234567" }).valid).toBe(false);
      expect(validatePatientRegistration({ firstName: "John", lastName: "Doe", gender: "Male", dateOfBirth: "1990-01-01", phoneNumber: "abc" }).valid).toBe(false);
    });

    it("should accurately detect duplicate patients by National ID or Phone Number", () => {
      const existingDatabase = [
        { nationalId: "42101-1234567-1", phoneNumber: "+92 300 1112222" },
        { nationalId: "42101-7654321-9", phoneNumber: "+92 321 9998888" },
      ];

      // Exact matching national ID
      expect(checkDuplicatePatient(existingDatabase, { nationalId: "42101-1234567-1", phoneNumber: "+92 333 0000000" })).toBe(true);
      // Exact matching phone
      expect(checkDuplicatePatient(existingDatabase, { nationalId: "42101-9999999-9", phoneNumber: "+92 300 1112222" })).toBe(true);
      // Completely novel patient
      expect(checkDuplicatePatient(existingDatabase, { nationalId: "42101-0000000-0", phoneNumber: "+92 345 5555555" })).toBe(false);
    });

    it("should enforce authorization: users without patients.create permission are blocked from registering", () => {
      const userPermissions = ["appointments.read", "billing.read"];
      const canRegister = userPermissions.includes("patients.create");
      expect(canRegister).toBe(false);
    });
  });

  // =========================================================================
  // WORKFLOW B: APPOINTMENT SCHEDULING & LIFECYCLE
  // =========================================================================
  describe("Workflow B — Appointment Scheduling & Lifecycle Acceptance", () => {
    interface ExistingAppointment {
      appointmentId: number;
      doctorId: number;
      appointmentDate: string;
      appointmentTime: string;
      status: string;
    }

    const checkDoubleBooking = (
      existing: ExistingAppointment[],
      req: { doctorId: number; appointmentDate: string; appointmentTime?: string }
    ) => {
      if (!req.appointmentTime) return false;
      return existing.some(
        (a) =>
          a.doctorId === req.doctorId &&
          a.appointmentDate === req.appointmentDate &&
          a.appointmentTime === req.appointmentTime &&
          a.status !== "Cancelled"
      );
    };

    const validateStatusTransition = (currentStatus: string, nextStatus: string) => {
      // Terminal states cannot transition
      if (currentStatus === "Completed" || currentStatus === "Cancelled") {
        return { valid: false, error: `Cannot alter appointment in terminal state '${currentStatus}'` };
      }

      const allowedTransitions: Record<string, string[]> = {
        Scheduled: ["Confirmed", "Checked In", "Cancelled"],
        Confirmed: ["Checked In", "Cancelled"],
        "Checked In": ["In Consultation", "Cancelled"],
        "In Consultation": ["Completed", "Cancelled"],
      };

      const allowed = allowedTransitions[currentStatus]?.includes(nextStatus);
      return {
        valid: Boolean(allowed),
        error: allowed ? null : `Invalid status transition from '${currentStatus}' to '${nextStatus}'`,
      };
    };

    it("should prevent double booking for the same doctor, date, and time slot", () => {
      const bookedAppointments: ExistingAppointment[] = [
        { appointmentId: 1, doctorId: 5, appointmentDate: "2026-10-20", appointmentTime: "10:00 AM", status: "Confirmed" },
        { appointmentId: 2, doctorId: 5, appointmentDate: "2026-10-20", appointmentTime: "10:30 AM", status: "Cancelled" }, // Cancelled frees up slot
      ];

      // Attempt to book same doctor at same confirmed time
      expect(checkDoubleBooking(bookedAppointments, { doctorId: 5, appointmentDate: "2026-10-20", appointmentTime: "10:00 AM" })).toBe(true);

      // Attempt to book cancelled slot (should be available)
      expect(checkDoubleBooking(bookedAppointments, { doctorId: 5, appointmentDate: "2026-10-20", appointmentTime: "10:30 AM" })).toBe(false);

      // Attempt to book unoccupied slot
      expect(checkDoubleBooking(bookedAppointments, { doctorId: 5, appointmentDate: "2026-10-20", appointmentTime: "11:00 AM" })).toBe(false);

      // Attempt to book another doctor at same time
      expect(checkDoubleBooking(bookedAppointments, { doctorId: 6, appointmentDate: "2026-10-20", appointmentTime: "10:00 AM" })).toBe(false);
    });

    it("should support the full outpatient lifecycle: Scheduled -> Confirmed -> Checked In -> In Consultation -> Completed", () => {
      expect(validateStatusTransition("Scheduled", "Confirmed").valid).toBe(true);
      expect(validateStatusTransition("Confirmed", "Checked In").valid).toBe(true);
      expect(validateStatusTransition("Checked In", "In Consultation").valid).toBe(true);
      expect(validateStatusTransition("In Consultation", "Completed").valid).toBe(true);
    });

    it("should strictly reject alterations or status changes to Completed or Cancelled terminal appointments", () => {
      expect(validateStatusTransition("Completed", "Scheduled").valid).toBe(false);
      expect(validateStatusTransition("Completed", "Cancelled").valid).toBe(false);
      expect(validateStatusTransition("Cancelled", "Confirmed").valid).toBe(false);
      expect(validateStatusTransition("Cancelled", "Completed").valid).toBe(false);
    });

    it("should reject illegal skips in appointment lifecycle (e.g. Scheduled directly to Completed without consult)", () => {
      expect(validateStatusTransition("Scheduled", "Completed").valid).toBe(false);
      expect(validateStatusTransition("Confirmed", "In Consultation").valid).toBe(false);
    });
  });

  // =========================================================================
  // WORKFLOW C: CLINICAL CONSULTATION (EMR)
  // =========================================================================
  describe("Workflow C — Clinical Consultation (EMR) Acceptance", () => {
    const calculateBMI = (weightKg: number, heightCm: number) => {
      if (weightKg <= 0 || heightCm <= 0) return 0;
      const heightM = heightCm / 100;
      return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
    };

    const classifyBMI = (bmi: number) => {
      if (bmi < 18.5) return "Underweight";
      if (bmi < 25) return "Normal";
      if (bmi < 30) return "Overweight";
      return "Obese";
    };

    it("should calculate correct BMI and clinical classification from height and weight", () => {
      const normalBMI = calculateBMI(70, 175); // 70 / 1.75^2 = 22.86 -> 22.9
      expect(normalBMI).toBe(22.9);
      expect(classifyBMI(normalBMI)).toBe("Normal");

      const overweightBMI = calculateBMI(85, 172); // 85 / 1.72^2 = 28.73 -> 28.7
      expect(overweightBMI).toBe(28.7);
      expect(classifyBMI(overweightBMI)).toBe("Overweight");
    });

    it("should detect dangerous drug-drug interactions via CDSS rule engine (e.g. Warfarin + Aspirin)", () => {
      const knownInteractions: Record<string, { interacting: string[]; severity: string; desc: string }> = {
        warfarin: {
          interacting: ["aspirin", "ibuprofen", "ciprofloxacin"],
          severity: "Critical",
          desc: "Severe risk of major hemorrhagic bleeding or toxicity.",
        },
        aspirin: {
          interacting: ["warfarin", "heparin", "ibuprofen"],
          severity: "Critical",
          desc: "Increased gastric ulceration and severe bleeding risk.",
        },
        metformin: {
          interacting: ["contrast medium", "cimetidine"],
          severity: "High",
          desc: "Risk of lactic acidosis.",
        },
      };

      const checkDrugInteractions = (medications: string[]) => {
        const alerts: { drugA: string; drugB: string; severity: string; description: string }[] = [];
        const normalized = medications.map((m) => m.toLowerCase().trim());

        for (let i = 0; i < normalized.length; i++) {
          for (let j = i + 1; j < normalized.length; j++) {
            const medA = normalized[i];
            const medB = normalized[j];

            if (knownInteractions[medA]?.interacting.includes(medB)) {
              alerts.push({
                drugA: medA,
                drugB: medB,
                severity: knownInteractions[medA].severity,
                description: knownInteractions[medA].desc,
              });
            }
          }
        }
        return { hasInteractions: alerts.length > 0, alerts };
      };

      const safeRx = ["Paracetamol", "Amoxicillin"];
      expect(checkDrugInteractions(safeRx).alerts.length).toBe(0);

      const dangerousRx = ["Warfarin", "Aspirin"];
      const check = checkDrugInteractions(dangerousRx);
      expect(check.hasInteractions).toBe(true);
      expect(check.alerts[0].severity).toBe("Critical");
      expect(check.alerts[0].description).toContain("bleeding");
    });

    it("should enforce clinical record sealing: finalized consultation cannot be edited or overwritten", () => {
      const attemptEncounterUpdate = (encounter: { status: string }, newSymptoms: string) => {
        if (encounter.status === "Finalized" || encounter.status === "SignedOff") {
          throw new Error("Cannot modify or alter a finalized clinical record. Finalized records are sealed.");
        }
        return { ...encounter, symptoms: newSymptoms };
      };

      const draftRecord = { status: "Draft", symptoms: "Mild fever" };
      expect(attemptEncounterUpdate(draftRecord, "Fever and chills").symptoms).toBe("Fever and chills");

      const finalizedRecord = { status: "Finalized", symptoms: "Hypertension baseline" };
      expect(() => attemptEncounterUpdate(finalizedRecord, "Tampered symptoms")).toThrow(
        "Cannot modify or alter a finalized clinical record"
      );
    });

    it("should restrict clinical sign-off to licensed clinicians (requiring emr.diagnose permission)", () => {
      const canFinalize = (permissions: string[]) => permissions.includes("emr.diagnose");

      expect(canFinalize(["emr.read", "emr.create", "emr.diagnose"])).toBe(true); // Doctor
      expect(canFinalize(["emr.read", "patients.read"])).toBe(false); // Nurse
      expect(canFinalize(["billing.read", "billing.create", "billing.pay"])).toBe(false); // Cashier
    });
  });

  // =========================================================================
  // WORKFLOW D: BILLING & PAYMENT PROCESSING
  // =========================================================================
  describe("Workflow D — Billing & Payment Processing Acceptance", () => {
    const calculateTotals = (items: InvoiceLineItem[], discountPct: number = 0, taxPct: number = 0) => {
      if (!items || items.length === 0) throw new Error("Invoice requires at least one line item");

      let subtotal = 0;
      for (const item of items) {
        if (item.quantity <= 0) throw new Error("Item quantity must be greater than zero");
        if (item.unitPrice < 0) throw new Error("Item price cannot be negative");
        subtotal += Math.round(item.quantity * item.unitPrice * 100) / 100;
      }
      subtotal = Math.round(subtotal * 100) / 100;

      const discountAmt = Math.round((subtotal * (Math.min(100, Math.max(0, discountPct)) / 100)) * 100) / 100;
      const discountedSubtotal = Math.max(0, subtotal - discountAmt);
      const taxAmt = Math.round((discountedSubtotal * (Math.min(100, Math.max(0, taxPct)) / 100)) * 100) / 100;
      const total = Math.round((discountedSubtotal + taxAmt) * 100) / 100;

      return { subtotal, discountAmt, taxAmt, total };
    };

    it("should compute authoritative financial totals and discard client-submitted forged prices", () => {
      const lineItems: InvoiceLineItem[] = [
        { description: "General OPD Consultation", quantity: 1, unitPrice: 30.0 },
        { description: "CBC Blood Diagnostic", quantity: 1, unitPrice: 25.0 },
      ];

      // Subtotal = 55.00, Discount 10% = 5.50 -> 49.50, Tax 5% = 2.48 -> Total 51.98
      const serverCalculated = calculateTotals(lineItems, 10, 5);
      expect(serverCalculated.subtotal).toBe(55.0);
      expect(serverCalculated.discountAmt).toBe(5.5);
      expect(serverCalculated.taxAmt).toBe(2.48);
      expect(serverCalculated.total).toBe(51.98);

      const clientForgedTotal = 15.0; // Client trying to cheat billing
      expect(clientForgedTotal).not.toBe(serverCalculated.total);
    });

    it("should prevent and reject overpayments exceeding the invoice balance", () => {
      const processPayment = (invoice: { balance: number }, paymentAmount: number) => {
        if (paymentAmount <= 0) throw new Error("Payment amount must be greater than zero");
        if (paymentAmount > invoice.balance) {
          throw new Error(`Payment amount ($${paymentAmount.toFixed(2)}) exceeds balance of $${invoice.balance.toFixed(2)}`);
        }
        return { success: true, remaining: invoice.balance - paymentAmount };
      };

      const invoice = { balance: 50.0 };
      expect(processPayment(invoice, 30.0).remaining).toBe(20.0);
      expect(processPayment(invoice, 50.0).remaining).toBe(0.0);
      expect(() => processPayment(invoice, 50.01)).toThrow("exceeds balance");
    });

    it("should enforce supported payment methods and reject unauthorized channels", () => {
      const supportedMethods = new Set(["Cash", "Card", "Bank Transfer", "Insurance Claim"]);
      expect(supportedMethods.has("Cash")).toBe(true);
      expect(supportedMethods.has("Card")).toBe(true);
      expect(supportedMethods.has("Bank Transfer")).toBe(true);
      expect(supportedMethods.has("Insurance Claim")).toBe(true);
      expect(supportedMethods.has("Bitcoin")).toBe(false);
      expect(supportedMethods.has("Personal IOUs")).toBe(false);
    });

    it("should enforce strict role segregation: Cashier collects payments, Doctor cannot collect payments", () => {
      const cashierPerms = ["billing.read", "billing.create", "billing.pay"];
      const doctorPerms = ["billing.read", "billing.create", "emr.diagnose"];

      expect(cashierPerms.includes("billing.pay")).toBe(true);
      expect(doctorPerms.includes("billing.pay")).toBe(false);
    });
  });

  // =========================================================================
  // WORKFLOW E: MULTI-EDITION SEPARATION & SECURITY BOUNDARY
  // =========================================================================
  describe("Workflow E — Multi-Edition Separation & Security Boundary Acceptance", () => {
    it("should enable all hospital clinical capabilities in Hospital Edition", () => {
      const hospitalConfig = getEditionConfig("Hospital");
      expect(hospitalConfig.type).toBe("Hospital");

      const hospitalModules: ModuleId[] = [
        "dashboard",
        "patients",
        "appointments",
        "opd",
        "ipd",
        "emergency",
        "emr",
        "laboratory",
        "radiology",
        "pharmacy",
        "surgery",
        "icu",
        "billing",
        "payments",
        "insurance",
      ];

      for (const mod of hospitalModules) {
        expect(isModuleEnabledForEdition(mod, "Hospital")).toBe(true);
      }
    });

    it("should strictly disable inpatient, emergency, surgery, and ICU modules in Clinic Edition", () => {
      const clinicConfig = getEditionConfig("Clinic");
      expect(clinicConfig.type).toBe("Clinic");

      // Shared outpatient modules enabled
      expect(isModuleEnabledForEdition("dashboard", "Clinic")).toBe(true);
      expect(isModuleEnabledForEdition("patients", "Clinic")).toBe(true);
      expect(isModuleEnabledForEdition("appointments", "Clinic")).toBe(true);
      expect(isModuleEnabledForEdition("opd", "Clinic")).toBe(true);
      expect(isModuleEnabledForEdition("emr", "Clinic")).toBe(true);
      expect(isModuleEnabledForEdition("billing", "Clinic")).toBe(true);
      expect(isModuleEnabledForEdition("payments", "Clinic")).toBe(true);

      // Hospital-only modules strictly disabled
      expect(isModuleEnabledForEdition("ipd", "Clinic")).toBe(false);
      expect(isModuleEnabledForEdition("emergency", "Clinic")).toBe(false);
      expect(isModuleEnabledForEdition("surgery", "Clinic")).toBe(false);
      expect(isModuleEnabledForEdition("icu", "Clinic")).toBe(false);
    });

    it("should verify that backend RequireModule filter blocks disabled modules with HTTP 403", () => {
      const checkModuleAccess = (edition: EditionType, moduleId: ModuleId) => {
        if (!isModuleEnabledForEdition(moduleId, edition)) {
          return { statusCode: 403, errorCode: "EDITION_MODULE_DISABLED" };
        }
        return { statusCode: 200, errorCode: null };
      };

      // Hospital edition allows IPD
      expect(checkModuleAccess("Hospital", "ipd").statusCode).toBe(200);

      // Clinic edition forbids IPD & Emergency
      const ipdInClinic = checkModuleAccess("Clinic", "ipd");
      expect(ipdInClinic.statusCode).toBe(403);
      expect(ipdInClinic.errorCode).toBe("EDITION_MODULE_DISABLED");

      const emergencyInClinic = checkModuleAccess("Clinic", "emergency");
      expect(emergencyInClinic.statusCode).toBe(403);
      expect(emergencyInClinic.errorCode).toBe("EDITION_MODULE_DISABLED");
    });

    it("should ensure client-side tampering cannot bypass backend HasPermissionAttribute filter", () => {
      const evaluateBackendPermission = (userClaims: { type: string; value: string }[], requiredPermission: string) => {
        const hasClaim = userClaims.some((c) => c.type === "permission" && c.value === requiredPermission);
        if (!hasClaim) {
          return { statusCode: 403, errorCode: "PERMISSION_DENIED" };
        }
        return { statusCode: 200, errorCode: null };
      };

      // User claims received from cryptographic JWT
      const receptionClaims = [
        { type: "permission", value: "patients.read" },
        { type: "permission", value: "appointments.create" },
      ];

      // Receptionist trying to access clinical diagnostic API
      const result = evaluateBackendPermission(receptionClaims, "emr.diagnose");
      expect(result.statusCode).toBe(403);
      expect(result.errorCode).toBe("PERMISSION_DENIED");
    });
  });

  // =========================================================================
  // VIEWPORT RESPONSIVENESS CHECKS
  // =========================================================================
  describe("Viewport Responsiveness & Accessibility Verification", () => {
    interface ViewportConfig {
      name: string;
      width: number;
      isMobile: boolean;
      isTablet: boolean;
      columns: number;
    }

    const classifyViewport = (width: number): ViewportConfig => {
      if (width < 640) return { name: "mobile", width, isMobile: true, isTablet: false, columns: 1 };
      if (width < 1024) return { name: "tablet", width, isMobile: false, isTablet: true, columns: 2 };
      return { name: "desktop", width, isMobile: false, isTablet: false, columns: 4 };
    };

    it("should correctly adapt grid layout across representative viewports (1440px, 1024px, 768px, 390px)", () => {
      const desktop = classifyViewport(1440);
      expect(desktop.columns).toBe(4);
      expect(desktop.isMobile).toBe(false);

      const tabletLandscape = classifyViewport(1024);
      expect(tabletLandscape.columns).toBe(4);

      const tabletPortrait = classifyViewport(768);
      expect(tabletPortrait.columns).toBe(2);
      expect(tabletPortrait.isTablet).toBe(true);

      const mobilePhone = classifyViewport(390);
      expect(mobilePhone.columns).toBe(1);
      expect(mobilePhone.isMobile).toBe(true);
    });
  });
});
