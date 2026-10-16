import { useState, useEffect } from "react";
import { Scissors, Plus, Search, Filter, Calendar, Clock, CheckCircle2, AlertTriangle, Printer } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { Stat } from "../../../components/ui/Stat";
import { Table } from "../../../components/ui/Table";
import { Modal } from "../../../components/ui/Modal";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import PageHeader from "../../../components/layout/PageHeader";
import { clinicalServices, SurgicalScheduleItem } from "../../../services/clinicalServices";

const initialSampleSurgeries: SurgicalScheduleItem[] = [
  { surgeryId: 1, surgeryNumber: "OT-2026-041", patientId: 101, patientName: "Muhammad Ali", medicalRecordNumber: "MRN-00521", procedureName: "Laparoscopic Appendectomy", otRoomNumber: "OT Room 1", leadSurgeonName: "Dr. Mehwish Ali", anesthetistName: "Dr. Bilquis Sheikh", scheduledStartTime: "2026-08-21 09:00 AM", status: "In Surgery" },
  { surgeryId: 2, surgeryNumber: "OT-2026-042", patientId: 102, patientName: "Usman Tariq", medicalRecordNumber: "MRN-00519", procedureName: "Total Knee Arthroplasty", otRoomNumber: "OT Room 2", leadSurgeonName: "Dr. Mehwish Ali", anesthetistName: "Dr. Bilquis Sheikh", scheduledStartTime: "2026-08-21 11:30 AM", status: "Scheduled" },
  { surgeryId: 3, surgeryNumber: "OT-2026-043", patientId: 103, patientName: "Zara Ahmed", medicalRecordNumber: "MRN-00504", procedureName: "Coronary Artery Bypass", otRoomNumber: "OT Room 3 (Cardiac)", leadSurgeonName: "Dr. Adeel Khan", anesthetistName: "Dr. Faisal Shah", scheduledStartTime: "2026-08-21 02:00 PM", status: "Scheduled" },
];

export default function SurgeryPage() {
  const [surgeries, setSurgeries] = useState<SurgicalScheduleItem[]>(initialSampleSurgeries);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [patientName, setPatientName] = useState("");
  const [procedureName, setProcedureName] = useState("");
  const [otRoomNumber, setOtRoomNumber] = useState("OT Room 1");
  const [leadSurgeonName, setLeadSurgeonName] = useState("Dr. Mehwish Ali (Orthopedics)");
  const [anesthetistName, setAnesthetistName] = useState("Dr. Bilquis Sheikh");
  const [startTime, setStartTime] = useState("09:00 AM");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchSurgeries = async () => {
    setLoading(true);
    try {
      const data = await clinicalServices.getSurgerySchedules(search);
      if (data && data.length > 0) {
        setSurgeries(data);
      }
    } catch {
      // Keep sample
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurgeries();
  }, [search]);

  const handleScheduleSurgery = (e: React.FormEvent) => {
    e.preventDefault();
    const newSurgery: SurgicalScheduleItem = {
      surgeryId: Date.now(),
      surgeryNumber: `OT-2026-${Math.floor(100 + Math.random() * 900)}`,
      patientId: 105,
      patientName: patientName || "Surgical Patient",
      medicalRecordNumber: `MRN-${Math.floor(10000 + Math.random() * 90000)}`,
      procedureName: procedureName || "Elective Surgery",
      otRoomNumber: otRoomNumber,
      leadSurgeonName: leadSurgeonName,
      anesthetistName: anesthetistName,
      scheduledStartTime: `${new Date().toISOString().split("T")[0]} ${startTime}`,
      status: "Scheduled",
    };
    setSurgeries([newSurgery, ...surgeries]);
    setIsModalOpen(false);
    setPatientName("");
    setProcedureName("");
    triggerToast(`Surgery ${newSurgery.surgeryNumber} (${newSurgery.procedureName}) scheduled in ${newSurgery.otRoomNumber}.`);
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredSurgeries = surgeries.filter((s) =>
    s.patientName.toLowerCase().includes(search.toLowerCase()) ||
    s.procedureName.toLowerCase().includes(search.toLowerCase()) ||
    s.surgeryNumber.toLowerCase().includes(search.toLowerCase())
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
        title="Operation Theatre & Surgery Scheduling"
        subtitle="Manage OT room bookings, surgical teams, anesthesia pre-ops, and procedure logs"
        icon={<Scissors size={20} />}
        actions={
          <>
            <Button size="sm" variant="outline" leftIcon={<Printer size={14} />} onClick={handlePrint}>Print OT Roster</Button>
            <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setIsModalOpen(true)}>Schedule Surgery</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Surgeries Scheduled" value={surgeries.length.toString()} icon={<Calendar size={20} />} change={12} color="blue" />
        <Stat label="Currently In Surgery" value={surgeries.filter(s => s.status === "In Surgery").length.toString()} icon={<Clock size={20} />} color="yellow" />
        <Stat label="OT Rooms Active" value="3 / 4" icon={<AlertTriangle size={20} />} color="purple" />
        <Stat label="Surgeries Completed" value={surgeries.filter(s => s.status === "Completed").length.toString()} icon={<CheckCircle2 size={20} />} color="green" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search surgeries or OT rooms..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 bg-slate-50"
            />
          </div>
          <Button size="sm" variant="outline" leftIcon={<Filter size={14} />}>OT Room</Button>
        </div>

        <Table
          keyField="surgeryId"
          loading={loading}
          data={filteredSurgeries}
          columns={[
            { key: "surgeryNumber", header: "Surgery Ref", render: (r) => <span className="font-mono text-xs font-bold text-slate-800">{r.surgeryNumber}</span> },
            { key: "patientName", header: "Patient", render: (r) => <div><p className="text-sm font-semibold text-slate-800">{r.patientName}</p><p className="text-xs font-mono text-slate-400">{r.medicalRecordNumber}</p></div> },
            { key: "procedureName", header: "Procedure", render: (r) => <span className="text-sm font-semibold text-slate-800">{r.procedureName}</span> },
            { key: "otRoomNumber", header: "OT Suite", render: (r) => <Badge variant="info">{r.otRoomNumber}</Badge> },
            { key: "leadSurgeonName", header: "Surgeon & Anesthetist", render: (r) => <div><p className="text-xs font-semibold text-slate-700">{r.leadSurgeonName}</p><p className="text-xs text-slate-400">Anesth: {r.anesthetistName}</p></div> },
            { key: "scheduledStartTime", header: "Scheduled Time", render: (r) => <span className="text-xs font-mono text-slate-500">{r.scheduledStartTime}</span> },
            { key: "status", header: "Status", render: (r) => <Badge variant={r.status === "In Surgery" ? "warning" : r.status === "Completed" ? "success" : "info"}>{r.status}</Badge> },
          ]}
        />
      </div>

      {/* SCHEDULE OT SURGERY MODAL */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Schedule Operation Theatre Surgery">
        <form onSubmit={handleScheduleSurgery} className="space-y-4">
          <Input
            label="Patient Name"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder="e.g. Zara Ahmed"
            required
          />
          <Input
            label="Surgical Procedure Name"
            value={procedureName}
            onChange={(e) => setProcedureName(e.target.value)}
            placeholder="e.g. Laparoscopic Cholecystectomy"
            required
          />
          <Select
            label="Operation Theatre Suite"
            value={otRoomNumber}
            onChange={(e) => setOtRoomNumber(e.target.value)}
            options={[
              { value: "OT Room 1", label: "OT Room 1 (General Surgery)" },
              { value: "OT Room 2", label: "OT Room 2 (Orthopedics)" },
              { value: "OT Room 3 (Cardiac)", label: "OT Room 3 (Cardiac Surgery)" },
              { value: "OT Room 4", label: "OT Room 4 (Emergency Surgery)" },
            ]}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Lead Surgeon"
              value={leadSurgeonName}
              onChange={(e) => setLeadSurgeonName(e.target.value)}
              options={[
                { value: "Dr. Mehwish Ali (Orthopedics)", label: "Dr. Mehwish Ali (Orthopedics)" },
                { value: "Dr. Adeel Khan (Cardiology)", label: "Dr. Adeel Khan (Cardiology)" },
                { value: "Dr. Sana Qureshi (General)", label: "Dr. Sana Qureshi (General)" },
              ]}
            />
            <Input
              label="Lead Anesthetist"
              value={anesthetistName}
              onChange={(e) => setAnesthetistName(e.target.value)}
              required
            />
          </div>
          <Input
            label="Scheduled Start Time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            placeholder="e.g. 09:30 AM"
            required
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Confirm OT Surgery Booking</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

