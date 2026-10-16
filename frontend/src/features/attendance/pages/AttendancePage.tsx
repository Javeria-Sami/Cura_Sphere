import { useState } from "react";
import { Clock, CheckCircle2, XCircle, AlertCircle, Filter, Search, Printer, Plus } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { Stat } from "../../../components/ui/Stat";
import { Table } from "../../../components/ui/Table";
import { Modal } from "../../../components/ui/Modal";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import PageHeader from "../../../components/layout/PageHeader";

interface AttendanceRecord {
  id: number;
  empId: string;
  name: string;
  dept: string;
  checkIn: string;
  checkOut: string;
  hours: string;
  status: string;
  overtime: string;
}

const initialAttendance: AttendanceRecord[] = [
  { id: 1, empId: "EMP-001", name: "Dr. Sana Qureshi", dept: "General Medicine", checkIn: "08:02 AM", checkOut: "04:15 PM", hours: "8h 13m", status: "Present", overtime: "—" },
  { id: 2, empId: "EMP-002", name: "Nurse Amina Bibi", dept: "Nursing", checkIn: "07:55 AM", checkOut: "—", hours: "—", status: "Present", overtime: "—" },
  { id: 3, empId: "EMP-003", name: "Bilal Ahmed", dept: "Laboratory", checkIn: "09:12 AM", checkOut: "05:00 PM", hours: "7h 48m", status: "Late", overtime: "—" },
  { id: 4, empId: "EMP-004", name: "Nadia Hassan", dept: "Pharmacy", checkIn: "—", checkOut: "—", hours: "—", status: "On Leave", overtime: "—" },
  { id: 5, empId: "EMP-005", name: "Muhammad Asif", dept: "Administration", checkIn: "08:00 AM", checkOut: "06:30 PM", hours: "10h 30m", status: "Present", overtime: "2h 30m" },
];

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>(initialAttendance);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [empName, setEmpName] = useState("");
  const [dept, setDept] = useState("General Medicine");
  const [checkInTime, setCheckInTime] = useState("08:00 AM");
  const [status, setStatus] = useState("Present");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleMarkAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: AttendanceRecord = {
      id: Date.now(),
      empId: `EMP-${Math.floor(100 + Math.random() * 900)}`,
      name: empName || "Staff Member",
      dept: dept,
      checkIn: checkInTime,
      checkOut: "—",
      hours: "In Progress",
      status: status,
      overtime: "—",
    };
    setRecords([newRecord, ...records]);
    setIsModalOpen(false);
    setEmpName("");
    triggerToast(`Attendance logged for ${newRecord.name} (${newRecord.status}).`);
  };

  const handlePrint = () => {
    window.print();
  };

  const filtered = records.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.dept.toLowerCase().includes(search.toLowerCase()) ||
      r.empId.toLowerCase().includes(search.toLowerCase())
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
        title="Attendance & Roster Tracking"
        subtitle="Track daily staff attendance, leaves, shift duty rosters, and work hours"
        icon={<Clock size={20} />}
        actions={
          <>
            <Button size="sm" variant="outline" leftIcon={<Printer size={14} />} onClick={handlePrint}>Print Sheet</Button>
            <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setIsModalOpen(true)}>Mark Attendance</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Present Today" value={records.filter(r => r.status === "Present").length.toString()} icon={<CheckCircle2 size={20} />} change={3} color="green" />
        <Stat label="Absent" value={records.filter(r => r.status === "Absent").length.toString()} icon={<XCircle size={20} />} color="red" />
        <Stat label="On Leave" value={records.filter(r => r.status === "On Leave").length.toString()} icon={<Clock size={20} />} color="yellow" />
        <Stat label="Late Arrivals" value={records.filter(r => r.status === "Late").length.toString()} icon={<AlertCircle size={20} />} color="red" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-slate-400" />
            <p className="text-sm font-semibold text-slate-900">
              {new Date().toLocaleDateString("en-PK", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search employee..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 bg-slate-50"
              />
            </div>
            <Button size="sm" variant="outline" leftIcon={<Filter size={14} />}>Department</Button>
          </div>
        </div>

        <Table
          keyField="id"
          data={filtered}
          columns={[
            { key: "empId", header: "Emp ID", render: (r) => <span className="font-mono text-xs font-bold text-slate-800">{r.empId}</span> },
            { key: "name", header: "Employee", render: (r) => <div><p className="text-sm font-semibold text-slate-800">{r.name}</p><p className="text-xs font-mono text-slate-400">{r.dept}</p></div> },
            { key: "checkIn", header: "Check In", render: (r) => <span className="text-sm font-mono text-slate-700">{r.checkIn}</span> },
            { key: "checkOut", header: "Check Out", render: (r) => <span className="text-sm font-mono text-slate-700">{r.checkOut}</span> },
            { key: "hours", header: "Total Hours", render: (r) => <span className="text-sm font-semibold text-slate-800">{r.hours}</span> },
            { key: "overtime", header: "Overtime", render: (r) => <span className={`text-sm font-medium ${r.overtime !== "—" ? "text-warning-600" : "text-slate-400"}`}>{r.overtime}</span> },
            { key: "status", header: "Status", render: (r) => <Badge variant={r.status === "Present" ? "success" : r.status === "Late" ? "warning" : r.status === "On Leave" ? "info" : "danger"}>{r.status}</Badge> },
          ]}
        />
      </div>

      {/* MARK ATTENDANCE MODAL */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Mark Daily Staff Attendance">
        <form onSubmit={handleMarkAttendance} className="space-y-4">
          <Input
            label="Employee Name"
            value={empName}
            onChange={(e) => setEmpName(e.target.value)}
            placeholder="e.g. Nurse Amina Bibi"
            required
          />
          <Select
            label="Department"
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            options={[
              { value: "General Medicine", label: "General Medicine / OPD" },
              { value: "Nursing", label: "Nursing Station" },
              { value: "Laboratory", label: "Diagnostic Laboratory" },
              { value: "Pharmacy", label: "Pharmacy Department" },
              { value: "Administration", label: "Administration & HR" },
            ]}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Check-In Time"
              value={checkInTime}
              onChange={(e) => setCheckInTime(e.target.value)}
              placeholder="e.g. 08:00 AM"
              required
            />
            <Select
              label="Attendance Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { value: "Present", label: "Present" },
                { value: "Late", label: "Late Arrival" },
                { value: "On Leave", label: "Approved Leave" },
                { value: "Absent", label: "Absent" },
              ]}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Record Attendance Log</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

