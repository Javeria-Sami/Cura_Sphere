import { useState } from "react";
import { UserCheck, Search, Plus, Phone, Heart, CheckCircle2, Filter, Printer, Activity } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { Table, Column } from "../../../components/ui/Table";
import { Modal } from "../../../components/ui/Modal";
import { Input } from "../../../components/ui/Input";
import PageHeader from "../../../components/layout/PageHeader";

interface NurseItem {
  nurseId: number;
  nurseCode: string;
  name: string;
  qualification: string;
  department: string;
  assignedWard: string;
  shift: string;
  phone: string;
  status: string;
}

const sampleNurses: NurseItem[] = [
  { nurseId: 1, nurseCode: "NRS-001", name: "Sr. Sadia Parveen", qualification: "BSc Nursing, RN", department: "ICU Unit", assignedWard: "ICU-01", shift: "Morning (07:00 - 15:00)", phone: "+923005556677", status: "On Duty" },
  { nurseId: 2, nurseCode: "NRS-002", name: "Sr. Maryam Bibi", qualification: "Diploma Nursing", department: "Female Surgical", assignedWard: "Ward B-2", shift: "Evening (15:00 - 23:00)", phone: "+923006667788", status: "On Duty" },
  { nurseId: 3, nurseCode: "NRS-003", name: "Sr. Zainab Tariq", qualification: "BSc Nursing", department: "Pediatric Ward", assignedWard: "Ward P-1", shift: "Night (23:00 - 07:00)", phone: "+923007778899", status: "Off Duty" },
];

export default function NursesPage() {
  const [nurses, setNurses] = useState<NurseItem[]>(sampleNurses);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Vitals State
  const [patientName, setPatientName] = useState("Muhammad Ali (B-12)");
  const [bp, setBp] = useState("120/80");
  const [hr, setHr] = useState("72");
  const [temp, setTemp] = useState("98.6");
  const [spo2, setSpo2] = useState("98%");
  const [nursingNote, setNursingNote] = useState("Patient resting comfortably, IV drip running.");

  const [formData, setFormData] = useState({
    name: "",
    qualification: "BSc Nursing, RN",
    department: "General Medical",
    assignedWard: "Ward A-1",
    shift: "Morning (07:00 - 15:00)",
    phone: ""
  });

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleAddNurse = (e: React.FormEvent) => {
    e.preventDefault();
    const newNurse: NurseItem = {
      nurseId: nurses.length + 1,
      nurseCode: `NRS-00${nurses.length + 1}`,
      name: formData.name.startsWith("Sr.") ? formData.name : `Sr. ${formData.name}`,
      qualification: formData.qualification,
      department: formData.department,
      assignedWard: formData.assignedWard,
      shift: formData.shift,
      phone: formData.phone || "+923000000000",
      status: "On Duty"
    };
    setNurses([newNurse, ...nurses]);
    setIsModalOpen(false);
    setFormData({ name: "", qualification: "BSc Nursing, RN", department: "General Medical", assignedWard: "Ward A-1", shift: "Morning (07:00 - 15:00)", phone: "" });
    triggerToast(`Nurse ${newNurse.name} registered and assigned to ${newNurse.assignedWard}.`);
  };

  const handleLogVitals = (e: React.FormEvent) => {
    e.preventDefault();
    setIsVitalsModalOpen(false);
    triggerToast(`Vitals logged for ${patientName}: BP ${bp}, HR ${hr} bpm, SpO2 ${spo2}.`);
  };

  const handlePrint = () => {
    window.print();
  };

  const filtered = nurses.filter(n =>
    n.name.toLowerCase().includes(search.toLowerCase()) ||
    n.department.toLowerCase().includes(search.toLowerCase()) ||
    n.assignedWard.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<NurseItem>[] = [
    { key: "nurseCode", header: "Nurse ID", render: (row) => <span className="font-mono text-xs font-semibold text-slate-600">{row.nurseCode}</span> },
    { key: "name", header: "Full Name", render: (row) => <span className="font-semibold text-slate-900">{row.name}</span> },
    { key: "qualification", header: "Qualification", render: (row) => <span className="text-sm text-slate-600">{row.qualification}</span> },
    { key: "department", header: "Department", render: (row) => <Badge variant="primary">{row.department}</Badge> },
    { key: "assignedWard", header: "Assigned Ward", render: (row) => <span className="font-medium text-slate-900">{row.assignedWard}</span> },
    { key: "shift", header: "Active Shift", render: (row) => <span className="text-xs text-slate-600">{row.shift}</span> },
    { key: "phone", header: "Contact Phone", render: (row) => <div className="text-xs text-slate-500 flex items-center gap-1.5"><Phone size={12} /> {row.phone}</div> },
    { key: "status", header: "Status", render: (row) => <Badge variant={row.status === "On Duty" ? "success" : "default"}>{row.status}</Badge> }
  ];

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
        title="Nursing Care & Staff Management"
        subtitle="Roster management, ward assignments, vitals logging, and shift rotations"
        icon={<UserCheck size={20} />}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" leftIcon={<Printer size={14} />} onClick={handlePrint}>Print Shift Roster</Button>
            <Button variant="outline" size="sm" leftIcon={<Activity size={14} />} onClick={() => setIsVitalsModalOpen(true)}>Log Patient Vitals</Button>
            <Button onClick={() => setIsModalOpen(true)} size="sm" className="gap-2">
              <Plus size={16} /> Register Nurse Staff
            </Button>
          </div>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Nursing Staff</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{nurses.length} Staff</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <UserCheck size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Shift Staff</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">{nurses.filter(n => n.status === "On Duty").length} On Duty</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ICU & Critical Care Staff</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">4 Certified RNs</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Heart size={20} />
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search nurse by name, department, ward assignment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter size={14} /> Filter Shift Roster
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <Table columns={columns} data={filtered} keyField="nurseId" />
      </div>

      {/* LOG VITALS MODAL */}
      <Modal open={isVitalsModalOpen} onClose={() => setIsVitalsModalOpen(false)} title="Log Inpatient Vitals & Nursing Note">
        <form onSubmit={handleLogVitals} className="space-y-4">
          <Input
            label="Inpatient Name & Bed"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Blood Pressure (mmHg)" value={bp} onChange={(e) => setBp(e.target.value)} placeholder="120/80" required />
            <Input label="Heart Rate (BPM)" value={hr} onChange={(e) => setHr(e.target.value)} placeholder="72" required />
            <Input label="Temperature (°F)" value={temp} onChange={(e) => setTemp(e.target.value)} placeholder="98.6" required />
            <Input label="Oxygen Saturation SpO2" value={spo2} onChange={(e) => setSpo2(e.target.value)} placeholder="98%" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Nursing Observations Note</label>
            <textarea
              value={nursingNote}
              onChange={(e) => setNursingNote(e.target.value)}
              className="w-full p-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsVitalsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Record Vitals & Log</Button>
          </div>
        </form>
      </Modal>

      {/* REGISTER NURSE MODAL */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register Nursing Staff">
        <form onSubmit={handleAddNurse} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Nurse Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Sr. Sadia Parveen"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Department</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Assigned Ward</label>
              <input
                type="text"
                value={formData.assignedWard}
                onChange={(e) => setFormData({ ...formData, assignedWard: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save Nurse Profile</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

