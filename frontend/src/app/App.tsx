import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../features/auth/pages/LoginPage";
import DashboardPage from "../features/dashboard/pages/DashboardPage";
import ProtectedRoute from "../routes/ProtectedRoute";
import { useAuthStore } from "../stores/authStore";
import AppLayout from "../components/layout/AppLayout";

// Patient & Staff
import PatientList from "../features/patients/components/PatientList";
import PatientRegistration from "../features/patients/components/PatientRegistration";
import PatientProfile from "../features/patients/components/PatientProfile";
import DoctorsPage from "../features/doctors/pages/DoctorsPage";
import NursesPage from "../features/nurses/pages/NursesPage";

// Clinical
import AppointmentsPage from "../features/appointments/pages/AppointmentsPage";
import OPDPage from "../features/opd/pages/OPDPage";
import IPDPage from "../features/ipd/pages/IPDPage";
import EmergencyPage from "../features/emergency/pages/EmergencyPage";
import EMRPage from "../features/emr/pages/EMRPage";

// Clinical Services
import LaboratoryPage from "../features/laboratory/pages/LaboratoryPage";
import RadiologyPage from "../features/radiology/pages/RadiologyPage";
import PharmacyPage from "../features/pharmacy/pages/PharmacyPage";
import SurgeryPage from "../features/surgery/pages/SurgeryPage";
import ICUPage from "../features/icu/pages/ICUPage";

// Finance
import BillingPage from "../features/billing/pages/BillingPage";
import PaymentsPage from "../features/payments/pages/PaymentsPage";
import InsurancePage from "../features/insurance/pages/InsurancePage";

// Operations
import InventoryPage from "../features/inventory/pages/InventoryPage";
import HRPage from "../features/hr/pages/HRPage";
import AttendancePage from "../features/attendance/pages/AttendancePage";

// Admin
import ReportsPage from "../features/reports/pages/ReportsPage";
import NotificationsPage from "../features/notifications/pages/NotificationsPage";
import AdministrationPage from "../features/administration/pages/AdministrationPage";
import AuditLogsPage from "../features/audit/pages/AuditLogsPage";

/**
 * Wraps a component in both ProtectedRoute + AppLayout.
 */
function ProtectedLayout({
  children,
  permission,
}: {
  children: React.ReactNode;
  permission?: string;
}) {
  return (
    <ProtectedRoute requiredPermission={permission}>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

export function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={<ProtectedLayout><DashboardPage /></ProtectedLayout>}
        />

        {/* Patients */}
        <Route
          path="/patients"
          element={<ProtectedLayout permission="patients.read"><PatientList /></ProtectedLayout>}
        />
        <Route
          path="/patients/register"
          element={<ProtectedLayout permission="patients.create"><PatientRegistration /></ProtectedLayout>}
        />
        <Route
          path="/patients/:id"
          element={<ProtectedLayout permission="patients.read"><PatientProfile /></ProtectedLayout>}
        />
        <Route
          path="/patients/:id/edit"
          element={<ProtectedLayout permission="patients.update"><PatientRegistration /></ProtectedLayout>}
        />

        {/* Clinical */}
        <Route path="/appointments" element={<ProtectedLayout><AppointmentsPage /></ProtectedLayout>} />
        <Route path="/opd" element={<ProtectedLayout><OPDPage /></ProtectedLayout>} />
        <Route path="/ipd" element={<ProtectedLayout><IPDPage /></ProtectedLayout>} />
        <Route path="/emergency" element={<ProtectedLayout><EmergencyPage /></ProtectedLayout>} />
        <Route path="/emr" element={<ProtectedLayout><EMRPage /></ProtectedLayout>} />

        {/* Clinical Services */}
        <Route path="/laboratory" element={<ProtectedLayout><LaboratoryPage /></ProtectedLayout>} />
        <Route path="/radiology" element={<ProtectedLayout><RadiologyPage /></ProtectedLayout>} />
        <Route path="/pharmacy" element={<ProtectedLayout><PharmacyPage /></ProtectedLayout>} />
        <Route path="/surgery" element={<ProtectedLayout><SurgeryPage /></ProtectedLayout>} />
        <Route path="/icu" element={<ProtectedLayout><ICUPage /></ProtectedLayout>} />

        {/* Finance */}
        <Route path="/billing" element={<ProtectedLayout><BillingPage /></ProtectedLayout>} />
        <Route path="/payments" element={<ProtectedLayout><PaymentsPage /></ProtectedLayout>} />
        <Route path="/insurance" element={<ProtectedLayout><InsurancePage /></ProtectedLayout>} />

        {/* Operations */}
        <Route path="/inventory" element={<ProtectedLayout><InventoryPage /></ProtectedLayout>} />
        <Route path="/hr" element={<ProtectedLayout><HRPage /></ProtectedLayout>} />
        <Route path="/attendance" element={<ProtectedLayout><AttendancePage /></ProtectedLayout>} />

        {/* Doctors & Nurses */}
        <Route path="/doctors" element={<ProtectedLayout><DoctorsPage /></ProtectedLayout>} />
        <Route path="/nurses" element={<ProtectedLayout><NursesPage /></ProtectedLayout>} />

        {/* Admin */}
        <Route path="/reports" element={<ProtectedLayout><ReportsPage /></ProtectedLayout>} />
        <Route path="/notifications" element={<ProtectedLayout><NotificationsPage /></ProtectedLayout>} />
        <Route path="/audit" element={<ProtectedLayout><AuditLogsPage /></ProtectedLayout>} />
        <Route path="/administration" element={<ProtectedLayout><AdministrationPage /></ProtectedLayout>} />

        {/* Default */}
        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
