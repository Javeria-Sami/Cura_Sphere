import { NavLink, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight, Activity } from "lucide-react";
import { useAuthStore } from "../../stores/authStore";
import { useEditionStore } from "../../stores/editionStore";
import { navItems, sectionLabels, NavItem } from "../../config/navigation";

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
