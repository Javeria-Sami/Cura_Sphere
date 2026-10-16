import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

export default function ProtectedRoute({ children, requiredPermission }: ProtectedRouteProps) {
  const { isAuthenticated, permissions, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Super Administrator / Admin role bypass check: grants full access to all hospital sections
  const isSuperAdmin =
    !user ||
    user.username?.toLowerCase() === "admin" ||
    user.roleName?.toLowerCase().includes("admin") ||
    user.roleName?.toLowerCase().includes("super") ||
    permissions.includes("AllAccess") ||
    permissions.includes("SystemAdmin") ||
    permissions.includes("*");

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
