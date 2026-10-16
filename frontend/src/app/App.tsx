import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../features/auth/pages/LoginPage";
import DashboardPage from "../features/dashboard/pages/DashboardPage";
import ProtectedRoute from "../routes/ProtectedRoute";
import { useAuthStore } from "../stores/authStore";
import { useEditionStore } from "../stores/editionStore";
import AppLayout from "../components/layout/AppLayout";
import { ModuleId } from "../types/edition";

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
 * Wraps a component in ProtectedRoute (validating edition + user permissions) + AppLayout.
 */
function ProtectedLayout({
  children,
  permission,
  module,
}: {
  children: React.ReactNode;
  permission?: string;
  module?: ModuleId;
}) {
  return (
    <ProtectedRoute requiredPermission={permission} requiredModule={module}>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

export function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const syncWithBackend = useEditionStore((state) => state.syncWithBackend);

  useEffect(() => {
    syncWithBackend();
  }, [syncWithBackend]);

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
          element={<ProtectedLayout module="dashboard"><DashboardPage /></ProtectedLayout>}
        />

        {/* Patients */}
        <Route
          path="/patients"
          element={<ProtectedLayout module="patients" permission="patients.read"><PatientList /></ProtectedLayout>}
        />
        <Route
          path="/patients/register"
          element={<ProtectedLayout module="patients" permission="patients.create"><PatientRegistration /></ProtectedLayout>}
        />
        <Route
          path="/patients/:id"
          element={<ProtectedLayout module="patients" permission="patients.read"><PatientProfile /></ProtectedLayout>}
        />
        <Route
          path="/patients/:id/edit"
          element={<ProtectedLayout module="patients" permission="patients.update"><PatientRegistration /></ProtectedLayout>}
        />

        {/* Clinical */}
        <Route path="/appointments" element={<ProtectedLayout module="appointments"><AppointmentsPage /></ProtectedLayout>} />
        <Route path="/opd" element={<ProtectedLayout module="opd"><OPDPage /></ProtectedLayout>} />
        <Route path="/ipd" element={<ProtectedLayout module="ipd"><IPDPage /></ProtectedLayout>} />
        <Route path="/emergency" element={<ProtectedLayout module="emergency"><EmergencyPage /></ProtectedLayout>} />
        <Route path="/emr" element={<ProtectedLayout module="emr"><EMRPage /></ProtectedLayout>} />

        {/* Clinical Services */}
        <Route path="/laboratory" element={<ProtectedLayout module="laboratory"><LaboratoryPage /></ProtectedLayout>} />
        <Route path="/radiology" element={<ProtectedLayout module="radiology"><RadiologyPage /></ProtectedLayout>} />
        <Route path="/pharmacy" element={<ProtectedLayout module="pharmacy"><PharmacyPage /></ProtectedLayout>} />
        <Route path="/surgery" element={<ProtectedLayout module="surgery"><SurgeryPage /></ProtectedLayout>} />
        <Route path="/icu" element={<ProtectedLayout module="icu"><ICUPage /></ProtectedLayout>} />

        {/* Finance */}
        <Route path="/billing" element={<ProtectedLayout module="billing"><BillingPage /></ProtectedLayout>} />
        <Route path="/payments" element={<ProtectedLayout module="payments"><PaymentsPage /></ProtectedLayout>} />
        <Route path="/insurance" element={<ProtectedLayout module="insurance"><InsurancePage /></ProtectedLayout>} />

        {/* Operations */}
        <Route path="/inventory" element={<ProtectedLayout module="inventory"><InventoryPage /></ProtectedLayout>} />
        <Route path="/hr" element={<ProtectedLayout module="hr"><HRPage /></ProtectedLayout>} />
        <Route path="/attendance" element={<ProtectedLayout module="attendance"><AttendancePage /></ProtectedLayout>} />

        {/* Doctors & Nurses */}
        <Route path="/doctors" element={<ProtectedLayout module="doctors"><DoctorsPage /></ProtectedLayout>} />
        <Route path="/nurses" element={<ProtectedLayout module="nurses"><NursesPage /></ProtectedLayout>} />

        {/* Admin */}
        <Route path="/reports" element={<ProtectedLayout module="reports"><ReportsPage /></ProtectedLayout>} />
        <Route path="/notifications" element={<ProtectedLayout module="notifications"><NotificationsPage /></ProtectedLayout>} />
        <Route path="/audit" element={<ProtectedLayout module="audit"><AuditLogsPage /></ProtectedLayout>} />
        <Route path="/administration" element={<ProtectedLayout module="administration"><AdministrationPage /></ProtectedLayout>} />

        {/* Default */}
        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
