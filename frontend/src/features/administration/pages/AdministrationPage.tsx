import { Settings, Users, Shield, Database, Server, Globe, Key, Bell } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Tabs, TabList, Tab, TabPanel } from "../../../components/ui/Tabs";
import PageHeader from "../../../components/layout/PageHeader";

const adminSections = [
  { icon: <Users size={22} />, color: "bg-primary-100 text-primary-600", title: "User Accounts", desc: "Manage users, roles, and account status", count: "42 Users", action: "Manage Users" },
  { icon: <Shield size={22} />, color: "bg-success-100 text-success-600", title: "Roles & Permissions", desc: "Configure role-based access control", count: "8 Roles", action: "Configure Roles" },
  { icon: <Database size={22} />, color: "bg-purple-100 text-purple-600", title: "Data Management", desc: "Backup, restore, and data exports", count: "Last backup: Today", action: "Manage Data" },
  { icon: <Bell size={22} />, color: "bg-warning-100 text-warning-600", title: "System Notifications", desc: "Configure alert triggers and channels", count: "12 Rules", action: "Configure" },
  { icon: <Server size={22} />, color: "bg-cyan-100 text-cyan-600", title: "System Health", desc: "Server status, logs, and performance", count: "All Healthy", action: "View Status" },
  { icon: <Globe size={22} />, color: "bg-info-100 text-info-600", title: "Integration Settings", desc: "External systems and API connections", count: "3 Active", action: "Manage" },
  { icon: <Key size={22} />, color: "bg-danger-100 text-danger-600", title: "Audit Trail", desc: "Security logs and access history", count: "1,248 Events", action: "View Audit" },
  { icon: <Settings size={22} />, color: "bg-slate-100 text-slate-600", title: "General Settings", desc: "Hospital info, branding, and preferences", count: "—", action: "Configure" },
];

const recentAudits = [
  { action: "User login", user: "admin", ip: "192.168.1.10", time: "09:32 AM", status: "Success" },
  { action: "Patient record modified", user: "dr.qureshi", ip: "192.168.1.25", time: "09:45 AM", status: "Success" },
  { action: "Failed login attempt", user: "unknown", ip: "192.168.1.99", time: "10:02 AM", status: "Failed" },
  { action: "Prescription created", user: "pharmacy.bilal", ip: "192.168.1.31", time: "10:15 AM", status: "Success" },
  { action: "Role permission changed", user: "admin", ip: "192.168.1.10", time: "10:30 AM", status: "Success" },
];

export default function AdministrationPage() {
  return (
    <div className="p-6 space-y-6 max-w-screen-2xl mx-auto animate-fade-in">
      <PageHeader
        title="System Administration"
        subtitle="User management, security, audit trail, and system configuration"
        icon={<Settings size={20} />}
      />

      <Tabs defaultTab="overview">
        <TabList>
          <Tab value="overview">Overview</Tab>
          <Tab value="users">Users & Roles</Tab>
          <Tab value="audit">Audit Trail</Tab>
          <Tab value="settings">Settings</Tab>
        </TabList>

        <TabPanel value="overview" className="mt-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {adminSections.map((s, i) => (
              <Card key={i} className="p-5 hover:border-primary-200 hover:shadow-md transition-all duration-200 cursor-pointer group">
                <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-4`}>{s.icon}</div>
                <p className="font-semibold text-slate-900 text-sm">{s.title}</p>
                <p className="text-xs text-slate-500 mt-1 mb-3">{s.desc}</p>
                <p className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded-lg w-fit">{s.count}</p>
                <Button size="sm" variant="ghost" className="w-full mt-3 text-xs group-hover:bg-primary-50 group-hover:text-primary-700 transition-all">{s.action}</Button>
              </Card>
            ))}
          </div>
        </TabPanel>

        <TabPanel value="users" className="mt-4">
          <div className="p-8 text-center text-slate-400 text-sm bg-white rounded-2xl border border-slate-200">User and role management interface</div>
        </TabPanel>

        <TabPanel value="audit" className="mt-4">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="font-semibold text-slate-900 text-sm">Recent Audit Events</p>
            </div>
            <div className="divide-y divide-slate-50">
              {recentAudits.map((a, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${a.status === "Success" ? "bg-success-500" : "bg-danger-500"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{a.action}</p>
                    <p className="text-xs text-slate-400 font-mono">{a.user} · {a.ip}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-slate-500">{a.time}</p>
                    <p className={`text-xs font-medium mt-0.5 ${a.status === "Success" ? "text-success-600" : "text-danger-600"}`}>{a.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabPanel>

        <TabPanel value="settings" className="mt-4">
          <div className="p-8 text-center text-slate-400 text-sm bg-white rounded-2xl border border-slate-200">General system configuration</div>
        </TabPanel>
      </Tabs>
    </div>
  );
}
