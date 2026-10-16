import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, Calendar, Receipt, Bed, Activity,
  FlaskConical, Pill, AlertTriangle, TrendingUp,
  Clock, CheckCircle2, UserPlus, Stethoscope, ArrowRight
} from "lucide-react";
import { useAuthStore } from "../../../stores/authStore";
import { Stat } from "../../../components/ui/Stat";
import { Card } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import PageHeader from "../../../components/layout/PageHeader";

interface ActivityItem {
  time: string;
  type: string;
  patient: string;
  mrn: string;
  badge: string;
  badgeVariant: "success" | "info" | "danger" | "warning" | "default" | "secondary";
  department: string;
  targetPath: string;
  details: string;
  attendingDoctor: string;
}

const stats = [
  { label: "Today's Patients", value: "148", icon: <Users size={20} />, change: 12, color: "blue" as const, path: "/patients" },
  { label: "Appointments", value: "64", icon: <Calendar size={20} />, change: 5, color: "green" as const, path: "/appointments" },
  { label: "IPD Admissions", value: "23", icon: <Bed size={20} />, change: -3, color: "purple" as const, path: "/ipd" },
  { label: "Today's Revenue", value: "₨ 1.2M", icon: <Receipt size={20} />, change: 18, color: "yellow" as const, path: "/billing" },
];

const recentActivity: ActivityItem[] = [
  {
    time: "09:32",
    type: "Registration",
    patient: "Muhammad Ali",
    mrn: "MRN-00521",
    badge: "New Patient",
    badgeVariant: "success",
    department: "Patient Registration Desk",
    targetPath: "/patients",
    details: "New patient registered in OPD. Primary contact & CNIC verified.",
    attendingDoctor: "Dr. Sana Qureshi"
  },
  {
    time: "09:18",
    type: "Discharged",
    patient: "Ayesha Khan",
    mrn: "MRN-00498",
    badge: "Discharged",
    badgeVariant: "info",
    department: "Inpatient Ward B (Cardiac)",
    targetPath: "/ipd",
    details: "Post-op cardiac recovery complete. Discharge summary signed by consultant.",
    attendingDoctor: "Dr. Adeel Khan"
  },
  {
    time: "09:05",
    type: "Lab Result",
    patient: "Zara Ahmed",
    mrn: "MRN-00504",
    badge: "Critical Value",
    badgeVariant: "danger",
    department: "Biochemistry Laboratory",
    targetPath: "/laboratory",
    details: "Critical Hgb level detected (6.2 g/dL). STAT alert transmitted to attending doctor.",
    attendingDoctor: "Dr. Mehwish Ali"
  },
  {
    time: "08:52",
    type: "Admission",
    patient: "Usman Tariq",
    mrn: "MRN-00519",
    badge: "IPD Ward Bed",
    badgeVariant: "warning",
    department: "Neuro Ward — Bed N-02",
    targetPath: "/ipd",
    details: "Admitted for observation following cerebral concussion evaluation.",
    attendingDoctor: "Dr. Faisal Siddiqui"
  },
  {
    time: "08:41",
    type: "Surgery",
    patient: "Fatima Malik",
    mrn: "MRN-00487",
    badge: "Completed",
    badgeVariant: "success",
    department: "Operation Theatre Suite 1",
    targetPath: "/surgery",
    details: "Laparoscopic Cholecystectomy completed smoothly. Patient transferred to PACU recovery.",
    attendingDoctor: "Dr. Kamran Ahmed"
  },
  {
    time: "08:30",
    type: "Emergency",
    patient: "Hamza Iqbal",
    mrn: "MRN-00522",
    badge: "Critical Triage",
    badgeVariant: "danger",
    department: "Emergency Trauma Bay 01",
    targetPath: "/emergency",
    details: "P1 Critical Trauma Triage. Immediate resuscitation and IV Access initiated.",
    attendingDoctor: "Dr. Ahmad Raza"
  },
];

const upcomingAppointments = [
  { time: "10:00 AM", doctor: "Dr. Sana Qureshi", patient: "Bilal Raza", mrn: "MRN-00412", type: "General OPD", path: "/appointments" },
  { time: "10:30 AM", doctor: "Dr. Adeel Khan", patient: "Nadia Hussain", mrn: "MRN-00415", type: "Cardiology", path: "/appointments" },
  { time: "11:00 AM", doctor: "Dr. Mehwish Ali", patient: "Tariq Mahmood", mrn: "MRN-00420", type: "Orthopedics", path: "/appointments" },
  { time: "11:30 AM", doctor: "Dr. Faisal Siddiqui", patient: "Rabia Nawaz", mrn: "MRN-00428", type: "Neurology", path: "/appointments" },
  { time: "12:00 PM", doctor: "Dr. Amna Sheikh", patient: "Asad Javed", mrn: "MRN-00435", type: "Gynecology", path: "/appointments" },
];

const departmentStatus = [
  { dept: "OPD", waiting: 12, serving: 3, status: "Normal", path: "/opd" },
  { dept: "Emergency", waiting: 5, serving: 4, status: "Busy", path: "/emergency" },
  { dept: "Laboratory", waiting: 18, serving: 6, status: "Busy", path: "/laboratory" },
  { dept: "Pharmacy", waiting: 9, serving: 5, status: "Normal", path: "/pharmacy" },
  { dept: "Radiology", waiting: 3, serving: 2, status: "Normal", path: "/radiology" },
  { dept: "ICU", waiting: 0, serving: 8, status: "Critical", path: "/icu" },
];

const quickActions = [
  { label: "Register Patient", path: "/patients/register", icon: <UserPlus size={18} />, color: "bg-primary-600 hover:bg-primary-700 text-white" },
  { label: "New Appointment", path: "/appointments", icon: <Calendar size={18} />, color: "bg-success-600 hover:bg-success-700 text-white" },
  { label: "Emergency Admit", path: "/emergency", icon: <AlertTriangle size={18} />, color: "bg-danger-600 hover:bg-danger-700 text-white" },
  { label: "Lab Request", path: "/laboratory", icon: <FlaskConical size={18} />, color: "bg-purple-600 hover:bg-purple-700 text-white" },
];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl mx-auto animate-fade-in">
      {/* Page Header */}
      <PageHeader
        title={`${greeting}, ${user?.employeeName?.split(" ")[0] || "Admin"}`}
        subtitle={`Today is ${new Date().toLocaleDateString("en-PK", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`}
        icon={<Activity size={20} />}
        actions={
          <div className="flex items-center gap-2">
            {quickActions.map((a, i) => (
              <button
                key={i}
                onClick={() => navigate(a.path)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 shadow-sm cursor-pointer ${a.color}`}
              >
                {a.icon}
                <span className="hidden xl:inline">{a.label}</span>
              </button>
            ))}
          </div>
        }
      />

      {/* KPI Stats Cards — Interactive & Clickable */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div
            key={i}
            onClick={() => navigate(s.path)}
            className="cursor-pointer group transition-all duration-200 hover:-translate-y-1"
            title={`Click to open ${s.label}`}
          >
            <Stat
              label={s.label}
              value={s.value}
              icon={s.icon}
              change={s.change}
              changeLabel="vs yesterday"
              color={s.color}
              className="group-hover:border-primary-500 group-hover:shadow-lg transition-all"
            />
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Activity Feed */}
        <Card className="xl:col-span-2 p-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <h2 className="font-semibold text-slate-900 text-sm">Recent Activity Feed</h2>
              <p className="text-xs text-slate-400 mt-0.5">Click any activity record to view details</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => navigate("/patients")}>View All Patients</Button>
          </div>
          <div className="divide-y divide-slate-50">
            {recentActivity.map((a, i) => (
              <div
                key={i}
                onClick={() => setSelectedActivity(a)}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors cursor-pointer group"
              >
                <div className="shrink-0 text-center w-12">
                  <p className="text-xs font-mono font-semibold text-slate-700">{a.time}</p>
                </div>
                <div className="w-px h-8 bg-slate-100 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-800 group-hover:text-primary-600 transition-colors truncate">{a.patient}</p>
                    <span className="text-[11px] font-mono text-slate-400">({a.mrn})</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{a.department} · {a.type}</p>
                </div>
                <Badge variant={a.badgeVariant}>{a.badge}</Badge>
                <ArrowRight size={14} className="text-slate-300 group-hover:text-primary-600 transition-colors shrink-0" />
              </div>
            ))}
          </div>
        </Card>

        {/* Today's Appointments */}
        <Card className="p-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <h2 className="font-semibold text-slate-900 text-sm">Upcoming Appointments</h2>
              <p className="text-xs text-slate-400 mt-0.5">Today's OPD schedule</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => navigate("/appointments")}>View All</Button>
          </div>
          <div className="divide-y divide-slate-50">
            {upcomingAppointments.map((a, i) => (
              <div
                key={i}
                onClick={() => navigate(a.path)}
                className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-50 text-primary-600 shrink-0 mt-0.5 group-hover:bg-primary-600 group-hover:text-white transition-all">
                  <Stethoscope size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 group-hover:text-primary-600 transition-colors truncate">{a.patient}</p>
                  <p className="text-xs text-slate-500 truncate">{a.doctor}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-mono text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded-md font-semibold">{a.time}</span>
                    <span className="text-xs text-slate-400">{a.type}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Department Status Grid — Interactive Clickable Desks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-slate-900">Department Status Monitors</h2>
            <p className="text-xs text-slate-400">Click any department to open its live operational desk</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {departmentStatus.map((d, i) => {
            const statusColor =
              d.status === "Critical"
                ? "border-danger-300 bg-danger-50 hover:bg-danger-100/60"
                : d.status === "Busy"
                ? "border-warning-300 bg-warning-50 hover:bg-warning-100/60"
                : "border-success-200 bg-success-50 hover:bg-success-100/60";
            const dotColor =
              d.status === "Critical"
                ? "bg-danger-500"
                : d.status === "Busy"
                ? "bg-warning-500"
                : "bg-success-500";
            return (
              <div
                key={i}
                onClick={() => navigate(d.path)}
                className={`rounded-2xl border p-4 text-center ${statusColor} hover:shadow-md cursor-pointer transition-all duration-200 hover:-translate-y-0.5 group`}
                title={`Open ${d.dept} Department Desk`}
              >
                <div className="flex items-center justify-center gap-1.5 mb-2">
                  <div className={`w-2 h-2 rounded-full ${dotColor} ${d.status === "Critical" ? "animate-pulse" : ""}`} />
                  <p className="text-xs font-semibold text-slate-700">{d.status}</p>
                </div>
                <p className="text-lg font-bold text-slate-900 group-hover:text-primary-700 transition-colors">{d.dept}</p>
                <p className="text-xs text-slate-600 font-medium mt-1">{d.waiting} waiting</p>
                <p className="text-xs text-slate-400">{d.serving} serving</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6">
        {/* Lab Pending */}
        <Card className="p-5 hover:border-purple-300 transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <FlaskConical size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Laboratory Queue</p>
              <p className="text-xs text-slate-400">Pending diagnostic results</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {[
              { test: "CBC", patient: "Zara Ahmed", status: "Critical" },
              { test: "LFTs", patient: "Ali Hassan", status: "Pending" },
              { test: "Urine R/E", patient: "Maria Khan", status: "Processing" },
            ].map((r, i) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-700">{r.test} — {r.patient}</p>
                </div>
                <Badge variant={r.status === "Critical" ? "danger" : r.status === "Processing" ? "warning" : "info"} className="text-[10px]">
                  {r.status}
                </Badge>
              </div>
            ))}
          </div>
          <Button size="sm" variant="ghost" className="w-full mt-4 text-purple-600" onClick={() => navigate("/laboratory")}>
            View All Lab Results
          </Button>
        </Card>

        {/* Pharmacy Stock */}
        <Card className="p-5 hover:border-emerald-300 transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
              <Pill size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Pharmacy Stock</p>
              <p className="text-xs text-slate-400">Low stock formulary alerts</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {[
              { drug: "Amoxicillin 500mg", qty: 12, thresh: 50 },
              { drug: "Metformin 850mg", qty: 8, thresh: 30 },
              { drug: "Paracetamol IV", qty: 5, thresh: 20 },
            ].map((d, i) => (
              <div key={i}>
                <div className="flex justify-between mb-1">
                  <p className="text-xs font-medium text-slate-700">{d.drug}</p>
                  <p className="text-xs text-danger-600 font-bold">{d.qty} left</p>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-danger-500 rounded-full transition-all duration-500"
                    style={{ width: `${(d.qty / d.thresh) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <Button size="sm" variant="ghost" className="w-full mt-4 text-green-600" onClick={() => navigate("/pharmacy")}>
            View Pharmacy Stock
          </Button>
        </Card>

        {/* System Summary */}
        <Card className="p-5 hover:border-primary-300 transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Today's Hospital Summary</p>
              <p className="text-xs text-slate-400">Performance KPI overview</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { label: "Surgeries completed", value: "7", icon: <CheckCircle2 size={14} className="text-success-500" /> },
              { label: "Avg. wait time", value: "18 min", icon: <Clock size={14} className="text-warning-500" /> },
              { label: "Pending prescriptions", value: "34", icon: <Pill size={14} className="text-primary-500" /> },
              { label: "Insurance claims", value: "12", icon: <CheckCircle2 size={14} className="text-info-500" /> },
            ].map((s, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {s.icon}
                  <p className="text-xs text-slate-600">{s.label}</p>
                </div>
                <p className="text-sm font-bold text-slate-900">{s.value}</p>
              </div>
            ))}
          </div>
          <Button size="sm" variant="ghost" className="w-full mt-4 text-primary-600" onClick={() => navigate("/reports")}>
            View Executive BI Report
          </Button>
        </Card>
      </div>

      {/* RECENT ACTIVITY DETAIL MODAL */}
      {selectedActivity && (
        <Modal
          open={!!selectedActivity}
          onClose={() => setSelectedActivity(null)}
          title={`Hospital Activity Details — ${selectedActivity.type}`}
          description={`Event record logged at ${selectedActivity.time}`}
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <p className="text-xs font-mono text-slate-400">{selectedActivity.time} · {selectedActivity.mrn}</p>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">{selectedActivity.patient}</h3>
              </div>
              <Badge variant={selectedActivity.badgeVariant}>{selectedActivity.badge}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <p className="text-slate-400 font-semibold uppercase">Department / Unit</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{selectedActivity.department}</p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold uppercase">Attending Doctor</p>
                <p className="text-sm font-bold text-primary-700 mt-0.5">{selectedActivity.attendingDoctor}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
              <p className="font-semibold text-slate-700">Clinical Event Summary:</p>
              <p className="text-slate-600">{selectedActivity.details}</p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <Button variant="ghost" onClick={() => setSelectedActivity(null)}>Close</Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  leftIcon={<Users size={14} />}
                  onClick={() => {
                    setSelectedActivity(null);
                    navigate("/patients");
                  }}
                >
                  Patient Directory
                </Button>
                <Button
                  leftIcon={<ArrowRight size={14} />}
                  onClick={() => {
                    const target = selectedActivity.targetPath;
                    setSelectedActivity(null);
                    navigate(target);
                  }}
                >
                  Open {selectedActivity.type} Desk
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

