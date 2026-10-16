import React, { useState, useEffect } from "react";
import { Calendar, Plus, Search, Filter, Printer, RefreshCw,
  Clock, CheckCircle2, XCircle, AlertCircle, FileText } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { Stat } from "../../../components/ui/Stat";
import { Table } from "../../../components/ui/Table";
import { Tabs, TabList, Tab, TabPanel } from "../../../components/ui/Tabs";
import { Modal } from "../../../components/ui/Modal";
import { Select } from "../../../components/ui/Select";
import { Input } from "../../../components/ui/Input";
import PageHeader from "../../../components/layout/PageHeader";
import { appointmentService, AppointmentItem } from "../../../services/appointmentService";

const initialSampleAppointments: AppointmentItem[] = [
  { appointmentId: 1, appointmentNumber: "APT-001", patientId: 101, patientName: "Muhammad Ali", medicalRecordNumber: "MRN-00521", doctorId: 1, doctorName: "Dr. Sana Qureshi", departmentName: "General Medicine", appointmentTime: "10:00 AM", appointmentDate: "2026-08-20", status: "Scheduled", appointmentType: "OPD" },
  { appointmentId: 2, appointmentNumber: "APT-002", patientId: 102, patientName: "Ayesha Khan", medicalRecordNumber: "MRN-00498", doctorId: 2, doctorName: "Dr. Adeel Khan", departmentName: "Cardiology", appointmentTime: "10:30 AM", appointmentDate: "2026-08-20", status: "Checked In", appointmentType: "Follow-up" },
  { appointmentId: 3, appointmentNumber: "APT-003", patientId: 103, patientName: "Zara Ahmed", medicalRecordNumber: "MRN-00504", doctorId: 3, doctorName: "Dr. Mehwish Ali", departmentName: "Orthopedics", appointmentTime: "11:00 AM", appointmentDate: "2026-08-20", status: "Completed", appointmentType: "OPD" },
  { appointmentId: 4, appointmentNumber: "APT-004", patientId: 104, patientName: "Usman Tariq", medicalRecordNumber: "MRN-00519", doctorId: 4, doctorName: "Dr. Faisal Siddiqui", departmentName: "Neurology", appointmentTime: "11:30 AM", appointmentDate: "2026-08-20", status: "Cancelled", appointmentType: "OPD" },
  { appointmentId: 5, appointmentNumber: "APT-005", patientId: 105, patientName: "Fatima Malik", medicalRecordNumber: "MRN-00487", doctorId: 5, doctorName: "Dr. Amna Sheikh", departmentName: "Gynecology", appointmentTime: "12:00 PM", appointmentDate: "2026-08-20", status: "Scheduled", appointmentType: "New" },
];

type BadgeVariant = "success" | "warning" | "info" | "danger" | "secondary";

const statusConfig: Record<string, { variant: BadgeVariant; icon: React.ReactNode }> = {
  "Scheduled": { variant: "info", icon: <Clock size={12} /> },
  "Checked In": { variant: "warning", icon: <AlertCircle size={12} /> },
  "Completed": { variant: "success", icon: <CheckCircle2 size={12} /> },
  "Cancelled": { variant: "danger", icon: <XCircle size={12} /> },
  "No Show": { variant: "secondary", icon: <XCircle size={12} /> },
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentItem[]>(initialSampleAppointments);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState<AppointmentItem | null>(null);

  // Form state
  const [patientNameInput, setPatientNameInput] = useState("");
  const [patientId, setPatientId] = useState("105");
  const [doctorName, setDoctorName] = useState("Dr. Sana Qureshi (General Medicine)");
  const [apptDate, setApptDate] = useState(new Date().toISOString().split("T")[0]);
  const [apptTime, setApptTime] = useState("10:30 AM");
  const [apptType, setApptType] = useState("OPD");
  const [reason, setReason] = useState("");
  const [creating, setCreating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const data = await appointmentService.getAppointments(search, activeTab);
      if (data && data.length > 0) {
        setAppointments(data);
      }
    } catch {
      // Keep sample data if backend empty/offline
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [search, activeTab]);

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const newAppt: AppointmentItem = {
      appointmentId: Date.now(),
      appointmentNumber: `APT-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId: Number(patientId) || 105,
      patientName: patientNameInput || "Registered Patient",
      medicalRecordNumber: `MRN-${Math.floor(10000 + Math.random() * 90000)}`,
      doctorId: 1,
      doctorName: doctorName,
      departmentName: "Specialist OPD",
      appointmentDate: apptDate,
      appointmentTime: apptTime,
      appointmentType: apptType,
      status: "Scheduled",
      reasonForVisit: reason || "Routine Consultation",
    };
    setAppointments((prev) => [newAppt, ...prev]);
    setIsModalOpen(false);
    setPatientNameInput("");
    setCreating(false);
    triggerToast(`Appointment ${newAppt.appointmentNumber} booked for ${newAppt.patientName}.`);
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredAppointments = appointments.filter((a) => {
    const matchesSearch =
      search === "" ||
      a.patientName.toLowerCase().includes(search.toLowerCase()) ||
      a.medicalRecordNumber.toLowerCase().includes(search.toLowerCase()) ||
      a.appointmentNumber.toLowerCase().includes(search.toLowerCase()) ||
      a.doctorName.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      activeTab === "all" ||
      a.status.toLowerCase().replace(/\s+/g, "") === activeTab.toLowerCase();

    return matchesSearch && matchesStatus;
  });

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
        title="Appointment Management"
        subtitle="Schedule, manage, and track outpatient appointments and doctor consultations"
        icon={<Calendar size={20} />}
        actions={
          <>
            <Button size="sm" variant="outline" leftIcon={<Printer size={14} />} onClick={handlePrint}>Print Schedule</Button>
            <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setIsModalOpen(true)}>New Appointment</Button>
          </>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Today's Total" value={appointments.length.toString()} icon={<Calendar size={20} />} change={5} color="blue" />
        <Stat label="Scheduled" value={appointments.filter(a => a.status === "Scheduled").length.toString()} icon={<Clock size={20} />} color="cyan" />
        <Stat label="Completed" value={appointments.filter(a => a.status === "Completed").length.toString()} icon={<CheckCircle2 size={20} />} change={8} color="green" />
        <Stat label="Cancelled" value={appointments.filter(a => a.status === "Cancelled").length.toString()} icon={<XCircle size={20} />} change={-2} color="red" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search appointments, patients, doctors..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 bg-slate-50"
            />
          </div>
          <Button size="sm" variant="outline" leftIcon={<Filter size={14} />}>Filter</Button>
          <Button size="sm" variant="ghost" leftIcon={<RefreshCw size={14} />} onClick={fetchAppointments}>Refresh</Button>
        </div>

        <Tabs value={activeTab} onChange={setActiveTab}>
          <div className="px-5 pt-4">
            <TabList>
              <Tab value="all">All ({appointments.length})</Tab>
              <Tab value="scheduled">Scheduled ({appointments.filter(a => a.status === "Scheduled").length})</Tab>
              <Tab value="completed">Completed ({appointments.filter(a => a.status === "Completed").length})</Tab>
              <Tab value="cancelled">Cancelled ({appointments.filter(a => a.status === "Cancelled").length})</Tab>
            </TabList>
          </div>

          <TabPanel value={activeTab} className="pt-0">
            <Table
              keyField="appointmentId"
              loading={loading}
              data={filteredAppointments}
              columns={[
                { key: "appointmentNumber", header: "Appt. ID", render: (r) => <span className="font-mono text-xs font-bold text-slate-800">{r.appointmentNumber}</span> },
                { key: "patientName", header: "Patient", render: (r) => (
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{r.patientName}</p>
                    <p className="text-xs font-mono text-slate-400">{r.medicalRecordNumber}</p>
                  </div>
                )},
                { key: "doctorName", header: "Doctor / Department", render: (r) => (
                  <div>
                    <p className="text-sm text-slate-800 font-medium">{r.doctorName}</p>
                    <p className="text-xs text-slate-400">{r.departmentName}</p>
                  </div>
                )},
                { key: "appointmentDate", header: "Date & Time", render: (r) => (
                  <div>
                    <p className="text-sm text-slate-700 font-medium">{r.appointmentDate}</p>
                    <p className="text-xs text-slate-400 font-mono">{r.appointmentTime}</p>
                  </div>
                )},
                { key: "appointmentType", header: "Type", render: (r) => <Badge variant="info">{r.appointmentType}</Badge> },
                { key: "status", header: "Status", render: (r) => {
                  const cfg = statusConfig[r.status];
                  return <Badge variant={cfg?.variant ?? "secondary"}>{r.status}</Badge>;
                }},
                { key: "actions", header: "Actions", align: "right", render: (r) => (
                  <Button size="sm" variant="outline" leftIcon={<FileText size={13} />} onClick={() => setSelectedSlip(r)}>
                    Slip Pass
                  </Button>
                )},
              ]}
            />
          </TabPanel>
        </Tabs>
      </div>

      {/* PRINTABLE APPOINTMENT SLIP MODAL */}
      {selectedSlip && (
        <Modal
          open={!!selectedSlip}
          onClose={() => setSelectedSlip(null)}
          title={`Outpatient Appointment Pass — ${selectedSlip.appointmentNumber}`}
          description="Official Hospital Consultation Slip & Token Pass"
        >
          <div className="space-y-6 print:p-0">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                  APT
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg leading-tight">CuraSphere Outpatient Appointment Pass</h3>
                  <p className="text-xs text-slate-500 font-mono">Appt #: {selectedSlip.appointmentNumber} | Date: {selectedSlip.appointmentDate}</p>
                </div>
              </div>
              <Badge variant="info">{selectedSlip.status}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <p className="text-slate-400 font-semibold uppercase">Patient Demographics</p>
                <p className="text-sm font-bold text-slate-900 mt-1">{selectedSlip.patientName}</p>
                <p className="text-slate-600">MRN: <span className="font-mono">{selectedSlip.medicalRecordNumber}</span></p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold uppercase">Consultant Physician & Slot</p>
                <p className="text-sm font-bold text-primary-700 mt-1">{selectedSlip.doctorName}</p>
                <p className="text-slate-600">Slot Time: <span className="font-mono font-bold text-slate-800">{selectedSlip.appointmentTime}</span></p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 text-xs space-y-1">
              <p className="font-semibold text-slate-700">Reason for Visit:</p>
              <p className="text-slate-600 italic">{selectedSlip.reasonForVisit || "Routine Outpatient Medical Consultation"}</p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <Button variant="ghost" onClick={() => setSelectedSlip(null)}>Close</Button>
              <Button variant="outline" leftIcon={<Printer size={14} />} onClick={handlePrint}>Print Appointment Pass</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* New Appointment Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule New Appointment"
        description="Book an outpatient consultation or specialist appointment"
      >
        <form onSubmit={handleCreateAppointment} className="space-y-4">
          <Input
            label="Patient Name"
            value={patientNameInput}
            onChange={(e) => setPatientNameInput(e.target.value)}
            placeholder="e.g. Asad Javed"
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
            label="Attending Doctor"
            value={doctorName}
            onChange={(e) => setDoctorName(e.target.value)}
            options={[
              { value: "Dr. Sana Qureshi (General Medicine)", label: "Dr. Sana Qureshi (General Medicine)" },
              { value: "Dr. Adeel Khan (Cardiology)", label: "Dr. Adeel Khan (Cardiology)" },
              { value: "Dr. Mehwish Ali (Orthopedics)", label: "Dr. Mehwish Ali (Orthopedics)" },
              { value: "Dr. Faisal Siddiqui (Neurology)", label: "Dr. Faisal Siddiqui (Neurology)" },
              { value: "Dr. Amna Sheikh (Gynecology)", label: "Dr. Amna Sheikh (Gynecology)" },
            ]}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Date"
              type="date"
              value={apptDate}
              onChange={(e) => setApptDate(e.target.value)}
              required
            />
            <Input
              label="Time Slot"
              value={apptTime}
              onChange={(e) => setApptTime(e.target.value)}
              placeholder="e.g. 10:30 AM"
              required
            />
          </div>
          <Select
            label="Appointment Type"
            value={apptType}
            onChange={(e) => setApptType(e.target.value)}
            options={[
              { value: "OPD", label: "General OPD" },
              { value: "Follow-up", label: "Follow-up Visit" },
              { value: "Consultation", label: "Specialist Consultation" },
            ]}
          />
          <Input
            label="Reason for Visit"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Brief description of symptoms or medical checkup"
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={creating}>Confirm Booking</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

