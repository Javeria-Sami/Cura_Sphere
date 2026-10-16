import React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "secondary" | "success" | "danger" | "warning" | "info" | "default";
  size?: "sm" | "md";
  showDot?: boolean;
  pill?: boolean;
}

export function Badge({
  variant = "primary",
  size = "md",
  showDot = false,
  pill = false,
  className = "",
  children,
  ...props
}: BadgeProps) {
  const sizeStyles = {
    sm: "px-2 py-0.5 text-[10px] gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
  };

  const pillStyles = pill ? "rounded-full" : "rounded-md";

  const variantStyles = {
    primary: "bg-primary-50 text-primary-700 border border-primary-200",
    secondary: "bg-slate-100 text-slate-700 border border-slate-200",
    success: "bg-success-50 text-success-700 border border-success-200",
    danger: "bg-danger-50 text-danger-700 border border-danger-200",
    warning: "bg-warning-50 text-warning-700 border border-warning-200",
    info: "bg-info-50 text-info-700 border border-info-200",
    default: "bg-slate-100 text-slate-600 border border-slate-200",
  };

  const dotColorStyles = {
    primary: "bg-primary-500",
    secondary: "bg-slate-500",
    success: "bg-success-500",
    danger: "bg-danger-500",
    warning: "bg-warning-500",
    info: "bg-info-500",
    default: "bg-slate-400",
  };

  return (
    <span
      className={`inline-flex items-center font-medium ${sizeStyles[size]} ${pillStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColorStyles[variant]}`} />
      )}
      {children}
    </span>
  );
}
