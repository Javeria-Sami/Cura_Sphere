import { useState } from "react";
import { Users2, Plus, Search, Filter, UserCheck, Users, Briefcase, Printer, CheckCircle2 } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { Stat } from "../../../components/ui/Stat";
import { Table } from "../../../components/ui/Table";
import { Modal } from "../../../components/ui/Modal";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import PageHeader from "../../../components/layout/PageHeader";

interface EmployeeItem {
  id: string;
  name: string;
  dept: string;
  designation: string;
  type: string;
  phone: string;
  status: string;
  join: string;
}

const initialEmployees: EmployeeItem[] = [
  { id: "EMP-001", name: "Dr. Sana Qureshi", dept: "General Medicine", designation: "Senior Consultant", type: "Doctor", phone: "0321-1234567", status: "Active", join: "2020-03-15" },
  { id: "EMP-002", name: "Nurse Amina Bibi", dept: "Nursing", designation: "Head Nurse", type: "Nurse", phone: "0333-7654321", status: "Active", join: "2018-06-01" },
  { id: "EMP-003", name: "Bilal Ahmed", dept: "Laboratory", designation: "Lab Technician", type: "Lab Staff", phone: "0345-9876543", status: "Active", join: "2022-01-10" },
  { id: "EMP-004", name: "Nadia Hassan", dept: "Pharmacy", designation: "Pharmacist", type: "Pharmacist", phone: "0311-5678901", status: "On Leave", join: "2021-08-20" },
  { id: "EMP-005", name: "Muhammad Asif", dept: "Administration", designation: "HR Officer", type: "Admin", phone: "0300-1122334", status: "Active", join: "2019-04-05" },
];

export default function HRPage() {
  const [empList, setEmpList] = useState<EmployeeItem[]>(initialEmployees);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [dept, setDept] = useState("General Medicine");
  const [designation, setDesignation] = useState("Medical Officer");
  const [staffType, setStaffType] = useState("Doctor");
  const [phone, setPhone] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleRegisterEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    const newEmp: EmployeeItem = {
      id: `EMP-${Math.floor(100 + Math.random() * 900)}`,
      name: name || "New Staff Member",
      dept,
      designation,
      type: staffType,
      phone: phone || "0300-0000000",
      status: "Active",
      join: new Date().toISOString().split("T")[0],
    };
    setEmpList([newEmp, ...empList]);
    setIsModalOpen(false);
    setName("");
    setPhone("");
    triggerToast(`Registered ${newEmp.name} (${newEmp.id}) into ${newEmp.dept}.`);
  };

  const handlePrint = () => {
    window.print();
  };

  const filtered = empList.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.dept.toLowerCase().includes(search.toLowerCase()) ||
      e.id.toLowerCase().includes(search.toLowerCase())
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
        title="Human Resource Management"
        subtitle="Staff records, employee management, and workforce planning"
        icon={<Users2 size={20} />}
        actions={
          <>
            <Button size="sm" variant="outline" leftIcon={<Printer size={14} />} onClick={handlePrint}>Print Roster</Button>
            <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setIsModalOpen(true)}>Add Employee</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Total Employees" value={empList.length.toString()} icon={<Users size={20} />} change={4} color="blue" />
        <Stat label="Doctors" value={empList.filter(e => e.type === "Doctor").length.toString()} icon={<UserCheck size={20} />} color="green" />
        <Stat label="Nursing Staff" value={empList.filter(e => e.type === "Nurse").length.toString()} icon={<Users2 size={20} />} color="cyan" />
        <Stat label="Support & Admin" value={empList.filter(e => e.type !== "Doctor" && e.type !== "Nurse").length.toString()} icon={<Briefcase size={20} />} color="purple" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employees, departments..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 bg-slate-50"
            />
          </div>
          <Button size="sm" variant="outline" leftIcon={<Filter size={14} />}>Department</Button>
        </div>

        <Table
          keyField="id"
          data={filtered}
          columns={[
            { key: "id", header: "Emp ID", render: (r) => <span className="font-mono text-xs font-bold text-slate-800">{r.id}</span> },
            { key: "name", header: "Employee", render: (r) => (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold shrink-0">
                  {r.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                </div>
                <div><p className="text-sm font-semibold text-slate-800">{r.name}</p><p className="text-xs text-slate-400">{r.phone}</p></div>
              </div>
            )},
            { key: "dept", header: "Department", render: (r) => <div><p className="text-sm font-semibold text-slate-700">{r.dept}</p><p className="text-xs text-slate-400">{r.designation}</p></div> },
            { key: "type", header: "Role Type", render: (r) => <Badge variant="info">{r.type}</Badge> },
            { key: "join", header: "Join Date", render: (r) => <span className="text-sm font-mono text-slate-600">{r.join}</span> },
            { key: "status", header: "Status", render: (r) => <Badge variant={r.status === "Active" ? "success" : "warning"}>{r.status}</Badge> },
          ]}
        />
      </div>

      {/* REGISTER NEW EMPLOYEE MODAL */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register New Hospital Employee">
        <form onSubmit={handleRegisterEmployee} className="space-y-4">
          <Input
            label="Full Employee Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Dr. Kamran Ahmed"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Department Allocation"
              value={dept}
              onChange={(e) => setDept(e.target.value)}
              options={[
                { value: "General Medicine", label: "General Medicine / OPD" },
                { value: "Cardiology", label: "Cardiology Unit" },
                { value: "Nursing", label: "Nursing Department" },
                { value: "Laboratory", label: "Diagnostic Laboratory" },
                { value: "Pharmacy", label: "Hospital Pharmacy" },
                { value: "Administration", label: "Administration & HR" },
              ]}
            />
            <Select
              label="Staff Role Type"
              value={staffType}
              onChange={(e) => setStaffType(e.target.value)}
              options={[
                { value: "Doctor", label: "Consultant / Medical Specialist" },
                { value: "Nurse", label: "Registered Staff Nurse" },
                { value: "Lab Staff", label: "Lab Technician / Pathologist" },
                { value: "Pharmacist", label: "Licensed Pharmacist" },
                { value: "Admin", label: "Administrator / Finance" },
              ]}
            />
          </div>
          <Input
            label="Designation Title"
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            placeholder="e.g. Senior Medical Officer"
            required
          />
          <Input
            label="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 0321-9988776"
            required
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Confirm Staff Registration</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

