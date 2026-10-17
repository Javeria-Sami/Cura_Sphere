import { describe, it, expect } from "vitest";
import {
  CreateEmrEncounterRequest,
  EmrEncounter,
  DiagnosisItem,
} from "../services/emrService";

describe("Doctor Consultation & Clinical Records (Session 7)", () => {
  describe("Consultation Records Validation & Life-Cycle", () => {
    it("should validate that mandatory fields (patientId, doctorId, chiefComplaint) are present", () => {
      const validateConsultation = (data: Partial<CreateEmrEncounterRequest>) => {
        if (!data.patientId || data.patientId <= 0) {
          return { valid: false, error: "Missing or invalid patient reference" };
        }
        if (!data.doctorId || data.doctorId <= 0) {
          return { valid: false, error: "Missing or invalid doctor reference" };
        }
        if (!data.chiefComplaint?.trim()) {
          return { valid: false, error: "Chief complaint / presenting symptoms are required" };
        }
        return { valid: true, error: null };
      };

      const validRequest: CreateEmrEncounterRequest = {
        patientId: 101,
        doctorId: 5,
        appointmentId: 42,
        encounterType: "OPD",
        chiefComplaint: "Occipital headache and elevated blood pressure for 3 days",
        vitals: {
          bloodPressure: "145/95",
          heartRate: 80,
          temperature: 98.6,
          spO2: 98,
          weightKg: 75,
          heightCm: 175,
        },
        diagnoses: [
          { icdCode: "I10", description: "Essential (primary) hypertension", isPrimary: true },
        ],
        prescriptions: [
          {
            medicationName: "Amlodipine",
            dosage: "5mg",
            route: "Oral",
            frequency: "OD",
            duration: "30 days",
            quantity: 30,
            instructions: "Take once daily in morning",
          },
        ],
        isFinalized: false,
      };

      expect(validateConsultation(validRequest).valid).toBe(true);

      // Missing patient ID
      expect(validateConsultation({ ...validRequest, patientId: 0 }).valid).toBe(false);
      expect(validateConsultation({ ...validRequest, patientId: 0 }).error).toBe("Missing or invalid patient reference");

      // Missing doctor ID
      expect(validateConsultation({ ...validRequest, doctorId: 0 }).valid).toBe(false);
      expect(validateConsultation({ ...validRequest, doctorId: 0 }).error).toBe("Missing or invalid doctor reference");

      // Empty chief complaint
      expect(validateConsultation({ ...validRequest, chiefComplaint: "   " }).valid).toBe(false);
      expect(validateConsultation({ ...validRequest, chiefComplaint: "   " }).error).toBe("Chief complaint / presenting symptoms are required");
    });

    it("should calculate correct BMI and classify vitals appropriately", () => {
      const calculateBmi = (weightKg?: number, heightCm?: number): { bmi: number | null; category: string } => {
        if (!weightKg || !heightCm || weightKg <= 0 || heightCm <= 0) {
          return { bmi: null, category: "Unknown" };
        }
        const heightM = heightCm / 100;
        const bmi = parseFloat((weightKg / (heightM * heightM)).toFixed(1));
        let category = "Normal";
        if (bmi < 18.5) category = "Underweight";
        else if (bmi >= 25 && bmi < 30) category = "Overweight";
        else if (bmi >= 30) category = "Obese";
        return { bmi, category };
      };

      const normal = calculateBmi(70, 175);
      expect(normal.bmi).toBe(22.9);
      expect(normal.category).toBe("Normal");

      const overweight = calculateBmi(85, 175);
      expect(overweight.bmi).toBe(27.8);
      expect(overweight.category).toBe("Overweight");

      const obese = calculateBmi(105, 175);
      expect(obese.bmi).toBe(34.3);
      expect(obese.category).toBe("Obese");

      const invalid = calculateBmi(0, 175);
      expect(invalid.bmi).toBe(null);
    });

    it("should differentiate draft vs finalized encounters and guard finalized records against modification", () => {
      const recordStore: Record<number, EmrEncounter> = {
        1: {
          encounterId: 1,
          encounterNumber: "EMR-20261017-1001",
          patientId: 101,
          patientName: "Muhammad Ali",
          medicalRecordNumber: "MRN-00101",
          doctorId: 5,
          doctorName: "Dr. Sarah Jenkins",
          specialization: "Cardiology",
          encounterDate: "2026-10-17T09:30:00Z",
          encounterType: "OPD",
          chiefComplaint: "Follow-up BP review",
          status: "Draft",
          diagnoses: [{ icdCode: "I10", description: "Essential hypertension", isPrimary: true }],
          prescriptions: [],
          createdAt: "2026-10-17T09:30:00Z",
        },
        2: {
          encounterId: 2,
          encounterNumber: "EMR-20261017-1002",
          patientId: 102,
          patientName: "Ayesha Khan",
          medicalRecordNumber: "MRN-00102",
          doctorId: 5,
          doctorName: "Dr. Sarah Jenkins",
          specialization: "Cardiology",
          encounterDate: "2026-10-17T10:00:00Z",
          encounterType: "OPD",
          chiefComplaint: "Routine checkup",
          status: "Finalized",
          diagnoses: [{ icdCode: "Z00.00", description: "General adult medical examination", isPrimary: true }],
          prescriptions: [],
          createdAt: "2026-10-17T10:00:00Z",
        },
      };

      const updateEncounter = (id: number, updates: Partial<CreateEmrEncounterRequest>) => {
        const existing = recordStore[id];
        if (!existing) throw new Error("Encounter not found");
        if (existing.status === "Finalized" || existing.status === "SignedOff") {
          throw new Error("Cannot modify or overwrite a finalized clinical record");
        }
        existing.chiefComplaint = updates.chiefComplaint || existing.chiefComplaint;
        if (updates.isFinalized) existing.status = "Finalized";
        return existing;
      };

      // Updating a Draft encounter succeeds
      const updatedDraft = updateEncounter(1, { chiefComplaint: "Updated draft headache notes" });
      expect(updatedDraft.chiefComplaint).toBe("Updated draft headache notes");
      expect(updatedDraft.status).toBe("Draft");

      // Finalizing the draft record
      const finalized = updateEncounter(1, { isFinalized: true });
      expect(finalized.status).toBe("Finalized");

      // Attempting to modify an already finalized encounter throws error
      expect(() => updateEncounter(2, { chiefComplaint: "Tampered diagnosis notes" })).toThrow(
        "Cannot modify or overwrite a finalized clinical record"
      );
    });

    it("should automatically transition linked appointment to Completed when consultation is finalized", () => {
      interface AppointmentState {
        appointmentId: number;
        status: string;
        remarks?: string;
      }

      const appointments: Record<number, AppointmentState> = {
        55: { appointmentId: 55, status: "In Consultation" },
        56: { appointmentId: 56, status: "Cancelled" },
      };

      const completeAppointmentOnEncounterFinalize = (
        appointmentId: number,
        encounterNumber: string
      ): AppointmentState => {
        const apt = appointments[appointmentId];
        if (!apt) throw new Error("Appointment not found");
        if (apt.status !== "Cancelled") {
          apt.status = "Completed";
          apt.remarks = `Consultation finalized — ${encounterNumber}`;
        }
        return apt;
      };

      // Active appointment transitions to Completed
      const completedApt = completeAppointmentOnEncounterFinalize(55, "EMR-20261017-9999");
      expect(completedApt.status).toBe("Completed");
      expect(completedApt.remarks).toContain("EMR-20261017-9999");

      // Cancelled appointment is not overridden
      const cancelledApt = completeAppointmentOnEncounterFinalize(56, "EMR-20261017-9999");
      expect(cancelledApt.status).toBe("Cancelled");
    });
  });

  describe("Diagnoses, Prescriptions & CDSS Drug Interactions", () => {
    it("should format primary and secondary ICD-10 diagnoses accurately", () => {
      const rawDiagnoses: DiagnosisItem[] = [
        { icdCode: "I10", description: "Essential (primary) hypertension", isPrimary: true },
        { icdCode: "E11.9", description: "Type 2 diabetes mellitus without complications", isPrimary: false },
        { icdCode: "E78.5", description: "Hyperlipidemia, unspecified", isPrimary: false },
      ];

      const primary = rawDiagnoses.find((d) => d.isPrimary);
      const secondary = rawDiagnoses.filter((d) => !d.isPrimary);

      expect(primary).toBeDefined();
      expect(primary?.icdCode).toBe("I10");
      expect(secondary.length).toBe(2);
      expect(secondary.map((s) => s.icdCode)).toEqual(["E11.9", "E78.5"]);
    });

    it("should detect potential severe drug-drug interactions using CDSS rule logic", () => {
      const knownInteractions: Record<string, string[]> = {
        warfarin: ["aspirin", "ibuprofen", "ciprofloxacin"],
        aspirin: ["warfarin", "heparin", "ibuprofen"],
        metformin: ["contrast medium", "cimetidine"],
        lisinopril: ["spironolactone", "potassium"],
      };

      const checkDrugInteractions = (medications: string[]) => {
        const alerts: { drugA: string; drugB: string; severity: string; description: string }[] = [];
        const normalized = medications.map((m) => m.toLowerCase().trim());

        for (let i = 0; i < normalized.length; i++) {
          for (let j = i + 1; j < normalized.length; j++) {
            const medA = normalized[i];
            const medB = normalized[j];

            if (knownInteractions[medA]?.includes(medB)) {
              alerts.push({
                drugA: medA,
                drugB: medB,
                severity: "High",
                description: `Potential severe interaction detected between ${medA} and ${medB}. Increased bleeding or toxicity risk.`,
              });
            }
          }
        }
        return { hasInteractions: alerts.length > 0, alerts };
      };

      // Test Warfarin + Aspirin (High Risk)
      const testRx1 = ["Warfarin", "Amlodipine", "Aspirin"];
      const result1 = checkDrugInteractions(testRx1);
      expect(result1.hasInteractions).toBe(true);
      expect(result1.alerts.length).toBe(1);
      expect(result1.alerts[0].drugA).toBe("warfarin");
      expect(result1.alerts[0].drugB).toBe("aspirin");

      // Test Lisinopril + Spironolactone (Hyperkalemia Risk)
      const testRx2 = ["Lisinopril", "Spironolactone"];
      const result2 = checkDrugInteractions(testRx2);
      expect(result2.hasInteractions).toBe(true);
      expect(result2.alerts[0].drugA).toBe("lisinopril");

      // Test Safe Regimen
      const testSafe = ["Amoxicillin", "Paracetamol", "Omeprazole"];
      const resultSafe = checkDrugInteractions(testSafe);
      expect(resultSafe.hasInteractions).toBe(false);
      expect(resultSafe.alerts.length).toBe(0);
    });

    it("should enforce clinical role permissions for reading, creating, and prescribing", () => {
      const canReadEmr = (permissions: string[]) => permissions.includes("emr.read");
      const canCreateEmr = (permissions: string[]) => permissions.includes("emr.create");
      const canDiagnose = (permissions: string[]) => permissions.includes("emr.diagnose");
      const canPrescribe = (permissions: string[]) => permissions.includes("emr.prescribe");

      // Doctor role has all clinical permissions
      const doctorPermissions = ["emr.read", "emr.create", "emr.diagnose", "emr.prescribe"];
      expect(canReadEmr(doctorPermissions)).toBe(true);
      expect(canCreateEmr(doctorPermissions)).toBe(true);
      expect(canDiagnose(doctorPermissions)).toBe(true);
      expect(canPrescribe(doctorPermissions)).toBe(true);

      // Nurse role can read and record vitals, but not diagnose or prescribe
      const nursePermissions = ["emr.read", "emr.create"];
      expect(canReadEmr(nursePermissions)).toBe(true);
      expect(canCreateEmr(nursePermissions)).toBe(true);
      expect(canDiagnose(nursePermissions)).toBe(false);
      expect(canPrescribe(nursePermissions)).toBe(false);

      // Cashier role has zero EMR permissions (protects patient privacy)
      const cashierPermissions = ["billing.read", "billing.create", "billing.pay"];
      expect(canReadEmr(cashierPermissions)).toBe(false);
      expect(canCreateEmr(cashierPermissions)).toBe(false);
      expect(canDiagnose(cashierPermissions)).toBe(false);
      expect(canPrescribe(cashierPermissions)).toBe(false);
    });
  });
});
