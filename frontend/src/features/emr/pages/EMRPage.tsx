import { useState } from "react";
import { FileText, Plus, Search, Filter, Printer, FileCheck, ClipboardList, Stethoscope, CheckCircle2 } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { Stat } from "../../../components/ui/Stat";
import { Table } from "../../../components/ui/Table";
import { Tabs, TabList, Tab, TabPanel } from "../../../components/ui/Tabs";
import { Modal } from "../../../components/ui/Modal";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import PageHeader from "../../../components/layout/PageHeader";

interface EmrRecordItem {
  id: string;
  mrn: string;
  patient: string;
  age: number;
  doctor: string;
  date: string;
  visit: string;
  diagnosis: string;
  icdCode: string;
  type: string;
  soapNotes: string;
}

const initialRecords: EmrRecordItem[] = [
  { id: "EMR-001", mrn: "MRN-00521", patient: "Muhammad Ali", age: 34, doctor: "Dr. Sana Qureshi", date: "2026-08-20", visit: "General Medicine OPD", diagnosis: "Essential Hypertension", icdCode: "ICD-10 I10", type: "New", soapNotes: "S: Complaints of persistent occipital headaches for 3 days.\nO: BP 145/95 mmHg, HR 78 bpm.\nA: Essential Hypertension Grade 1.\nP: Started Amlodipine 5mg daily. Advised low salt diet." },
  { id: "EMR-002", mrn: "MRN-00498", patient: "Ayesha Khan", age: 28, doctor: "Dr. Adeel Khan", date: "2026-08-19", visit: "Cardiology Unit", diagnosis: "Cardiac Arrhythmia", icdCode: "ICD-10 I49.9", type: "Follow-up", soapNotes: "S: Occasional palpitations after strenuous exercise.\nO: ECG shows sinus rhythm with occasional PACs.\nA: Benign Cardiac Arrhythmia.\nP: Continue Beta-blocker dosage, follow up in 4 weeks." },
  { id: "EMR-003", mrn: "MRN-00504", patient: "Zara Ahmed", age: 45, doctor: "Dr. Mehwish Ali", date: "2026-08-18", visit: "Orthopedics OPD", diagnosis: "Lumbar Disc Protrusion", icdCode: "ICD-10 M51.2", type: "Review", soapNotes: "S: Lower back stiffness radiating to right leg.\nO: Straight leg raise test positive at 60 degrees.\nA: L4-L5 Lumbar Disc Degeneration.\nP: Physical therapy twice weekly, NSAIDs prn." },
  { id: "EMR-004", mrn: "MRN-00519", patient: "Usman Tariq", age: 52, doctor: "Dr. Faisal Siddiqui", date: "2026-08-20", visit: "Neurology Clinic", diagnosis: "Chronic Migraine", icdCode: "ICD-10 G43.9", type: "New", soapNotes: "S: Unilateral throbbing headache with photophobia.\nO: Cranial nerve examination unremarkable.\nA: Acute Migraine Episode.\nP: Triptan acute therapy prescribed, sleep hygiene counselled." },
];

export default function EMRPage() {
  const [recordsList, setRecordsList] = useState<EmrRecordItem[]>(initialRecords);
  const [search, setSearch] = useState("");
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<EmrRecordItem | null>(null);

  // Form State
  const [patientName, setPatientName] = useState("");
  const [age, setAge] = useState("30");
  const [doctorName, setDoctorName] = useState("Dr. Sana Qureshi");
  const [diagnosis, setDiagnosis] = useState("");
  const [icdCode, setIcdCode] = useState("ICD-10 Z00.0");
  const [soapNotes, setSoapNotes] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCreateEncounter = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: EmrRecordItem = {
      id: `EMR-${Math.floor(100 + Math.random() * 900)}`,
      mrn: `MRN-${Math.floor(10000 + Math.random() * 90000)}`,
      patient: patientName || "Patient",
      age: Number(age) || 30,
      doctor: doctorName,
      date: new Date().toISOString().split("T")[0],
      visit: "Outpatient Encounter",
      diagnosis: diagnosis || "General Medical Examination",
      icdCode: icdCode,
      type: "New",
      soapNotes: soapNotes || "Subjective: Patient evaluated. Objective: Vitals stable. Assessment: Routine encounter. Plan: Treatment scheduled.",
    };
    setRecordsList([newRecord, ...recordsList]);
    setIsNewModalOpen(false);
    setPatientName("");
    setDiagnosis("");
    setSoapNotes("");
    triggerToast(`EMR Encounter ${newRecord.id} recorded for ${newRecord.patient}.`);
  };

  const handlePrint = () => {
    window.print();
  };

  const filtered = recordsList.filter(
    (r) =>
      r.patient.toLowerCase().includes(search.toLowerCase()) ||
      r.diagnosis.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.mrn.toLowerCase().includes(search.toLowerCase())
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
        title="Electronic Medical Records (EMR)"
        subtitle="Manage patient clinical records, ICD-10 diagnoses, encounter SOAP notes, and medical history"
        icon={<FileText size={20} />}
        actions={
          <>
            <Button size="sm" variant="outline" leftIcon={<Printer size={14} />} onClick={handlePrint}>Print EMR Register</Button>
            <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setIsNewModalOpen(true)}>New Encounter</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Total EMR Records" value={recordsList.length.toString()} icon={<FileText size={20} />} change={34} color="blue" />
        <Stat label="Today's Encounters" value="48" icon={<Stethoscope size={20} />} change={12} color="green" />
        <Stat label="Pending Review" value="3" icon={<ClipboardList size={20} />} color="yellow" />
        <Stat label="Signed Off" value="45" icon={<FileCheck size={20} />} change={8} color="cyan" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by patient name, MRN, diagnosis..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 bg-slate-50"
            />
          </div>
          <Button size="sm" variant="outline" leftIcon={<Filter size={14} />}>Filter</Button>
        </div>

        <Tabs defaultTab="all">
          <div className="px-5 pt-4">
            <TabList>
              <Tab value="all">All Records ({filtered.length})</Tab>
              <Tab value="new">New ({filtered.filter(r => r.type === "New").length})</Tab>
              <Tab value="followup">Follow-up ({filtered.filter(r => r.type === "Follow-up" || r.type === "Review").length})</Tab>
            </TabList>
          </div>

          <TabPanel value="all">
            <Table
              keyField="id"
              data={filtered}
              columns={[
                { key: "id", header: "Record ID", render: (r) => <span className="font-mono text-xs font-bold text-slate-800">{r.id}</span> },
                { key: "patient", header: "Patient Demographics", render: (r) => <div><p className="text-sm font-semibold text-slate-800">{r.patient}</p><p className="text-xs font-mono text-slate-400">{r.mrn} · Age {r.age}</p></div> },
                { key: "doctor", header: "Attending & Unit", render: (r) => <div><p className="text-sm font-medium text-slate-800">{r.doctor}</p><p className="text-xs text-slate-400">{r.visit}</p></div> },
                {
                  key: "diagnosis",
                  header: "ICD-10 Clinical Diagnosis",
                  render: (r) => (
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{r.diagnosis}</p>
                      <span className="text-[10px] font-mono text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">{r.icdCode}</span>
                    </div>
                  )
                },
                { key: "date", header: "Encounter Date", render: (r) => <span className="text-sm font-mono text-slate-600">{r.date}</span> },
                { key: "type", header: "Encounter Type", render: (r) => <Badge variant={r.type === "New" ? "info" : "secondary"}>{r.type}</Badge> },
                {
                  key: "actions",
                  header: "Actions",
                  align: "right",
                  render: (r) => (
                    <Button size="sm" variant="outline" leftIcon={<FileText size={13} />} onClick={() => setSelectedRecord(r)}>
                      Open Record
                    </Button>
                  )
                },
              ]}
            />
          </TabPanel>
          <TabPanel value="new">
            <Table
              keyField="id"
              data={filtered.filter(r => r.type === "New")}
              columns={[
                { key: "id", header: "Record ID", render: (r) => <span className="font-mono text-xs font-bold text-slate-800">{r.id}</span> },
                { key: "patient", header: "Patient", render: (r) => <p className="text-sm font-semibold text-slate-800">{r.patient}</p> },
                { key: "diagnosis", header: "Diagnosis", render: (r) => <p className="text-sm text-slate-800 font-medium">{r.diagnosis}</p> },
                { key: "actions", header: "", align: "right", render: (r) => <Button size="sm" variant="outline" onClick={() => setSelectedRecord(r)}>Open</Button> },
              ]}
            />
          </TabPanel>
          <TabPanel value="followup">
            <Table
              keyField="id"
              data={filtered.filter(r => r.type === "Follow-up" || r.type === "Review")}
              columns={[
                { key: "id", header: "Record ID", render: (r) => <span className="font-mono text-xs font-bold text-slate-800">{r.id}</span> },
                { key: "patient", header: "Patient", render: (r) => <p className="text-sm font-semibold text-slate-800">{r.patient}</p> },
                { key: "diagnosis", header: "Diagnosis", render: (r) => <p className="text-sm text-slate-800 font-medium">{r.diagnosis}</p> },
                { key: "actions", header: "", align: "right", render: (r) => <Button size="sm" variant="outline" onClick={() => setSelectedRecord(r)}>Open</Button> },
              ]}
            />
          </TabPanel>
        </Tabs>
      </div>

      {/* PRINTABLE EMR CLINICAL RECORD MODAL */}
      {selectedRecord && (
        <Modal
          open={!!selectedRecord}
          onClose={() => setSelectedRecord(null)}
          title={`Clinical EMR Encounter — ${selectedRecord.id}`}
          description="Official Electronic Medical Record & Doctor SOAP Encounter Notes"
        >
          <div className="space-y-6 print:p-0">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center font-bold text-lg">
                  EMR
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg leading-tight">CuraSphere Electronic Medical Record</h3>
                  <p className="text-xs text-slate-500 font-mono">Encounter #: {selectedRecord.id} | Date: {selectedRecord.date}</p>
                </div>
              </div>
              <Badge variant="info">{selectedRecord.type}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <p className="text-slate-400 font-semibold uppercase">Patient Demographics</p>
                <p className="text-sm font-bold text-slate-900 mt-1">{selectedRecord.patient}</p>
                <p className="text-slate-600">MRN: <span className="font-mono">{selectedRecord.mrn}</span> | Age: {selectedRecord.age}</p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold uppercase">Attending Physician & Unit</p>
                <p className="text-sm font-bold text-primary-700 mt-1">{selectedRecord.doctor}</p>
                <p className="text-slate-600">{selectedRecord.visit}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-primary-50 border border-primary-100 text-xs">
              <p className="text-primary-700 font-semibold">ICD-10 Primary Clinical Diagnosis:</p>
              <p className="font-bold text-primary-950 text-sm mt-0.5">{selectedRecord.diagnosis} ({selectedRecord.icdCode})</p>
            </div>

            <div className="space-y-2 text-xs">
              <p className="font-semibold text-slate-700 uppercase tracking-wide">Physician SOAP Clinical Notes:</p>
              <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 font-sans text-xs whitespace-pre-wrap leading-relaxed">
                {selectedRecord.soapNotes}
              </pre>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <Button variant="ghost" onClick={() => setSelectedRecord(null)}>Close</Button>
              <Button variant="outline" leftIcon={<Printer size={14} />} onClick={handlePrint}>Print Medical Record</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* NEW EMR ENCOUNTER MODAL */}
      <Modal
        open={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Record New Clinical EMR Encounter"
        description="Log patient clinical evaluation, diagnosis, and SOAP notes"
      >
        <form onSubmit={handleCreateEncounter} className="space-y-4">
          <Input
            label="Patient Name"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder="e.g. Muhammad Ali"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Age" type="number" value={age} onChange={(e) => setAge(e.target.value)} required />
            <Select
              label="Attending Physician"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              options={[
                { value: "Dr. Sana Qureshi", label: "Dr. Sana Qureshi" },
                { value: "Dr. Adeel Khan", label: "Dr. Adeel Khan" },
                { value: "Dr. Mehwish Ali", label: "Dr. Mehwish Ali" },
                { value: "Dr. Faisal Siddiqui", label: "Dr. Faisal Siddiqui" },
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Primary Clinical Diagnosis"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="e.g. Essential Hypertension"
              required
            />
            <Input
              label="ICD-10 Code"
              value={icdCode}
              onChange={(e) => setIcdCode(e.target.value)}
              placeholder="e.g. ICD-10 I10"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">SOAP Encounter Notes</label>
            <textarea
              value={soapNotes}
              onChange={(e) => setSoapNotes(e.target.value)}
              placeholder="S: Complaints...\nO: Vitals & Findings...\nA: Clinical Assessment...\nP: Treatment Plan..."
              className="w-full p-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsNewModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Save EMR Encounter Record</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

