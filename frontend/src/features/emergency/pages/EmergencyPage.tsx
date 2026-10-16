import React, { useState } from "react";
import {
  Plus, Clock, CheckCircle2, Activity, Search, Filter, AlertTriangle,
  Printer, Send, UserCheck, FileText, FlaskConical, Scan, Pill, Receipt, BedDouble
} from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { Stat } from "../../../components/ui/Stat";
import { Table } from "../../../components/ui/Table";
import { Alert } from "../../../components/ui/Alert";
import { Modal } from "../../../components/ui/Modal";
import { Select } from "../../../components/ui/Select";
import { Input } from "../../../components/ui/Input";
import PageHeader from "../../../components/layout/PageHeader";
import { useSignalR } from "../../../hooks/useSignalR";

interface EmergencyItem {
  emergencyCaseId: number;
  caseNumber: string;
  patientId: number;
  patientName: string;
  medicalRecordNumber: string;
  age: number;
  gender: string;
  chiefComplaint: string;
  triageLevel: string;
  doctorName: string;
  arrivalTime: string;
  vitals: { bp: string; hr: number; temp: string; spo2: number };
  primaryDiagnosis: string;
  status: string;
}

const initialDoctors = [
  "Dr. Adeel Khan (Trauma Specialist)",
  "Dr. Sana Qureshi (Emergency Officer)",
  "Dr. Kamran Ahmed (Cardiologist)",
  "Dr. Mehwish Ali (Orthopedic Surgeon)",
  "Dr. Faisal Siddiqui (Neurologist)",
  "Dr. Ayesha Malik (Consultant Physician)",
];

const sampleEmergencyCases: EmergencyItem[] = [
  {
    emergencyCaseId: 1,
    caseNumber: "EM-0892",
    patientId: 101,
    patientName: "Muhammad Ali",
    medicalRecordNumber: "MRN-00521",
    age: 34,
    gender: "Male",
    chiefComplaint: "Severe Trauma / Road Traffic Accident",
    triageLevel: "P1",
    doctorName: "Dr. Adeel Khan (Trauma Specialist)",
    arrivalTime: "10:15 AM",
    vitals: { bp: "90/60", hr: 118, temp: "98.6°F", spo2: 92 },
    primaryDiagnosis: "Polytrauma / Suspected Internal Hemorrhage",
    status: "Under Treatment"
  },
  {
    emergencyCaseId: 2,
    caseNumber: "EM-0893",
    patientId: 102,
    patientName: "Ayesha Khan",
    medicalRecordNumber: "MRN-00498",
    age: 28,
    gender: "Female",
    chiefComplaint: "Acute Abdominal Pain & Vomiting",
    triageLevel: "P2",
    doctorName: "Dr. Sana Qureshi (Emergency Officer)",
    arrivalTime: "10:30 AM",
    vitals: { bp: "120/80", hr: 88, temp: "100.4°F", spo2: 98 },
    primaryDiagnosis: "Acute Appendicitis",
    status: "Under Treatment"
  },
  {
    emergencyCaseId: 3,
    caseNumber: "EM-0894",
    patientId: 103,
    patientName: "Zara Ahmed",
    medicalRecordNumber: "MRN-00504",
    age: 45,
    gender: "Female",
    chiefComplaint: "Laceration / Minor Wound on Forearm",
    triageLevel: "P3",
    doctorName: "Dr. Mehwish Ali (Orthopedic Surgeon)",
    arrivalTime: "10:45 AM",
    vitals: { bp: "118/75", hr: 76, temp: "98.4°F", spo2: 99 },
    primaryDiagnosis: "Forearm Laceration — Suture Required",
    status: "Stabilizing"
  },
  {
    emergencyCaseId: 4,
    caseNumber: "EM-0895",
    patientId: 104,
    patientName: "Usman Tariq",
    medicalRecordNumber: "MRN-00519",
    age: 52,
    gender: "Male",
    chiefComplaint: "Crushing Chest Pain / Shortness of Breath",
    triageLevel: "P1",
    doctorName: "Dr. Kamran Ahmed (Cardiologist)",
    arrivalTime: "11:00 AM",
    vitals: { bp: "150/95", hr: 104, temp: "98.8°F", spo2: 94 },
    primaryDiagnosis: "Acute Coronary Syndrome / ST-Elevation MI",
    status: "Under Treatment"
  },
];

export default function EmergencyPage() {
  const [cases, setCases] = useState<EmergencyItem[]>(sampleEmergencyCases);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isConnected, latestAlert } = useSignalR();

  // Modals for Report, Doctor Assign, Send Dept
  const [selectedReportCase, setSelectedReportCase] = useState<EmergencyItem | null>(null);
  const [selectedDoctorCase, setSelectedDoctorCase] = useState<EmergencyItem | null>(null);
  const [selectedSendCase, setSelectedSendCase] = useState<EmergencyItem | null>(null);

  // Form State
  const [patientId, setPatientId] = useState("105");
  const [patientNameInput, setPatientNameInput] = useState("");
  const [triage, setTriage] = useState("P1");
  const [complaint, setComplaint] = useState("");
  const [assignedDoctor, setAssignedDoctor] = useState(initialDoctors[0]);
  const [newDoctorSelection, setNewDoctorSelection] = useState(initialDoctors[0]);

  // Dept Send Feedback Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleRegisterEmergency = (e: React.FormEvent) => {
    e.preventDefault();
    const newCase: EmergencyItem = {
      emergencyCaseId: Date.now(),
      caseNumber: `EM-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId: Number(patientId) || 105,
      patientName: patientNameInput || "Emergency Patient",
      medicalRecordNumber: `MRN-${Math.floor(10000 + Math.random() * 90000)}`,
      age: 38,
      gender: "Male",
      chiefComplaint: complaint,
      triageLevel: triage,
      doctorName: assignedDoctor,
      arrivalTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      vitals: { bp: "120/80", hr: 84, temp: "98.6°F", spo2: 97 },
      primaryDiagnosis: complaint,
      status: "Under Treatment",
    };
    setCases((prev) => [newCase, ...prev]);
    setIsModalOpen(false);
    setPatientNameInput("");
    setComplaint("");
    triggerToast(`Emergency Case ${newCase.caseNumber} registered and assigned to ${newCase.doctorName}.`);
  };

  const handleUpdateDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorCase) return;
    setCases((prev) =>
      prev.map((c) =>
        c.emergencyCaseId === selectedDoctorCase.emergencyCaseId
          ? { ...c, doctorName: newDoctorSelection }
          : c
      )
    );
    triggerToast(`Attending Physician updated to ${newDoctorSelection} for ${selectedDoctorCase.patientName}.`);
    setSelectedDoctorCase(null);
  };

  const handleSendToDepartment = (dept: string, details: string) => {
    if (!selectedSendCase) return;
    triggerToast(`Sent ${selectedSendCase.patientName} (${selectedSendCase.caseNumber}) to ${dept}: ${details}`);
    setSelectedSendCase(null);
  };

  const handlePrintReport = () => {
    window.print();
  };

  const filteredCases = cases.filter((c) =>
    c.patientName.toLowerCase().includes(search.toLowerCase()) ||
    c.caseNumber.toLowerCase().includes(search.toLowerCase()) ||
    c.medicalRecordNumber.toLowerCase().includes(search.toLowerCase()) ||
    c.doctorName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl mx-auto animate-fade-in print:p-0 print:m-0">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 bg-slate-900 text-white rounded-2xl shadow-xl">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      <PageHeader
        title="Emergency & Trauma Unit"
        subtitle="24/7 emergency triage, critical care management, and trauma response"
        icon={<Activity size={20} />}
        badge={
          <Badge variant={isConnected ? "success" : "default"} className="flex items-center gap-1">
            <Activity className="w-3 h-3 animate-pulse" />
            {isConnected ? "Live Telemetry Connected" : "Telemetry Polling"}
          </Badge>
        }
        actions={
          <>
            <Button size="sm" variant="outline" leftIcon={<Printer size={14} />} onClick={handlePrintReport}>Print Triage Board</Button>
            <Button size="sm" variant="danger" leftIcon={<Plus size={14} />} onClick={() => setIsModalOpen(true)}>New Emergency Entry</Button>
          </>
        }
      />

      {latestAlert && (
        <Alert variant="warning" title={`Live P1 Alert: ${latestAlert.caseNumber} - ${latestAlert.patientName}`}>
          Emergency triage classification updated in real-time. Timestamp: {latestAlert.timestamp}
        </Alert>
      )}

      <Alert variant="error" title="Red Alert: 2 Critical P1 Trauma Cases Active">
        Resuscitation Bay 1 and Bay 3 currently operating at peak emergency capacity.
      </Alert>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Active Cases" value={cases.length.toString()} icon={<Activity size={20} />} change={4} color="red" />
        <Stat label="P1 Critical" value={cases.filter(c => c.triageLevel === "P1").length.toString()} icon={<AlertTriangle size={20} />} color="red" />
        <Stat label="P2 Urgent" value={cases.filter(c => c.triageLevel === "P2").length.toString()} icon={<Clock size={20} />} color="yellow" />
        <Stat label="P3 Standard" value={cases.filter(c => c.triageLevel === "P3").length.toString()} icon={<CheckCircle2 size={20} />} color="green" />
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by case ID, patient, doctor..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 bg-slate-50"
            />
          </div>
          <Button size="sm" variant="outline" leftIcon={<Filter size={14} />}>Filter Priority</Button>
        </div>

        <Table
          keyField="emergencyCaseId"
          data={filteredCases}
          columns={[
            {
              key: "caseNumber",
              header: "Case ID",
              render: (r) => (
                <div>
                  <span className="font-mono font-bold text-slate-900">{r.caseNumber}</span>
                  <p className="text-[10px] text-slate-400">{r.arrivalTime}</p>
                </div>
              )
            },
            {
              key: "triageLevel",
              header: "Triage Priority",
              render: (r) => (
                <Badge variant={r.triageLevel === "P1" ? "danger" : r.triageLevel === "P2" ? "warning" : "success"}>
                  {r.triageLevel} {r.triageLevel === "P1" ? "Critical" : r.triageLevel === "P2" ? "Urgent" : "Standard"}
                </Badge>
              )
            },
            {
              key: "patientName",
              header: "Patient Demographics",
              render: (r) => (
                <div>
                  <p className="text-sm font-semibold text-slate-900">{r.patientName}</p>
                  <p className="text-xs font-mono text-slate-400">{r.medicalRecordNumber} · {r.age} yrs ({r.gender})</p>
                </div>
              )
            },
            {
              key: "chiefComplaint",
              header: "Chief Complaint / Vitals",
              render: (r) => (
                <div>
                  <p className="text-sm font-medium text-slate-800">{r.chiefComplaint}</p>
                  <p className="text-xs font-mono text-primary-600 mt-0.5">
                    BP {r.vitals.bp} | HR {r.vitals.hr} bpm | SpO2 {r.vitals.spo2}%
                  </p>
                </div>
              )
            },
            {
              key: "doctorName",
              header: "Attending Doctor",
              render: (r) => (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-700">{r.doctorName}</span>
                  <button
                    onClick={() => { setSelectedDoctorCase(r); setNewDoctorSelection(r.doctorName); }}
                    className="p-1 text-slate-400 hover:text-primary-600 rounded-lg hover:bg-slate-100 transition-all"
                    title="Change / Assign Doctor"
                  >
                    <UserCheck size={14} />
                  </button>
                </div>
              )
            },
            {
              key: "actions",
              header: "Clinical Actions",
              align: "right",
              render: (r) => (
                <div className="flex items-center justify-end gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<FileText size={13} />}
                    onClick={() => setSelectedReportCase(r)}
                  >
                    View Report
                  </Button>

                  <Button
                    size="sm"
                    variant="primary"
                    leftIcon={<Send size={13} />}
                    onClick={() => setSelectedSendCase(r)}
                  >
                    Send to Dept
                  </Button>
                </div>
              )
            },
          ]}
        />
      </div>

      {/* 1. VIEW & PRINT CLINICAL REPORT MODAL */}
      {selectedReportCase && (
        <Modal
          open={!!selectedReportCase}
          onClose={() => setSelectedReportCase(null)}
          title={`Emergency Clinical Report — ${selectedReportCase.caseNumber}`}
          description="Official Inpatient / Emergency Clinical Summary Report"
        >
          <div className="space-y-6 print:p-0">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-danger-600 text-white flex items-center justify-center font-bold text-lg">
                  EM
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg leading-tight">CuraSphere Emergency Care Report</h3>
                  <p className="text-xs text-slate-500 font-mono">Case #: {selectedReportCase.caseNumber} | Date: {new Date().toLocaleDateString()}</p>
                </div>
              </div>
              <Badge variant={selectedReportCase.triageLevel === "P1" ? "danger" : "warning"}>
                Triage {selectedReportCase.triageLevel}
              </Badge>
            </div>

            {/* Patient & Doctor Grid */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <p className="text-slate-400 font-semibold uppercase">Patient Information</p>
                <p className="text-sm font-bold text-slate-900 mt-1">{selectedReportCase.patientName}</p>
                <p className="text-slate-600">MRN: <span className="font-mono">{selectedReportCase.medicalRecordNumber}</span></p>
                <p className="text-slate-600">Age / Gender: {selectedReportCase.age} Yrs / {selectedReportCase.gender}</p>
                <p className="text-slate-600">Arrival Time: {selectedReportCase.arrivalTime}</p>
              </div>

              <div>
                <p className="text-slate-400 font-semibold uppercase">Attending Physician & Department</p>
                <p className="text-sm font-bold text-primary-700 mt-1">{selectedReportCase.doctorName}</p>
                <p className="text-slate-600">Department: Emergency & Trauma Care</p>
                <p className="text-slate-600">Status: {selectedReportCase.status}</p>
              </div>
            </div>

            {/* Vitals Summary */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Recorded Vitals</p>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100">
                  <p className="text-slate-500">Blood Pressure</p>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedReportCase.vitals.bp}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-100">
                  <p className="text-slate-500">Heart Rate</p>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedReportCase.vitals.hr} bpm</p>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100">
                  <p className="text-slate-500">Temperature</p>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedReportCase.vitals.temp}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                  <p className="text-slate-500">Oxygen (SpO2)</p>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedReportCase.vitals.spo2}%</p>
                </div>
              </div>
            </div>

            {/* Diagnosis & Notes */}
            <div className="space-y-2 text-xs">
              <div>
                <p className="font-semibold text-slate-700">Chief Complaint:</p>
                <p className="p-2.5 rounded-xl bg-slate-100 text-slate-800 font-medium">{selectedReportCase.chiefComplaint}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-700">Primary Diagnosis:</p>
                <p className="p-2.5 rounded-xl bg-primary-50 text-primary-800 font-semibold">{selectedReportCase.primaryDiagnosis}</p>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <Button variant="ghost" onClick={() => setSelectedReportCase(null)}>Close Report</Button>
              <div className="flex gap-2">
                <Button variant="outline" leftIcon={<Printer size={14} />} onClick={handlePrintReport}>
                  Print Printable Report
                </Button>
                <Button
                  leftIcon={<Send size={14} />}
                  onClick={() => {
                    const c = selectedReportCase;
                    setSelectedReportCase(null);
                    setSelectedSendCase(c);
                  }}
                >
                  Send to Department Options
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* 2. ASSIGN / CHANGE DOCTOR MODAL */}
      {selectedDoctorCase && (
        <Modal
          open={!!selectedDoctorCase}
          onClose={() => setSelectedDoctorCase(null)}
          title={`Assign Doctor — ${selectedDoctorCase.patientName}`}
          description="Update attending physician for emergency case"
        >
          <form onSubmit={handleUpdateDoctor} className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <p className="font-semibold text-slate-700">Patient: {selectedDoctorCase.patientName} ({selectedDoctorCase.medicalRecordNumber})</p>
              <p className="text-slate-500 mt-0.5">Current Doctor: <span className="font-bold text-slate-800">{selectedDoctorCase.doctorName}</span></p>
            </div>

            <Select
              label="Select New Attending Physician"
              value={newDoctorSelection}
              onChange={(e) => setNewDoctorSelection(e.target.value)}
              options={initialDoctors.map((doc) => ({ value: doc, label: doc }))}
            />

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <Button type="button" variant="ghost" onClick={() => setSelectedDoctorCase(null)}>Cancel</Button>
              <Button type="submit" variant="primary">Confirm Doctor Assignment</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* 3. SEND TO DEPARTMENT OPTIONS MODAL */}
      {selectedSendCase && (
        <Modal
          open={!!selectedSendCase}
          onClose={() => setSelectedSendCase(null)}
          title={`Send ${selectedSendCase.patientName} to Hospital Department`}
          description="Dispatch lab test, PACS radiology order, e-prescription, billing, or IPD transfer"
        >
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-between">
              <div>
                <p className="font-bold text-primary-900">{selectedSendCase.patientName} ({selectedSendCase.caseNumber})</p>
                <p className="text-primary-700">MRN: {selectedSendCase.medicalRecordNumber} | Diagnosis: {selectedSendCase.primaryDiagnosis}</p>
              </div>
              <Badge variant="primary">{selectedSendCase.triageLevel}</Badge>
            </div>

            <p className="font-semibold text-slate-700 pt-2">Select Target Department Action:</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {/* Send to Lab */}
              <button
                type="button"
                onClick={() => handleSendToDepartment("Laboratory", "CBC, LFTs, Blood Grouping & Troponin Panel Requested")}
                className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-purple-400 hover:bg-purple-50 transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                  <FlaskConical size={16} />
                </div>
                <div>
                  <p className="font-bold text-slate-900 group-hover:text-purple-700">1. Send to Laboratory</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Order blood panel, biochemistry & STAT lab tests</p>
                </div>
              </button>

              {/* Send to Radiology */}
              <button
                type="button"
                onClick={() => handleSendToDepartment("Radiology / PACS", "Chest X-Ray & Abdominal CT Scan Accession Order Created")}
                className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Scan size={16} />
                </div>
                <div>
                  <p className="font-bold text-slate-900 group-hover:text-blue-700">2. Send to Radiology (PACS)</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Generate X-Ray, CT Scan or MRI accession order</p>
                </div>
              </button>

              {/* Send to Pharmacy */}
              <button
                type="button"
                onClick={() => handleSendToDepartment("Pharmacy", "E-Prescription Dispatched for STAT Medication Fulfillment")}
                className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Pill size={16} />
                </div>
                <div>
                  <p className="font-bold text-slate-900 group-hover:text-emerald-700">3. Send to Pharmacy</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Transmit electronic prescription & STAT IV order</p>
                </div>
              </button>

              {/* Send to Billing */}
              <button
                type="button"
                onClick={() => handleSendToDepartment("Billing & Cashier", "Itemized Emergency Invoice INV-2026-EMG Created")}
                className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50 transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Receipt size={16} />
                </div>
                <div>
                  <p className="font-bold text-slate-900 group-hover:text-amber-700">4. Send to Billing Desk</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Generate itemized invoice for cashier payment</p>
                </div>
              </button>

              {/* Transfer to IPD Ward / ICU */}
              <button
                type="button"
                onClick={() => handleSendToDepartment("IPD Admission Wards", "Transferred to Inpatient Ward / ICU Bed Allocation Queue")}
                className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-red-400 hover:bg-red-50 transition-all text-left group md:col-span-2"
              >
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                  <BedDouble size={16} />
                </div>
                <div>
                  <p className="font-bold text-slate-900 group-hover:text-red-700">5. Transfer to IPD Ward / ICU Bed</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Direct inpatient admission, bed allocation & telemetry transfer</p>
                </div>
              </button>
            </div>

            <div className="flex justify-end pt-3">
              <Button variant="ghost" onClick={() => setSelectedSendCase(null)}>Cancel</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 4. NEW EMERGENCY REGISTRATION MODAL */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register Emergency / Trauma Arrival"
        description="Immediate triage entry for arriving emergency patient"
      >
        <form onSubmit={handleRegisterEmergency} className="space-y-4">
          <Input
            label="Patient Name"
            value={patientNameInput}
            onChange={(e) => setPatientNameInput(e.target.value)}
            placeholder="e.g. Tariq Mahmood"
            required
          />
          <Input
            label="Patient ID / Temporary MRN"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            placeholder="Enter ID or Auto-assigned"
            required
          />
          <Select
            label="Triage Priority Category"
            value={triage}
            onChange={(e) => setTriage(e.target.value)}
            options={[
              { value: "P1", label: "P1 - Critical (Immediate Resuscitation Required)" },
              { value: "P2", label: "P2 - Urgent (Requires Treatment within 15 mins)" },
              { value: "P3", label: "P3 - Standard (Non-life threatening)" },
            ]}
          />
          <Input
            label="Chief Complaint / Injury Details"
            value={complaint}
            onChange={(e) => setComplaint(e.target.value)}
            placeholder="Road accident, acute chest pain, trauma, etc."
            required
          />
          <Select
            label="Attending Emergency Physician"
            value={assignedDoctor}
            onChange={(e) => setAssignedDoctor(e.target.value)}
            options={initialDoctors.map((doc) => ({ value: doc, label: doc }))}
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="danger">Register Emergency Patient</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

