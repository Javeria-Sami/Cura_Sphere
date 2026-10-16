import React from "react";
import { Spinner } from "./Spinner";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "success" | "danger" | "warning" | "outline" | "ghost";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      size = "md",
      variant = "primary",
      isLoading = false,
      leftIcon,
      rightIcon,
      className = "",
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98] disabled:active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed";

    const sizeStyles = {
      sm: "px-3 py-1.5 text-xs gap-1.5",
      md: "px-4 py-2 text-sm gap-2",
      lg: "px-5 py-2.5 text-base gap-2.5",
    };

    const variantStyles = {
      primary:
        "bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500 shadow-sm",
      secondary:
        "bg-slate-100 hover:bg-slate-200 text-slate-800 focus:ring-slate-300",
      success:
        "bg-success-600 hover:bg-success-700 text-white focus:ring-success-500 shadow-sm",
      danger:
        "bg-danger-600 hover:bg-danger-700 text-white focus:ring-danger-500 shadow-sm",
      warning:
        "bg-warning-500 hover:bg-warning-600 text-white focus:ring-warning-500 shadow-sm",
      outline:
        "border border-slate-300 hover:bg-slate-50 text-slate-700 focus:ring-primary-500",
      ghost:
        "hover:bg-slate-100 text-slate-600 hover:text-slate-900 focus:ring-slate-400",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {isLoading && (
          <Spinner
            size="sm"
            variant={
              variant === "outline" || variant === "ghost" || variant === "secondary"
                ? "primary"
                : "white"
            }
            className="shrink-0"
          />
        )}
        {!isLoading && leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
        <span className="truncate">{children}</span>
        {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
