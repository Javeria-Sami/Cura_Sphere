
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, Calendar, Stethoscope, BedDouble,
  AlertTriangle, FileText, FlaskConical, Scan, Pill,
  Scissors, Heart, Receipt, CreditCard, Shield,
  Package, Users2, Clock, BarChart3, Settings,
  Bell, ChevronLeft, ChevronRight, Activity
} from "lucide-react";
import { useAuthStore } from "../../stores/authStore";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  permission?: string;
  roles?: string[];
  badge?: number;
  section?: string;
}

const navItems: NavItem[] = [
  // Core Overview
  { label: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={18} />, section: "core" },

  // Clinical Workspace (Doctors, Nurses, Receptionists)
  { label: "Patients", path: "/patients", icon: <Users size={18} />, permission: "patients.read", roles: ["Super Administrator", "Hospital Administrator", "Doctor", "Nurse", "Receptionist"], section: "clinical" },
  { label: "Doctors Directory", path: "/doctors", icon: <Stethoscope size={18} />, roles: ["Super Administrator", "Hospital Administrator", "Doctor", "Receptionist", "HR Manager"], section: "clinical" },
  { label: "Nurses Desk", path: "/nurses", icon: <Activity size={18} />, roles: ["Super Administrator", "Hospital Administrator", "Nurse", "Head Nurse", "HR Manager"], section: "clinical" },
  { label: "Appointments", path: "/appointments", icon: <Calendar size={18} />, roles: ["Super Administrator", "Hospital Administrator", "Doctor", "Receptionist", "Nurse"], section: "clinical" },
  { label: "OPD Queue", path: "/opd", icon: <Stethoscope size={18} />, roles: ["Super Administrator", "Hospital Administrator", "Doctor", "Nurse", "Receptionist"], section: "clinical" },
  { label: "IPD Wards", path: "/ipd", icon: <BedDouble size={18} />, roles: ["Super Administrator", "Hospital Administrator", "Doctor", "Nurse", "Receptionist"], section: "clinical" },
  { label: "Emergency Triage", path: "/emergency", icon: <AlertTriangle size={18} />, roles: ["Super Administrator", "Hospital Administrator", "Doctor", "Nurse", "Emergency Specialist"], section: "clinical" },
  { label: "EMR Desk", path: "/emr", icon: <FileText size={18} />, roles: ["Super Administrator", "Hospital Administrator", "Doctor", "Nurse"], section: "clinical" },

  // Clinical Services (Diagnostics, Surgery, ICU, Pharmacy)
  { label: "Laboratory", path: "/laboratory", icon: <FlaskConical size={18} />, roles: ["Super Administrator", "Hospital Administrator", "Doctor", "Laboratory Technician", "Pathologist"], section: "services" },
  { label: "Radiology / PACS", path: "/radiology", icon: <Scan size={18} />, roles: ["Super Administrator", "Hospital Administrator", "Doctor", "Radiologist", "X-Ray Tech"], section: "services" },
  { label: "Pharmacy", path: "/pharmacy", icon: <Pill size={18} />, roles: ["Super Administrator", "Hospital Administrator", "Pharmacist", "Dispensary Staff"], section: "services" },
  { label: "Surgery OT", path: "/surgery", icon: <Scissors size={18} />, roles: ["Super Administrator", "Hospital Administrator", "Doctor", "Surgeon", "Nurse"], section: "services" },
  { label: "ICU Telemetry", path: "/icu", icon: <Heart size={18} />, roles: ["Super Administrator", "Hospital Administrator", "Doctor", "Nurse", "ICU Specialist"], section: "services" },

  // Finance Workspace
  { label: "Billing & Invoices", path: "/billing", icon: <Receipt size={18} />, permission: "billing.read", roles: ["Super Administrator", "Hospital Administrator", "Accountant", "Cashier", "Billing Officer"], section: "finance" },
  { label: "Payments Cashier", path: "/payments", icon: <CreditCard size={18} />, roles: ["Super Administrator", "Hospital Administrator", "Accountant", "Cashier"], section: "finance" },
  { label: "Insurance Claims", path: "/insurance", icon: <Shield size={18} />, roles: ["Super Administrator", "Hospital Administrator", "Accountant", "Insurance Officer"], section: "finance" },

  // Operations Workspace
  { label: "Store Inventory", path: "/inventory", icon: <Package size={18} />, roles: ["Super Administrator", "Hospital Administrator", "Store Manager", "Pharmacist"], section: "operations" },
  { label: "HR Staff", path: "/hr", icon: <Users2 size={18} />, roles: ["Super Administrator", "Hospital Administrator", "HR Manager", "HR Officer"], section: "operations" },
  { label: "Attendance Roster", path: "/attendance", icon: <Clock size={18} />, roles: ["Super Administrator", "Hospital Administrator", "HR Manager", "Department Head"], section: "operations" },

  // System Administration
  { label: "BI Reports", path: "/reports", icon: <BarChart3 size={18} />, roles: ["Super Administrator", "Hospital Administrator", "Manager", "Accountant"], section: "admin" },
  { label: "Notifications", path: "/notifications", icon: <Bell size={18} />, section: "admin" },
  { label: "Audit Logs", path: "/audit", icon: <Shield size={18} />, roles: ["Super Administrator", "Hospital Administrator", "IT Support"], section: "admin" },
  { label: "System Config", path: "/administration", icon: <Settings size={18} />, roles: ["Super Administrator", "Hospital Administrator", "IT Support"], section: "admin" },
];

const sectionLabels: Record<string, string> = {
  core: "OVERVIEW",
  clinical: "CLINICAL WORKSPACE",
  services: "DIAGNOSTICS & SERVICES",
  finance: "FINANCE & CASHIER",
  operations: "OPERATIONS & STORE",
  admin: "ADMINISTRATION",
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const permissions = useAuthStore((state) => state.permissions);
  const user = useAuthStore((state) => state.user);

  const userRole = user?.roleName || "Super Administrator";

  const isAllowed = (item: NavItem) => {
    // Super Administrator & Hospital Administrator see everything
    if (userRole === "Super Administrator" || userRole === "Hospital Administrator") {
      return true;
    }
    // Check role inclusion
    if (item.roles && item.roles.includes(userRole)) {
      return true;
    }
    // Check permission inclusion if defined
    if (item.permission && permissions.includes(item.permission)) {
      return true;
    }
    // If no strict restriction defined, allow core dashboard and notifications
    if (!item.permission && !item.roles) {
      return true;
    }
    return false;
  };

  const filteredItems = navItems.filter(isAllowed);

  // Group by section
  const grouped = filteredItems.reduce<Record<string, NavItem[]>>((acc, item) => {
    const key = item.section ?? "core";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <aside
      className={`
        flex flex-col h-screen bg-white border-r border-slate-200 
        transition-all duration-300 ease-in-out shrink-0 relative
        ${collapsed ? "w-[68px]" : "w-[240px]"}
      `}
    >
      {/* Logo */}
      <div className={`flex items-center h-16 px-4 border-b border-slate-200 shrink-0 ${collapsed ? "justify-center" : "gap-3"}`}>
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary-600 text-white shrink-0">
          <Activity size={18} />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="font-bold text-sm text-slate-900 leading-tight">CuraSphere</p>
            <p className="text-[10px] text-slate-500 leading-tight">{userRole}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1 scrollbar-thin">
        {Object.entries(grouped).map(([section, items], sectionIdx) => (
          <div key={section} className={sectionIdx > 0 ? "pt-3" : ""}>
            {!collapsed && (
              <p className="text-[10px] font-semibold text-slate-400 px-3 pb-1.5 tracking-widest">
                {sectionLabels[section]}
              </p>
            )}
            {collapsed && sectionIdx > 0 && (
              <div className="mx-2 my-2 border-t border-slate-100" />
            )}
            <div className="space-y-0.5">
              {items.map((item) => {
                const isActive = location.pathname === item.path ||
                  (item.path !== "/dashboard" && location.pathname.startsWith(item.path));
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    title={collapsed ? item.label : undefined}
                    className={`
                      flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium
                      transition-all duration-150 group relative
                      ${isActive
                        ? "bg-primary-50 text-primary-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }
                      ${collapsed ? "justify-center" : ""}
                    `}
                  >
                    <span className={`shrink-0 ${isActive ? "text-primary-600" : "text-slate-400 group-hover:text-slate-600"}`}>
                      {item.icon}
                    </span>
                    {!collapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                    {isActive && !collapsed && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-600 shrink-0" />
                    )}
                    {/* Tooltip for collapsed mode */}
                    {collapsed && (
                      <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 shadow-lg">
                        {item.label}
                        <div className="absolute top-1/2 -translate-y-1/2 -left-1.5 border-4 border-transparent border-r-slate-900" />
                      </div>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <div className="border-t border-slate-200 p-3 shrink-0">
        <button
          onClick={onToggle}
          className={`
            w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-slate-500
            hover:bg-slate-50 hover:text-slate-700 transition-all duration-150
            ${collapsed ? "justify-center" : ""}
          `}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed
            ? <ChevronRight size={16} />
            : <>
                <ChevronLeft size={16} />
                <span className="text-xs font-medium">Collapse</span>
              </>
          }
        </button>
      </div>
    </aside>
  );
}
