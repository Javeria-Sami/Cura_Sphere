import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      className = "",
      containerClassName = "",
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    // Generate a fallback stable ID for accessibility
    const fallbackId = React.useId();
    const inputId = id || fallbackId;

    return (
      <div className={`flex flex-col gap-1.5 w-full ${containerClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-slate-700 select-none cursor-pointer"
          >
            {label}
            {props.required && <span className="text-danger-500 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3.5 text-slate-400 select-none pointer-events-none z-10">
              {leftIcon}
            </span>
          )}
          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            className={`w-full text-sm px-4 py-2.5 rounded-lg border bg-surface transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
              ${leftIcon ? "pl-10" : ""}
              ${rightIcon ? "pr-10" : ""}
              ${
                error
                  ? "border-danger-400 focus:border-danger-500 focus:ring-danger-200"
                  : "border-slate-300 focus:border-primary-500 focus:ring-primary-100"
              }
              ${className}
            `}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3.5 text-slate-400 select-none pointer-events-none z-10">
              {rightIcon}
            </span>
          )}
        </div>
        {error && (
          <span className="text-xs text-danger-600 font-medium animate-slide-down">
            {error}
          </span>
        )}
        {!error && helperText && (
          <span className="text-xs text-slate-500">
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
