import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar, Users, Clock, Receipt, UserPlus,
  Stethoscope, RefreshCw, AlertCircle, CheckCircle2,
  ChevronRight, ArrowRight, Activity,
  Phone, AlertTriangle
} from "lucide-react";
import { useAuthStore } from "../../../stores/authStore";
import { appointmentService, AppointmentItem } from "../../../services/appointmentService";
import { opdService, OpdTokenItem } from "../../../services/opdService";
import { patientService } from "../../../services/patientService";
import { financialService, InvoiceItem } from "../../../services/financialService";
import { reportsService, DashboardReportSummary } from "../../../services/reportsService";
import { PatientListDto } from "../../../types/patient";
import { Card } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Skeleton } from "../../../components/ui/Skeleton";
import { Stat } from "../../../components/ui/Stat";
import PageHeader from "../../../components/layout/PageHeader";

// Clinic on-duty doctor reference roster
interface ClinicDoctorStatus {
  doctorId: number;
  doctorName: string;
  specialty: string;
  room: string;
  status: "Available" | "In Consultation" | "Break";
  patientsSeenToday: number;
}

const DEFAULT_CLINIC_DOCTORS: ClinicDoctorStatus[] = [
  { doctorId: 1, doctorName: "Dr. Sana Qureshi", specialty: "Family Medicine & GP", room: "Consultation Room 1", status: "In Consultation", patientsSeenToday: 14 },
  { doctorId: 2, doctorName: "Dr. Adeel Khan", specialty: "Internal Medicine", room: "Consultation Room 2", status: "Available", patientsSeenToday: 11 },
  { doctorId: 3, doctorName: "Dr. Mehwish Ali", specialty: "Pediatrics & Child Care", room: "Consultation Room 3", status: "In Consultation", patientsSeenToday: 9 },
  { doctorId: 4, doctorName: "Dr. Amna Sheikh", specialty: "Obstetrics & Gynecology", room: "Consultation Room 4", status: "Available", patientsSeenToday: 8 },
];

export default function ClinicDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const userRole = user?.roleName || "Guest";

  // Data states
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [queueTokens, setQueueTokens] = useState<OpdTokenItem[]>([]);
  const [recentPatients, setRecentPatients] = useState<PatientListDto[]>([]);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [reportSummary, setReportSummary] = useState<DashboardReportSummary | null>(null);

  // Status flags
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter state for appointments list
  const [appointmentFilter, setAppointmentFilter] = useState<"all" | "scheduled" | "in-consultation" | "completed">("all");

  // Load live data from existing APIs
  const loadDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const [
        apptsRes,
        queueRes,
        patientsRes,
        invoicesRes,
        summaryRes
      ] = await Promise.allSettled([
        appointmentService.getAppointments(),
        opdService.getQueue(),
        patientService.getPagedPatients("", 1, 6),
        financialService.getInvoices(),
        reportsService.getDashboardSummary(),
      ]);

      if (apptsRes.status === "fulfilled") {
        setAppointments(apptsRes.value || []);
      }
      if (queueRes.status === "fulfilled") {
        setQueueTokens(queueRes.value || []);
      }
      if (patientsRes.status === "fulfilled" && patientsRes.value) {
        setRecentPatients(patientsRes.value.items || []);
      }
      if (invoicesRes.status === "fulfilled") {
        setInvoices(invoicesRes.value || []);
      }
      if (summaryRes.status === "fulfilled") {
        setReportSummary(summaryRes.value || null);
      }

      // Check if all essential calls failed
      if (
        apptsRes.status === "rejected" &&
        queueRes.status === "rejected" &&
        patientsRes.status === "rejected"
      ) {
        setError("Unable to connect to the clinic server. Showing cached or offline view.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load clinic dashboard data.";
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Derived Metrics
  const totalAppointmentsCount = appointments.length > 0 
    ? appointments.length 
    : (reportSummary?.todayAppointments ?? 0);

  const completedAppointmentsCount = appointments.filter(
    (a) => a.status?.toLowerCase() === "completed"
  ).length;

  const waitingQueueCount = queueTokens.filter(
    (t) => t.status?.toLowerCase() === "waiting"
  ).length;

  const activeConsultationCount = queueTokens.filter(
    (t) => t.status?.toLowerCase() === "in consultation" || t.status?.toLowerCase() === "consulting"
  ).length;

  const totalRegisteredPatients = reportSummary?.totalPatientsRegistered ?? recentPatients.length ?? 0;

  // Billing collections today
  const totalBilledToday = invoices.reduce((acc, inv) => acc + (inv.totalAmount || 0), 0) || (reportSummary?.totalRevenueBilledToday ?? 0);
  const totalCollectedToday = invoices.reduce((acc, inv) => acc + (inv.paidAmount || 0), 0) || (reportSummary?.totalRevenueCollectedToday ?? 0);
  const totalPendingBalance = Math.max(0, totalBilledToday - totalCollectedToday);

  // Filtered appointments list
  const filteredAppointments = appointments.filter((a) => {
    if (appointmentFilter === "all") return true;
    const status = a.status?.toLowerCase() || "";
    if (appointmentFilter === "scheduled") return status === "scheduled" || status === "confirmed";
    if (appointmentFilter === "in-consultation") return status === "in consultation" || status === "consulting";
    if (appointmentFilter === "completed") return status === "completed";
    return true;
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Quick Action navigation handlers
  const handleQuickAction = (path: string) => {
    navigate(path);
  };

  // Helper for appointment status badge
  const renderAppointmentStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "completed") {
      return (
        <Badge variant="success" size="sm" className="font-medium gap-1">
          <CheckCircle2 size={12} aria-hidden="true" />
          <span>Completed</span>
        </Badge>
      );
    }
    if (s === "in consultation" || s === "consulting") {
      return (
        <Badge variant="primary" size="sm" className="font-medium gap-1 animate-pulse">
          <Stethoscope size={12} aria-hidden="true" />
          <span>In Consultation</span>
        </Badge>
      );
    }
    if (s === "cancelled" || s === "no show") {
      return (
        <Badge variant="danger" size="sm" className="font-medium gap-1">
          <AlertCircle size={12} aria-hidden="true" />
          <span>{status}</span>
        </Badge>
      );
    }
    return (
      <Badge variant="warning" size="sm" className="font-medium gap-1">
        <Clock size={12} aria-hidden="true" />
        <span>{status || "Scheduled"}</span>
      </Badge>
    );
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-screen-2xl mx-auto animate-fade-in text-slate-900">
      {/* Page Header */}
      <PageHeader
        title={`${greeting}, ${user?.employeeName?.split(" ")[0] || "Doctor"}`}
        subtitle={`Clinic Operations Desk · ${new Date().toLocaleDateString("en-PK", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}`}
        icon={<Activity size={20} className="text-emerald-600" aria-hidden="true" />}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadDashboardData(true)}
              disabled={refreshing || loading}
              aria-label="Refresh dashboard data"
              leftIcon={<RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />}
            >
              <span className="hidden sm:inline">Refresh Data</span>
            </Button>

            <Button
              size="sm"
              variant="primary"
              onClick={() => handleQuickAction("/patients/register")}
              leftIcon={<UserPlus size={15} />}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <span>New Patient</span>
            </Button>
          </div>
        }
      />

      {/* Error / Offline Alert Banner */}
      {error && (
        <div
          role="alert"
          className="flex items-center justify-between p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm"
        >
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={18} className="text-amber-600 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-semibold text-amber-900">Connection Notice</p>
              <p className="text-xs text-amber-700 mt-0.5">{error}</p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => loadDashboardData(true)}>
            Retry
          </Button>
        </div>
      )}

      {/* Overview KPI Cards */}
      <section aria-labelledby="kpi-heading">
        <h2 id="kpi-heading" className="sr-only">Clinic Key Performance Indicators</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Today's Appointments */}
          <div
            onClick={() => navigate("/appointments")}
            className="cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-2xl"
            tabIndex={0}
            role="button"
            aria-label={`View appointments. Today's appointments: ${totalAppointmentsCount}. ${completedAppointmentsCount} completed.`}
          >
            <Stat
              label="Today's Appointments"
              value={totalAppointmentsCount}
              icon={<Calendar size={20} />}
              loading={loading}
              color="blue"
              changeLabel="scheduled"
              className="group-hover:border-primary-500 group-hover:shadow-md transition-all h-full"
            />
          </div>

          {/* Card 2: Patients in Queue */}
          <div
            onClick={() => navigate("/opd")}
            className="cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-2xl"
            tabIndex={0}
            role="button"
            aria-label={`View OPD queue. ${waitingQueueCount} waiting, ${activeConsultationCount} consulting.`}
          >
            <Stat
              label="Waiting in Queue"
              value={waitingQueueCount}
              icon={<Clock size={20} />}
              loading={loading}
              color="yellow"
              changeLabel="active tokens"
              className="group-hover:border-amber-500 group-hover:shadow-md transition-all h-full"
            />
          </div>

          {/* Card 3: Registered Patients */}
          <div
            onClick={() => navigate("/patients")}
            className="cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-2xl"
            tabIndex={0}
            role="button"
            aria-label={`View registered patients directory. Total patients: ${totalRegisteredPatients}.`}
          >
            <Stat
              label="Registered Patients"
              value={totalRegisteredPatients}
              icon={<Users size={20} />}
              loading={loading}
              color="green"
              className="group-hover:border-emerald-500 group-hover:shadow-md transition-all h-full"
            />
          </div>

          {/* Card 4: Today's Billing */}
          <div
            onClick={() => navigate("/billing")}
            className="cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-2xl"
            tabIndex={0}
            role="button"
            aria-label={`View billing. Today's collections: Rs. ${totalCollectedToday.toLocaleString()}. Pending balance: Rs. ${totalPendingBalance.toLocaleString()}.`}
          >
            <Stat
              label="Today's Collections"
              value={`₨ ${totalCollectedToday.toLocaleString()}`}
              icon={<Receipt size={20} />}
              loading={loading}
              color="cyan"
              className="group-hover:border-cyan-500 group-hover:shadow-md transition-all h-full"
            />
          </div>
        </div>
      </section>

      {/* Quick Action Navigation Bar */}
      <section aria-label="Clinic Quick Actions">
        <Card className="p-4 bg-gradient-to-r from-slate-50 via-white to-slate-50 border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Quick Actions:</span>
            </div>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction("/patients/register")}
                leftIcon={<UserPlus size={14} className="text-emerald-600" />}
                className="justify-start sm:justify-center text-xs hover:border-emerald-400 hover:bg-emerald-50/50"
              >
                Register Patient
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction("/appointments")}
                leftIcon={<Calendar size={14} className="text-primary-600" />}
                className="justify-start sm:justify-center text-xs hover:border-primary-400 hover:bg-primary-50/50"
              >
                Book Appointment
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction("/opd")}
                leftIcon={<Clock size={14} className="text-amber-600" />}
                className="justify-start sm:justify-center text-xs hover:border-amber-400 hover:bg-amber-50/50"
              >
                OPD Tokens
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction("/billing")}
                leftIcon={<Receipt size={14} className="text-cyan-600" />}
                className="justify-start sm:justify-center text-xs hover:border-cyan-400 hover:bg-cyan-50/50"
              >
                Counter Billing
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction("/patients")}
                leftIcon={<Users size={14} className="text-slate-600" />}
                className="justify-start sm:justify-center text-xs hover:border-slate-400 hover:bg-slate-50"
              >
                Patient List
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* Main Two-Column Grid: Left (Schedule & Queue), Right (Recent Patients & Doctor Board) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Today's Appointments & Live Queue Ticker (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Today's Appointments Section */}
          <Card className="p-0 overflow-hidden border-slate-200 shadow-sm">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-slate-900 text-base">Today's Consultation Schedule</h2>
                  <Badge variant="primary" size="sm" pill>
                    {filteredAppointments.length}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Scheduled clinic appointments and consultations
                </p>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs" role="tablist" aria-label="Appointment Status Filter">
                <button
                  type="button"
                  role="tab"
                  aria-selected={appointmentFilter === "all"}
                  onClick={() => setAppointmentFilter("all")}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    appointmentFilter === "all"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={appointmentFilter === "scheduled"}
                  onClick={() => setAppointmentFilter("scheduled")}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    appointmentFilter === "scheduled"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Scheduled
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={appointmentFilter === "in-consultation"}
                  onClick={() => setAppointmentFilter("in-consultation")}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    appointmentFilter === "in-consultation"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Consulting
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={appointmentFilter === "completed"}
                  onClick={() => setAppointmentFilter("completed")}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    appointmentFilter === "completed"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Done
                </button>
              </div>
            </div>

            {/* Appointments Content */}
            <div className="divide-y divide-slate-100">
              {loading ? (
                <div className="p-5 space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Skeleton variant="circular" width={36} height={36} />
                        <div className="space-y-1.5">
                          <Skeleton variant="text" width={140} height={14} />
                          <Skeleton variant="text" width={90} height={10} />
                        </div>
                      </div>
                      <Skeleton variant="rectangular" width={80} height={24} />
                    </div>
                  ))}
                </div>
              ) : filteredAppointments.length === 0 ? (
                <div className="py-12 px-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <Calendar size={22} aria-hidden="true" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">No appointments found</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    {appointmentFilter === "all"
                      ? "There are no appointments scheduled for today yet. Use the button below to book one."
                      : `No appointments matching the "${appointmentFilter}" filter.`}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-4"
                    onClick={() => navigate("/appointments")}
                    leftIcon={<Calendar size={14} />}
                  >
                    Schedule Appointment
                  </Button>
                </div>
              ) : (
                filteredAppointments.slice(0, 6).map((item) => (
                  <div
                    key={item.appointmentId}
                    className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        <Clock size={16} aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900 group-hover:text-primary-600 transition-colors truncate">
                            {item.patientName}
                          </p>
                          <span className="text-[11px] font-mono text-slate-400 shrink-0">
                            ({item.medicalRecordNumber || `MRN-${item.patientId}`})
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {item.doctorName} · <span className="text-slate-400">{item.departmentName || "General Practice"}</span>
                        </p>
                        {item.reasonForVisit && (
                          <p className="text-[11px] text-slate-600 italic truncate mt-1">
                            “{item.reasonForVisit}”
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                      <div className="text-right">
                        <span className="text-xs font-semibold text-slate-800 block">
                          {item.appointmentTime || "Queue"}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {item.appointmentType || "Consultation"}
                        </span>
                      </div>
                      <div>{renderAppointmentStatusBadge(item.status)}</div>
                      <button
                        onClick={() => navigate(`/emr?patientId=${item.patientId}`)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                        title={`Open EMR for ${item.patientName}`}
                        aria-label={`Open EMR for ${item.patientName}`}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">
                Showing {Math.min(filteredAppointments.length, 6)} of {filteredAppointments.length} appointments
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate("/appointments")}
                rightIcon={<ArrowRight size={14} />}
                className="text-primary-600 hover:text-primary-700"
              >
                View Full Calendar
              </Button>
            </div>
          </Card>

          {/* Live OPD Walk-In Queue Panel */}
          <Card className="p-0 overflow-hidden border-slate-200 shadow-sm">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-slate-900 text-base">Live Walk-in Token Queue</h2>
                  <span className="flex h-2 w-2 relative" aria-hidden="true">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time outpatient reception tokens & calling order
                </p>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate("/opd")}
                leftIcon={<Clock size={14} />}
              >
                Open OPD Desk
              </Button>
            </div>

            <div className="divide-y divide-slate-100" aria-live="polite">
              {loading ? (
                <div className="p-5 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between">
                      <Skeleton variant="text" width={180} height={16} />
                      <Skeleton variant="rectangular" width={60} height={20} />
                    </div>
                  ))}
                </div>
              ) : queueTokens.length === 0 ? (
                <div className="py-8 px-4 text-center">
                  <p className="text-sm font-semibold text-slate-700">Queue is currently clear</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    No walk-in patients waiting at reception right now.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3 text-xs"
                    onClick={() => navigate("/opd")}
                  >
                    Issue Walk-in Token
                  </Button>
                </div>
              ) : (
                queueTokens.slice(0, 5).map((token) => {
                  const isServing =
                    token.status?.toLowerCase() === "in consultation" ||
                    token.status?.toLowerCase() === "consulting";
                  return (
                    <div
                      key={token.opdTokenId}
                      className={`p-3.5 sm:px-5 flex items-center justify-between gap-3 transition-colors ${
                        isServing ? "bg-indigo-50/40" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-10 h-10 rounded-xl font-bold font-mono text-xs flex items-center justify-center shrink-0 ${
                            isServing
                              ? "bg-indigo-600 text-white shadow-sm"
                              : "bg-slate-100 text-slate-800 border border-slate-200"
                          }`}
                        >
                          {token.tokenNumber}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {token.patientName}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            Age: {token.age} · Attending: {token.doctorName}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant={isServing ? "primary" : "warning"}
                          size="sm"
                          showDot
                        >
                          {token.status}
                        </Badge>
                        {userRole === "Doctor" ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs text-primary-600"
                            onClick={() => navigate(`/emr?patientId=${token.patientId}`)}
                          >
                            Examine
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs text-slate-600"
                            onClick={() => navigate("/opd")}
                          >
                            Manage
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Doctor Status Board & Recent Registrations (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* On-Duty Clinic Doctors Board */}
          <Card className="p-0 overflow-hidden border-slate-200 shadow-sm">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900 text-base">On-Duty Clinic Doctors</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time room occupancy and consultation status
                </p>
              </div>
              <Badge variant="success" size="sm" pill>
                4 Available
              </Badge>
            </div>

            <div className="divide-y divide-slate-100">
              {DEFAULT_CLINIC_DOCTORS.map((doc) => {
                const isBusy = doc.status === "In Consultation";
                return (
                  <div key={doc.doctorId} className="p-3.5 sm:px-5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                        <Stethoscope size={16} aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {doc.doctorName}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {doc.specialty} · <span className="font-mono text-slate-400">{doc.room}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          isBusy
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isBusy ? "bg-indigo-500" : "bg-emerald-500"
                          }`}
                        />
                        {doc.status}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {doc.patientsSeenToday} patients seen
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Recent Patient Activity / Registrations */}
          <Card className="p-0 overflow-hidden border-slate-200 shadow-sm">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900 text-base">Recent Patient Registrations</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Newly registered clinic files
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate("/patients")}
                className="text-xs text-primary-600"
              >
                View All
              </Button>
            </div>

            <div className="divide-y divide-slate-100">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between">
                      <Skeleton variant="text" width={140} height={14} />
                      <Skeleton variant="text" width={80} height={12} />
                    </div>
                  ))}
                </div>
              ) : recentPatients.length === 0 ? (
                <div className="py-8 px-4 text-center">
                  <p className="text-xs text-slate-500">No recent patients registered.</p>
                </div>
              ) : (
                recentPatients.slice(0, 5).map((p) => {
                  const patientFullName = [p.firstName, p.middleName, p.lastName].filter(Boolean).join(" ");
                  return (
                    <div
                      key={p.patientId}
                      onClick={() => navigate(`/patients/${p.patientId}`)}
                      className="p-3.5 sm:px-5 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 cursor-pointer group"
                      title={`Open chart for ${patientFullName}`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900 group-hover:text-primary-600 transition-colors truncate">
                            {patientFullName}
                          </p>
                          <span className="text-[11px] font-mono text-slate-400 shrink-0">
                            ({p.medicalRecordNumber || `MRN-${p.patientId}`})
                          </span>
                        </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span>{p.gender}</span>
                        <span>·</span>
                        <span>Age: {p.age}</span>
                        {p.phoneNumber && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-1 font-mono text-slate-400">
                              <Phone size={10} aria-hidden="true" />
                              {p.phoneNumber.slice(0, 4)}***{p.phoneNumber.slice(-2)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <ArrowRight
                      size={14}
                      className="text-slate-300 group-hover:text-primary-600 transition-colors shrink-0"
                      aria-hidden="true"
                    />
                  </div>
                );
              })
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs"
                onClick={() => navigate("/patients/register")}
                leftIcon={<UserPlus size={14} />}
              >
                Register New Walk-in Patient
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
