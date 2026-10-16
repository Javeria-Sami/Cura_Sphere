import React, { useState, useEffect } from "react";
import {
  BedDouble, Plus, Search, Filter, Activity, Clock, Heart,
  Printer, Send, UserCheck, FileText, FlaskConical, Scan, Pill, Receipt, CheckCircle2
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
import { ipdService, IpdAdmissionItem } from "../../../services/ipdService";

const initialDoctorsList = [
  "Dr. Sana Qureshi (General Medicine)",
  "Dr. Adeel Khan (Cardiology)",
  "Dr. Mehwish Ali (Orthopedics)",
  "Dr. Faisal Siddiqui (Neurology)",
  "Dr. Kamran Ahmed (Cardiovascular)",
  "Dr. Ayesha Malik (Consultant Physician)",
];

const initialSampleAdmissions: IpdAdmissionItem[] = [
  { admissionId: 1, admissionNumber: "IPD-001", patientId: 101, patientName: "Muhammad Ali", medicalRecordNumber: "MRN-00521", wardName: "Medical Ward A", bedNumber: "B-12", doctorId: 1, doctorName: "Dr. Sana Qureshi (General Medicine)", admissionDate: "2026-08-18", daysAdmitted: 2, primaryDiagnosis: "Acute Gastritis & Dehydration", patientCondition: "Stable", status: "Admitted" },
  { admissionId: 2, admissionNumber: "IPD-002", patientId: 102, patientName: "Ayesha Khan", medicalRecordNumber: "MRN-00498", wardName: "Cardiac Unit", bedNumber: "C-04", doctorId: 2, doctorName: "Dr. Adeel Khan (Cardiology)", admissionDate: "2026-08-19", daysAdmitted: 1, primaryDiagnosis: "Myocardial Infarction", patientCondition: "Critical", status: "Admitted" },
  { admissionId: 3, admissionNumber: "IPD-003", patientId: 103, patientName: "Zara Ahmed", medicalRecordNumber: "MRN-00504", wardName: "Ortho Ward", bedNumber: "O-07", doctorId: 3, doctorName: "Dr. Mehwish Ali (Orthopedics)", admissionDate: "2026-08-17", daysAdmitted: 3, primaryDiagnosis: "Right Femur Fracture", patientCondition: "Stable", status: "Admitted" },
  { admissionId: 4, admissionNumber: "IPD-004", patientId: 104, patientName: "Usman Tariq", medicalRecordNumber: "MRN-00519", wardName: "Neuro Ward", bedNumber: "N-02", doctorId: 4, doctorName: "Dr. Faisal Siddiqui (Neurology)", admissionDate: "2026-08-20", daysAdmitted: 1, primaryDiagnosis: "Cerebral Concussion", patientCondition: "Observation", status: "Admitted" },
];

export default function IPDPage() {
  const [admissions, setAdmissions] = useState<IpdAdmissionItem[]>(initialSampleAdmissions);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [wardFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modals for Report, Doctor Assign, Send Dept
  const [selectedReportAdmission, setSelectedReportAdmission] = useState<IpdAdmissionItem | null>(null);
  const [selectedDoctorAdmission, setSelectedDoctorAdmission] = useState<IpdAdmissionItem | null>(null);
  const [selectedSendAdmission, setSelectedSendAdmission] = useState<IpdAdmissionItem | null>(null);

  // Admission Form State
  const [patientId, setPatientId] = useState("105");
  const [patientNameInput, setPatientNameInput] = useState("");
  const [assignedDoctor, setAssignedDoctor] = useState(initialDoctorsList[0]);
  const [newDoctorSelection, setNewDoctorSelection] = useState(initialDoctorsList[0]);
  const [bedId, setBedId] = useState("1");
  const [diagnosis, setDiagnosis] = useState("");
  const [condition, setCondition] = useState("Stable");
  const [admitting, setAdmitting] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchAdmissions = async () => {
    setLoading(true);
    try {
      const data = await ipdService.getAdmissions(search, wardFilter);
      if (data && data.length > 0) {
        setAdmissions(data);
      }
    } catch {
      // Keep sample admissions
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmissions();
  }, [search, wardFilter]);

  const handleAdmitPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdmitting(true);
    const newAdm: IpdAdmissionItem = {
      admissionId: Date.now(),
      admissionNumber: `IPD-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId: Number(patientId) || 105,
      patientName: patientNameInput || "Admitted Inpatient",
      medicalRecordNumber: `MRN-${Math.floor(10000 + Math.random() * 90000)}`,
      wardName: bedId === "2" ? "Cardiac Unit" : bedId === "3" ? "Ortho Ward" : "Medical Ward A",
      bedNumber: `B-${Math.floor(10 + Math.random() * 80)}`,
      doctorId: 1,
      doctorName: assignedDoctor,
      admissionDate: new Date().toISOString().split("T")[0],
      daysAdmitted: 1,
      primaryDiagnosis: diagnosis || "Inpatient Admission",
      patientCondition: condition,
      status: "Admitted",
    };
    setAdmissions((prev) => [newAdm, ...prev]);
    setIsModalOpen(false);
    setPatientNameInput("");
    setDiagnosis("");
    setAdmitting(false);
    triggerToast(`Patient ${newAdm.patientName} admitted to ${newAdm.wardName} Bed ${newAdm.bedNumber}.`);
  };

  const handleUpdateDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorAdmission) return;
    setAdmissions((prev) =>
      prev.map((a) =>
        a.admissionId === selectedDoctorAdmission.admissionId
          ? { ...a, doctorName: newDoctorSelection }
          : a
      )
    );
    triggerToast(`Attending Doctor updated to ${newDoctorSelection} for ${selectedDoctorAdmission.patientName}.`);
    setSelectedDoctorAdmission(null);
  };

  const handleSendToDepartment = (dept: string, details: string) => {
    if (!selectedSendAdmission) return;
    triggerToast(`Sent Inpatient ${selectedSendAdmission.patientName} (${selectedSendAdmission.admissionNumber}) to ${dept}: ${details}`);
    setSelectedSendAdmission(null);
  };

  const handlePrintReport = () => {
    window.print();
  };

  const handleDischarge = async (id: number) => {
    setAdmissions((prev) =>
      prev.map((a) =>
        a.admissionId === id ? { ...a, status: "Discharged", patientCondition: "Discharged" } : a
      )
    );
    triggerToast("Inpatient successfully discharged.");
  };

  const filteredAdmissions = admissions.filter((a) =>
    a.patientName.toLowerCase().includes(search.toLowerCase()) ||
    a.admissionNumber.toLowerCase().includes(search.toLowerCase()) ||
    a.medicalRecordNumber.toLowerCase().includes(search.toLowerCase()) ||
    a.doctorName.toLowerCase().includes(search.toLowerCase())
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
        title="Inpatient Department (IPD)"
        subtitle="Manage hospital admissions, bed allocation, ward management, and doctor assignments"
        icon={<BedDouble size={20} />}
        actions={
          <>
            <Button size="sm" variant="outline" leftIcon={<Printer size={14} />} onClick={handlePrintReport}>Print Ward Census</Button>
            <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setIsModalOpen(true)}>New Admission</Button>
          </>
        }
      />

      <Alert variant="warning" title="2 Critical Patients Require Immediate Attention">
        Cardiac Unit C-04 and ICU Bed B-08 have patients flagged as critical. Please review immediately.
      </Alert>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Total Admitted" value={admissions.filter(a => a.status === "Admitted").length.toString()} icon={<BedDouble size={20} />} change={3} color="blue" />
        <Stat label="Critical Cases" value={admissions.filter(a => a.patientCondition === "Critical").length.toString()} icon={<Heart size={20} />} color="red" />
        <Stat label="Available Beds" value="43" icon={<Activity size={20} />} color="green" />
        <Stat label="Avg. Stay (days)" value="3.2" icon={<Clock size={20} />} color="yellow" />
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by admission ID, patient, doctor..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 bg-slate-50"
            />
          </div>
          <Button size="sm" variant="outline" leftIcon={<Filter size={14} />}>Filter by Ward</Button>
        </div>

        <Table
          keyField="admissionId"
          loading={loading}
          data={filteredAdmissions}
          columns={[
            {
              key: "admissionNumber",
              header: "Admission ID",
              render: (r) => <span className="font-mono text-xs font-bold text-slate-800">{r.admissionNumber}</span>
            },
            {
              key: "patientName",
              header: "Patient Demographics",
              render: (r) => (
                <div>
                  <p className="text-sm font-semibold text-slate-900">{r.patientName}</p>
                  <p className="text-xs font-mono text-slate-400">{r.medicalRecordNumber}</p>
                </div>
              )
            },
            {
              key: "wardName",
              header: "Ward / Bed",
              render: (r) => (
                <div>
                  <p className="text-sm font-medium text-slate-800">{r.wardName}</p>
                  <p className="text-xs font-mono text-primary-600 font-bold">{r.bedNumber}</p>
                </div>
              )
            },
            {
              key: "doctorName",
              header: "Attending Physician",
              render: (r) => (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-700 font-medium">{r.doctorName}</span>
                  <button
                    onClick={() => { setSelectedDoctorAdmission(r); setNewDoctorSelection(r.doctorName); }}
                    className="p-1 text-slate-400 hover:text-primary-600 rounded-lg hover:bg-slate-100 transition-all"
                    title="Assign / Change Doctor"
                  >
                    <UserCheck size={14} />
                  </button>
                </div>
              )
            },
            {
              key: "patientCondition",
              header: "Condition",
              render: (r) => (
                <Badge variant={r.patientCondition === "Stable" ? "success" : r.patientCondition === "Critical" ? "danger" : "warning"}>
                  {r.patientCondition}
                </Badge>
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
                    onClick={() => setSelectedReportAdmission(r)}
                  >
                    Report
                  </Button>

                  <Button
                    size="sm"
                    variant="primary"
                    leftIcon={<Send size={13} />}
                    onClick={() => setSelectedSendAdmission(r)}
                  >
                    Send Dept
                  </Button>

                  {r.status === "Admitted" ? (
                    <Button size="sm" variant="ghost" className="text-slate-600" onClick={() => handleDischarge(r.admissionId)}>
                      Discharge
                    </Button>
                  ) : (
                    <Badge variant="secondary">Discharged</Badge>
                  )}
                </div>
              )
            },
          ]}
        />
      </div>

      {/* 1. VIEW & PRINT IPD ADMISSION REPORT MODAL */}
      {selectedReportAdmission && (
        <Modal
          open={!!selectedReportAdmission}
          onClose={() => setSelectedReportAdmission(null)}
          title={`Inpatient Admission Report — ${selectedReportAdmission.admissionNumber}`}
          description="Official Hospital Inpatient Summary & Daily Clinical Record"
        >
          <div className="space-y-6 print:p-0">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center font-bold text-lg">
                  IPD
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg leading-tight">CuraSphere Inpatient Admission Report</h3>
                  <p className="text-xs text-slate-500 font-mono">Admission #: {selectedReportAdmission.admissionNumber} | Admitted Date: {selectedReportAdmission.admissionDate}</p>
                </div>
              </div>
              <Badge variant={selectedReportAdmission.patientCondition === "Critical" ? "danger" : "success"}>
                {selectedReportAdmission.patientCondition}
              </Badge>
            </div>

            {/* Grid details */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <p className="text-slate-400 font-semibold uppercase">Inpatient Demographics</p>
                <p className="text-sm font-bold text-slate-900 mt-1">{selectedReportAdmission.patientName}</p>
                <p className="text-slate-600">MRN: <span className="font-mono">{selectedReportAdmission.medicalRecordNumber}</span></p>
                <p className="text-slate-600">Assigned Ward: {selectedReportAdmission.wardName}</p>
                <p className="text-slate-600">Bed Number: <span className="font-mono font-bold text-primary-600">{selectedReportAdmission.bedNumber}</span></p>
              </div>

              <div>
                <p className="text-slate-400 font-semibold uppercase">Attending Physician & Length of Stay</p>
                <p className="text-sm font-bold text-primary-700 mt-1">{selectedReportAdmission.doctorName}</p>
                <p className="text-slate-600">Days Admitted: {selectedReportAdmission.daysAdmitted} Day(s)</p>
                <p className="text-slate-600">Admission Status: {selectedReportAdmission.status}</p>
              </div>
            </div>

            {/* Clinical Diagnosis */}
            <div className="space-y-2 text-xs">
              <p className="font-semibold text-slate-700">Primary Admission Diagnosis:</p>
              <p className="p-3 rounded-xl bg-primary-50 text-primary-900 font-semibold">{selectedReportAdmission.primaryDiagnosis}</p>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <Button variant="ghost" onClick={() => setSelectedReportAdmission(null)}>Close</Button>
              <div className="flex gap-2">
                <Button variant="outline" leftIcon={<Printer size={14} />} onClick={handlePrintReport}>
                  Print Admission Report
                </Button>
                <Button
                  leftIcon={<Send size={14} />}
                  onClick={() => {
                    const a = selectedReportAdmission;
                    setSelectedReportAdmission(null);
                    setSelectedSendAdmission(a);
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
      {selectedDoctorAdmission && (
        <Modal
          open={!!selectedDoctorAdmission}
          onClose={() => setSelectedDoctorAdmission(null)}
          title={`Assign Attending Doctor — ${selectedDoctorAdmission.patientName}`}
          description="Update primary physician responsible for inpatient ward care"
        >
          <form onSubmit={handleUpdateDoctor} className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <p className="font-semibold text-slate-700">Inpatient: {selectedDoctorAdmission.patientName} ({selectedDoctorAdmission.medicalRecordNumber})</p>
              <p className="text-slate-500 mt-0.5">Current Attending Doctor: <span className="font-bold text-slate-800">{selectedDoctorAdmission.doctorName}</span></p>
            </div>

            <Select
              label="Select New Attending Doctor"
              value={newDoctorSelection}
              onChange={(e) => setNewDoctorSelection(e.target.value)}
              options={initialDoctorsList.map((doc) => ({ value: doc, label: doc }))}
            />

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <Button type="button" variant="ghost" onClick={() => setSelectedDoctorAdmission(null)}>Cancel</Button>
              <Button type="submit" variant="primary">Confirm Doctor Assignment</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* 3. SEND TO DEPARTMENT OPTIONS MODAL */}
      {selectedSendAdmission && (
        <Modal
          open={!!selectedSendAdmission}
          onClose={() => setSelectedSendAdmission(null)}
          title={`Send Inpatient ${selectedSendAdmission.patientName} to Hospital Department`}
          description="Dispatch lab test, PACS radiology order, e-prescription, billing, or ICU transfer"
        >
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-between">
              <div>
                <p className="font-bold text-primary-900">{selectedSendAdmission.patientName} ({selectedSendAdmission.admissionNumber})</p>
                <p className="text-primary-700">Ward: {selectedSendAdmission.wardName} ({selectedSendAdmission.bedNumber}) | Diagnosis: {selectedSendAdmission.primaryDiagnosis}</p>
              </div>
              <Badge variant="primary">{selectedSendAdmission.patientCondition}</Badge>
            </div>

            <p className="font-semibold text-slate-700 pt-2">Select Target Department Action:</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleSendToDepartment("Laboratory", "CBC, Electrolytes, Arterial Blood Gas & Urinalysis Ordered")}
                className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-purple-400 hover:bg-purple-50 transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                  <FlaskConical size={16} />
                </div>
                <div>
                  <p className="font-bold text-slate-900 group-hover:text-purple-700">1. Send to Laboratory</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Order inpatient daily blood panel & biochemistry</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSendToDepartment("Radiology / PACS", "Chest X-Ray Portable & Ultrasound PACS Order Created")}
                className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Scan size={16} />
                </div>
                <div>
                  <p className="font-bold text-slate-900 group-hover:text-blue-700">2. Send to Radiology (PACS)</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Generate portable bedside X-Ray or MRI PACS order</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSendToDepartment("Pharmacy", "Daily Inpatient Medication & IV Drip Cart Dispatched")}
                className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Pill size={16} />
                </div>
                <div>
                  <p className="font-bold text-slate-900 group-hover:text-emerald-700">3. Send to Pharmacy</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Fulfill inpatient e-prescriptions & IV fluid bags</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSendToDepartment("Billing & Cashier", "Itemized Inpatient Interim Ledger Updated")}
                className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50 transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Receipt size={16} />
                </div>
                <div>
                  <p className="font-bold text-slate-900 group-hover:text-amber-700">4. Send to Billing Desk</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Update daily ward bed charges & nursing fee ledger</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSendToDepartment("ICU Critical Care", "Patient Escalated & Transferred to ICU Bed Telemetry")}
                className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-red-400 hover:bg-red-50 transition-all text-left group md:col-span-2"
              >
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Heart size={16} />
                </div>
                <div>
                  <p className="font-bold text-slate-900 group-hover:text-red-700">5. Escalate & Transfer to ICU Telemetry</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Transfer critical inpatient to Intensive Care Unit telemetry monitoring</p>
                </div>
              </button>
            </div>

            <div className="flex justify-end pt-3">
              <Button variant="ghost" onClick={() => setSelectedSendAdmission(null)}>Cancel</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 4. NEW IPD ADMISSION MODAL */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Admit Patient to IPD Ward"
        description="Assign ward bed, attending physician, and primary admission diagnosis"
      >
        <form onSubmit={handleAdmitPatient} className="space-y-4">
          <Input
            label="Patient Name"
            value={patientNameInput}
            onChange={(e) => setPatientNameInput(e.target.value)}
            placeholder="e.g. Fatima Malik"
            required
          />
          <Input
            label="Patient ID / MRN"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            placeholder="Enter Patient ID"
            required
          />
          <Select
            label="Attending Physician"
            value={assignedDoctor}
            onChange={(e) => setAssignedDoctor(e.target.value)}
            options={initialDoctorsList.map((doc) => ({ value: doc, label: doc }))}
          />
          <Select
            label="Ward & Bed Selection"
            value={bedId}
            onChange={(e) => setBedId(e.target.value)}
            options={[
              { value: "1", label: "Medical Ward A — Bed B-12" },
              { value: "2", label: "Cardiac Unit — Bed C-04" },
              { value: "3", label: "Ortho Ward — Bed O-07" },
              { value: "4", label: "Neuro Ward — Bed N-02" },
            ]}
          />
          <Input
            label="Primary Admission Diagnosis"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            placeholder="e.g. Acute Appendicitis, Pneumonia"
            required
          />
          <Select
            label="Initial Patient Condition"
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            options={[
              { value: "Stable", label: "Stable" },
              { value: "Critical", label: "Critical" },
              { value: "Observation", label: "Observation" },
            ]}
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={admitting}>Admit Patient</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

