import React from "react";

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "white" | "success" | "danger";
}

export function Spinner({
  size = "md",
  variant = "primary",
  className = "",
  ...props
}: SpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-2",
    lg: "w-12 h-12 border-3",
  };

  const variantClasses = {
    primary: "border-primary-200 border-t-primary-600",
    secondary: "border-slate-200 border-t-slate-600",
    white: "border-white/30 border-t-white",
    success: "border-success-200 border-t-success-600",
    danger: "border-danger-200 border-t-danger-600",
  };

  return (
    <div
      className={`rounded-full animate-spin ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      style={{ borderStyle: "solid", borderRightColor: "transparent", borderBottomColor: "transparent" }}
      role="status"
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
