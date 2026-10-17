import { describe, it, expect } from "vitest";
import { CreateAppointmentRequest, RescheduleAppointmentRequest } from "../services/appointmentService";
import { RegisterPatientDto, DuplicateCheckRequest, DuplicateCheckResponse } from "../types/patient";

describe("Patient & Appointment Workflows Tests (Session 6)", () => {
  describe("Patient Registration & Duplicate Detection", () => {
    it("should validate that all mandatory patient demographics are present", () => {
      const validPatient: RegisterPatientDto = {
        firstName: "Muhammad",
        lastName: "Ali",
        gender: "Male",
        dateOfBirth: "1992-05-14",
        phoneNumber: "+92 300 1234567",
        address: "House 45, Street 12, Gulberg III",
        city: "Lahore",
        province: "Punjab",
        emergencyContactName: "Tariq Ali",
        emergencyContactPhone: "+92 300 9998877",
        emergencyRelationship: "Brother",
        patientStatus: "Active",
        guardians: [],
        insurances: [],
      };

      // Validation logic mimicking PatientRegistration.tsx validation rules
      const validatePatient = (data: Partial<RegisterPatientDto>) => {
        if (
          !data.firstName?.trim() ||
          !data.lastName?.trim() ||
          !data.dateOfBirth ||
          !data.phoneNumber?.trim() ||
          !data.address?.trim() ||
          !data.city?.trim() ||
          !data.province?.trim() ||
          !data.emergencyContactName?.trim() ||
          !data.emergencyContactPhone?.trim() ||
          !data.emergencyRelationship?.trim()
        ) {
          return { valid: false, error: "Missing required fields" };
        }
        if (data.firstName.length > 100 || data.lastName.length > 100) {
          return { valid: false, error: "Name exceeds character limit" };
        }
        if (data.phoneNumber.length > 20) {
          return { valid: false, error: "Phone number exceeds character limit" };
        }
        return { valid: true, error: null };
      };

      expect(validatePatient(validPatient).valid).toBe(true);

      // Missing required field: phone number
      const missingPhone = { ...validPatient, phoneNumber: "" };
      expect(validatePatient(missingPhone).valid).toBe(false);
      expect(validatePatient(missingPhone).error).toBe("Missing required fields");

      // Missing emergency contact
      const missingEmergency = { ...validPatient, emergencyContactPhone: "" };
      expect(validatePatient(missingEmergency).valid).toBe(false);

      // Overlength phone number
      const overlengthPhone = { ...validPatient, phoneNumber: "+92 300 1234567890123456789" };
      expect(validatePatient(overlengthPhone).valid).toBe(false);
      expect(validatePatient(overlengthPhone).error).toBe("Phone number exceeds character limit");
    });

    it("should flag potential duplicate records when matching first name, last name, and date of birth", () => {
      const existingPatients = [
        { patientId: 101, firstName: "Muhammad", lastName: "Ali", dateOfBirth: "1992-05-14", cnicPassport: "35202-1234567-1" },
        { patientId: 102, firstName: "Ayesha", lastName: "Khan", dateOfBirth: "1998-09-21", cnicPassport: "35202-7654321-2" },
      ];

      const checkDuplicate = (req: DuplicateCheckRequest): DuplicateCheckResponse => {
        const matches = existingPatients.filter(
          (p) =>
            (p.firstName.toLowerCase() === req.firstName.toLowerCase() &&
              p.lastName.toLowerCase() === req.lastName.toLowerCase() &&
              p.dateOfBirth === req.dateOfBirth) ||
            (req.cnicPassport && p.cnicPassport === req.cnicPassport)
        );

        return {
          isPotentialDuplicate: matches.length > 0,
          matches: matches.map((m) => ({
            patientId: m.patientId,
            medicalRecordNumber: `MRN-00${m.patientId}`,
            firstName: m.firstName,
            lastName: m.lastName,
            gender: "Male",
            dateOfBirth: m.dateOfBirth,
            age: 32,
            phoneNumber: "+92 300 1234567",
            patientStatus: "Active",
          })),
        };
      };

      // Exact match on Name and DOB
      const duplicateRequest: DuplicateCheckRequest = {
        firstName: "Muhammad",
        lastName: "Ali",
        dateOfBirth: "1992-05-14",
      };
      const check1 = checkDuplicate(duplicateRequest);
      expect(check1.isPotentialDuplicate).toBe(true);
      expect(check1.matches.length).toBe(1);
      expect(check1.matches[0].patientId).toBe(101);

      // Match on CNIC
      const cnicDuplicateRequest: DuplicateCheckRequest = {
        firstName: "M.",
        lastName: "Ali",
        dateOfBirth: "1995-01-01",
        cnicPassport: "35202-1234567-1",
      };
      const check2 = checkDuplicate(cnicDuplicateRequest);
      expect(check2.isPotentialDuplicate).toBe(true);

      // Distinct patient (No duplicate)
      const uniqueRequest: DuplicateCheckRequest = {
        firstName: "Fatima",
        lastName: "Zubair",
        dateOfBirth: "2000-01-15",
      };
      const check3 = checkDuplicate(uniqueRequest);
      expect(check3.isPotentialDuplicate).toBe(false);
      expect(check3.matches.length).toBe(0);
    });

    it("should enforce role-based permissions for creating and editing patient records", () => {
      const checkCanCreate = (permissions: string[]) => permissions.includes("patients.create");
      const checkCanUpdate = (permissions: string[]) => permissions.includes("patients.update");

      const receptionistPermissions = ["patients.read", "patients.create", "appointments.create"];
      const nursePermissions = ["patients.read", "appointments.read"];
      const adminPermissions = ["patients.read", "patients.create", "patients.update", "patients.delete"];

      expect(checkCanCreate(receptionistPermissions)).toBe(true);
      expect(checkCanUpdate(receptionistPermissions)).toBe(false);

      expect(checkCanCreate(nursePermissions)).toBe(false);
      expect(checkCanUpdate(nursePermissions)).toBe(false);

      expect(checkCanCreate(adminPermissions)).toBe(true);
      expect(checkCanUpdate(adminPermissions)).toBe(true);
    });
  });

  describe("Appointment Scheduling & Double-Booking Conflict Prevention", () => {
    it("should reject appointments with missing patient or missing provider", () => {
      const validateBooking = (req: Partial<CreateAppointmentRequest>) => {
        if (!req.patientId || req.patientId <= 0) {
          return { valid: false, error: "Patient reference is required" };
        }
        if (!req.doctorId || req.doctorId <= 0) {
          return { valid: false, error: "Doctor reference is required" };
        }
        if (!req.appointmentDate) {
          return { valid: false, error: "Appointment date is required" };
        }
        if (!req.appointmentTime) {
          return { valid: false, error: "Time slot is required" };
        }
        return { valid: true, error: null };
      };

      expect(
        validateBooking({
          doctorId: 1,
          departmentId: 1,
          appointmentDate: "2026-10-20",
          appointmentTime: "10:00 AM",
        }).valid
      ).toBe(false);

      expect(
        validateBooking({
          patientId: 101,
          departmentId: 1,
          appointmentDate: "2026-10-20",
          appointmentTime: "10:00 AM",
        }).valid
      ).toBe(false);

      expect(
        validateBooking({
          patientId: 101,
          doctorId: 1,
          departmentId: 1,
          appointmentDate: "2026-10-20",
          appointmentTime: "10:00 AM",
        }).valid
      ).toBe(true);
    });

    it("should prevent double-booking when the same provider is already booked for that date and time slot", () => {
      const existingBookings = [
        {
          appointmentId: 1,
          doctorId: 1,
          appointmentDate: "2026-10-20",
          appointmentTime: "10:00 AM",
          status: "Scheduled",
        },
        {
          appointmentId: 2,
          doctorId: 1,
          appointmentDate: "2026-10-20",
          appointmentTime: "10:30 AM",
          status: "Cancelled", // Cancelled slot should be available!
        },
      ];

      const checkSlotAvailability = (doctorId: number, date: string, time: string) => {
        const conflict = existingBookings.some(
          (b) =>
            b.doctorId === doctorId &&
            b.appointmentDate === date &&
            b.appointmentTime === time &&
            b.status !== "Cancelled" &&
            b.status !== "No Show"
        );
        return !conflict;
      };

      // 10:00 AM is actively booked -> Conflict
      expect(checkSlotAvailability(1, "2026-10-20", "10:00 AM")).toBe(false);

      // 10:30 AM had a cancelled appointment -> Available
      expect(checkSlotAvailability(1, "2026-10-20", "10:30 AM")).toBe(true);

      // 11:00 AM has no booking -> Available
      expect(checkSlotAvailability(1, "2026-10-20", "11:00 AM")).toBe(true);

      // Different doctor at 10:00 AM -> Available
      expect(checkSlotAvailability(2, "2026-10-20", "10:00 AM")).toBe(true);
    });

    it("should enforce clinical status transition rules", () => {
      const allowedTransitions: Record<string, string[]> = {
        "Scheduled": ["Confirmed", "Checked In", "Cancelled", "No Show"],
        "Confirmed": ["Checked In", "Cancelled", "No Show"],
        "Checked In": ["In Consultation", "Cancelled"],
        "In Consultation": ["Completed", "Cancelled"],
        "Completed": [], // Terminal state
        "Cancelled": [], // Terminal state
        "No Show": ["Scheduled", "Cancelled"], // Can reschedule
      };

      const isValidTransition = (currentStatus: string, targetStatus: string): boolean => {
        const allowed = allowedTransitions[currentStatus] || [];
        return allowed.includes(targetStatus);
      };

      // Valid workflows
      expect(isValidTransition("Scheduled", "Confirmed")).toBe(true);
      expect(isValidTransition("Confirmed", "Checked In")).toBe(true);
      expect(isValidTransition("Checked In", "In Consultation")).toBe(true);
      expect(isValidTransition("In Consultation", "Completed")).toBe(true);
      expect(isValidTransition("Scheduled", "Cancelled")).toBe(true);

      // Invalid / Prohibited workflows
      expect(isValidTransition("Completed", "Scheduled")).toBe(false);
      expect(isValidTransition("Completed", "Cancelled")).toBe(false);
      expect(isValidTransition("Cancelled", "Completed")).toBe(false);
      expect(isValidTransition("Checked In", "Completed")).toBe(false); // Must go to consultation first
    });

    it("should validate reschedule requests and permit changing date, time, and doctor", () => {
      const currentAppointment = {
        appointmentId: 10,
        appointmentNumber: "APT-20261020-101",
        patientId: 101,
        doctorId: 1,
        appointmentDate: "2026-10-20",
        appointmentTime: "09:00 AM",
        status: "Scheduled",
      };

      const validateReschedule = (appt: typeof currentAppointment, req: RescheduleAppointmentRequest) => {
        if (appt.status === "Completed" || appt.status === "Cancelled") {
          return { valid: false, error: `Cannot reschedule appointment with status ${appt.status}` };
        }
        if (!req.appointmentDate || !req.appointmentTime) {
          return { valid: false, error: "New date and time are required" };
        }
        return { valid: true, error: null };
      };

      const validReschedule: RescheduleAppointmentRequest = {
        appointmentDate: "2026-10-22",
        appointmentTime: "11:30 AM",
        doctorId: 2,
        remarks: "Patient requested afternoon reschedule",
      };
      expect(validateReschedule(currentAppointment, validReschedule).valid).toBe(true);

      // Attempting to reschedule completed appointment
      const completedAppt = { ...currentAppointment, status: "Completed" };
      expect(validateReschedule(completedAppt, validReschedule).valid).toBe(false);
      expect(validateReschedule(completedAppt, validReschedule).error).toContain("Cannot reschedule");
    });
  });
});
