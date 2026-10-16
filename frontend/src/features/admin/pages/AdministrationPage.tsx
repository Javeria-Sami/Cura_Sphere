import { useState, useEffect } from "react";
import { ShieldCheck, UserPlus, Search, Filter, Lock, CheckCircle2, ShieldAlert } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { Stat } from "../../../components/ui/Stat";
import { Table } from "../../../components/ui/Table";
import { Modal } from "../../../components/ui/Modal";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import PageHeader from "../../../components/layout/PageHeader";
import { reportsService, UserAccountManagementItem } from "../../../services/reportsService";

const initialUsers: UserAccountManagementItem[] = [
  { userId: 1, username: "admin", employeeName: "System Administrator", departmentName: "IT Administration", roleName: "SuperAdmin", lastLogin: "Today 10:15 AM", accountStatus: "Active" },
  { userId: 2, username: "dr.kamran", employeeName: "Dr. Kamran Ahmed", departmentName: "Cardiology", roleName: "Consultant Physician", lastLogin: "Today 09:30 AM", accountStatus: "Active" },
  { userId: 3, username: "dr.sarah", employeeName: "Dr. Sarah Khan", departmentName: "General Surgery", roleName: "Lead Surgeon", lastLogin: "Yesterday 04:20 PM", accountStatus: "Active" },
  { userId: 4, username: "cashier.kamran", employeeName: "Kamran Cashier", departmentName: "Finance & Accounts", roleName: "Billing Cashier", lastLogin: "Today 08:00 AM", accountStatus: "Active" },
];

export default function AdministrationPage() {
  const [users, setUsers] = useState<UserAccountManagementItem[]>(initialUsers);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [username, setUsername] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [departmentName, setDepartmentName] = useState("General Medicine");
  const [roleName, setRoleName] = useState("Consultant Physician");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await reportsService.getUserAccounts(search);
      if (data && data.length > 0) {
        setUsers(data);
      }
    } catch {
      // Keep initial
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: UserAccountManagementItem = {
      userId: Date.now(),
      username: username || "new.user",
      employeeName: employeeName || "Staff User",
      departmentName: departmentName,
      roleName: roleName,
      lastLogin: "Never",
      accountStatus: "Active",
    };
    setUsers([newUser, ...users]);
    setIsModalOpen(false);
    setUsername("");
    setEmployeeName("");
    triggerToast(`User Account '${newUser.username}' created with role '${newUser.roleName}'.`);
  };

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.employeeName.toLowerCase().includes(search.toLowerCase()) ||
    u.roleName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl mx-auto animate-fade-in">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 bg-slate-900 text-white rounded-2xl shadow-xl">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      <PageHeader
        title="System Administration & Role Access"
        subtitle="Manage user accounts, RBAC role permissions, staff credentials, and security status"
        icon={<ShieldCheck size={20} />}
        actions={
          <Button size="sm" leftIcon={<UserPlus size={14} />} onClick={() => setIsModalOpen(true)}>Create User Account</Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Total User Accounts" value={users.length.toString()} icon={<ShieldCheck size={20} />} color="blue" />
        <Stat label="Active Credentials" value={users.filter(u => u.accountStatus === "Active").length.toString()} icon={<CheckCircle2 size={20} />} color="green" />
        <Stat label="System Roles Configured" value="8 Roles" icon={<Lock size={20} />} color="purple" />
        <Stat label="Failed Login Alerts" value="0" icon={<ShieldAlert size={20} />} color="green" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user accounts or roles..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 bg-slate-50"
            />
          </div>
          <Button size="sm" variant="outline" leftIcon={<Filter size={14} />}>Role Filter</Button>
        </div>

        <Table
          keyField="userId"
          loading={loading}
          data={filteredUsers}
          columns={[
            { key: "username", header: "Username", render: (r) => <span className="font-mono text-xs font-bold text-slate-800">{r.username}</span> },
            { key: "employeeName", header: "Employee Name", render: (r) => <div><p className="text-sm font-semibold text-slate-800">{r.employeeName}</p><p className="text-xs text-slate-400">{r.departmentName}</p></div> },
            { key: "roleName", header: "Assigned Role", render: (r) => <Badge variant="info">{r.roleName}</Badge> },
            { key: "lastLogin", header: "Last Login", render: (r) => <span className="text-xs font-mono text-slate-500">{r.lastLogin}</span> },
            { key: "accountStatus", header: "Account Status", render: (r) => <Badge variant="success">{r.accountStatus}</Badge> },
          ]}
        />
      </div>

      {/* CREATE USER ACCOUNT MODAL */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New System User Account">
        <form onSubmit={handleCreateUser} className="space-y-4">
          <Input
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. dr.mehwish"
            required
          />
          <Input
            label="Full Employee Name"
            value={employeeName}
            onChange={(e) => setEmployeeName(e.target.value)}
            placeholder="e.g. Dr. Mehwish Ali"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Department Allocation"
              value={departmentName}
              onChange={(e) => setDepartmentName(e.target.value)}
              options={[
                { value: "General Medicine", label: "General Medicine" },
                { value: "Cardiology", label: "Cardiology" },
                { value: "Orthopedics", label: "Orthopedics" },
                { value: "Nursing", label: "Nursing Unit" },
                { value: "Laboratory", label: "Laboratory" },
                { value: "Finance & Accounts", label: "Finance & Accounts" },
              ]}
            />
            <Select
              label="Assigned RBAC Role"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              options={[
                { value: "Consultant Physician", label: "Consultant Physician (Doctor)" },
                { value: "Head Nurse", label: "Head Nurse" },
                { value: "Billing Cashier", label: "Billing Cashier" },
                { value: "Lab Technician", label: "Lab Technician" },
                { value: "Pharmacist", label: "Pharmacist" },
                { value: "SuperAdmin", label: "Super Administrator" },
              ]}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Create User Account</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

