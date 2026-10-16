import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  change?: number; // percentage, positive = up, negative = down
  changeLabel?: string;
  color?: "blue" | "green" | "yellow" | "red" | "purple" | "cyan";
  loading?: boolean;
  className?: string;
}

const colorMap = {
  blue: { bg: "bg-primary-50", text: "text-primary-600", icon: "bg-primary-100" },
  green: { bg: "bg-success-50", text: "text-success-600", icon: "bg-success-100" },
  yellow: { bg: "bg-warning-50", text: "text-warning-600", icon: "bg-warning-100" },
  red: { bg: "bg-danger-50", text: "text-danger-600", icon: "bg-danger-100" },
  purple: { bg: "bg-purple-50", text: "text-purple-600", icon: "bg-purple-100" },
  cyan: { bg: "bg-cyan-50", text: "text-cyan-600", icon: "bg-cyan-100" },
};

export function Stat({
  label,
  value,
  icon,
  change,
  changeLabel,
  color = "blue",
  loading = false,
  className = "",
}: StatProps) {
  const c = colorMap[color];

  const renderChange = () => {
    if (change === undefined) return null;
    const isUp = change > 0;
    const isDown = change < 0;
    const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;
    const trendColor = isUp
      ? "text-success-600 bg-success-50"
      : isDown
      ? "text-danger-600 bg-danger-50"
      : "text-slate-500 bg-slate-100";
    return (
      <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg ${trendColor}`}>
        <Icon size={12} />
        <span>{Math.abs(change)}%{changeLabel ? ` ${changeLabel}` : ""}</span>
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 p-5 hover:border-slate-300 hover:shadow-md transition-all duration-200 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">{label}</p>
          {loading ? (
            <div className="h-8 w-24 bg-slate-100 animate-pulse rounded-lg" />
          ) : (
            <p className="text-3xl font-bold text-slate-900 leading-none">{value}</p>
          )}
          {change !== undefined && !loading && (
            <div className="mt-3">{renderChange()}</div>
          )}
        </div>
        {icon && (
          <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${c.icon} ${c.text} shrink-0`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
