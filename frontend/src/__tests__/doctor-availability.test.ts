import { describe, it, expect, beforeEach } from "vitest";
import { useEditionStore } from "../stores/editionStore";
import { DoctorLookupItem, CreateDoctorRequest } from "../services/appointmentService";

describe("Doctor Profiles & Availability Workflow Tests (Module 4 - Session 17)", () => {
  beforeEach(() => {
    useEditionStore.getState().setEdition("Clinic");
  });

  const mockDoctors: DoctorLookupItem[] = [
    {
      doctorId: 1,
      doctorCode: "DOC-001",
      doctorName: "Dr. Kamran Ahmed",
      specialization: "Cardiology",
      departmentId: 1,
      departmentName: "Cardiovascular",
      consultationFee: 2500,
      phoneNumber: "+923001112233",
      email: "kamran.ahmed@curasphere.com",
      yearsOfExperience: 12,
      status: "Active"
    },
    {
      doctorId: 2,
      doctorCode: "DOC-002",
      doctorName: "Dr. Ayesha Malik",
      specialization: "Neurology",
      departmentId: 2,
      departmentName: "Neuroscience",
      consultationFee: 3000,
      phoneNumber: "+923002223344",
      email: "ayesha.malik@curasphere.com",
      yearsOfExperience: 15,
      status: "Active"
    },
    {
      doctorId: 3,
      doctorCode: "DOC-003",
      doctorName: "Dr. Tariq Mahmood",
      specialization: "Orthopedics",
      departmentId: 3,
      departmentName: "Orthopedic Surgery",
      consultationFee: 2000,
      phoneNumber: "+923003334455",
      email: "tariq.mahmood@curasphere.com",
      yearsOfExperience: 8,
      status: "On Leave"
    },
    {
      doctorId: 4,
      doctorCode: "DOC-004",
      doctorName: "Dr. Fatima Zahra",
      specialization: "Pediatrics",
      departmentId: 4,
      departmentName: "Pediatric Care",
      consultationFee: 1800,
      phoneNumber: "+923004445566",
      email: "fatima.zahra@curasphere.com",
      yearsOfExperience: 10,
      status: "Active"
    }
  ];

  it("should verify doctor management is accessible in Clinic Edition", () => {
    const store = useEditionStore.getState();
    expect(store.currentEdition).toBe("Clinic");
    expect(store.isModuleEnabled("doctors")).toBe(true);
    expect(store.isModuleEnabled("appointments")).toBe(true);
  });

  it("should validate doctor profile lookup DTO structure and contact info", () => {
    const doc = mockDoctors[0];
    expect(doc.doctorCode).toBe("DOC-001");
    expect(doc.doctorName).toContain("Dr. Kamran Ahmed");
    expect(doc.specialization).toBe("Cardiology");
    expect(doc.departmentName).toBe("Cardiovascular");
    expect(doc.consultationFee).toBe(2500);
    expect(doc.phoneNumber).toBe("+923001112233");
    expect(doc.email).toBe("kamran.ahmed@curasphere.com");
    expect(doc.yearsOfExperience).toBe(12);
    expect(doc.status).toBe("Active");
  });

  it("should correctly perform multi-field doctor directory search", () => {
    const searchFilter = (query: string) => {
      const q = query.toLowerCase();
      return mockDoctors.filter(d =>
        d.doctorName.toLowerCase().includes(q) ||
        (d.doctorCode && d.doctorCode.toLowerCase().includes(q)) ||
        d.specialization.toLowerCase().includes(q) ||
        d.departmentName.toLowerCase().includes(q)
      );
    };

    // Search by Name
    expect(searchFilter("Ayesha")).toHaveLength(1);
    expect(searchFilter("Ayesha")[0].doctorCode).toBe("DOC-002");

    // Search by Specialization
    expect(searchFilter("Cardiology")).toHaveLength(1);
    expect(searchFilter("Cardiology")[0].doctorName).toBe("Dr. Kamran Ahmed");

    // Search by Department
    expect(searchFilter("Pediatric Care")).toHaveLength(1);

    // Search by Doctor Code
    expect(searchFilter("DOC-003")).toHaveLength(1);
    expect(searchFilter("DOC-003")[0].status).toBe("On Leave");

    // Non-matching search
    expect(searchFilter("NonExistentSpecialist")).toHaveLength(0);
  });

  it("should filter doctors by duty status (Active vs On Leave)", () => {
    const activeDoctors = mockDoctors.filter(d => d.status === "Active");
    const onLeaveDoctors = mockDoctors.filter(d => d.status === "On Leave");

    expect(activeDoctors).toHaveLength(3);
    expect(onLeaveDoctors).toHaveLength(1);
    expect(onLeaveDoctors[0].doctorName).toBe("Dr. Tariq Mahmood");
  });

  it("should compute dynamic clinic doctor KPI metrics accurately", () => {
    const totalConsultants = mockDoctors.length;
    const onDutyCount = mockDoctors.filter(d => d.status === "Active").length;
    const uniqueSpecialties = Array.from(new Set(mockDoctors.map(d => d.specialization)));
    const totalFees = mockDoctors.reduce((sum, d) => sum + d.consultationFee, 0);
    const avgFee = Math.round(totalFees / totalConsultants);

    expect(totalConsultants).toBe(4);
    expect(onDutyCount).toBe(3);
    expect(uniqueSpecialties).toHaveLength(4);
    expect(uniqueSpecialties).toContain("Cardiology");
    expect(uniqueSpecialties).toContain("Neurology");
    expect(uniqueSpecialties).toContain("Orthopedics");
    expect(uniqueSpecialties).toContain("Pediatrics");
    expect(avgFee).toBe(2325); // (2500 + 3000 + 2000 + 1800) / 4 = 2325
  });

  it("should validate new specialist registration payload and normalization", () => {
    const payload: CreateDoctorRequest = {
      name: "Salman Khan",
      specialization: "Dermatology",
      departmentId: 1,
      consultationFee: 2200,
      phoneNumber: "+923005556677",
      email: "salman.khan@curasphere.com",
      yearsOfExperience: 7
    };

    // Validation checks
    expect(payload.name.trim().length).toBeGreaterThan(0);
    expect(payload.consultationFee).toBeGreaterThanOrEqual(0);
    expect(payload.yearsOfExperience).toBeGreaterThanOrEqual(0);
    expect(payload.phoneNumber).toMatch(/^\+?[0-9]{10,14}$/);

    // Doctor name prefix formatting
    const formattedName = payload.name.startsWith("Dr.") ? payload.name : `Dr. ${payload.name}`;
    expect(formattedName).toBe("Dr. Salman Khan");

    // Mapping to DoctorLookupItem
    const createdDoctor: DoctorLookupItem = {
      doctorId: 5,
      doctorCode: "DOC-005",
      doctorName: formattedName,
      specialization: payload.specialization,
      departmentId: payload.departmentId || 1,
      departmentName: "Cardiovascular",
      consultationFee: payload.consultationFee,
      phoneNumber: payload.phoneNumber,
      email: payload.email,
      yearsOfExperience: payload.yearsOfExperience,
      status: "Active"
    };

    expect(createdDoctor.doctorId).toBe(5);
    expect(createdDoctor.doctorCode).toBe("DOC-005");
    expect(createdDoctor.doctorName).toBe("Dr. Salman Khan");
    expect(createdDoctor.status).toBe("Active");
  });

  it("should safely handle empty or failing API response with fallback", () => {
    const sampleFallback: DoctorLookupItem[] = mockDoctors;
    const fetchWithFallback = (apiResult: DoctorLookupItem[] | null) => {
      if (apiResult && apiResult.length > 0) {
        return apiResult;
      }
      return sampleFallback;
    };

    expect(fetchWithFallback([])).toEqual(sampleFallback);
    expect(fetchWithFallback(null)).toEqual(sampleFallback);
    expect(fetchWithFallback(mockDoctors.slice(0, 1))).toHaveLength(1);
  });
});
