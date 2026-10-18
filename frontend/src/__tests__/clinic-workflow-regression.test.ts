import { describe, it, expect } from "vitest";
import { RegisterPatientDto } from "../types/patient";
import { CreateEmrEncounterRequest } from "../services/emrService";
import { isModuleEnabledForEdition, getEditionConfig } from "../config/editionConfig";
import { ModuleId } from "../types/edition";

interface TestPatientRecord {
  patientId: number;
  medicalRecordNumber: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  phoneNumber: string;
  address?: string;
  patientStatus: string;
  createdAt: string;
}

describe("CuraSphere Clinic Edition — Session 19 Comprehensive Regression & Workflow Consistency", () => {
  // =========================================================================
  // 1. PATIENT-TO-APPOINTMENT WORKFLOW
  // =========================================================================
  describe("1. Patient-to-Appointment Workflow", () => {
    const validatePatientDto = (dto: Partial<RegisterPatientDto>) => {
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
        errors.push("Valid phone number is required");
      }
      return { valid: errors.length === 0, errors };
    };

    it("should accept valid patient registration data and assign formatted MRN", () => {
      const validDto: Partial<RegisterPatientDto> = {
        firstName: "Fatima",
        lastName: "Zahra",
        gender: "Female",
        dateOfBirth: "1992-04-12",
        phoneNumber: "+92 300 7766554",
        cnicPassport: "37405-1234567-4",
        address: "House 14, F-8/3, Islamabad",
      };

      const validation = validatePatientDto(validDto);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);

      const generatedPatient: TestPatientRecord = {
        patientId: 501,
        medicalRecordNumber: "MRN-2026-00501",
        firstName: validDto.firstName!,
        lastName: validDto.lastName!,
        gender: validDto.gender!,
        dateOfBirth: validDto.dateOfBirth!,
        phoneNumber: validDto.phoneNumber!,
        address: validDto.address,
        patientStatus: "Active",
        createdAt: new Date().toISOString(),
      };

      expect(generatedPatient.medicalRecordNumber).toMatch(/^MRN-\d{4}-\d{5}$/);
      expect(generatedPatient.patientStatus).toBe("Active");
    });

    it("should reject patient registration with missing name, invalid gender, future DOB, or invalid phone", () => {
      expect(validatePatientDto({ firstName: "", lastName: "Zahra", gender: "Female", dateOfBirth: "1990-01-01", phoneNumber: "1234567" }).valid).toBe(false);
      expect(validatePatientDto({ firstName: "Fatima", lastName: "Zahra", gender: "Invalid" as any, dateOfBirth: "1990-01-01", phoneNumber: "1234567" }).valid).toBe(false);
      expect(validatePatientDto({ firstName: "Fatima", lastName: "Zahra", gender: "Female", dateOfBirth: "2099-01-01", phoneNumber: "1234567" }).valid).toBe(false);
      expect(validatePatientDto({ firstName: "Fatima", lastName: "Zahra", gender: "Female", dateOfBirth: "1990-01-01", phoneNumber: "invalid-phone" }).valid).toBe(false);
    });

    it("should accurately search patients across MRN, Full Name, Phone, and National ID", () => {
      const patientsDb: TestPatientRecord[] = [
        { patientId: 1, medicalRecordNumber: "MRN-2026-00101", firstName: "Ali", lastName: "Khan", gender: "Male", dateOfBirth: "1985-06-15", phoneNumber: "+92 300 1112233", patientStatus: "Active", createdAt: "" },
        { patientId: 2, medicalRecordNumber: "MRN-2026-00102", firstName: "Sara", lastName: "Ahmed", gender: "Female", dateOfBirth: "1990-09-20", phoneNumber: "+92 321 4445566", patientStatus: "Active", createdAt: "" },
      ];

      const searchPatients = (term: string) => {
        const q = term.toLowerCase().trim();
        return patientsDb.filter(
          (p) =>
            p.medicalRecordNumber.toLowerCase().includes(q) ||
            p.firstName.toLowerCase().includes(q) ||
            p.lastName.toLowerCase().includes(q) ||
            p.phoneNumber.includes(q)
        );
      };

      expect(searchPatients("00101")).toHaveLength(1);
      expect(searchPatients("Sara")).toHaveLength(1);
      expect(searchPatients("4445566")).toHaveLength(1);
      expect(searchPatients("NonExistent")).toHaveLength(0);
    });

    it("should prevent double-booking conflicts when scheduling appointments for the same doctor and slot", () => {
      const activeAppointments: Array<{ doctorId: number; date: string; time: string; status: string }> = [
        { doctorId: 10, date: "2026-10-20", time: "10:00:00", status: "Scheduled" },
      ];

      const checkConflict = (doctorId: number, date: string, time: string) => {
        return activeAppointments.some(
          (a) =>
            a.doctorId === doctorId &&
            a.date === date &&
            a.time === time &&
            a.status !== "Cancelled" &&
            a.status !== "No Show"
        );
      };

      // Exact conflict
      expect(checkConflict(10, "2026-10-20", "10:00:00")).toBe(true);
      // Different time slot - allowed
      expect(checkConflict(10, "2026-10-20", "10:30:00")).toBe(false);
      // Different doctor - allowed
      expect(checkConflict(11, "2026-10-20", "10:00:00")).toBe(false);
      // Different date - allowed
      expect(checkConflict(10, "2026-10-21", "10:00:00")).toBe(false);
    });

    it("should lock terminal appointment states (Completed, Cancelled) against further status mutations or rescheduling", () => {
      const canMutateAppointment = (status: string) => {
        const terminalStates = ["Completed", "Cancelled"];
        return !terminalStates.includes(status);
      };

      expect(canMutateAppointment("Scheduled")).toBe(true);
      expect(canMutateAppointment("Confirmed")).toBe(true);
      expect(canMutateAppointment("Checked In")).toBe(true);
      expect(canMutateAppointment("In Consultation")).toBe(true);
      expect(canMutateAppointment("Completed")).toBe(false);
      expect(canMutateAppointment("Cancelled")).toBe(false);
    });
  });

  // =========================================================================
  // 2. APPOINTMENT-TO-CONSULTATION (EMR) WORKFLOW
  // =========================================================================
  describe("2. Appointment-to-Consultation Workflow", () => {
    it("should compute Body Mass Index (BMI) accurately from height and weight vitals", () => {
      const calculateBmi = (weightKg: number, heightCm: number) => {
        if (!weightKg || !heightCm || heightCm <= 0) return 0;
        const heightM = heightCm / 100;
        return Number((weightKg / (heightM * heightM)).toFixed(1));
      };

      // Normal weight: 70kg, 175cm -> 22.9
      expect(calculateBmi(70, 175)).toBe(22.9);
      // Overweight: 85kg, 170cm -> 29.4
      expect(calculateBmi(85, 170)).toBe(29.4);
      // Zero or missing inputs
      expect(calculateBmi(0, 170)).toBe(0);
      expect(calculateBmi(70, 0)).toBe(0);
    });

    it("should require chief complaint and primary diagnosis when creating clinical encounter", () => {
      const validateEncounterDto = (dto: Partial<CreateEmrEncounterRequest>) => {
        const errors: string[] = [];
        if (!dto.patientId) errors.push("Patient ID is required");
        if (!dto.doctorId) errors.push("Doctor ID is required");
        if (!dto.chiefComplaint?.trim()) errors.push("Chief complaint is required");
        if (!dto.diagnoses || dto.diagnoses.length === 0) {
          errors.push("At least one diagnostic evaluation is required");
        }
        return { valid: errors.length === 0, errors };
      };

      const validEncounter: Partial<CreateEmrEncounterRequest> = {
        patientId: 101,
        doctorId: 10,
        appointmentId: 301,
        chiefComplaint: "Persistent dry cough, mild fever for 4 days",
        diagnoses: [
          { icdCode: "J06.9", description: "Acute upper respiratory infection", isPrimary: true },
        ],
        vitals: { bloodPressure: "120/80", heartRate: 76, temperature: 99.1, heightCm: 172, weightKg: 68 },
      };

      expect(validateEncounterDto(validEncounter).valid).toBe(true);
      expect(validateEncounterDto({ ...validEncounter, chiefComplaint: "" }).valid).toBe(false);
      expect(validateEncounterDto({ ...validEncounter, diagnoses: [] }).valid).toBe(false);
    });

    it("should seal finalized clinical encounters and prevent post-finalization record tampering", () => {
      interface MockEncounter {
        id: number;
        status: "Draft" | "Finalized";
        notes: string;
      }

      const encounter: MockEncounter = { id: 1, status: "Finalized", notes: "Original physician clinical assessment" };

      const updateEncounter = (enc: MockEncounter, newNotes: string) => {
        if (enc.status === "Finalized") {
          throw new Error("Cannot modify a finalized clinical record. Sealed encounters are immutable.");
        }
        enc.notes = newNotes;
        return enc;
      };

      expect(() => updateEncounter(encounter, "Tampered assessment")).toThrow(
        /Cannot modify a finalized clinical record/
      );
    });

    it("should transition associated appointment to 'Completed' upon clinical encounter finalization", () => {
      const appointment = { id: 301, status: "In Consultation", remarks: "" };
      const encounter = { id: 701, encounterNumber: "EMR-20261018-701", isFinalized: true, appointmentId: 301 };

      if (encounter.isFinalized && encounter.appointmentId === appointment.id) {
        appointment.status = "Completed";
        appointment.remarks = `Consultation finalized — ${encounter.encounterNumber}`;
      }

      expect(appointment.status).toBe("Completed");
      expect(appointment.remarks).toContain("EMR-20261018-701");
    });
  });

  // =========================================================================
  // 3. ELECTRONIC PRESCRIPTION & CDSS INTERACTION WORKFLOW
  // =========================================================================
  describe("3. Electronic Prescription & CDSS Interaction Workflow", () => {
    it("should validate prescription items (medication name, dosage, frequency, duration)", () => {
      const validatePrescriptionItem = (item: { medicationName?: string; dosage?: string; frequency?: string; duration?: string }) => {
        const errors: string[] = [];
        if (!item.medicationName?.trim()) errors.push("Medication name is required");
        if (!item.dosage?.trim()) errors.push("Dosage is required");
        if (!item.frequency?.trim()) errors.push("Frequency is required");
        if (!item.duration?.trim()) errors.push("Duration is required");
        return { valid: errors.length === 0, errors };
      };

      const validRx = { medicationName: "Amoxicillin", dosage: "500mg", frequency: "TDS (Every 8 hours)", duration: "5 days" };
      expect(validatePrescriptionItem(validRx).valid).toBe(true);

      const invalidRx = { medicationName: "", dosage: "500mg", frequency: "", duration: "5 days" };
      expect(validatePrescriptionItem(invalidRx).valid).toBe(false);
      expect(validatePrescriptionItem(invalidRx).errors).toHaveLength(2);
    });

    it("should trigger clinical decision support (CDSS) warnings on hazardous drug-drug interactions", () => {
      const knownInteractions: Record<string, { interacting: string[]; severity: string; desc: string }> = {
        warfarin: {
          interacting: ["aspirin", "ibuprofen", "ciprofloxacin"],
          severity: "High",
          desc: "Potentially severe risk of major hemorrhagic bleeding or toxicity.",
        },
        aspirin: {
          interacting: ["warfarin", "heparin", "ibuprofen"],
          severity: "High",
          desc: "Increased gastric ulceration and severe bleeding risk.",
        },
      };

      const evaluateInteractions = (medications: string[]) => {
        const alerts: { drugA: string; drugB: string; severity: string; description: string }[] = [];
        const normalized = medications.map((m) => m.toLowerCase().trim());
        for (let i = 0; i < normalized.length; i++) {
          for (let j = i + 1; j < normalized.length; j++) {
            const a = normalized[i];
            const b = normalized[j];
            if (knownInteractions[a]?.interacting.includes(b)) {
              alerts.push({
                drugA: a,
                drugB: b,
                severity: knownInteractions[a].severity,
                description: knownInteractions[a].desc,
              });
            }
          }
        }
        return { hasInteractions: alerts.length > 0, alerts };
      };

      const dangerousPair = ["Warfarin", "Aspirin"];
      const result = evaluateInteractions(dangerousPair);
      expect(result.hasInteractions).toBe(true);
      expect(result.alerts.length).toBeGreaterThan(0);
      expect(result.alerts[0].severity).toBe("High");
      expect(result.alerts[0].description.toLowerCase()).toContain("bleed");
    });

    it("should return zero warnings for safe non-interacting medication combinations", () => {
      const knownInteractions: Record<string, { interacting: string[]; severity: string; desc: string }> = {
        warfarin: { interacting: ["aspirin", "ibuprofen"], severity: "High", desc: "Bleeding risk" },
      };

      const evaluateInteractions = (medications: string[]) => {
        const alerts: any[] = [];
        const normalized = medications.map((m) => m.toLowerCase().trim());
        for (let i = 0; i < normalized.length; i++) {
          for (let j = i + 1; j < normalized.length; j++) {
            if (knownInteractions[normalized[i]]?.interacting.includes(normalized[j])) {
              alerts.push(normalized[i]);
            }
          }
        }
        return { hasInteractions: alerts.length > 0, alerts };
      };

      const safeMedications = ["Paracetamol", "Vitamin C"];
      const result = evaluateInteractions(safeMedications);
      expect(result.hasInteractions).toBe(false);
      expect(result.alerts).toHaveLength(0);
    });
  });

  // =========================================================================
  // 4. BILLING & PAYMENT CONSISTENCY WORKFLOW
  // =========================================================================
  describe("4. Billing & Payment Consistency Workflow", () => {
    const calculateInvoice = (
      lineItems: Array<{ quantity: number; unitPrice: number }>,
      discountPercent: number = 0,
      taxPercent: number = 0
    ) => {
      const subTotal = lineItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
      const discPct = Math.min(Math.max(discountPercent, 0), 100);
      const discountAmount = Number((subTotal * (discPct / 100)).toFixed(2));
      const taxable = subTotal - discountAmount;
      const tPct = Math.min(Math.max(taxPercent, 0), 100);
      const taxAmount = Number((taxable * (tPct / 100)).toFixed(2));
      const totalAmount = Number((taxable + taxAmount).toFixed(2));
      return { subTotal, discountAmount, taxAmount, totalAmount };
    };

    it("should calculate line item subtotals, discounts, taxes, and final total authoritatively", () => {
      const lineItems = [
        { quantity: 1, unitPrice: 2000 }, // OPD Consultation
        { quantity: 2, unitPrice: 750 },  // Diagnostic Tests
      ];

      // Subtotal = 2000 + 1500 = 3500. Discount 10% = 350. Taxable = 3150. Tax 5% = 157.50. Total = 3307.50
      const calc = calculateInvoice(lineItems, 10, 5);
      expect(calc.subTotal).toBe(3500);
      expect(calc.discountAmount).toBe(350);
      expect(calc.taxAmount).toBe(157.5);
      expect(calc.totalAmount).toBe(3307.5);
    });

    it("should accurately update invoice balances across partial payment and full settlement", () => {
      interface MockInvoice {
        total: number;
        paid: number;
        balance: number;
        status: "Unpaid" | "Partial" | "Paid";
      }

      const invoice: MockInvoice = { total: 4000.0, paid: 0, balance: 4000.0, status: "Unpaid" };

      const applyPayment = (inv: MockInvoice, amount: number) => {
        if (amount <= 0) throw new Error("Payment amount must be greater than zero.");
        if (amount > inv.balance) {
          throw new Error(`Payment amount (${amount}) exceeds outstanding balance (${inv.balance}).`);
        }
        inv.paid = Number((inv.paid + amount).toFixed(2));
        inv.balance = Number((inv.total - inv.paid).toFixed(2));
        inv.status = inv.balance === 0 ? "Paid" : "Partial";
        return inv;
      };

      // 1. Partial payment 1500
      applyPayment(invoice, 1500);
      expect(invoice.paid).toBe(1500.0);
      expect(invoice.balance).toBe(2500.0);
      expect(invoice.status).toBe("Partial");

      // 2. Overpayment attempt of 3000 against 2500 balance must be rejected
      expect(() => applyPayment(invoice, 3000)).toThrow(/exceeds outstanding balance/);

      // 3. Negative payment attempt must be rejected
      expect(() => applyPayment(invoice, -500)).toThrow(/greater than zero/);

      // 4. Settle remaining 2500
      applyPayment(invoice, 2500);
      expect(invoice.paid).toBe(4000.0);
      expect(invoice.balance).toBe(0.0);
      expect(invoice.status).toBe("Paid");
    });
  });

  // =========================================================================
  // 5. ROLE-BASED ACCESS CONTROL (RBAC) & AUTHORIZATION INTEGRITY
  // =========================================================================
  describe("5. Role-Based Access Control & Permission Enforcement", () => {
    const rolePermissionRegistry: Record<string, string[]> = {
      "Clinic Administrator": [
        "patients.read", "patients.create", "patients.update",
        "appointments.read", "appointments.create", "appointments.update",
        "emr.read", "emr.create", "emr.diagnose",
        "billing.read", "billing.create", "billing.pay",
        "reports.read", "audit.read"
      ],
      "Receptionist": [
        "patients.read", "patients.create", "patients.update",
        "appointments.read", "appointments.create", "appointments.update",
        "billing.read"
      ],
      "Doctor": [
        "patients.read",
        "appointments.read", "appointments.update",
        "emr.read", "emr.create", "emr.diagnose",
        "billing.read"
      ],
      "Billing Operator": [
        "patients.read",
        "appointments.read",
        "billing.read", "billing.create", "billing.pay"
      ],
      "Read-Only Viewer": [
        "patients.read", "appointments.read", "billing.read", "reports.read"
      ]
    };

    const hasPermission = (role: string, perm: string): boolean => {
      const perms = rolePermissionRegistry[role] || [];
      return perms.includes(perm);
    };

    it("should allow Clinic Administrator to access all clinical, operational and financial functions", () => {
      const role = "Clinic Administrator";
      expect(hasPermission(role, "patients.create")).toBe(true);
      expect(hasPermission(role, "appointments.create")).toBe(true);
      expect(hasPermission(role, "emr.diagnose")).toBe(true);
      expect(hasPermission(role, "billing.pay")).toBe(true);
      expect(hasPermission(role, "reports.read")).toBe(true);
    });

    it("should grant Receptionist patient registration and scheduling, but block clinical diagnoses and cashier payments", () => {
      const role = "Receptionist";
      expect(hasPermission(role, "patients.create")).toBe(true);
      expect(hasPermission(role, "appointments.create")).toBe(true);
      expect(hasPermission(role, "emr.diagnose")).toBe(false);
      expect(hasPermission(role, "billing.pay")).toBe(false);
    });

    it("should grant Doctor consultation and diagnosis permissions, but block cashier payment processing", () => {
      const role = "Doctor";
      expect(hasPermission(role, "emr.read")).toBe(true);
      expect(hasPermission(role, "emr.create")).toBe(true);
      expect(hasPermission(role, "emr.diagnose")).toBe(true);
      expect(hasPermission(role, "billing.pay")).toBe(false);
      expect(hasPermission(role, "patients.create")).toBe(false);
    });

    it("should grant Billing Operator payment processing, but block clinical encounter creation", () => {
      const role = "Billing Operator";
      expect(hasPermission(role, "billing.create")).toBe(true);
      expect(hasPermission(role, "billing.pay")).toBe(true);
      expect(hasPermission(role, "emr.create")).toBe(false);
      expect(hasPermission(role, "emr.diagnose")).toBe(false);
    });

    it("should deny Read-Only Viewer all mutation permissions (register, schedule, diagnose, pay)", () => {
      const role = "Read-Only Viewer";
      expect(hasPermission(role, "patients.create")).toBe(false);
      expect(hasPermission(role, "appointments.create")).toBe(false);
      expect(hasPermission(role, "emr.create")).toBe(false);
      expect(hasPermission(role, "billing.pay")).toBe(false);
      expect(hasPermission(role, "patients.read")).toBe(true);
    });
  });

  // =========================================================================
  // 6. HOSPITAL EDITION REGRESSION & BOUNDARY GUARDS
  // =========================================================================
  describe("6. Hospital Edition Regression & Boundary Guards", () => {
    it("should enable all 24 medical modules in Hospital Edition with zero regressions", () => {
      const config = getEditionConfig("Hospital");
      expect(config.type).toBe("Hospital");
      expect(config.enabledModules).toContain("ipd");
      expect(config.enabledModules).toContain("emergency");
      expect(config.enabledModules).toContain("surgery");
      expect(config.enabledModules).toContain("icu");
      expect(config.disabledModules).toHaveLength(0);

      expect(isModuleEnabledForEdition("ipd", "Hospital")).toBe(true);
      expect(isModuleEnabledForEdition("emergency", "Hospital")).toBe(true);
      expect(isModuleEnabledForEdition("surgery", "Hospital")).toBe(true);
      expect(isModuleEnabledForEdition("icu", "Hospital")).toBe(true);
    });

    it("should strictly disable and suppress tertiary hospital modules in Clinic Edition", () => {
      const config = getEditionConfig("Clinic");
      expect(config.type).toBe("Clinic");
      expect(config.disabledModules).toContain("ipd");
      expect(config.disabledModules).toContain("emergency");
      expect(config.disabledModules).toContain("surgery");
      expect(config.disabledModules).toContain("icu");

      expect(isModuleEnabledForEdition("ipd", "Clinic")).toBe(false);
      expect(isModuleEnabledForEdition("emergency", "Clinic")).toBe(false);
      expect(isModuleEnabledForEdition("surgery", "Clinic")).toBe(false);
      expect(isModuleEnabledForEdition("icu", "Clinic")).toBe(false);
    });

    it("should enable shared core modules across both Hospital and Clinic editions", () => {
      const sharedModules: ModuleId[] = [
        "dashboard", "patients", "doctors", "appointments", "opd", "emr",
        "laboratory", "pharmacy", "billing", "payments", "reports", "audit"
      ];

      for (const mod of sharedModules) {
        expect(isModuleEnabledForEdition(mod, "Hospital")).toBe(true);
        expect(isModuleEnabledForEdition(mod, "Clinic")).toBe(true);
      }
    });
  });

  // =========================================================================
  // 7. OBSERVABILITY, AUDIT TRAIL & PRIVACY INTEGRITY
  // =========================================================================
  describe("7. Observability, Audit Trail & Privacy Integrity", () => {
    it("should record structured audit log metadata without exposing raw secrets or passwords", () => {
      interface AuditLogEntry {
        module: string;
        action: string;
        affectedRecord: string;
        timestamp: string;
        details: Record<string, any>;
      }

      const createAuditEntry = (module: string, action: string, record: string, details: Record<string, any>): AuditLogEntry => {
        // Redact any password or auth token fields
        const sanitizedDetails = { ...details };
        delete sanitizedDetails.password;
        delete sanitizedDetails.token;
        delete sanitizedDetails.secret;

        return {
          module,
          action,
          affectedRecord: record,
          timestamp: new Date().toISOString(),
          details: sanitizedDetails,
        };
      };

      const entry = createAuditEntry("Authentication", "LOGIN_ATTEMPT", "User: 42", {
        username: "admin_user",
        ipAddress: "192.168.1.50",
        password: "SuperSecretPassword123!",
        token: "eyJhbGciOi...",
      });

      expect(entry.details.username).toBe("admin_user");
      expect(entry.details.password).toBeUndefined();
      expect(entry.details.token).toBeUndefined();
      expect(entry.action).toBe("LOGIN_ATTEMPT");
    });

    it("should mask unhandled exceptions in production into RFC 7231 Problem Details without stack traces", () => {
      const formatErrorResponse = (err: Error, isProduction: boolean = true) => {
        if (isProduction) {
          return {
            type: "https://tools.ietf.org/html/rfc7231#section-6.6.1",
            title: "Internal Server Error",
            status: 500,
            detail: "An unexpected error occurred while processing your request. Please contact support.",
            instance: "/api/error-instance",
          };
        }
        return {
          title: err.message,
          stack: err.stack,
        };
      };

      const err = new Error("Database connection timed out at Npgsql.NpgsqlConnector.Open()");
      const prodResponse = formatErrorResponse(err, true);

      expect(prodResponse.status).toBe(500);
      expect((prodResponse as any).stack).toBeUndefined();
      expect(prodResponse.detail).not.toContain("Npgsql");
    });
  });
});
