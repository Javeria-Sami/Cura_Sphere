import { useState, useEffect, useCallback } from "react";
import { Stethoscope, Search, Plus, Phone, Mail, Award, CheckCircle2, UserPlus, Filter, Loader2, RefreshCw } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { Table, Column } from "../../../components/ui/Table";
import { Modal } from "../../../components/ui/Modal";
import PageHeader from "../../../components/layout/PageHeader";
import { appointmentService, DepartmentLookupItem } from "../../../services/appointmentService";

interface DoctorItem {
  doctorId: number;
  doctorCode: string;
  name: string;
  specialization: string;
  department: string;
  consultationFee: number;
  phone: string;
  email: string;
  status: string;
  experience: number;
}

const sampleDoctors: DoctorItem[] = [
  { doctorId: 1, doctorCode: "DOC-001", name: "Dr. Kamran Ahmed", specialization: "Cardiology", department: "Cardiovascular", consultationFee: 2500, phone: "+923001112233", email: "kamran.ahmed@curasphere.com", status: "Active", experience: 12 },
  { doctorId: 2, doctorCode: "DOC-002", name: "Dr. Ayesha Malik", specialization: "Neurology", department: "Neuroscience", consultationFee: 3000, phone: "+923002223344", email: "ayesha.malik@curasphere.com", status: "Active", experience: 15 },
  { doctorId: 3, doctorCode: "DOC-003", name: "Dr. Tariq Mahmood", specialization: "Orthopedics", department: "Orthopedic Surgery", consultationFee: 2000, phone: "+923003334455", email: "tariq.mahmood@curasphere.com", status: "On Leave", experience: 8 },
  { doctorId: 4, doctorCode: "DOC-004", name: "Dr. Fatima Zahra", specialization: "Pediatrics", department: "Pediatric Care", consultationFee: 1800, phone: "+923004445566", email: "fatima.zahra@curasphere.com", status: "Active", experience: 10 },
];

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<DoctorItem[]>(sampleDoctors);
  const [departments, setDepartments] = useState<DepartmentLookupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "Active" | "On Leave">("all");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    specialization: "Cardiology",
    departmentId: 0,
    consultationFee: 2000,
    phone: "",
    email: "",
    experience: 5
  });

  const loadDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const [docs, depts] = await Promise.all([
        appointmentService.getDoctors(statusFilter === "all" ? undefined : statusFilter),
        appointmentService.getDepartments().catch(() => []),
      ]);

      if (depts && depts.length > 0) {
        setDepartments(depts);
      }

      if (docs && docs.length > 0) {
        const mapped: DoctorItem[] = docs.map(d => ({
          doctorId: d.doctorId,
          doctorCode: d.doctorCode || `DOC-${String(d.doctorId).padStart(3, "0")}`,
          name: d.doctorName,
          specialization: d.specialization,
          department: d.departmentName,
          consultationFee: d.consultationFee,
          phone: d.phoneNumber || "+923000000000",
          email: d.email || "doctor@curasphere.com",
          status: d.status,
          experience: d.yearsOfExperience ?? 5,
        }));
        setDoctors(mapped);
      } else {
        setDoctors(sampleDoctors);
      }
    } catch {
      setDoctors(sampleDoctors);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await appointmentService.createDoctor({
        name: formData.name,
        specialization: formData.specialization,
        departmentId: formData.departmentId ? Number(formData.departmentId) : undefined,
        consultationFee: Number(formData.consultationFee),
        phoneNumber: formData.phone || "+923000000000",
        email: formData.email || "doctor@curasphere.com",
        yearsOfExperience: Number(formData.experience)
      });

      const newDoc: DoctorItem = {
        doctorId: created.doctorId,
        doctorCode: created.doctorCode || `DOC-00${doctors.length + 1}`,
        name: created.doctorName,
        specialization: created.specialization,
        department: created.departmentName,
        consultationFee: created.consultationFee,
        phone: created.phoneNumber || formData.phone || "+923000000000",
        email: created.email || formData.email || "doctor@curasphere.com",
        status: created.status || "Active",
        experience: created.yearsOfExperience ?? Number(formData.experience)
      };
      setDoctors(prev => [newDoc, ...prev]);
      setIsModalOpen(false);
      setFormData({
        name: "",
        specialization: "Cardiology",
        departmentId: departments[0]?.departmentId || 0,
        consultationFee: 2000,
        phone: "",
        email: "",
        experience: 5
      });
    } catch {
      // Fallback local persistence if backend network unreachable
      const newDoc: DoctorItem = {
        doctorId: doctors.length + 1,
        doctorCode: `DOC-00${doctors.length + 1}`,
        name: formData.name.startsWith("Dr.") ? formData.name : `Dr. ${formData.name}`,
        specialization: formData.specialization,
        department: departments.find(d => d.departmentId === Number(formData.departmentId))?.departmentName || "Outpatient Clinic",
        consultationFee: Number(formData.consultationFee),
        phone: formData.phone || "+923000000000",
        email: formData.email || "doctor@curasphere.com",
        status: "Active",
        experience: Number(formData.experience)
      };
      setDoctors(prev => [newDoc, ...prev]);
      setIsModalOpen(false);
      setFormData({
        name: "",
        specialization: "Cardiology",
        departmentId: departments[0]?.departmentId || 0,
        consultationFee: 2000,
        phone: "",
        email: "",
        experience: 5
      });
    } finally {
      setSaving(false);
    }
  };

  const specialties = Array.from(new Set(doctors.map(d => d.specialization)));

  const filtered = doctors.filter(d => {
    const matchesSearch = 
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.doctorCode.toLowerCase().includes(search.toLowerCase()) ||
      d.specialization.toLowerCase().includes(search.toLowerCase()) ||
      d.department.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || d.status === statusFilter;
    const matchesSpecialty = specialtyFilter === "all" || d.specialization === specialtyFilter;
    return matchesSearch && matchesStatus && matchesSpecialty;
  });

  const totalFeeSum = doctors.reduce((acc, d) => acc + d.consultationFee, 0);
  const avgFee = doctors.length > 0 ? Math.round(totalFeeSum / doctors.length) : 0;

  const columns: Column<DoctorItem>[] = [
    { key: "doctorCode", header: "Doctor Code", render: (row) => <span className="font-mono text-xs font-semibold text-slate-600">{row.doctorCode}</span> },
    { key: "name", header: "Full Name", render: (row) => <span className="font-semibold text-slate-900">{row.name}</span> },
    { key: "specialization", header: "Specialization", render: (row) => <Badge variant="primary">{row.specialization}</Badge> },
    { key: "department", header: "Department", render: (row) => <span className="text-slate-600 text-sm">{row.department}</span> },
    { key: "experience", header: "Experience", render: (row) => <span className="text-slate-600 text-sm">{row.experience} Years</span> },
    { key: "consultationFee", header: "Fee (PKR)", render: (row) => <span className="font-medium text-slate-900">PKR {row.consultationFee.toLocaleString()}</span> },
    { key: "phone", header: "Contact Info", render: (row) => (
      <div className="text-xs text-slate-500 space-y-1">
        <div className="flex items-center gap-1.5"><Phone size={12} /> {row.phone}</div>
        <div className="flex items-center gap-1.5"><Mail size={12} /> {row.email}</div>
      </div>
    ) },
    { key: "status", header: "Status", render: (row) => <Badge variant={row.status === "Active" ? "success" : "warning"}>{row.status}</Badge> }
  ];

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl mx-auto animate-fade-in">
      <PageHeader
        title="Doctor Directory & Schedules"
        subtitle="Manage clinic medical specialists, consultation fees, department allocations, and availability"
        icon={<Stethoscope size={20} />}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadDoctors} disabled={loading} className="gap-2">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
            </Button>
            <Button onClick={() => setIsModalOpen(true)} className="gap-2">
              <Plus size={16} /> Add Medical Specialist
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Consultants</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{doctors.length}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Stethoscope size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">On Duty Today</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">{doctors.filter(d => d.status === "Active").length}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Specialties</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{specialties.length} Active</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Award size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Consultation</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">PKR {avgFee.toLocaleString()}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <UserPlus size={20} />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by doctor code, name, specialization, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-1 text-xs text-slate-500 mr-1">
            <Filter size={14} /> Filter:
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "Active" | "On Leave")}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active Only</option>
            <option value="On Leave">On Leave</option>
          </select>

          <select
            value={specialtyFilter}
            onChange={(e) => setSpecialtyFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Specialties</option>
            {specialties.map(spec => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <Table columns={columns} data={filtered} keyField="doctorId" loading={loading} emptyMessage="No medical specialists found matching your search." />
      </div>

      {/* Modal Form */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register Medical Specialist">
        <form onSubmit={handleAddDoctor} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Doctor Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Dr. Salman Khan"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Specialization</label>
              <input
                type="text"
                required
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Consultation Fee (PKR)</label>
              <input
                type="number"
                min="0"
                required
                value={formData.consultationFee}
                onChange={(e) => setFormData({ ...formData, consultationFee: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Department</label>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white"
              >
                <option value={0}>General Outpatient</option>
                {departments.map(dept => (
                  <option key={dept.departmentId} value={dept.departmentId}>{dept.departmentName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Years of Experience</label>
              <input
                type="number"
                min="0"
                max="70"
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                placeholder="+923001234567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                placeholder="doctor@curasphere.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? "Saving..." : "Save Specialist"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
