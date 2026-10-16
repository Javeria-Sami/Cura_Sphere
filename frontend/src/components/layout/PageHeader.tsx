import React from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, icon, actions, badge }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="flex items-center gap-3 min-w-0">
        {icon && (
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-50 text-primary-600 shrink-0">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-bold text-slate-900 leading-tight">{title}</h1>
            {badge}
          </div>
          {subtitle && (
            <p className="text-sm text-slate-500 mt-0.5 leading-snug">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2.5 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
