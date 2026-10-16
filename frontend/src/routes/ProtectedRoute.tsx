import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { useEditionStore } from "../stores/editionStore";
import { ModuleId } from "../types/edition";
import { ShieldAlert, ArrowLeft, Layers } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredModule?: ModuleId;
}

export default function ProtectedRoute({ children, requiredPermission, requiredModule }: ProtectedRouteProps) {
  const { isAuthenticated, permissions, user } = useAuthStore();
  const currentEdition = useEditionStore((state) => state.currentEdition);
  const isModuleEnabled = useEditionStore((state) => state.isModuleEnabled);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 1. Edition Module Guard: verify feature is supported in current edition
  if (requiredModule && !isModuleEnabled(requiredModule)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 select-none">
        <Card className="w-full max-w-md p-8 text-center border-border/40 shadow-xl hover:border-warning/30 transition-all duration-300">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-amber-50 text-amber-600 mb-4 border border-amber-200">
            <Layers className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Edition Restriction</h2>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
            The <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono text-xs">{requiredModule}</code> capability is a hospital-specific workflow and is disabled in <strong>{currentEdition} Edition</strong>.
          </p>
          <div className="mt-8 flex justify-center">
            <Button
              variant="outline"
              onClick={() => { window.location.href = "/dashboard"; }}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // 2. Super Administrator / Admin role check: grants full access to all enabled hospital sections
  const isSuperAdmin = Boolean(
    user &&
      (user.username?.toLowerCase() === "admin" ||
        user.roleName?.toLowerCase().includes("admin") ||
        user.roleName?.toLowerCase().includes("super") ||
        permissions.includes("AllAccess") ||
        permissions.includes("SystemAdmin") ||
        permissions.includes("*"))
  );

  // 3. User Role & Permission Authorization Guard
  if (requiredPermission && !isSuperAdmin && !permissions.includes(requiredPermission)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 select-none">
        <Card className="w-full max-w-md p-8 text-center border-border/40 shadow-xl hover:border-danger/30 transition-all duration-300">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-danger/10 text-danger mb-4">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Permission Denied</h2>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
            Your user account role does not have authorization to access this area. 
            Required claim: <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono text-xs">{requiredPermission}</code>
          </p>
          <div className="mt-8 flex justify-center">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
