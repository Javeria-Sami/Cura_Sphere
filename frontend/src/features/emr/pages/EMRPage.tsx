import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  FileText,
  Plus,
  Search,
  Printer,
  FileCheck,
  Stethoscope,
  CheckCircle2,
  AlertTriangle,
  History,
  UserCheck,
  Calendar,
  Pill,
  Trash2,
  Lock,
  ArrowLeft,
  Info
} from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { Stat } from "../../../components/ui/Stat";
import { Table } from "../../../components/ui/Table";
import { Modal } from "../../../components/ui/Modal";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import PageHeader from "../../../components/layout/PageHeader";
import {
  emrService,
  EmrEncounter,
  DiagnosisItem,
  PrescriptionItem,
  VitalSigns,
  InteractionAlert
} from "../../../services/emrService";
import { patientService } from "../../../services/patientService";
import { appointmentService, DoctorLookupItem } from "../../../services/appointmentService";
import { clinicalServices, PharmacyStockItem } from "../../../services/clinicalServices";
import { PatientDetailDto } from "../../../types/patient";

// Standard Common Outpatient ICD-10 Diagnostic Options
const COMMON_ICD10: { code: string; desc: string }[] = [
  { code: "I10", desc: "Essential (primary) hypertension" },
  { code: "E11.9", desc: "Type 2 diabetes mellitus without complications" },
  { code: "J06.9", desc: "Acute upper respiratory infection, unspecified" },
  { code: "K21.9", desc: "Gastro-esophageal reflux disease without esophagitis" },
  { code: "M54.5", desc: "Low back pain" },
  { code: "R51.9", desc: "Headache, unspecified" },
  { code: "J45.909", desc: "Unspecified asthma, uncomplicated" },
  { code: "A09", desc: "Infectious gastroenteritis and colitis, unspecified" },
  { code: "N39.0", desc: "Urinary tract infection, site not specified" },
  { code: "E78.5", desc: "Hyperlipidemia, unspecified" },
  { code: "K29.70", desc: "Gastritis, unspecified, without bleeding" },
  { code: "J02.9", desc: "Acute pharyngitis, unspecified" },
  { code: "Z00.00", desc: "Encounter for general adult medical examination" },
];

export default function EMRPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL query parameters for direct consultation launch
  const urlAppointmentId = searchParams.get("appointmentId");
  const urlPatientId = searchParams.get("patientId");
  const urlPatientName = searchParams.get("patientName");
  const urlMrn = searchParams.get("mrn");

  // State: View Modes ('list' | 'consultation')
  const [activeMode, setActiveMode] = useState<"list" | "consultation">(
    urlPatientId ? "consultation" : "list"
  );

  // Encounter list & search state
  const [encounters, setEncounters] = useState<EmrEncounter[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Patient context for active consultation
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(
    urlPatientId ? Number(urlPatientId) : null
  );
  const [patientDetails, setPatientDetails] = useState<PatientDetailDto | null>(null);
  const [patientHistory, setPatientHistory] = useState<EmrEncounter[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Doctors & Formulary Lookups
  const [doctorsList, setDoctorsList] = useState<DoctorLookupItem[]>([]);
  const [pharmacyStock, setPharmacyStock] = useState<PharmacyStockItem[]>([]);

  // Active Consultation Form State
  const [selectedDoctorId, setSelectedDoctorId] = useState<number>(0);
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [hpi, setHpi] = useState("");
  const [examFindings, setExamFindings] = useState("");
  const [clinicalAssessment, setClinicalAssessment] = useState("");
  const [treatmentPlan, setTreatmentPlan] = useState("");
  const [followUpDays, setFollowUpDays] = useState<string>("7");
  const [followUpInstructions, setFollowUpInstructions] = useState("");

  // Vitals State
  const [bpSystolic, setBpSystolic] = useState("120");
  const [bpDiastolic, setBpDiastolic] = useState("80");
  const [heartRate, setHeartRate] = useState("72");
  const [temperature, setTemperature] = useState("98.6");
  const [respRate, setRespRate] = useState("16");
  const [spO2, setSpO2] = useState("98");
  const [weightKg, setWeightKg] = useState("70");
  const [heightCm, setHeightCm] = useState("172");

  // Diagnoses State
  const [diagnoses, setDiagnoses] = useState<DiagnosisItem[]>([
    { icdCode: "I10", description: "Essential (primary) hypertension", isPrimary: true },
  ]);
  const [newDiagCode, setNewDiagCode] = useState("E11.9");
  const [newDiagDesc, setNewDiagDesc] = useState("Type 2 diabetes mellitus without complications");

  // Prescriptions State
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
  const [newMedName, setNewMedName] = useState("");
  const [newMedDosage, setNewMedDosage] = useState("5mg");
  const [newMedRoute, setNewMedRoute] = useState("Oral");
  const [newMedFrequency, setNewMedFrequency] = useState("OD");
  const [newMedDuration, setNewMedDuration] = useState("30 days");
  const [newMedQty, setNewMedQty] = useState("30");
  const [newMedInstructions, setNewMedInstructions] = useState("Take once daily in the morning after meal");

  // CDSS Alerts
  const [interactionAlerts, setInteractionAlerts] = useState<InteractionAlert[]>([]);

  // Finalize / Print State
  const [saving, setSaving] = useState(false);
  const [selectedEncounterForPrint, setSelectedEncounterForPrint] = useState<EmrEncounter | null>(null);
  const [isFinalizeConfirmOpen, setIsFinalizeConfirmOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Automated BMI calculation
  const calculatedBmi = useMemo(() => {
    const w = parseFloat(weightKg);
    const h = parseFloat(heightCm) / 100;
    if (w > 0 && h > 0) {
      return (w / (h * h)).toFixed(1);
    }
    return null;
  }, [weightKg, heightCm]);

  // Load Initial Lookups
  useEffect(() => {
    const loadLookups = async () => {
      try {
        const [docs, stock] = await Promise.all([
          appointmentService.getDoctors(),
          clinicalServices.getPharmacyStock(),
        ]);
        setDoctorsList(docs);
        setPharmacyStock(stock);
        if (docs.length > 0) {
          setSelectedDoctorId(docs[0].doctorId);
        }
      } catch (err) {
        console.error("Failed to load clinical lookups", err);
      }
    };
    loadLookups();
  }, []);

  // Load Encounters List
  const loadEncountersList = async () => {
    try {
      setLoadingList(true);
      const data = await emrService.getAllEncounters(searchTerm);
      setEncounters(data);
    } catch (err) {
      console.error("Failed to fetch EMR encounters", err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (activeMode === "list") {
      loadEncountersList();
    }
  }, [activeMode, searchTerm]);

  // Load Patient Details & History when Patient Selected
  useEffect(() => {
    if (!selectedPatientId) return;

    const fetchPatientData = async () => {
      try {
        setLoadingHistory(true);
        const [patient, history] = await Promise.all([
          patientService.getPatientById(selectedPatientId),
          emrService.getPatientEncounters(selectedPatientId),
        ]);
        setPatientDetails(patient);
        setPatientHistory(history);
      } catch (err) {
        console.error("Failed to load patient history", err);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchPatientData();
  }, [selectedPatientId]);

  // CDSS Drug Interaction Check whenever prescriptions change
  useEffect(() => {
    const medNames = prescriptions.map((p) => p.medicationName).filter(Boolean);
    if (medNames.length >= 2) {
      emrService.checkInteractions(medNames).then((res) => {
        setInteractionAlerts(res.alerts);
      });
    } else {
      setInteractionAlerts([]);
    }
  }, [prescriptions]);

  // Handle adding diagnosis
  const handleAddDiagnosis = () => {
    if (!newDiagCode.trim() || !newDiagDesc.trim()) return;
    const exists = diagnoses.some((d) => d.icdCode === newDiagCode);
    if (exists) {
      triggerToast("Diagnosis already added to consultation.");
      return;
    }
    setDiagnoses([
      ...diagnoses,
      {
        icdCode: newDiagCode,
        description: newDiagDesc,
        isPrimary: diagnoses.length === 0,
      },
    ]);
  };

  const handleRemoveDiagnosis = (code: string) => {
    setDiagnoses(diagnoses.filter((d) => d.icdCode !== code));
  };

  const handleSetPrimaryDiagnosis = (code: string) => {
    setDiagnoses(
      diagnoses.map((d) => ({
        ...d,
        isPrimary: d.icdCode === code,
      }))
    );
  };

  // Handle adding medication
  const handleAddPrescription = () => {
    if (!newMedName.trim()) {
      triggerToast("Medication name is required.");
      return;
    }

    const item: PrescriptionItem = {
      medicationName: newMedName.trim(),
      dosage: newMedDosage.trim(),
      route: newMedRoute,
      frequency: newMedFrequency,
      duration: newMedDuration.trim(),
      quantity: parseInt(newMedQty) || undefined,
      instructions: newMedInstructions.trim(),
    };

    setPrescriptions([...prescriptions, item]);
    setNewMedName("");
    setNewMedInstructions("");
  };

  const handleRemovePrescription = (index: number) => {
    setPrescriptions(prescriptions.filter((_, idx) => idx !== index));
  };

  // Save Consultation (Draft or Finalized)
  const handleSaveConsultation = async (isFinalized: boolean) => {
    if (!selectedPatientId) {
      triggerToast("No patient selected for consultation.");
      return;
    }
    if (!selectedDoctorId) {
      triggerToast("Attending clinician is required.");
      return;
    }
    if (!chiefComplaint.trim()) {
      triggerToast("Chief complaint / presenting symptoms are required.");
      return;
    }

    try {
      setSaving(true);

      const vitals: VitalSigns = {
        bloodPressure: bpSystolic && bpDiastolic ? `${bpSystolic}/${bpDiastolic}` : undefined,
        heartRate: heartRate ? parseInt(heartRate) : undefined,
        temperature: temperature ? parseFloat(temperature) : undefined,
        respiratoryRate: respRate ? parseInt(respRate) : undefined,
        spO2: spO2 ? parseInt(spO2) : undefined,
        weightKg: weightKg ? parseFloat(weightKg) : undefined,
        heightCm: heightCm ? parseFloat(heightCm) : undefined,
        bmi: calculatedBmi ? parseFloat(calculatedBmi) : undefined,
      };

      const soapFormatted = [
        `Subjective: ${chiefComplaint}. ${hpi}`.trim(),
        `Objective: BP ${vitals.bloodPressure || "N/A"}, HR ${vitals.heartRate || "N/A"} bpm, Temp ${vitals.temperature || "N/A"} F. Exam: ${examFindings || "Normal examination"}`.trim(),
        `Assessment: ${clinicalAssessment || diagnoses.map((d) => d.description).join(", ") || "Clinical evaluation"}`.trim(),
        `Plan: ${treatmentPlan || "Standard outpatient management"}. Follow-up in ${followUpDays || "7"} days.`
      ].join("\n\n");

      const payload = {
        patientId: selectedPatientId,
        doctorId: selectedDoctorId,
        appointmentId: urlAppointmentId ? parseInt(urlAppointmentId) : undefined,
        encounterType: "OPD",
        chiefComplaint: chiefComplaint.trim(),
        historyOfPresentIllness: hpi.trim() || undefined,
        examinationFindings: examFindings.trim() || undefined,
        vitals,
        diagnoses,
        prescriptions,
        clinicalNotes: soapFormatted,
        followUpDays: parseInt(followUpDays) || undefined,
        followUpInstructions: followUpInstructions.trim() || undefined,
        isFinalized,
      };

      const savedRecord = await emrService.createEncounter(payload);

      triggerToast(
        isFinalized
          ? `Clinical Consultation #${savedRecord.encounterNumber} successfully signed and finalized!`
          : `Consultation draft saved successfully.`
      );

      setIsFinalizeConfirmOpen(false);

      if (isFinalized) {
        setSelectedEncounterForPrint(savedRecord);
        // Reset query parameters
        setSearchParams({});
        setActiveMode("list");
      }
    } catch (err: any) {
      console.error("Failed to save consultation", err);
      triggerToast(err.response?.data?.message || "Failed to record clinical consultation.");
    } finally {
      setSaving(false);
    }
  };

  const filteredEncounters = encounters.filter((e) => {
    if (statusFilter === "draft") return e.status === "Draft";
    if (statusFilter === "finalized") return e.status === "Finalized" || e.status === "SignedOff";
    return true;
  });

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl mx-auto animate-fade-in print:p-0 print:m-0">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-700 animate-slide-in">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Mode Header */}
      <PageHeader
        title={activeMode === "consultation" ? "Doctor Clinical Consultation Workspace" : "Electronic Medical Records (EMR)"}
        subtitle={
          activeMode === "consultation"
            ? "Record clinical vitals, SOAP examination notes, ICD-10 diagnoses, and electronic prescriptions"
            : "Centralized outpatient clinical encounters, diagnostic history, and longitudinal medical records"
        }
        icon={activeMode === "consultation" ? <Stethoscope size={20} /> : <FileText size={20} />}
        actions={
          <div className="flex items-center gap-2">
            {activeMode === "consultation" ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<ArrowLeft size={14} />}
                  onClick={() => {
                    setActiveMode("list");
                    setSearchParams({});
                  }}
                >
                  Exit Workspace
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={saving}
                  onClick={() => handleSaveConsultation(false)}
                >
                  Save as Draft
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  leftIcon={<Lock size={14} />}
                  disabled={saving}
                  onClick={() => setIsFinalizeConfirmOpen(true)}
                >
                  Finalize & Sign Off
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<Printer size={14} />}
                  onClick={() => window.print()}
                >
                  Print EMR Registry
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  leftIcon={<Plus size={14} />}
                  onClick={() => {
                    setActiveMode("consultation");
                    setSelectedPatientId(selectedPatientId || 1);
                  }}
                >
                  New Consultation
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* VIEW MODE 1: ACTIVE DOCTOR CONSULTATION WORKSPACE */}
      {activeMode === "consultation" ? (
        <div className="space-y-6">
          {/* Patient Identity & Verification Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-5 shadow-sm border border-slate-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary-600/30 border border-primary-400/40 text-primary-200 flex items-center justify-center font-bold text-xl shrink-0">
                  {patientDetails?.firstName?.[0] || urlPatientName?.[0] || "P"}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold tracking-tight">
                      {patientDetails ? `${patientDetails.firstName} ${patientDetails.lastName}` : urlPatientName || "Select Patient"}
                    </h2>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <UserCheck size={12} />
                      Identity Verified
                    </span>
                    <Badge variant="info" size="sm">Outpatient Clinic</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-300 mt-1.5 flex-wrap">
                    <span>MRN: <strong className="font-mono text-white">{patientDetails?.medicalRecordNumber || urlMrn || "MRN-Pending"}</strong></span>
                    <span>Age/Gender: <strong className="text-white">{patientDetails?.age ?? 34} yrs ({patientDetails?.gender || "Male"})</strong></span>
                    <span>Contact: <strong className="text-white">{patientDetails?.phoneNumber || "+92 300 1234567"}</strong></span>
                    <span>Blood Group: <strong className="text-rose-300">{patientDetails?.bloodGroupName || "O+"}</strong></span>
                  </div>
                </div>
              </div>

              {/* Appointment Context Details */}
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3 shrink-0">
                <Calendar size={18} className="text-primary-300" />
                <div className="text-xs">
                  <p className="text-slate-400 font-medium">Active Consultation Session</p>
                  <p className="font-bold text-white">
                    {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Clinical Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Clinician & Attending Info */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Stethoscope size={16} className="text-primary-600" />
                    Attending Physician Assignment
                  </h3>
                  <Badge variant="secondary" size="sm">Outpatient EMR</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Attending Doctor"
                    value={selectedDoctorId.toString()}
                    onChange={(e) => setSelectedDoctorId(parseInt(e.target.value))}
                    options={doctorsList.map((d) => ({
                      value: d.doctorId.toString(),
                      label: `${d.doctorName} — ${d.specialization}`,
                    }))}
                  />
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Encounter Type</label>
                    <input
                      value="OPD Consultation & Clinical Examination"
                      disabled
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-600 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Vitals Intake Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <FileCheck size={16} className="text-emerald-600" />
                    Patient Vital Signs Intake
                  </h3>
                  {calculatedBmi && (
                    <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
                      Calculated BMI: {calculatedBmi} kg/m²
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase">BP Systolic</label>
                    <div className="flex items-baseline gap-1 mt-1">
                      <input
                        value={bpSystolic}
                        onChange={(e) => setBpSystolic(e.target.value)}
                        placeholder="120"
                        className="w-16 font-mono font-bold text-base text-slate-900 bg-transparent focus:outline-none"
                      />
                      <span className="text-xs text-slate-400">mmHg</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase">BP Diastolic</label>
                    <div className="flex items-baseline gap-1 mt-1">
                      <input
                        value={bpDiastolic}
                        onChange={(e) => setBpDiastolic(e.target.value)}
                        placeholder="80"
                        className="w-16 font-mono font-bold text-base text-slate-900 bg-transparent focus:outline-none"
                      />
                      <span className="text-xs text-slate-400">mmHg</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase">Heart Rate</label>
                    <div className="flex items-baseline gap-1 mt-1">
                      <input
                        value={heartRate}
                        onChange={(e) => setHeartRate(e.target.value)}
                        placeholder="72"
                        className="w-16 font-mono font-bold text-base text-slate-900 bg-transparent focus:outline-none"
                      />
                      <span className="text-xs text-slate-400">bpm</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase">Temperature</label>
                    <div className="flex items-baseline gap-1 mt-1">
                      <input
                        value={temperature}
                        onChange={(e) => setTemperature(e.target.value)}
                        placeholder="98.6"
                        className="w-16 font-mono font-bold text-base text-slate-900 bg-transparent focus:outline-none"
                      />
                      <span className="text-xs text-slate-400">°F</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase">Resp Rate</label>
                    <div className="flex items-baseline gap-1 mt-1">
                      <input
                        value={respRate}
                        onChange={(e) => setRespRate(e.target.value)}
                        placeholder="16"
                        className="w-16 font-mono font-bold text-base text-slate-900 bg-transparent focus:outline-none"
                      />
                      <span className="text-xs text-slate-400">/min</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase">Oxygen (SpO2)</label>
                    <div className="flex items-baseline gap-1 mt-1">
                      <input
                        value={spO2}
                        onChange={(e) => setSpO2(e.target.value)}
                        placeholder="98"
                        className="w-16 font-mono font-bold text-base text-slate-900 bg-transparent focus:outline-none"
                      />
                      <span className="text-xs text-slate-400">%</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase">Weight</label>
                    <div className="flex items-baseline gap-1 mt-1">
                      <input
                        value={weightKg}
                        onChange={(e) => setWeightKg(e.target.value)}
                        placeholder="70"
                        className="w-16 font-mono font-bold text-base text-slate-900 bg-transparent focus:outline-none"
                      />
                      <span className="text-xs text-slate-400">kg</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase">Height</label>
                    <div className="flex items-baseline gap-1 mt-1">
                      <input
                        value={heightCm}
                        onChange={(e) => setHeightCm(e.target.value)}
                        placeholder="172"
                        className="w-16 font-mono font-bold text-base text-slate-900 bg-transparent focus:outline-none"
                      />
                      <span className="text-xs text-slate-400">cm</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SOAP Clinical Examination Notes */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <FileText size={16} className="text-primary-600" />
                    Clinician SOAP Examination & Clinical Notes
                  </h3>
                  <span className="text-xs text-slate-400">Outpatient Encounter Documentation</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Chief Complaint / Presenting Symptoms <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      value={chiefComplaint}
                      onChange={(e) => setChiefComplaint(e.target.value)}
                      placeholder="e.g. Persistent headache and occipital neck stiffness for 3 days"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Subjective (History of Present Illness)
                      </label>
                      <textarea
                        value={hpi}
                        onChange={(e) => setHpi(e.target.value)}
                        rows={3}
                        placeholder="Patient reports onset of symptoms, pain intensity, aggravating/relieving factors..."
                        className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Objective (Physical Findings & Signs)
                      </label>
                      <textarea
                        value={examFindings}
                        onChange={(e) => setExamFindings(e.target.value)}
                        rows={3}
                        placeholder="Chest clear, heart sounds normal, abdomen soft, cranial nerves intact..."
                        className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Assessment (Clinical Impression)
                      </label>
                      <textarea
                        value={clinicalAssessment}
                        onChange={(e) => setClinicalAssessment(e.target.value)}
                        rows={3}
                        placeholder="Primary clinical impression, differential diagnosis rationale..."
                        className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Plan (Therapy & Recommendations)
                      </label>
                      <textarea
                        value={treatmentPlan}
                        onChange={(e) => setTreatmentPlan(e.target.value)}
                        rows={3}
                        placeholder="Dietary recommendations, physical exercise, lifestyle counselling..."
                        className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ICD-10 Diagnoses Section */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-indigo-600" />
                    ICD-10 Clinical Diagnoses
                  </h3>
                  <Badge variant="info" size="sm">{diagnoses.length} Assigned</Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex items-end gap-2 flex-wrap sm:flex-nowrap">
                    <div className="flex-1 min-w-[200px]">
                      <Select
                        label="Common ICD-10 Diagnosis"
                        value={newDiagCode}
                        onChange={(e) => {
                          setNewDiagCode(e.target.value);
                          const item = COMMON_ICD10.find((x) => x.code === e.target.value);
                          if (item) setNewDiagDesc(item.desc);
                        }}
                        options={COMMON_ICD10.map((i) => ({
                          value: i.code,
                          label: `${i.code} — ${i.desc}`,
                        }))}
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<Plus size={14} />}
                      onClick={handleAddDiagnosis}
                      className="shrink-0 mb-0.5"
                    >
                      Add Diagnosis
                    </Button>
                  </div>

                  {/* Diagnoses List */}
                  <div className="space-y-2 pt-2">
                    {diagnoses.map((d) => (
                      <div
                        key={d.icdCode}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                          d.isPrimary
                            ? "bg-primary-50/60 border-primary-200"
                            : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white border border-slate-300 text-slate-800">
                            {d.icdCode}
                          </span>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{d.description}</p>
                            {d.isPrimary && (
                              <span className="text-[10px] font-semibold text-primary-700 uppercase tracking-wider">
                                Primary Clinical Diagnosis
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {!d.isPrimary && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryDiagnosis(d.icdCode)}
                              className="text-[11px] text-primary-600 hover:underline font-medium"
                            >
                              Make Primary
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveDiagnosis(d.icdCode)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Remove Diagnosis"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Electronic Prescriptions (Rx) Section */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Pill size={16} className="text-rose-600" />
                    Electronic Prescription (Rx) Builder
                  </h3>
                  <Badge variant="secondary" size="sm">{prescriptions.length} Medications</Badge>
                </div>

                {/* CDSS Drug Interaction Alert Banner */}
                {interactionAlerts.length > 0 && (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2 animate-fade-in">
                    <div className="flex items-center gap-2 font-bold text-xs text-rose-800">
                      <AlertTriangle size={16} className="text-rose-600 shrink-0" />
                      <span>Clinical Decision Support (CDSS): Potential Drug-Drug Interaction Detected!</span>
                    </div>
                    {interactionAlerts.map((alt, idx) => (
                      <p key={idx} className="text-xs text-rose-700 pl-6 leading-relaxed">
                        • <strong>{alt.drugA}</strong> + <strong>{alt.drugB}</strong>: {alt.description}
                      </p>
                    ))}
                  </div>
                )}

                {/* Add Medication Form */}
                <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Medication Name</label>
                      <input
                        value={newMedName}
                        onChange={(e) => setNewMedName(e.target.value)}
                        placeholder="e.g. Amlodipine, Paracetamol, Metformin"
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-white"
                        list="pharmacyStockOptions"
                      />
                      <datalist id="pharmacyStockOptions">
                        {pharmacyStock.map((s) => (
                          <option key={s.drugId} value={s.drugName}>
                            {s.genericName} — {s.dosageForm}
                          </option>
                        ))}
                      </datalist>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Dosage / Strength</label>
                      <input
                        value={newMedDosage}
                        onChange={(e) => setNewMedDosage(e.target.value)}
                        placeholder="e.g. 5mg, 500mg"
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Route</label>
                      <select
                        value={newMedRoute}
                        onChange={(e) => setNewMedRoute(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                      >
                        <option value="Oral">Oral</option>
                        <option value="Topical">Topical</option>
                        <option value="Inhalation">Inhalation</option>
                        <option value="IV">Intravenous (IV)</option>
                        <option value="IM">Intramuscular (IM)</option>
                        <option value="Sublingual">Sublingual</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Frequency</label>
                      <select
                        value={newMedFrequency}
                        onChange={(e) => setNewMedFrequency(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                      >
                        <option value="OD">Once Daily (OD)</option>
                        <option value="BID">Twice Daily (BID)</option>
                        <option value="TID">Three times (TID)</option>
                        <option value="QID">Four times (QID)</option>
                        <option value="PRN">As Needed (PRN)</option>
                        <option value="STAT">Immediately (STAT)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Duration</label>
                      <input
                        value={newMedDuration}
                        onChange={(e) => setNewMedDuration(e.target.value)}
                        placeholder="e.g. 5 days, 30 days"
                        className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Quantity</label>
                      <input
                        type="number"
                        value={newMedQty}
                        onChange={(e) => setNewMedQty(e.target.value)}
                        placeholder="30"
                        className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Instructions</label>
                    <input
                      value={newMedInstructions}
                      onChange={(e) => setNewMedInstructions(e.target.value)}
                      placeholder="e.g. Take after breakfast with water"
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <Button size="sm" variant="outline" leftIcon={<Plus size={14} />} onClick={handleAddPrescription}>
                      Add Prescription Item
                    </Button>
                  </div>
                </div>

                {/* Prescriptions Table */}
                {prescriptions.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px]">
                        <tr>
                          <th className="p-3">Medication</th>
                          <th className="p-3">Dosage & Route</th>
                          <th className="p-3">Frequency</th>
                          <th className="p-3">Duration</th>
                          <th className="p-3">Instructions</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                        {prescriptions.map((p, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="p-3 font-bold text-slate-900">{p.medicationName}</td>
                            <td className="p-3">{p.dosage} · {p.route}</td>
                            <td className="p-3"><Badge variant="info" size="sm">{p.frequency}</Badge></td>
                            <td className="p-3">{p.duration} ({p.quantity || 1} units)</td>
                            <td className="p-3 text-slate-500 text-[11px]">{p.instructions || "As directed"}</td>
                            <td className="p-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemovePrescription(idx)}
                                className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                    No medications added to this prescription yet. Add items above if indicated.
                  </div>
                )}
              </div>

              {/* Follow-up & Discharge Advice */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Calendar size={16} className="text-amber-600" />
                    Follow-Up & Clinical Disposition
                  </h3>
                  <span className="text-xs text-slate-400">Recommended Return Schedule</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Select
                      label="Recommended Follow-up"
                      value={followUpDays}
                      onChange={(e) => setFollowUpDays(e.target.value)}
                      options={[
                        { value: "3", label: "In 3 Days" },
                        { value: "7", label: "In 1 Week (7 Days)" },
                        { value: "14", label: "In 2 Weeks (14 Days)" },
                        { value: "30", label: "In 1 Month (30 Days)" },
                        { value: "0", label: "PRN (As Needed / If Unresolved)" },
                      ]}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Patient Discharge & Review Instructions
                    </label>
                    <input
                      value={followUpInstructions}
                      onChange={(e) => setFollowUpInstructions(e.target.value)}
                      placeholder="e.g. Return for BP checkup and blood glucose re-assessment"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right 1 Col: Patient Historical Context */}
            <div className="space-y-6">
              {/* Allergy Alert Notice */}
              <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 shadow-sm text-xs text-amber-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-800">
                  <Info size={16} className="text-amber-600 shrink-0" />
                  <span>Allergy & Medical Alert Protocol</span>
                </div>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  No critical drug allergies recorded in profile. Clinician must verbally confirm with patient before dispensing new medication classes.
                </p>
              </div>

              {/* Patient Encounter History */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <History size={16} className="text-indigo-600" />
                    Patient Clinical History
                  </h3>
                  <span className="text-xs font-mono text-slate-400">
                    {patientHistory.length} Past Visits
                  </span>
                </div>

                {loadingHistory ? (
                  <div className="p-6 text-center text-xs text-slate-400">Loading prior encounters...</div>
                ) : patientHistory.length > 0 ? (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {patientHistory.map((h) => (
                      <div
                        key={h.encounterId}
                        className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100/60 transition-colors space-y-2 cursor-pointer"
                        onClick={() => setSelectedEncounterForPrint(h)}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-900 font-mono">{h.encounterNumber}</span>
                          <span className="text-[11px] text-slate-500">
                            {new Date(h.encounterDate).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-primary-700">
                          {h.diagnoses?.[0]?.description || h.chiefComplaint}
                        </p>
                        <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                          {h.clinicalNotes || h.chiefComplaint}
                        </p>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[10px] text-slate-400">
                          <span>{h.doctorName}</span>
                          <Badge variant={h.status === "Finalized" ? "success" : "secondary"} size="sm">
                            {h.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    No prior clinical encounters on file for this patient. This consultation establishes their baseline record.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* VIEW MODE 2: EMR ENCOUNTERS DIRECTORY & REGISTER */
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat label="Total Clinical Encounters" value={encounters.length.toString()} icon={<FileText size={20} />} color="blue" />
            <Stat label="Finalized & Signed Off" value={encounters.filter((e) => e.status === "Finalized" || e.status === "SignedOff").length.toString()} icon={<CheckCircle2 size={20} />} color="green" />
            <Stat label="Active Consultation Drafts" value={encounters.filter((e) => e.status === "Draft").length.toString()} icon={<Stethoscope size={20} />} color="yellow" />
            <Stat label="Attending Clinicians" value={doctorsList.length.toString()} icon={<UserCheck size={20} />} color="cyan" />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 flex-wrap">
              <div className="relative flex-1 min-w-[240px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by patient name, MRN, diagnosis, encounter number..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-slate-50"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={statusFilter === "all" ? "primary" : "ghost"}
                  onClick={() => setStatusFilter("all")}
                >
                  All ({encounters.length})
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === "finalized" ? "primary" : "ghost"}
                  onClick={() => setStatusFilter("finalized")}
                >
                  Finalized ({encounters.filter((e) => e.status === "Finalized" || e.status === "SignedOff").length})
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === "draft" ? "primary" : "ghost"}
                  onClick={() => setStatusFilter("draft")}
                >
                  Drafts ({encounters.filter((e) => e.status === "Draft").length})
                </Button>
              </div>
            </div>

            {loadingList ? (
              <div className="p-12 text-center text-sm text-slate-400">Loading clinical encounter records...</div>
            ) : filteredEncounters.length > 0 ? (
              <Table
                keyField="encounterId"
                data={filteredEncounters}
                columns={[
                  {
                    key: "encounterNumber",
                    header: "Encounter #",
                    render: (r) => <span className="font-mono text-xs font-bold text-slate-900">{r.encounterNumber}</span>,
                  },
                  {
                    key: "patientName",
                    header: "Patient Demographics",
                    render: (r) => (
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{r.patientName}</p>
                        <p className="text-xs font-mono text-slate-400">{r.medicalRecordNumber} · {r.patientAge ?? 30}y ({r.patientGender || "N/A"})</p>
                      </div>
                    ),
                  },
                  {
                    key: "doctorName",
                    header: "Attending Clinician",
                    render: (r) => (
                      <div>
                        <p className="text-sm font-medium text-slate-800">{r.doctorName}</p>
                        <p className="text-xs text-slate-400">{r.specialization}</p>
                      </div>
                    ),
                  },
                  {
                    key: "diagnoses",
                    header: "Primary ICD-10 Diagnosis",
                    render: (r) => (
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {r.diagnoses?.[0]?.description || r.chiefComplaint}
                        </p>
                        {r.diagnoses?.[0]?.icdCode && (
                          <span className="text-[10px] font-mono text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded border border-primary-200">
                            {r.diagnoses[0].icdCode}
                          </span>
                        )}
                      </div>
                    ),
                  },
                  {
                    key: "encounterDate",
                    header: "Date",
                    render: (r) => <span className="text-xs font-mono text-slate-600">{new Date(r.encounterDate).toLocaleDateString()}</span>,
                  },
                  {
                    key: "status",
                    header: "Record Status",
                    render: (r) => (
                      <Badge variant={r.status === "Finalized" || r.status === "SignedOff" ? "success" : "warning"}>
                        {r.status}
                      </Badge>
                    ),
                  },
                  {
                    key: "actions",
                    header: "Actions",
                    align: "right",
                    render: (r) => (
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          leftIcon={<FileText size={13} />}
                          onClick={() => setSelectedEncounterForPrint(r)}
                        >
                          View / Print Record
                        </Button>
                      </div>
                    ),
                  },
                ]}
              />
            ) : (
              <div className="p-12 text-center text-sm text-slate-400">
                No clinical encounters matching your search query.
              </div>
            )}
          </div>
        </div>
      )}

      {/* FINALIZE CONFIRMATION MODAL */}
      <Modal
        open={isFinalizeConfirmOpen}
        onClose={() => setIsFinalizeConfirmOpen(false)}
        title="Finalize & Sign Clinical Encounter"
        description="Authoritative clinical record sign-off & locking"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-800">
              <Lock size={16} className="text-amber-600" />
              <span>Finalized Clinical Record Warning</span>
            </div>
            <p className="leading-relaxed">
              Once this consultation is finalized and signed, the record is locked against modifications to maintain legal and clinical audit integrity. Any linked appointment will automatically transition to <strong>Completed</strong>.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
            <p><strong>Primary Diagnosis:</strong> {diagnoses[0]?.description || "General Evaluation"}</p>
            <p><strong>Prescribed Items:</strong> {prescriptions.length} medications</p>
            <p><strong>Follow-Up:</strong> {followUpDays} days</p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setIsFinalizeConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              leftIcon={<Lock size={14} />}
              disabled={saving}
              onClick={() => handleSaveConsultation(true)}
            >
              Confirm & Sign Record
            </Button>
          </div>
        </div>
      </Modal>

      {/* PRINTABLE CLINICAL CONSULTATION RECORD & PRESCRIPTION MODAL */}
      {selectedEncounterForPrint && (
        <Modal
          open={!!selectedEncounterForPrint}
          onClose={() => setSelectedEncounterForPrint(null)}
          title={`Clinical Encounter — ${selectedEncounterForPrint.encounterNumber}`}
          description="Official Electronic Medical Record & Prescription Summary"
        >
          <div className="space-y-6 print:p-0 print:m-0" id="printable-emr-record">
            {/* Clinic Document Header */}
            <div className="flex items-center justify-between pb-4 border-b-2 border-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary-700 text-white flex items-center justify-center font-bold text-xl">
                  CS
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-lg leading-tight uppercase tracking-wide">
                    CuraSphere Outpatient Medical Clinic
                  </h2>
                  <p className="text-xs text-slate-500 font-mono">
                    Encounter #: {selectedEncounterForPrint.encounterNumber} · Date: {new Date(selectedEncounterForPrint.encounterDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Badge variant={selectedEncounterForPrint.status === "Finalized" ? "success" : "secondary"}>
                {selectedEncounterForPrint.status}
              </Badge>
            </div>

            {/* Patient & Doctor Demographics Grid */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Patient Details</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedEncounterForPrint.patientName}</p>
                <p className="text-slate-600 font-mono mt-0.5">MRN: {selectedEncounterForPrint.medicalRecordNumber} · Age: {selectedEncounterForPrint.patientAge ?? 34}y</p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Attending Clinician</p>
                <p className="text-sm font-bold text-primary-700 mt-0.5">{selectedEncounterForPrint.doctorName}</p>
                <p className="text-slate-600 mt-0.5">{selectedEncounterForPrint.specialization}</p>
              </div>
            </div>

            {/* Vital Signs Row */}
            {selectedEncounterForPrint.vitals && (
              <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs flex items-center justify-between flex-wrap gap-2">
                <span>BP: <strong>{selectedEncounterForPrint.vitals.bloodPressure || "120/80"}</strong> mmHg</span>
                <span>HR: <strong>{selectedEncounterForPrint.vitals.heartRate || "72"}</strong> bpm</span>
                <span>Temp: <strong>{selectedEncounterForPrint.vitals.temperature || "98.6"}</strong> °F</span>
                <span>SpO2: <strong>{selectedEncounterForPrint.vitals.spO2 || "98"}</strong>%</span>
                <span>BMI: <strong>{selectedEncounterForPrint.vitals.bmi || "23.5"}</strong></span>
              </div>
            )}

            {/* Diagnoses Box */}
            <div className="p-3.5 rounded-xl bg-primary-50 border border-primary-200 text-xs space-y-1">
              <p className="text-primary-800 font-semibold uppercase text-[10px]">Clinical Diagnoses (ICD-10):</p>
              {selectedEncounterForPrint.diagnoses?.map((d, i) => (
                <p key={i} className="font-bold text-slate-900 text-sm">
                  • {d.description} <span className="font-mono text-primary-700">({d.icdCode})</span> {d.isPrimary && <span className="text-[10px] text-primary-600">[Primary]</span>}
                </p>
              )) || <p className="font-bold text-slate-900 text-sm">{selectedEncounterForPrint.chiefComplaint}</p>}
            </div>

            {/* SOAP Clinical Examination Notes */}
            <div className="space-y-1.5 text-xs">
              <p className="font-semibold text-slate-700 uppercase tracking-wide text-[10px]">Doctor Clinical Notes & Evaluation:</p>
              <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 font-sans text-xs whitespace-pre-wrap leading-relaxed">
                {selectedEncounterForPrint.clinicalNotes || selectedEncounterForPrint.chiefComplaint}
              </pre>
            </div>

            {/* Prescriptions Table */}
            {selectedEncounterForPrint.prescriptions && selectedEncounterForPrint.prescriptions.length > 0 && (
              <div className="space-y-2">
                <p className="font-semibold text-slate-700 uppercase tracking-wide text-[10px] flex items-center gap-1.5">
                  <Pill size={14} className="text-rose-600" />
                  Prescribed Medications (Rx):
                </p>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5">Medication</th>
                        <th className="p-2.5">Dosage / Route</th>
                        <th className="p-2.5">Frequency</th>
                        <th className="p-2.5">Duration</th>
                        <th className="p-2.5">Instructions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {selectedEncounterForPrint.prescriptions.map((p, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-bold text-slate-900">{p.medicationName}</td>
                          <td className="p-2.5">{p.dosage} · {p.route}</td>
                          <td className="p-2.5">{p.frequency}</td>
                          <td className="p-2.5">{p.duration}</td>
                          <td className="p-2.5 text-slate-500">{p.instructions || "As directed"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Follow-up disposition */}
            {selectedEncounterForPrint.followUpDays !== undefined && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <p className="text-slate-500 uppercase text-[10px] font-semibold">Follow-Up Schedule</p>
                <p className="font-bold text-slate-900 mt-0.5">
                  Return in {selectedEncounterForPrint.followUpDays} days {selectedEncounterForPrint.followUpInstructions && `— ${selectedEncounterForPrint.followUpInstructions}`}
                </p>
              </div>
            )}

            {/* Signature Area */}
            <div className="pt-8 border-t border-slate-200 flex items-end justify-between text-xs">
              <div>
                <p className="text-slate-400 font-mono text-[10px]">Generated electronically by CuraSphere Clinic Edition</p>
                <p className="text-slate-400 font-mono text-[10px]">Timestamp: {new Date().toISOString()}</p>
              </div>
              <div className="text-right">
                <div className="w-48 border-b border-slate-400 mb-1" />
                <p className="font-bold text-slate-900">{selectedEncounterForPrint.doctorName}</p>
                <p className="text-[10px] text-slate-500">Authorized Clinician Signature</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 print:hidden">
              <Button variant="ghost" onClick={() => setSelectedEncounterForPrint(null)}>
                Close
              </Button>
              <Button
                variant="outline"
                leftIcon={<Printer size={14} />}
                onClick={() => window.print()}
              >
                Print Official Clinical Record
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
