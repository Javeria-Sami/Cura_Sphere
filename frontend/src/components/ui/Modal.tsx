import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  closable?: boolean;
}

const sizeMap = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  closable = true,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && closable) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closable, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-fade-in"
        onClick={() => closable && onClose()}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`
          relative w-full ${sizeMap[size]} bg-white rounded-2xl shadow-2xl
          border border-slate-200 animate-slide-up flex flex-col max-h-[90vh]
        `}
      >
        {/* Header */}
        {(title || closable) && (
          <div className="flex items-start justify-between gap-3 p-6 border-b border-slate-100 shrink-0">
            <div>
              {title && (
                <h2 className="text-lg font-bold text-slate-900">{title}</h2>
              )}
              {description && (
                <p className="text-sm text-slate-500 mt-1">{description}</p>
              )}
            </div>
            {closable && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-150 shrink-0"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        {children && (
          <div className="flex-1 overflow-y-auto p-6">{children}</div>
        )}

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 p-6 border-t border-slate-100 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
