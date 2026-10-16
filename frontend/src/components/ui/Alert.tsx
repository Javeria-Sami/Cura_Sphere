import React from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle, X } from "lucide-react";

type AlertVariant = "success" | "warning" | "error" | "info" | "critical";

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children?: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

const config: Record<AlertVariant, { icon: React.ReactNode; bg: string; border: string; title: string; text: string; close: string }> = {
  success: {
    icon: <CheckCircle2 size={16} />,
    bg: "bg-success-50",
    border: "border-success-200",
    title: "text-success-800",
    text: "text-success-700",
    close: "text-success-500 hover:bg-success-100",
  },
  warning: {
    icon: <AlertTriangle size={16} />,
    bg: "bg-warning-50",
    border: "border-warning-200",
    title: "text-warning-800",
    text: "text-warning-700",
    close: "text-warning-500 hover:bg-warning-100",
  },
  error: {
    icon: <XCircle size={16} />,
    bg: "bg-danger-50",
    border: "border-danger-200",
    title: "text-danger-800",
    text: "text-danger-700",
    close: "text-danger-500 hover:bg-danger-100",
  },
  info: {
    icon: <Info size={16} />,
    bg: "bg-info-50",
    border: "border-info-200",
    title: "text-info-800",
    text: "text-info-700",
    close: "text-info-500 hover:bg-info-100",
  },
  critical: {
    icon: <AlertTriangle size={16} />,
    bg: "bg-danger-100",
    border: "border-danger-400",
    title: "text-danger-900",
    text: "text-danger-800",
    close: "text-danger-600 hover:bg-danger-200",
  },
};

export function Alert({ variant = "info", title, children, onClose, className = "" }: AlertProps) {
  const c = config[variant];
  return (
    <div
      role="alert"
      className={`
        flex items-start gap-3 p-4 rounded-xl border
        ${c.bg} ${c.border} ${className}
        animate-slide-down
      `}
    >
      <span className={`${c.title} shrink-0 mt-0.5`}>{c.icon}</span>
      <div className="flex-1 min-w-0">
        {title && (
          <p className={`font-semibold text-sm ${c.title}`}>{title}</p>
        )}
        {children && (
          <div className={`text-sm mt-0.5 ${c.text} ${title ? "mt-1" : ""}`}>
            {children}
          </div>
        )}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className={`p-1 rounded-md transition-colors duration-150 ${c.close} shrink-0`}
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
