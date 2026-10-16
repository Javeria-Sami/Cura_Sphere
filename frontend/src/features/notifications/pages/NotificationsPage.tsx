import { Bell, CheckCheck, Filter, Search, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Stat } from "../../../components/ui/Stat";
import { Tabs, TabList, Tab, TabPanel } from "../../../components/ui/Tabs";
import PageHeader from "../../../components/layout/PageHeader";

const notifications = [
  { id: 1, type: "critical", icon: "🔴", title: "Critical Lab Value: Hgb 6.2 g/dL", body: "Patient Muhammad Ali (MRN-00521) — CBC result flagged critical", time: "2 min ago", read: false },
  { id: 2, type: "warning", icon: "⚠️", title: "Low Pharmacy Stock Alert", body: "Amoxicillin 500mg dropped below threshold (12 units remaining)", time: "15 min ago", read: false },
  { id: 3, type: "info", icon: "📋", title: "New Lab Results Available", body: "LFTs completed for Ayesha Khan (MRN-00498)", time: "32 min ago", read: false },
  { id: 4, type: "success", icon: "✅", title: "Surgery Completed Successfully", body: "Appendectomy for Fatima Malik (MRN-00487) — Duration: 2h 15m", time: "1 hr ago", read: true },
  { id: 5, type: "info", icon: "📅", title: "3 Appointments Unconfirmed", body: "Dr. Sana Qureshi's 2:00 PM, 2:30 PM, 3:00 PM appointments need confirmation", time: "2 hr ago", read: true },
  { id: 6, type: "warning", icon: "🏥", title: "ICU Bed Utilization: 75%", body: "Only 2 ICU beds available. Consider early discharge planning", time: "3 hr ago", read: true },
];

const typeColors: Record<string, string> = {
  critical: "border-l-danger-500 bg-danger-50",
  warning: "border-l-warning-500 bg-warning-50",
  info: "border-l-primary-500 bg-primary-50",
  success: "border-l-success-500 bg-success-50",
};

export default function NotificationsPage() {
  return (
    <div className="p-6 space-y-6 max-w-screen-2xl mx-auto animate-fade-in">
      <PageHeader
        title="Notifications"
        subtitle="System alerts, clinical notifications, and operational updates"
        icon={<Bell size={20} />}
        actions={
          <>
            <Button size="sm" variant="outline" leftIcon={<CheckCheck size={14} />}>Mark All Read</Button>
          </>
        }
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Unread" value="3" icon={<Bell size={20} />} color="blue" />
        <Stat label="Critical" value="1" icon={<AlertTriangle size={20} />} color="red" />
        <Stat label="Warnings" value="2" icon={<Info size={20} />} color="yellow" />
        <Stat label="Today's Total" value="12" icon={<CheckCircle2 size={20} />} color="green" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input placeholder="Search notifications..." className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 bg-slate-50" />
          </div>
          <Button size="sm" variant="outline" leftIcon={<Filter size={14} />}>Filter</Button>
        </div>

        <Tabs defaultTab="all">
          <div className="px-5 pt-4">
            <TabList>
              <Tab value="all">All (12)</Tab>
              <Tab value="unread">Unread (3)</Tab>
              <Tab value="critical">Critical (1)</Tab>
            </TabList>
          </div>
          <TabPanel value="all" className="divide-y divide-slate-50">
            {notifications.map((n) => (
              <div key={n.id} className={`flex items-start gap-4 p-5 border-l-4 ${typeColors[n.type]} ${!n.read ? "opacity-100" : "opacity-70"} hover:opacity-100 transition-all cursor-pointer`}>
                <span className="text-xl shrink-0 mt-0.5">{n.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm font-semibold text-slate-900 ${!n.read ? "font-bold" : ""}`}>{n.title}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      {!n.read && <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0" />}
                      <span className="text-xs text-slate-400 whitespace-nowrap">{n.time}</span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">{n.body}</p>
                </div>
              </div>
            ))}
          </TabPanel>
          <TabPanel value="unread" className="divide-y divide-slate-50">
            {notifications.filter(n => !n.read).map((n) => (
              <div key={n.id} className={`flex items-start gap-4 p-5 border-l-4 ${typeColors[n.type]}`}>
                <span className="text-xl shrink-0">{n.icon}</span>
                <div><p className="text-sm font-bold text-slate-900">{n.title}</p><p className="text-sm text-slate-500 mt-1">{n.body}</p></div>
              </div>
            ))}
          </TabPanel>
          <TabPanel value="critical">
            {notifications.filter(n => n.type === "critical").map((n) => (
              <div key={n.id} className={`flex items-start gap-4 p-5 border-l-4 ${typeColors[n.type]}`}>
                <span className="text-xl shrink-0">{n.icon}</span>
                <div><p className="text-sm font-bold text-danger-700">{n.title}</p><p className="text-sm text-slate-500 mt-1">{n.body}</p></div>
              </div>
            ))}
          </TabPanel>
        </Tabs>
      </div>
    </div>
  );
}
