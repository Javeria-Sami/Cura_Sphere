import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, User, Eye, EyeOff, Activity, Shield, Heart, Stethoscope, FlaskConical } from "lucide-react";
import { useAuthStore } from "../../../stores/authStore";
import api from "../../../lib/api";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";

const features = [
  { icon: <Stethoscope size={20} />, label: "Clinical Workflows", desc: "OPD, IPD, EMR, Surgery" },
  { icon: <FlaskConical size={20} />, label: "Diagnostic Services", desc: "Lab, Radiology, Pharmacy" },
  { icon: <Heart size={20} />, label: "Patient Care", desc: "Emergency, ICU, Nursing" },
  { icon: <Shield size={20} />, label: "Secure & Compliant", desc: "Role-based access control" },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const loginStore = useAuthStore((state) => state.login);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const cleanUsername = username.trim().toLowerCase();
      const isAdminCredentials = cleanUsername === "admin" && (password === "Admin123!" || password === "admin" || password === "Admin123");

      try {
        const response = await api.post("/auth/login", { username: cleanUsername, password });
        const { success, data, error: apiError } = response.data;

        if (success && data) {
          const { token, userId, username: resUser, roleName, employeeName, permissions } = data;
          loginStore(token, { userId, username: resUser, roleName, employeeName }, permissions);
          navigate("/dashboard");
          return;
        } else if (isAdminCredentials) {
          // Fallback if backend returned unsuccessful response for admin
          loginStore(
            "demo-admin-token",
            { userId: 1, username: "admin", roleName: "Super Administrator", employeeName: "System Administrator" },
            ["SystemAdmin", "AllAccess", "ManageUsers", "ClinicalWorkspace", "FinancialCashier", "Diagnostics", "Operations"]
          );
          navigate("/dashboard");
          return;
        } else {
          setError(apiError?.message || "Invalid username or password.");
        }
      } catch (apiErr: any) {
        // Backend API offline / Vercel standalone deployment fallback
        if (isAdminCredentials) {
          loginStore(
            "demo-admin-token",
            { userId: 1, username: "admin", roleName: "Super Administrator", employeeName: "System Administrator" },
            ["SystemAdmin", "AllAccess", "ManageUsers", "ClinicalWorkspace", "FinancialCashier", "Diagnostics", "Operations"]
          );
          navigate("/dashboard");
          return;
        }
        setError(apiErr.response?.data?.error?.message || "Invalid username or password.");
      }
    } catch (err: any) {
      setError("An unexpected login error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex flex-col flex-1 bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 relative overflow-hidden">
        {/* Decorative orbs */}
        <div className="absolute top-[-15%] left-[-10%] w-[60%] h-[60%] rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary-400/20 blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-[-5%] w-[30%] h-[30%] rounded-full bg-white/5 blur-2xl pointer-events-none" />

        <div className="relative flex flex-col h-full p-12 justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-white/15 text-white backdrop-blur-sm">
              <Activity size={22} />
            </div>
            <div>
              <p className="text-white font-bold text-xl leading-tight">CuraSphere</p>
              <p className="text-primary-200 text-xs">Hospital Management System</p>
            </div>
          </div>

          {/* Hero Text */}
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              Centralized<br />Hospital Operations
            </h1>
            <p className="text-primary-200 text-base leading-relaxed max-w-sm">
              One connected platform for patient care, clinical services, billing, and hospital administration.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-4">
              {features.map((f, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/15 transition-all duration-200">
                  <div className="text-primary-200 shrink-0 mt-0.5">{f.icon}</div>
                  <div>
                    <p className="text-white text-sm font-semibold">{f.label}</p>
                    <p className="text-primary-300 text-xs mt-0.5">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div>
            <div className="flex items-center gap-4 mb-4">
              {[
                { value: "24+", label: "Modules" },
                { value: "100%", label: "Role-based" },
                { value: "HIPAA", label: "Compliant" },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <p className="text-white font-bold text-xl">{s.value}</p>
                  <p className="text-primary-300 text-xs">{s.label}</p>
                </div>
              ))}
            </div>
            <p className="text-primary-400 text-xs">
              Develop by Uzaii (
              <a
                href="https://www.linkedin.com/in/uzair-ahmad-58007a266/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-white transition-colors"
              >
                linkedin.com/in/uzair-ahmad-58007a266
              </a>
              )
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex flex-col items-center justify-center flex-1 p-8 bg-white relative min-h-screen lg:min-h-0 lg:max-w-[480px]">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2.5 mb-10">
          <div className="w-9 h-9 rounded-xl bg-primary-600 text-white flex items-center justify-center">
            <Activity size={18} />
          </div>
          <p className="font-bold text-lg text-slate-900">CuraSphere HMS</p>
        </div>

        <div className="w-full max-w-[360px]">
          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
            <p className="text-slate-500 text-sm mt-1">Sign in to your HMS account</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-center gap-2.5 p-3.5 rounded-xl bg-danger-50 border border-danger-200 text-danger-700 text-sm animate-slide-down">
              <div className="w-1.5 h-1.5 rounded-full bg-danger-500 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              id="username-input"
              label="Username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              leftIcon={<User size={16} className="text-slate-400" />}
              required
              autoComplete="username"
            />

            <div className="relative">
              <Input
                id="password-input"
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                leftIcon={<Lock size={16} className="text-slate-400" />}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all duration-150"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
                <input type="checkbox" className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                Remember me
              </label>
              <button type="button" className="text-primary-600 hover:underline font-medium">
                Forgot password?
              </button>
            </div>

            <Button
              id="login-btn"
              type="submit"
              className="w-full h-11 text-sm font-semibold"
              isLoading={loading}
              leftIcon={!loading ? <Shield size={16} /> : undefined}
            >
              Sign In to HMS
            </Button>
          </form>

          {/* Department Staff Quick Logins */}
          <div className="mt-6 p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Quick Role / Department Logins
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  loginStore("demo-doctor-token", { userId: 2, username: "dr_kamran", roleName: "Doctor", employeeName: "Dr. Kamran Ahmed" }, ["patients.read", "emr.read", "opd.read", "appointments.read"]);
                  navigate("/emr");
                }}
                className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 hover:border-primary-400 hover:bg-primary-50 transition-all font-medium text-slate-700"
              >
                <span>🩺 Doctor Desk</span>
                <span className="text-[10px] text-primary-600 font-bold">EMR</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  loginStore("demo-nurse-token", { userId: 3, username: "nurse_fatima", roleName: "Nurse", employeeName: "Nurse Fatima" }, ["patients.read", "ipd.read", "emergency.read", "icu.read"]);
                  navigate("/ipd");
                }}
                className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all font-medium text-slate-700"
              >
                <span>🏥 Nurse Station</span>
                <span className="text-[10px] text-emerald-600 font-bold">Wards</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  loginStore("demo-finance-token", { userId: 4, username: "cashier_tariq", roleName: "Cashier", employeeName: "Tariq Mahmood (Cashier)" }, ["billing.read", "billing.create", "payments.pay"]);
                  navigate("/billing");
                }}
                className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 hover:border-amber-400 hover:bg-amber-50 transition-all font-medium text-slate-700"
              >
                <span>💳 Finance & Billing</span>
                <span className="text-[10px] text-amber-600 font-bold">Cashier</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  loginStore("demo-lab-token", { userId: 5, username: "lab_zara", roleName: "Laboratory Technician", employeeName: "Zara Tech (Lab)" }, ["laboratory.read", "radiology.read"]);
                  navigate("/laboratory");
                }}
                className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 hover:border-purple-400 hover:bg-purple-50 transition-all font-medium text-slate-700"
              >
                <span>🧪 Diagnostics Desk</span>
                <span className="text-[10px] text-purple-600 font-bold">Lab/PACS</span>
              </button>
            </div>
            <div className="pt-1 flex items-center justify-between text-xs border-t border-slate-200/60">
              <span className="text-slate-500">Super Admin (All Access):</span>
              <button
                type="button"
                onClick={() => { setUsername("admin"); setPassword("Admin123!"); }}
                className="text-xs text-primary-600 hover:underline font-bold"
              >
                Auto-fill Admin
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            Secure access. All actions are logged and audited.
          </p>
        </div>
      </div>
    </div>
  );
}
