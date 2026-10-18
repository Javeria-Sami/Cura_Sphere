import { useState, useEffect, useCallback } from "react";
import {
  BarChart3, TrendingUp, DollarSign, Users, Bed,
  Filter, CheckCircle2, CreditCard, RefreshCw, Printer, Receipt
} from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Stat } from "../../../components/ui/Stat";
import PageHeader from "../../../components/layout/PageHeader";
import { useEditionStore } from "../../../stores/editionStore";
import { reportsService, DashboardReportSummary } from "../../../services/reportsService";

export default function ReportsPage() {
  const currentEdition = useEditionStore((state) => state.currentEdition);
  const isClinic = currentEdition === "Clinic";

  const [summary, setSummary] = useState<DashboardReportSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeframe, setTimeframe] = useState<"today" | "week" | "month" | "year">("month");

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const data = await reportsService.getDashboardSummary(currentEdition, timeframe);
      if (data) {
        setSummary(data);
      }
    } catch {
      // Retain existing summary or fallback
    } finally {
      setLoading(false);
    }
  }, [currentEdition, timeframe]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handlePrint = () => {
    window.print();
  };

  const timeframeLabels: Record<string, string> = {
    today: "Today",
    week: "Last 7 Days",
    month: "This Month",
    year: "Year to Date"
  };

  const departmentRevenues = summary?.revenueByDepartment ?? (isClinic ? [
    { departmentName: "Outpatient Consultations (OPD)", amount: 45000 },
    { departmentName: "Diagnostic Laboratory", amount: 28000 },
    { departmentName: "Pharmacy Dispensary", amount: 17000 },
    { departmentName: "Outpatient Procedures", amount: 10000 },
  ] : [
    { departmentName: "Outpatient (OPD)", amount: 45000 },
    { departmentName: "Inpatient Wards (IPD)", amount: 75000 },
    { departmentName: "Diagnostic Laboratory", amount: 28000 },
    { departmentName: "Radiology & Imaging", amount: 22000 },
    { departmentName: "Pharmacy Dispensary", amount: 15000 },
  ]);

  const maxDeptAmount = Math.max(...departmentRevenues.map(d => d.amount), 50000);

  const paymentBreakdown = summary?.paymentMethodsBreakdown ?? [
    { method: "Cash", amount: 75000, percentage: 52.8 },
    { method: "Card (POS)", amount: 42000, percentage: 29.6 },
    { method: "Bank Transfer", amount: 15000, percentage: 10.6 },
    { method: "Insurance Claim", amount: 10000, percentage: 7.0 }
  ];

  const invoiceBreakdown = summary?.invoiceStatusBreakdown ?? [
    { status: "Paid", count: 28, totalAmount: 142000 },
    { status: "Partial", count: 6, totalAmount: 28000 },
    { status: "Unpaid", count: 4, totalAmount: 15000 }
  ];

  const censusTrend = summary?.monthlyCensusTrend ?? [
    { month: "Jan", outpatientCount: 1100, inpatientCount: isClinic ? 0 : 120, walkInCount: 420 },
    { month: "Feb", outpatientCount: 1250, inpatientCount: isClinic ? 0 : 145, walkInCount: 460 },
    { month: "Mar", outpatientCount: 1400, inpatientCount: isClinic ? 0 : 160, walkInCount: 510 },
    { month: "Apr", outpatientCount: 1350, inpatientCount: isClinic ? 0 : 150, walkInCount: 490 },
    { month: "May", outpatientCount: 1520, inpatientCount: isClinic ? 0 : 180, walkInCount: 530 },
    { month: "Jun", outpatientCount: 1680, inpatientCount: isClinic ? 0 : 210, walkInCount: 580 },
  ];

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl mx-auto animate-fade-in print:p-2 print:space-y-4">
      <PageHeader
        title={isClinic ? "Clinic Executive BI & Financial Reports" : "Hospital Executive Reports & BI Analytics"}
        subtitle={isClinic
          ? `Outpatient clinic performance, revenue aggregations, settlement rates (${timeframeLabels[timeframe]})`
          : "Real-time hospital KPI summary, department revenue breakdown, and patient census trends"
        }
        icon={<BarChart3 size={20} />}
        actions={
          <div className="flex flex-wrap gap-2 items-center print:hidden">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-medium">
              {(["today", "week", "month", "year"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    timeframe === t
                      ? "bg-white text-slate-900 shadow-sm font-semibold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {timeframeLabels[t]}
                </button>
              ))}
            </div>

            <Button size="sm" variant="outline" onClick={fetchSummary} disabled={loading} leftIcon={<RefreshCw size={14} className={loading ? "animate-spin" : ""} />}>
              Refresh
            </Button>
            <Button size="sm" onClick={handlePrint} leftIcon={<Printer size={14} />}>
              Print / Export Report
            </Button>
          </div>
        }
      />

      {/* Top Level KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat
          label={isClinic ? "Registered Patients" : "Total Patient Census"}
          value={summary?.totalPatientsRegistered ? summary.totalPatientsRegistered.toLocaleString() : "1,250"}
          icon={<Users size={20} />}
          change={14}
          color="blue"
          loading={loading}
        />
        <Stat
          label={`Revenue Billed (${timeframeLabels[timeframe]})`}
          value={`PKR ${(summary?.totalRevenueBilledToday ? summary.totalRevenueBilledToday / 1000 : 185).toFixed(0)}k`}
          icon={<DollarSign size={20} />}
          change={18}
          color="green"
          loading={loading}
        />
        <Stat
          label={`Cash Collected (${timeframeLabels[timeframe]})`}
          value={`PKR ${(summary?.totalRevenueCollectedToday ? summary.totalRevenueCollectedToday / 1000 : 142).toFixed(0)}k`}
          icon={<TrendingUp size={20} />}
          color="purple"
          loading={loading}
        />
        {isClinic ? (
          <Stat
            label="Consultation Completion Rate"
            value={`${summary?.consultationCompletionRate ?? 85.0}%`}
            icon={<CheckCircle2 size={20} />}
            change={8}
            color="yellow"
            loading={loading}
          />
        ) : (
          <Stat
            label="Bed Occupancy Rate"
            value={`${summary?.bedOccupancyPercentage ?? 75.0}%`}
            icon={<Bed size={20} />}
            color="yellow"
            loading={loading}
          />
        )}
      </div>

      {/* Analytics Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: Department / Service Revenue Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                {isClinic ? "Revenue by Clinic Service Line" : "Revenue Contribution by Department"}
              </h3>
              <p className="text-xs text-slate-500">
                {isClinic ? "Outpatient consultation, diagnostic, and dispensary billing" : "Distribution of billing across hospital units"}
              </p>
            </div>
            <Filter size={16} className="text-slate-400" />
          </div>

          <div className="space-y-3 pt-2">
            {departmentRevenues.map((dept, idx) => {
              const pct = Math.min(100, Math.round((dept.amount / maxDeptAmount) * 100));
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>{dept.departmentName}</span>
                    <span className="font-mono text-slate-900">PKR {dept.amount.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-primary-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel 2: Monthly Patient Footfall & Trend */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                {isClinic ? "Outpatient Footfall & Visit Trends" : "Patient Admission & Visit Trends"}
              </h3>
              <p className="text-xs text-slate-500">
                {isClinic
                  ? "Monthly comparison: Booked Appointments (Blue) vs Walk-in Tokens (Green)"
                  : "Monthly OPD vs IPD hospital footfall comparison"
                }
              </p>
            </div>
            <TrendingUp size={16} className="text-slate-400" />
          </div>

          <div className="grid grid-cols-6 gap-2 pt-6 items-end h-48">
            {censusTrend.map((item, i) => {
              const primaryCount = item.outpatientCount;
              const secondaryCount = isClinic ? (item.walkInCount ?? 400) : item.inpatientCount;
              const primaryHeight = Math.min(100, Math.round((primaryCount / 1800) * 100));
              const secondaryHeight = Math.min(100, Math.round((secondaryCount / (isClinic ? 800 : 300)) * 100));

              return (
                <div key={i} className="flex flex-col items-center gap-2 h-full justify-end">
                  <div className="w-full bg-slate-100 rounded-t-lg flex flex-col justify-end overflow-hidden h-36">
                    <div
                      className="bg-primary-500 w-full transition-all duration-500"
                      style={{ height: `${primaryHeight}%` }}
                      title={`${isClinic ? "Appointments" : "OPD"}: ${primaryCount}`}
                    />
                    <div
                      className="bg-emerald-500 w-full transition-all duration-500"
                      style={{ height: `${secondaryHeight}%` }}
                      title={`${isClinic ? "Walk-Ins" : "IPD"}: ${secondaryCount}`}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-600">{item.month}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-6 pt-2 text-xs font-medium text-slate-600 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-primary-500" />
              <span>{isClinic ? "Scheduled Appointments" : "Outpatient (OPD)"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>{isClinic ? "Walk-In Queue (OPD)" : "Inpatient Admissions (IPD)"}</span>
            </div>
          </div>
        </div>

        {/* Panel 3: Cashier Payment Channels Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Payment Channels & Cashier Collections</h3>
              <p className="text-xs text-slate-500">Distribution of collected payments by transaction method</p>
            </div>
            <CreditCard size={16} className="text-slate-400" />
          </div>

          <div className="space-y-3 pt-2">
            {paymentBreakdown.map((pm, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700">
                    {pm.method.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900">{pm.method}</p>
                    <p className="text-[11px] text-slate-500">{pm.percentage}% of total collections</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-xs font-bold text-slate-900">PKR {pm.amount.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel 4: Invoice Settlement & Aging Status */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Invoice Settlement & Outstanding Balances</h3>
              <p className="text-xs text-slate-500">Breakdown of billing recovery across patient encounters</p>
            </div>
            <Receipt size={16} className="text-slate-400" />
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            {invoiceBreakdown.map((inv, idx) => {
              const badgeColors: Record<string, string> = {
                Paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
                Partial: "bg-amber-50 text-amber-700 border-amber-200",
                Unpaid: "bg-rose-50 text-rose-700 border-rose-200"
              };
              return (
                <div key={idx} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 text-center">
                  <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full border ${badgeColors[inv.status] || "bg-slate-100 text-slate-700"}`}>
                    {inv.status}
                  </span>
                  <p className="text-lg font-bold text-slate-900 mt-2">{inv.count}</p>
                  <p className="text-[11px] font-mono text-slate-500 mt-0.5">PKR {(inv.totalAmount / 1000).toFixed(0)}k</p>
                </div>
              );
            })}
          </div>

          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/60 flex items-center justify-between mt-4">
            <div>
              <p className="text-xs font-bold text-amber-900">Total Uncollected Balance</p>
              <p className="text-[11px] text-amber-700">Accumulated balance awaiting settlement</p>
            </div>
            <p className="font-mono text-sm font-bold text-amber-900">
              PKR {(summary?.totalOutstandingBalance ?? 43000).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
