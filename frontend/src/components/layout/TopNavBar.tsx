import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Search, Bell, HelpCircle, LogOut, User, Settings,
  ChevronDown
} from "lucide-react";
import { useAuthStore } from "../../stores/authStore";
import api from "../../lib/api";


const breadcrumbMap: Record<string, string> = {
  dashboard: "Dashboard",
  patients: "Patients",
  appointments: "Appointments",
  opd: "OPD",
  ipd: "IPD",
  emergency: "Emergency",
  emr: "EMR",
  laboratory: "Laboratory",
  radiology: "Radiology",
  pharmacy: "Pharmacy",
  surgery: "Surgery",
  icu: "ICU",
  billing: "Billing",
  payments: "Payments",
  insurance: "Insurance",
  inventory: "Inventory",
  hr: "HR Management",
  attendance: "Attendance",
  reports: "Reports",
  notifications: "Notifications",
  administration: "Administration",
  register: "Register Patient",
};

export default function TopNavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const profileRef = useRef<HTMLDivElement>(null);

  // Build breadcrumb from path
  const pathSegments = location.pathname.split("/").filter(Boolean);
  const breadcrumbs = pathSegments.map((seg) => breadcrumbMap[seg] ?? seg);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try { await api.post("/auth/logout"); } catch {}
    logout();
    navigate("/login");
  };

  const initials = (user?.employeeName || user?.username || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 gap-4 shrink-0 sticky top-0 z-30">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm min-w-0 mr-2">
        <span className="text-slate-400 text-xs">CuraSphere</span>
        {breadcrumbs.map((crumb, idx) => (
          <span key={idx} className="flex items-center gap-1.5">
            <span className="text-slate-300">/</span>
            <span className={`${idx === breadcrumbs.length - 1 ? "text-slate-800 font-semibold" : "text-slate-500"} text-xs capitalize`}>
              {crumb}
            </span>
          </span>
        ))}
      </div>

      {/* Search */}
      <div className="flex-1 max-w-sm">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search patients, records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl 
                       focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                       placeholder:text-slate-400 transition-all duration-150"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Help */}
        <button className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all duration-150">
          <HelpCircle size={18} />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all duration-150"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danger-500 ring-2 ring-white" />
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-slide-down">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <p className="font-semibold text-sm text-slate-900">Notifications</p>
                <span className="text-xs text-primary-600 font-medium cursor-pointer hover:underline">Mark all read</span>
              </div>
              <div className="divide-y divide-slate-50">
                {[
                  { icon: "🔴", title: "Critical: ICU Patient Alert", time: "2 min ago" },
                  { icon: "📋", title: "Lab results ready — MRN-00234", time: "15 min ago" },
                  { icon: "💊", title: "Pharmacy: Low stock — Amoxicillin", time: "1 hr ago" },
                  { icon: "📅", title: "3 appointments pending confirmation", time: "2 hr ago" },
                ].map((n, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors">
                    <span className="text-lg shrink-0 mt-0.5">{n.icon}</span>
                    <div className="min-w-0">
                      <p className="text-sm text-slate-800 font-medium leading-tight truncate">{n.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{n.time}</p>
                    </div>
                    {i === 0 && <span className="ml-auto w-2 h-2 rounded-full bg-primary-500 shrink-0 mt-1.5" />}
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 border-t border-slate-100 text-center">
                <button onClick={() => { navigate("/notifications"); setNotifOpen(false); }}
                  className="text-sm text-primary-600 font-medium hover:underline">
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-200" />

        {/* User Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-slate-50 transition-all duration-150"
          >
            <div className="w-8 h-8 rounded-xl bg-primary-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
              {initials}
            </div>
            <div className="text-left hidden sm:block min-w-0">
              <p className="text-sm font-semibold text-slate-900 leading-tight truncate max-w-[120px]">
                {user?.employeeName || user?.username || "Admin"}
              </p>
              <p className="text-[10px] text-slate-400 leading-tight truncate">{user?.roleName || "Administrator"}</p>
            </div>
            <ChevronDown size={14} className={`text-slate-400 transition-transform duration-150 ${profileOpen ? "rotate-180" : ""}`} />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-slide-down">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="font-semibold text-sm text-slate-900">{user?.employeeName || user?.username}</p>
                <p className="text-xs text-slate-400">{user?.roleName}</p>
              </div>
              <div className="py-1.5">
                <button className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                  <User size={15} className="text-slate-400" /> My Profile
                </button>
                <button className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                  <Settings size={15} className="text-slate-400" /> Settings
                </button>
              </div>
              <div className="border-t border-slate-100 py-1.5">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-danger-600 hover:bg-danger-50 transition-colors"
                >
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
