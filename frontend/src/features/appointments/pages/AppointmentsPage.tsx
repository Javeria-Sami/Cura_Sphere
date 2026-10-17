import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Calendar, Plus, Search, Printer, RefreshCw,
  Clock, CheckCircle2, XCircle, AlertCircle, FileText,
  User, Stethoscope, ChevronRight, AlertTriangle,
  UserCheck, ShieldAlert
} from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { Stat } from "../../../components/ui/Stat";
import { Table } from "../../../components/ui/Table";
import { Tabs, TabList, Tab, TabPanel } from "../../../components/ui/Tabs";
import { Modal } from "../../../components/ui/Modal";
import { Input } from "../../../components/ui/Input";
import PageHeader from "../../../components/layout/PageHeader";
import {
  appointmentService,
  AppointmentItem,
  DoctorLookupItem,
  DepartmentLookupItem
} from "../../../services/appointmentService";
import { patientService } from "../../../services/patientService";
import { PatientListDto } from "../../../types/patient";

type BadgeVariant = "success" | "warning" | "info" | "danger" | "secondary" | "primary";

const statusConfig: Record<string, { variant: BadgeVariant; icon: React.ReactNode }> = {
  "Scheduled": { variant: "info", icon: <Clock size={12} aria-hidden="true" /> },
  "Confirmed": { variant: "primary", icon: <UserCheck size={12} aria-hidden="true" /> },
  "Checked In": { variant: "warning", icon: <AlertCircle size={12} aria-hidden="true" /> },
  "In Consultation": { variant: "warning", icon: <Stethoscope size={12} aria-hidden="true" /> },
  "Completed": { variant: "success", icon: <CheckCircle2 size={12} aria-hidden="true" /> },
  "Cancelled": { variant: "danger", icon: <XCircle size={12} aria-hidden="true" /> },
  "No Show": { variant: "secondary", icon: <ShieldAlert size={12} aria-hidden="true" /> },
};

const CLINICAL_TIME_SLOTS = [
  "09:00 AM", "09:15 AM", "09:30 AM", "09:45 AM",
  "10:00 AM", "10:15 AM", "10:30 AM", "10:45 AM",
  "11:00 AM", "11:15 AM", "11:30 AM", "11:45 AM",
  "12:00 PM", "12:15 PM", "12:30 PM", "12:45 PM",
  "02:00 PM", "02:15 PM", "02:30 PM", "02:45 PM",
  "03:00 PM", "03:15 PM", "03:30 PM", "03:45 PM",
  "04:00 PM", "04:30 PM", "05:00 PM"
];

const fallbackDoctors: DoctorLookupItem[] = [
  { doctorId: 1, doctorName: "Dr. Sana Qureshi", specialization: "Family Medicine & GP", departmentId: 1, departmentName: "General Practice", consultationFee: 1500, status: "Active" },
  { doctorId: 2, doctorName: "Dr. Adeel Khan", specialization: "Internal Medicine", departmentId: 2, departmentName: "Internal Medicine", consultationFee: 2000, status: "Active" },
  { doctorId: 3, doctorName: "Dr. Mehwish Ali", specialization: "Pediatrics & Child Care", departmentId: 3, departmentName: "Pediatrics", consultationFee: 1800, status: "Active" },
  { doctorId: 4, doctorName: "Dr. Amna Sheikh", specialization: "Obstetrics & Gynecology", departmentId: 4, departmentName: "Gynecology", consultationFee: 2200, status: "Active" },
  { doctorId: 5, doctorName: "Dr. Faisal Siddiqui", specialization: "Neurology", departmentId: 5, departmentName: "Neurosciences", consultationFee: 2500, status: "Active" }
];

export default function AppointmentsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Appointments List State
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Lookups State
  const [doctors, setDoctors] = useState<DoctorLookupItem[]>(fallbackDoctors);
  const [, setDepartments] = useState<DepartmentLookupItem[]>([]);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState<AppointmentItem | null>(null);
  const [cancellingAppt, setCancellingAppt] = useState<AppointmentItem | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [reschedulingAppt, setReschedulingAppt] = useState<AppointmentItem | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleDoctorId, setRescheduleDoctorId] = useState("");
  const [rescheduleRemarks, setRescheduleRemarks] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  // Booking Form State
  const [patientSearch, setPatientSearch] = useState("");
  const [searchedPatients, setSearchedPatients] = useState<PatientListDto[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<{ id: number; name: string; mrn: string } | null>(null);
  const [patientSearching, setPatientSearching] = useState(false);

  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("1");
  const [apptDate, setApptDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [apptTime, setApptTime] = useState<string>("10:00 AM");
  const [apptType, setApptType] = useState<string>("OPD");
  const [reason, setReason] = useState<string>("");
  const [creating, setCreating] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const triggerToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Check URL parameters for pre-selected patient
  useEffect(() => {
    const paramPatientId = searchParams.get("patientId");
    const paramPatientName = searchParams.get("patientName");
    const paramMrn = searchParams.get("mrn");

    if (paramPatientId && paramPatientName) {
      setSelectedPatient({
        id: Number(paramPatientId),
        name: paramPatientName,
        mrn: paramMrn || `MRN-${paramPatientId}`,
      });
      setIsModalOpen(true);
    }
  }, [searchParams]);

  // Load Lookups (Doctors and Departments)
  useEffect(() => {
    const loadLookups = async () => {
      try {
        const [docs, depts] = await Promise.all([
          appointmentService.getDoctors(),
          appointmentService.getDepartments(),
        ]);
        if (docs && docs.length > 0) {
          setDoctors(docs);
          setSelectedDoctorId(docs[0].doctorId.toString());
        }
        if (depts && depts.length > 0) {
          setDepartments(depts);
        }
      } catch {
        // Keep fallback doctors
      }
    };
    loadLookups();
  }, []);

  // Fetch Appointments
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await appointmentService.getAppointments(search, activeTab);
      setAppointments(data || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load appointments.";
      triggerToast(message, "error");
    } finally {
      setLoading(false);
    }
  }, [search, activeTab]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Patient Autocomplete Search in Booking Modal
  useEffect(() => {
    if (!patientSearch || patientSearch.trim().length < 2) {
      setSearchedPatients([]);
      return;
    }

    const timer = setTimeout(async () => {
      setPatientSearching(true);
      try {
        const res = await patientService.getPagedPatients(patientSearch.trim(), 1, 5);
        if (res && res.items) {
          setSearchedPatients(res.items);
        }
      } catch {
        setSearchedPatients([]);
      } finally {
        setPatientSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [patientSearch]);

  // Handle Book Appointment Submission
  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);

    if (!selectedPatient) {
      setBookingError("Please select a registered patient for this appointment.");
      return;
    }

    const doctor = doctors.find((d) => d.doctorId.toString() === selectedDoctorId);
    if (!doctor) {
      setBookingError("Please select a valid doctor.");
      return;
    }

    setCreating(true);
    try {
      const created = await appointmentService.createAppointment({
        patientId: selectedPatient.id,
        doctorId: doctor.doctorId,
        departmentId: doctor.departmentId,
        appointmentDate: apptDate,
        appointmentTime: apptTime,
        appointmentType: apptType,
        reasonForVisit: reason.trim() || undefined,
      });

      triggerToast(`Appointment ${created.appointmentNumber} successfully booked for ${selectedPatient.name}.`);
      setIsModalOpen(false);
      setSelectedPatient(null);
      setPatientSearch("");
      setReason("");
      fetchAppointments();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err instanceof Error ? err.message : "Failed to schedule appointment.");
      setBookingError(msg);
    } finally {
      setCreating(false);
    }
  };

  // Status Change Handler
  const handleStatusChange = async (appointmentId: number, targetStatus: string, remarks?: string) => {
    setSubmittingAction(true);
    try {
      await appointmentService.updateStatus(appointmentId, targetStatus, remarks);
      triggerToast(`Appointment status updated to '${targetStatus}'.`);
      setCancellingAppt(null);
      setCancellationReason("");
      fetchAppointments();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err instanceof Error ? err.message : "Failed to update appointment status.");
      triggerToast(msg, "error");
    } finally {
      setSubmittingAction(false);
    }
  };

  // Reschedule Handler
  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reschedulingAppt) return;

    setSubmittingAction(true);
    try {
      await appointmentService.reschedule(reschedulingAppt.appointmentId, {
        appointmentDate: rescheduleDate,
        appointmentTime: rescheduleTime,
        doctorId: rescheduleDoctorId ? Number(rescheduleDoctorId) : undefined,
        remarks: rescheduleRemarks.trim() || undefined,
      });

      triggerToast(`Appointment ${reschedulingAppt.appointmentNumber} rescheduled to ${rescheduleDate} ${rescheduleTime}.`);
      setReschedulingAppt(null);
      fetchAppointments();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err instanceof Error ? err.message : "Failed to reschedule appointment.");
      triggerToast(msg, "error");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter local view based on tab
  const filteredAppointments = appointments.filter((a) => {
    if (activeTab === "all") return true;
    const s = a.status.toLowerCase().replace(/\s+/g, "");
    const tab = activeTab.toLowerCase().replace(/\s+/g, "");
    return s === tab;
  });

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-screen-2xl mx-auto animate-fade-in print:p-0 print:m-0 text-slate-900">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-white ${
            toastMessage.type === "success" ? "bg-slate-900 border border-emerald-500/30" : "bg-rose-900 border border-rose-500/30"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" aria-hidden="true" />
          ) : (
            <AlertCircle size={18} className="text-rose-400 shrink-0" aria-hidden="true" />
          )}
          <span className="text-sm font-medium">{toastMessage.text}</span>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="Appointment Management"
        subtitle="Schedule, reschedule, and manage outpatient clinic appointments and provider availability"
        icon={<Calendar size={20} className="text-primary-600" aria-hidden="true" />}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Printer size={14} />}
              onClick={handlePrint}
            >
              Print Schedule
            </Button>
            <Button
              size="sm"
              variant="primary"
              leftIcon={<Plus size={14} />}
              onClick={() => {
                setBookingError(null);
                setIsModalOpen(true);
              }}
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              New Appointment
            </Button>
          </div>
        }
      />

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat
          label="Total Scheduled"
          value={appointments.length.toString()}
          icon={<Calendar size={20} />}
          color="blue"
        />
        <Stat
          label="Confirmed & In Queue"
          value={appointments.filter((a) => a.status === "Scheduled" || a.status === "Confirmed" || a.status === "Checked In").length.toString()}
          icon={<Clock size={20} />}
          color="cyan"
        />
        <Stat
          label="Completed Consultations"
          value={appointments.filter((a) => a.status === "Completed").length.toString()}
          icon={<CheckCircle2 size={20} />}
          color="green"
        />
        <Stat
          label="Cancelled / No Show"
          value={appointments.filter((a) => a.status === "Cancelled" || a.status === "No Show").length.toString()}
          icon={<XCircle size={20} />}
          color="red"
        />
      </div>

      {/* Appointments Management Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" aria-hidden="true" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by patient, MRN, appt #, or doctor..."
              aria-label="Search appointments by patient, MRN, appt number, or doctor"
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 bg-slate-50 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              leftIcon={<RefreshCw size={14} className={loading ? "animate-spin" : ""} />}
              onClick={fetchAppointments}
              disabled={loading}
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Tab Filters */}
        <Tabs value={activeTab} onChange={setActiveTab}>
          <div className="px-5 pt-4 border-b border-slate-100">
            <TabList>
              <Tab value="all">All ({appointments.length})</Tab>
              <Tab value="scheduled">Scheduled ({appointments.filter((a) => a.status === "Scheduled").length})</Tab>
              <Tab value="confirmed">Confirmed ({appointments.filter((a) => a.status === "Confirmed").length})</Tab>
              <Tab value="checkedin">Checked In ({appointments.filter((a) => a.status === "Checked In").length})</Tab>
              <Tab value="inconsultation">In Consultation ({appointments.filter((a) => a.status === "In Consultation").length})</Tab>
              <Tab value="completed">Completed ({appointments.filter((a) => a.status === "Completed").length})</Tab>
              <Tab value="cancelled">Cancelled ({appointments.filter((a) => a.status === "Cancelled").length})</Tab>
            </TabList>
          </div>

          <TabPanel value={activeTab} className="pt-0">
            <Table
              keyField="appointmentId"
              loading={loading}
              data={filteredAppointments}
              columns={[
                {
                  key: "appointmentNumber",
                  header: "Appt. ID",
                  render: (r) => (
                    <span className="font-mono text-xs font-bold text-slate-800">
                      {r.appointmentNumber}
                    </span>
                  ),
                },
                {
                  key: "patientName",
                  header: "Patient",
                  render: (r) => (
                    <div>
                      <button
                        type="button"
                        onClick={() => navigate(`/patients/${r.patientId}`)}
                        className="text-sm font-semibold text-slate-900 hover:text-primary-600 transition-colors text-left"
                        title={`Open patient profile for ${r.patientName}`}
                      >
                        {r.patientName}
                      </button>
                      <p className="text-xs font-mono text-slate-400">{r.medicalRecordNumber}</p>
                    </div>
                  ),
                },
                {
                  key: "doctorName",
                  header: "Doctor / Department",
                  render: (r) => (
                    <div>
                      <p className="text-sm text-slate-800 font-medium">{r.doctorName}</p>
                      <p className="text-xs text-slate-500">{r.departmentName}</p>
                    </div>
                  ),
                },
                {
                  key: "appointmentDate",
                  header: "Date & Time",
                  render: (r) => (
                    <div>
                      <p className="text-sm text-slate-700 font-medium">{r.appointmentDate}</p>
                      <span className="text-xs font-mono font-semibold text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded">
                        {r.appointmentTime}
                      </span>
                    </div>
                  ),
                },
                {
                  key: "appointmentType",
                  header: "Type",
                  render: (r) => <Badge variant="info" size="sm">{r.appointmentType}</Badge>,
                },
                {
                  key: "status",
                  header: "Status",
                  render: (r) => {
                    const cfg = statusConfig[r.status] || { variant: "secondary", icon: null };
                    return (
                      <Badge variant={cfg.variant} size="sm" className="font-medium gap-1">
                        {cfg.icon}
                        <span>{r.status}</span>
                      </Badge>
                    );
                  },
                },
                {
                  key: "actions",
                  header: "Clinical Workflow Actions",
                  align: "right",
                  render: (r) => (
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      {/* Workflow Transitions */}
                      {r.status === "Scheduled" && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs text-primary-600 hover:bg-primary-50"
                            onClick={() => handleStatusChange(r.appointmentId, "Confirmed")}
                          >
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs text-amber-600 hover:bg-amber-50"
                            onClick={() => handleStatusChange(r.appointmentId, "Checked In")}
                          >
                            Check In
                          </Button>
                        </>
                      )}

                      {r.status === "Confirmed" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs text-amber-600 hover:bg-amber-50"
                          onClick={() => handleStatusChange(r.appointmentId, "Checked In")}
                        >
                          Check In
                        </Button>
                      )}

                      {r.status === "Checked In" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs text-indigo-600 hover:bg-indigo-50 font-semibold"
                          onClick={() => {
                            handleStatusChange(r.appointmentId, "In Consultation");
                            navigate(`/emr?appointmentId=${r.appointmentId}&patientId=${r.patientId}&patientName=${encodeURIComponent(r.patientName)}&mrn=${encodeURIComponent(r.medicalRecordNumber)}`);
                          }}
                        >
                          Start Consult
                        </Button>
                      )}

                      {r.status === "In Consultation" && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs text-indigo-600 hover:bg-indigo-50 font-semibold"
                            onClick={() => {
                              navigate(`/emr?appointmentId=${r.appointmentId}&patientId=${r.patientId}&patientName=${encodeURIComponent(r.patientName)}&mrn=${encodeURIComponent(r.medicalRecordNumber)}`);
                            }}
                          >
                            Open Consult
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs text-emerald-600 hover:bg-emerald-50 font-semibold"
                            onClick={() => handleStatusChange(r.appointmentId, "Completed")}
                          >
                            Complete
                          </Button>
                        </>
                      )}

                      {/* Reschedule option if not Completed or Cancelled */}
                      {r.status !== "Completed" && r.status !== "Cancelled" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs text-slate-600 hover:bg-slate-100"
                          onClick={() => {
                            setReschedulingAppt(r);
                            setRescheduleDate(r.appointmentDate);
                            setRescheduleTime(r.appointmentTime);
                            setRescheduleDoctorId(r.doctorId.toString());
                            setRescheduleRemarks("");
                          }}
                        >
                          Reschedule
                        </Button>
                      )}

                      {/* Cancel option if not Completed or Cancelled */}
                      {r.status !== "Completed" && r.status !== "Cancelled" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs text-rose-600 hover:bg-rose-50"
                          onClick={() => {
                            setCancellingAppt(r);
                            setCancellationReason("");
                          }}
                        >
                          Cancel
                        </Button>
                      )}

                      {/* Slip Pass Button */}
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<FileText size={12} />}
                        onClick={() => setSelectedSlip(r)}
                        className="text-xs"
                      >
                        Pass
                      </Button>
                    </div>
                  ),
                },
              ]}
            />
          </TabPanel>
        </Tabs>
      </div>

      {/* MODAL 1: SCHEDULE NEW APPOINTMENT */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule New Appointment"
        description="Book an outpatient consultation or specialist clinic encounter for a registered patient"
      >
        <form onSubmit={handleCreateAppointment} className="space-y-4">
          {bookingError && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2"
            >
              <AlertTriangle size={16} className="text-rose-600 shrink-0" aria-hidden="true" />
              <span>{bookingError}</span>
            </div>
          )}

          {/* Patient Selection Block */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Patient <span className="text-rose-500">*</span>
            </label>
            {selectedPatient ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-primary-50/60 border border-primary-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary-600 text-white flex items-center justify-center font-bold text-xs">
                    <User size={14} aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{selectedPatient.name}</p>
                    <p className="text-xs font-mono text-primary-700">{selectedPatient.mrn}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPatient(null)}
                  className="text-xs text-rose-600 hover:bg-rose-50"
                >
                  Change
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" aria-hidden="true" />
                  <input
                    type="text"
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    placeholder="Search patient by name, MRN, or phone number..."
                    className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 bg-white"
                  />
                  {patientSearching && (
                    <RefreshCw size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400" aria-hidden="true" />
                  )}
                </div>

                {searchedPatients.length > 0 && (
                  <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-48 overflow-y-auto shadow-sm bg-white">
                    {searchedPatients.map((p) => {
                      const fullName = [p.firstName, p.middleName, p.lastName].filter(Boolean).join(" ");
                      return (
                        <div
                          key={p.patientId}
                          onClick={() => {
                            setSelectedPatient({
                              id: p.patientId,
                              name: fullName,
                              mrn: p.medicalRecordNumber,
                            });
                            setPatientSearch("");
                            setSearchedPatients([]);
                          }}
                          className="p-2.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                        >
                          <div>
                            <span className="font-semibold text-slate-900">{fullName}</span>
                            <span className="ml-2 font-mono text-slate-400">({p.medicalRecordNumber})</span>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {p.gender} · Age {p.age} · {p.phoneNumber}
                            </p>
                          </div>
                          <ChevronRight size={14} className="text-slate-400" aria-hidden="true" />
                        </div>
                      );
                    })}
                  </div>
                )}
                {patientSearch.length >= 2 && searchedPatients.length === 0 && !patientSearching && (
                  <p className="text-xs text-slate-500 italic px-1">
                    No matching patient records found.{" "}
                    <button
                      type="button"
                      onClick={() => navigate("/patients/register")}
                      className="text-primary-600 underline font-medium"
                    >
                      Register new patient
                    </button>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Doctor Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Attending Doctor <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 bg-white"
              required
            >
              {doctors.map((d) => (
                <option key={d.doctorId} value={d.doctorId.toString()}>
                  {d.doctorName} — {d.specialization} ({d.departmentName}) · ₨ {d.consultationFee}
                </option>
              ))}
            </select>
          </div>

          {/* Date and Time Slot Picker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Consultation Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                min={todayStr}
                value={apptDate}
                onChange={(e) => setApptDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Time Slot <span className="text-rose-500">*</span>
              </label>
              <select
                value={apptTime}
                onChange={(e) => setApptTime(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 bg-white font-mono"
                required
              >
                {CLINICAL_TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Appointment Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Consultation Type
            </label>
            <select
              value={apptType}
              onChange={(e) => setApptType(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 bg-white"
            >
              <option value="OPD">General Outpatient (OPD)</option>
              <option value="Follow-up">Follow-up Visit</option>
              <option value="Consultation">Specialist Consultation</option>
              <option value="Emergency">Emergency Evaluation</option>
            </select>
          </div>

          {/* Reason for Visit */}
          <Input
            label="Reason for Visit / Chief Complaint"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Seasonal allergy checkup, headache follow-up, vitals evaluation"
          />

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={creating}
              disabled={creating || !selectedPatient}
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              Confirm Appointment Booking
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: RESCHEDULE APPOINTMENT */}
      {reschedulingAppt && (
        <Modal
          open={!!reschedulingAppt}
          onClose={() => setReschedulingAppt(null)}
          title={`Reschedule Appointment — ${reschedulingAppt.appointmentNumber}`}
          description={`Update consultation date or time slot for ${reschedulingAppt.patientName}`}
        >
          <form onSubmit={handleRescheduleSubmit} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <p className="font-semibold text-slate-800">Current Booking Details:</p>
              <p className="text-slate-600">
                Date: {reschedulingAppt.appointmentDate} · Slot: {reschedulingAppt.appointmentTime}
              </p>
              <p className="text-slate-600">Doctor: {reschedulingAppt.doctorName}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  New Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  min={todayStr}
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  New Time Slot <span className="text-rose-500">*</span>
                </label>
                <select
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 bg-white font-mono"
                  required
                >
                  {CLINICAL_TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Attending Doctor
              </label>
              <select
                value={rescheduleDoctorId}
                onChange={(e) => setRescheduleDoctorId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 bg-white"
              >
                {doctors.map((d) => (
                  <option key={d.doctorId} value={d.doctorId.toString()}>
                    {d.doctorName} — {d.specialization}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Reschedule Reason / Note"
              value={rescheduleRemarks}
              onChange={(e) => setRescheduleRemarks(e.target.value)}
              placeholder="e.g. Patient requested morning slot, provider shift adjustment"
            />

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <Button type="button" variant="ghost" onClick={() => setReschedulingAppt(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={submittingAction}>
                Confirm Reschedule
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 3: CANCEL APPOINTMENT CONFIRMATION */}
      {cancellingAppt && (
        <Modal
          open={!!cancellingAppt}
          onClose={() => setCancellingAppt(null)}
          title="Cancel Appointment"
          description={`Confirm cancellation for ${cancellingAppt.appointmentNumber}`}
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
              <p className="font-semibold text-rose-900">Are you sure you want to cancel this appointment?</p>
              <p>
                Patient: <span className="font-bold">{cancellingAppt.patientName}</span> ({cancellingAppt.medicalRecordNumber})
              </p>
              <p>
                Scheduled for: {cancellingAppt.appointmentDate} at {cancellingAppt.appointmentTime}
              </p>
            </div>

            <Input
              label="Cancellation Reason (Optional)"
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="e.g. Patient called to cancel, unable to attend, booked elsewhere"
            />

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <Button type="button" variant="ghost" onClick={() => setCancellingAppt(null)}>
                Keep Appointment
              </Button>
              <Button
                type="button"
                variant="danger"
                isLoading={submittingAction}
                onClick={() => handleStatusChange(cancellingAppt.appointmentId, "Cancelled", cancellationReason)}
              >
                Yes, Cancel Appointment
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 4: PRINTABLE APPOINTMENT SLIP / PASS */}
      {selectedSlip && (
        <Modal
          open={!!selectedSlip}
          onClose={() => setSelectedSlip(null)}
          title={`Outpatient Consultation Pass — ${selectedSlip.appointmentNumber}`}
          description="Official Clinic Outpatient Slip & Token Pass"
        >
          <div className="space-y-6 print:p-0">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center font-bold text-lg">
                  APT
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg leading-tight">
                    CuraSphere Clinic Consultation Pass
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Pass #: {selectedSlip.appointmentNumber} · Date: {selectedSlip.appointmentDate}
                  </p>
                </div>
              </div>
              <Badge variant="info">{selectedSlip.status}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <p className="text-slate-400 font-semibold uppercase">Patient Information</p>
                <p className="text-sm font-bold text-slate-900 mt-1">{selectedSlip.patientName}</p>
                <p className="text-slate-600">
                  MRN: <span className="font-mono font-bold">{selectedSlip.medicalRecordNumber}</span>
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold uppercase">Attending Doctor & Slot</p>
                <p className="text-sm font-bold text-primary-700 mt-1">{selectedSlip.doctorName}</p>
                <p className="text-slate-600">
                  Slot Time: <span className="font-mono font-bold text-slate-800">{selectedSlip.appointmentTime}</span>
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 text-xs space-y-1">
              <p className="font-semibold text-slate-700">Reason for Visit:</p>
              <p className="text-slate-600 italic">
                {selectedSlip.reasonForVisit || "Routine Outpatient Clinical Consultation"}
              </p>
            </div>

            {selectedSlip.remarks && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-0.5">
                <p className="font-semibold text-amber-900">Notes / Remarks:</p>
                <p>{selectedSlip.remarks}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <Button variant="ghost" onClick={() => setSelectedSlip(null)}>
                Close
              </Button>
              <Button variant="outline" leftIcon={<Printer size={14} />} onClick={handlePrint}>
                Print Appointment Pass
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
