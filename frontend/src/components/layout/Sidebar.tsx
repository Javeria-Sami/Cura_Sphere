import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, Calendar, Stethoscope, BedDouble,
  AlertTriangle, FileText, FlaskConical, Scan, Pill,
  Scissors, Heart, Receipt, CreditCard, Shield,
  Package, Users2, Clock, BarChart3, Settings,
  Bell, ChevronLeft, ChevronRight, Activity
} from "lucide-react";
import { useAuthStore } from "../../stores/authStore";
import { useEditionStore } from "../../stores/editionStore";
import { ModuleId } from "../../types/edition";

export interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  moduleId: ModuleId;
  permission?: string;
  roles?: string[];
  badge?: number;
  section?: string;
}

export const navItems: NavItem[] = [
  // Core Overview
  { label: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={18} />, moduleId: "dashboard", section: "core" },

  // Clinical Workspace (Doctors, Nurses, Receptionists)
  { label: "Patients", path: "/patients", icon: <Users size={18} />, moduleId: "patients", permission: "patients.read", roles: ["Super Administrator", "Hospital Administrator", "Doctor", "Nurse", "Receptionist"], section: "clinical" },
  { label: "Doctors Directory", path: "/doctors", icon: <Stethoscope size={18} />, moduleId: "doctors", roles: ["Super Administrator", "Hospital Administrator", "Doctor", "Receptionist", "HR Manager"], section: "clinical" },
  { label: "Nurses Desk", path: "/nurses", icon: <Activity size={18} />, moduleId: "nurses", roles: ["Super Administrator", "Hospital Administrator", "Nurse", "Head Nurse", "HR Manager"], section: "clinical" },
  { label: "Appointments", path: "/appointments", icon: <Calendar size={18} />, moduleId: "appointments", roles: ["Super Administrator", "Hospital Administrator", "Doctor", "Receptionist", "Nurse"], section: "clinical" },
  { label: "OPD Queue", path: "/opd", icon: <Stethoscope size={18} />, moduleId: "opd", roles: ["Super Administrator", "Hospital Administrator", "Doctor", "Nurse", "Receptionist"], section: "clinical" },
  { label: "IPD Wards", path: "/ipd", icon: <BedDouble size={18} />, moduleId: "ipd", roles: ["Super Administrator", "Hospital Administrator", "Doctor", "Nurse", "Receptionist"], section: "clinical" },
  { label: "Emergency Triage", path: "/emergency", icon: <AlertTriangle size={18} />, moduleId: "emergency", roles: ["Super Administrator", "Hospital Administrator", "Doctor", "Nurse", "Emergency Specialist"], section: "clinical" },
  { label: "EMR Desk", path: "/emr", icon: <FileText size={18} />, moduleId: "emr", roles: ["Super Administrator", "Hospital Administrator", "Doctor", "Nurse"], section: "clinical" },

  // Clinical Services (Diagnostics, Surgery, ICU, Pharmacy)
  { label: "Laboratory", path: "/laboratory", icon: <FlaskConical size={18} />, moduleId: "laboratory", roles: ["Super Administrator", "Hospital Administrator", "Doctor", "Laboratory Technician", "Pathologist"], section: "services" },
  { label: "Radiology / PACS", path: "/radiology", icon: <Scan size={18} />, moduleId: "radiology", roles: ["Super Administrator", "Hospital Administrator", "Doctor", "Radiologist", "X-Ray Tech"], section: "services" },
  { label: "Pharmacy", path: "/pharmacy", icon: <Pill size={18} />, moduleId: "pharmacy", roles: ["Super Administrator", "Hospital Administrator", "Pharmacist", "Dispensary Staff"], section: "services" },
  { label: "Surgery OT", path: "/surgery", icon: <Scissors size={18} />, moduleId: "surgery", roles: ["Super Administrator", "Hospital Administrator", "Doctor", "Surgeon", "Nurse"], section: "services" },
  { label: "ICU Telemetry", path: "/icu", icon: <Heart size={18} />, moduleId: "icu", roles: ["Super Administrator", "Hospital Administrator", "Doctor", "Nurse", "ICU Specialist"], section: "services" },

  // Finance Workspace
  { label: "Billing & Invoices", path: "/billing", icon: <Receipt size={18} />, moduleId: "billing", permission: "billing.read", roles: ["Super Administrator", "Hospital Administrator", "Accountant", "Cashier", "Billing Officer"], section: "finance" },
  { label: "Payments Cashier", path: "/payments", icon: <CreditCard size={18} />, moduleId: "payments", roles: ["Super Administrator", "Hospital Administrator", "Accountant", "Cashier"], section: "finance" },
  { label: "Insurance Claims", path: "/insurance", icon: <Shield size={18} />, moduleId: "insurance", roles: ["Super Administrator", "Hospital Administrator", "Accountant", "Insurance Officer"], section: "finance" },

  // Operations Workspace
  { label: "Store Inventory", path: "/inventory", icon: <Package size={18} />, moduleId: "inventory", roles: ["Super Administrator", "Hospital Administrator", "Store Manager", "Pharmacist"], section: "operations" },
  { label: "HR Staff", path: "/hr", icon: <Users2 size={18} />, moduleId: "hr", roles: ["Super Administrator", "Hospital Administrator", "HR Manager", "HR Officer"], section: "operations" },
  { label: "Attendance Roster", path: "/attendance", icon: <Clock size={18} />, moduleId: "attendance", roles: ["Super Administrator", "Hospital Administrator", "HR Manager", "Department Head"], section: "operations" },

  // System Administration
  { label: "BI Reports", path: "/reports", icon: <BarChart3 size={18} />, moduleId: "reports", roles: ["Super Administrator", "Hospital Administrator", "Manager", "Accountant"], section: "admin" },
  { label: "Notifications", path: "/notifications", icon: <Bell size={18} />, moduleId: "notifications", section: "admin" },
  { label: "Audit Logs", path: "/audit", icon: <Shield size={18} />, moduleId: "audit", roles: ["Super Administrator", "Hospital Administrator", "IT Support"], section: "admin" },
  { label: "System Config", path: "/administration", icon: <Settings size={18} />, moduleId: "administration", roles: ["Super Administrator", "Hospital Administrator", "IT Support"], section: "admin" },
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
  const currentEdition = useEditionStore((state) => state.currentEdition);
  const isModuleEnabled = useEditionStore((state) => state.isModuleEnabled);

  const userRole = user?.roleName || "Guest";

  const isAllowed = (item: NavItem) => {
    // 1. Centralized Edition check: module must be enabled in the active edition
    if (item.moduleId && !isModuleEnabled(item.moduleId)) {
      return false;
    }

    // 2. Super Administrator & Hospital Administrator see all enabled modules
    if (userRole === "Super Administrator" || userRole === "Hospital Administrator") {
      return true;
    }

    // 3. Check role inclusion
    if (item.roles && item.roles.includes(userRole)) {
      return true;
    }

    // 4. Check permission inclusion if defined
    if (item.permission && permissions.includes(item.permission)) {
      return true;
    }

    // 5. If no strict restriction defined, allow core dashboard and notifications
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
      {/* Logo & Edition Header */}
      <div className={`flex items-center h-16 px-4 border-b border-slate-200 shrink-0 ${collapsed ? "justify-center" : "gap-3"}`}>
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary-600 text-white shrink-0">
          <Activity size={18} />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="font-bold text-sm text-slate-900 leading-tight">CuraSphere</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-semibold uppercase tracking-wider ${
                currentEdition === "Clinic"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-primary-50 text-primary-700 border border-primary-200"
              }`}>
                {currentEdition}
              </span>
              <span className="text-[10px] text-slate-400 truncate max-w-[90px]">{userRole}</span>
            </div>
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
            <div className="space-y-0.5">
              {items.map((item) => {
                const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    title={collapsed ? item.label : undefined}
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium
                      transition-all duration-150 group relative
                      ${isActive
                        ? "bg-primary-50 text-primary-700 font-semibold"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }
                      ${collapsed ? "justify-center px-0" : ""}
                    `}
                  >
                    <span className={`shrink-0 ${isActive ? "text-primary-600" : "text-slate-400 group-hover:text-slate-600"}`}>
                      {item.icon}
                    </span>
                    {!collapsed && (
                      <span className="truncate flex-1">{item.label}</span>
                    )}
                    {!collapsed && item.badge && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-primary-100 text-primary-700">
                        {item.badge}
                      </span>
                    )}
                    {collapsed && (
                      <div className="
                        absolute left-full ml-2 px-2.5 py-1 bg-slate-900 text-white text-xs 
                        rounded-lg whitespace-nowrap shadow-lg pointer-events-none opacity-0 
                        group-hover:opacity-100 transition-opacity z-50
                      ">
                        {item.label}
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
      <div className="p-3 border-t border-slate-200 shrink-0">
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-full py-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all text-xs gap-2"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Collapse</span></>}
        </button>
      </div>
    </aside>
  );
}
