import { useState } from "react";
import { Scan, Plus, Search, Filter, Printer, Clock, CheckCircle2, Activity, FileText, Image as ImageIcon } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { Stat } from "../../../components/ui/Stat";
import { Table } from "../../../components/ui/Table";
import { Modal } from "../../../components/ui/Modal";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import PageHeader from "../../../components/layout/PageHeader";

interface RadiologyItem {
  id: string;
  accessionNumber: string;
  mrn: string;
  patient: string;
  study: string;
  modality: string;
  doctor: string;
  ordered: string;
  radiologist: string;
  status: string;
  priority: string;
  findings: string;
  impression: string;
}

const initialStudies: RadiologyItem[] = [
  { id: "RAD-001", accessionNumber: "ACC-2026-9011", mrn: "MRN-00521", patient: "Muhammad Ali", study: "Chest PA View X-Ray", modality: "X-Ray", doctor: "Dr. Adeel Khan", ordered: "09:10 AM", radiologist: "Dr. Imran Malik (Consultant Radiologist)", status: "Reported", priority: "Routine", findings: "No acute focal consolidation. Heart size within normal limits.", impression: "Normal Chest Radiograph." },
  { id: "RAD-002", accessionNumber: "ACC-2026-9012", mrn: "MRN-00498", patient: "Ayesha Khan", study: "Echocardiography (TTE)", modality: "Echo", doctor: "Dr. Adeel Khan", ordered: "09:40 AM", radiologist: "Dr. Sana Qureshi", status: "Scheduled", priority: "Urgent", findings: "Pending imaging acquisition.", impression: "Awaiting scan completion." },
  { id: "RAD-003", accessionNumber: "ACC-2026-9013", mrn: "MRN-00504", patient: "Zara Ahmed", study: "Lumbar Spine MRI", modality: "MRI", doctor: "Dr. Mehwish Ali", ordered: "10:00 AM", radiologist: "Dr. Imran Malik (Consultant Radiologist)", status: "Processing", priority: "Routine", findings: "Mild L4-L5 disc protrusion without nerve root compression.", impression: "L4-L5 Disc Protrusion." },
  { id: "RAD-004", accessionNumber: "ACC-2026-9014", mrn: "MRN-00519", patient: "Usman Tariq", study: "Non-Contrast Brain CT", modality: "CT Scan", doctor: "Dr. Faisal Siddiqui", ordered: "10:30 AM", radiologist: "Dr. Imran Malik (Consultant Radiologist)", status: "Pending", priority: "STAT", findings: "Emergency CT brain requested for head trauma.", impression: "Pending radiologist review." },
  { id: "RAD-005", accessionNumber: "ACC-2026-9015", mrn: "MRN-00522", patient: "Hamza Iqbal", study: "Contrast Enhanced Chest CT", modality: "CT Scan", doctor: "Dr. Adeel Khan", ordered: "10:55 AM", radiologist: "Dr. Imran Malik (Consultant Radiologist)", status: "Reported", priority: "STAT", findings: "No pulmonary embolism detected. Bilateral lower lobe atelectasis.", impression: "Negative for PE." },
];

export default function RadiologyPage() {
  const [studiesList, setStudiesList] = useState<RadiologyItem[]>(initialStudies);
  const [search, setSearch] = useState("");
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<RadiologyItem | null>(null);

  // Form State
  const [patientName, setPatientName] = useState("");
  const [modality, setModality] = useState("X-Ray");
  const [studyName, setStudyName] = useState("");
  const [doctorName, setDoctorName] = useState("Dr. Adeel Khan");
  const [priority, setPriority] = useState("Routine");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const newStudy: RadiologyItem = {
      id: `RAD-${Math.floor(100 + Math.random() * 900)}`,
      accessionNumber: `ACC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      mrn: `MRN-${Math.floor(10000 + Math.random() * 90000)}`,
      patient: patientName || "Patient",
      study: studyName || "Chest X-Ray",
      modality: modality,
      doctor: doctorName,
      ordered: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      radiologist: "Dr. Imran Malik (Consultant Radiologist)",
      status: "Pending",
      priority: priority,
      findings: "Imaging order dispatched to PACS modality queue.",
      impression: "Pending PACS scan.",
    };
    setStudiesList([newStudy, ...studiesList]);
    setIsNewOrderOpen(false);
    setPatientName("");
    setStudyName("");
    triggerToast(`Radiology Order ${newStudy.id} (${newStudy.accessionNumber}) generated for ${newStudy.patient}.`);
  };

  const handlePrint = () => {
    window.print();
  };

  const filtered = studiesList.filter(
    (s) =>
      s.patient.toLowerCase().includes(search.toLowerCase()) ||
      s.study.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase()) ||
      s.accessionNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl mx-auto animate-fade-in print:p-0 print:m-0">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 bg-slate-900 text-white rounded-2xl shadow-xl">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      <PageHeader
        title="Radiology & PACS Imaging Department"
        subtitle="Manage imaging modality studies, PACS accession numbers, and radiologist reports"
        icon={<Scan size={20} />}
        actions={
          <>
            <Button size="sm" variant="outline" leftIcon={<Printer size={14} />} onClick={handlePrint}>Print PACS Log</Button>
            <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setIsNewOrderOpen(true)}>New Imaging Order</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Total Studies" value={studiesList.length.toString()} icon={<Scan size={20} />} change={7} color="blue" />
        <Stat label="Pending" value={studiesList.filter(s => s.status === "Pending" || s.status === "Scheduled").length.toString()} icon={<Clock size={20} />} color="yellow" />
        <Stat label="Reported" value={studiesList.filter(s => s.status === "Reported").length.toString()} icon={<CheckCircle2 size={20} />} change={12} color="green" />
        <Stat label="STAT Orders" value={studiesList.filter(s => s.priority === "STAT").length.toString()} icon={<Activity size={20} />} color="red" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search studies, accession numbers, MRNs..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 bg-slate-50"
            />
          </div>
          <Button size="sm" variant="outline" leftIcon={<Filter size={14} />}>Modality Filter</Button>
        </div>

        <Table
          keyField="id"
          data={filtered}
          columns={[
            {
              key: "id",
              header: "Study ID",
              render: (r) => (
                <div>
                  <span className="font-mono text-xs font-bold text-slate-800">{r.id}</span>
                  <p className="text-[10px] font-mono text-primary-600">{r.accessionNumber}</p>
                </div>
              )
            },
            {
              key: "patient",
              header: "Patient",
              render: (r) => (
                <div>
                  <p className="text-sm font-semibold text-slate-800">{r.patient}</p>
                  <p className="text-xs font-mono text-slate-400">{r.mrn}</p>
                </div>
              )
            },
            {
              key: "study",
              header: "Study / Modality",
              render: (r) => (
                <div>
                  <p className="text-sm text-slate-800 font-medium">{r.study}</p>
                  <Badge variant="primary" className="text-[10px] mt-0.5">{r.modality}</Badge>
                </div>
              )
            },
            {
              key: "priority",
              header: "Priority",
              render: (r) => <Badge variant={r.priority === "STAT" ? "danger" : r.priority === "Urgent" ? "warning" : "default"}>{r.priority}</Badge>
            },
            { key: "radiologist", header: "Radiologist", render: (r) => <span className="text-xs text-slate-700 font-medium">{r.radiologist}</span> },
            { key: "status", header: "Status", render: (r) => <Badge variant={r.status === "Reported" ? "success" : r.status === "Processing" ? "warning" : "default"}>{r.status}</Badge> },
            {
              key: "actions",
              header: "Actions",
              align: "right",
              render: (r) => (
                <Button size="sm" variant="outline" leftIcon={<FileText size={13} />} onClick={() => setSelectedReport(r)}>
                  Open Report
                </Button>
              )
            },
          ]}
        />
      </div>

      {/* PACS RADIOLOGIST REPORT MODAL */}
      {selectedReport && (
        <Modal
          open={!!selectedReport}
          onClose={() => setSelectedReport(null)}
          title={`PACS Radiologist Report — ${selectedReport.accessionNumber}`}
          description="Official Hospital Radiology Imaging Impression & PACS Record"
        >
          <div className="space-y-6 print:p-0">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                  PACS
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg leading-tight">CuraSphere Radiology PACS Report</h3>
                  <p className="text-xs text-slate-500 font-mono">Accession #: {selectedReport.accessionNumber} | Date: {new Date().toLocaleDateString()}</p>
                </div>
              </div>
              <Badge variant={selectedReport.status === "Reported" ? "success" : "warning"}>{selectedReport.status}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <p className="text-slate-400 font-semibold uppercase">Patient Information</p>
                <p className="text-sm font-bold text-slate-900 mt-1">{selectedReport.patient}</p>
                <p className="text-slate-600">MRN: <span className="font-mono">{selectedReport.mrn}</span></p>
                <p className="text-slate-600">Study Requested: {selectedReport.study} ({selectedReport.modality})</p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold uppercase">Ordering Physician & Radiologist</p>
                <p className="text-slate-700">Ordering Doctor: <span className="font-bold">{selectedReport.doctor}</span></p>
                <p className="text-slate-700">Radiologist: <span className="font-bold text-blue-700">{selectedReport.radiologist}</span></p>
              </div>
            </div>

            {/* DICOM PACS Mock Frame */}
            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold flex items-center gap-1.5 text-blue-400"><ImageIcon size={15} /> DICOM Imaging PACS Viewer</span>
                <span className="font-mono text-slate-400">Modality: {selectedReport.modality}</span>
              </div>
              <p className="text-slate-300">PACS Accession Stream: High Resolution Digital Scan Verified.</p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <p className="font-semibold text-slate-700 uppercase tracking-wide">Radiological Findings:</p>
                <p className="p-3 rounded-xl bg-slate-100 text-slate-800 font-medium mt-1">{selectedReport.findings}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-700 uppercase tracking-wide">Impression Summary:</p>
                <p className="p-3 rounded-xl bg-blue-50 text-blue-900 font-bold mt-1">{selectedReport.impression}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <Button variant="ghost" onClick={() => setSelectedReport(null)}>Close</Button>
              <Button variant="outline" leftIcon={<Printer size={14} />} onClick={handlePrint}>Print PACS Report</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* NEW IMAGING ORDER MODAL */}
      <Modal
        open={isNewOrderOpen}
        onClose={() => setIsNewOrderOpen(false)}
        title="Create New Radiology Imaging Order"
        description="Dispatch imaging study request to PACS queue"
      >
        <form onSubmit={handleCreateOrder} className="space-y-4">
          <Input
            label="Patient Name"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder="e.g. Usman Tariq"
            required
          />
          <Select
            label="Imaging Modality"
            value={modality}
            onChange={(e) => setModality(e.target.value)}
            options={[
              { value: "X-Ray", label: "X-Ray Radiography" },
              { value: "CT Scan", label: "CT Scan (Computed Tomography)" },
              { value: "MRI", label: "MRI (Magnetic Resonance Imaging)" },
              { value: "Ultrasound", label: "Ultrasound Sonography" },
              { value: "Echo", label: "Echocardiography (TTE)" },
            ]}
          />
          <Input
            label="Specific Study Name"
            value={studyName}
            onChange={(e) => setStudyName(e.target.value)}
            placeholder="e.g. Chest PA View X-Ray, CT Brain"
            required
          />
          <Select
            label="Priority Level"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            options={[
              { value: "Routine", label: "Routine" },
              { value: "Urgent", label: "Urgent (Within 2 Hours)" },
              { value: "STAT", label: "STAT (Immediate Emergency Scan)" },
            ]}
          />
          <Select
            label="Ordering Doctor"
            value={doctorName}
            onChange={(e) => setDoctorName(e.target.value)}
            options={[
              { value: "Dr. Adeel Khan", label: "Dr. Adeel Khan" },
              { value: "Dr. Sana Qureshi", label: "Dr. Sana Qureshi" },
              { value: "Dr. Mehwish Ali", label: "Dr. Mehwish Ali" },
              { value: "Dr. Faisal Siddiqui", label: "Dr. Faisal Siddiqui" },
            ]}
          />
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsNewOrderOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Generate PACS Accession Order</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

