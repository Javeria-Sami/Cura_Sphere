import { useState, useEffect } from "react";
import { FileText, Search, Filter, ShieldCheck, Download } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { Table } from "../../../components/ui/Table";
import { Tabs, TabList, Tab, TabPanel } from "../../../components/ui/Tabs";
import PageHeader from "../../../components/layout/PageHeader";
import { reportsService, AuditLogItem } from "../../../services/reportsService";

const sampleLogs: AuditLogItem[] = [
  { auditLogId: 1, timestamp: "2026-08-21 10:10 AM", username: "admin", action: "USER_LOGIN_SUCCESS", module: "Security", ipAddress: "127.0.0.1", details: "Administrator login successful" },
  { auditLogId: 2, timestamp: "2026-08-21 09:52 AM", username: "receptionist", action: "PATIENT_REGISTERED", module: "Patient", ipAddress: "192.168.1.14", details: "Registered new patient MRN-00522 (Zubair Ahmed)" },
  { auditLogId: 3, timestamp: "2026-08-21 09:28 AM", username: "cashier_kamran", action: "INVOICE_PAID", module: "Billing", ipAddress: "192.168.1.20", details: "Collected PKR 45,000 for INV-2026-0891 via Card" },
  { auditLogId: 4, timestamp: "2026-08-21 08:30 AM", username: "dr_kamran", action: "EMR_ENCOUNTER_SIGNED", module: "Clinical", ipAddress: "192.168.1.35", details: "Signed OPD consultation encounter record for patient #101" },
];

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>(sampleLogs);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await reportsService.getAuditLogs(search, moduleFilter);
      if (data && data.length > 0) {
        setLogs(data);
      }
    } catch {
      // Keep sample
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [search, moduleFilter]);

  const filteredLogs = logs.filter((l) => {
    const matchesSearch =
      search === "" ||
      l.username.toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.details.toLowerCase().includes(search.toLowerCase());

    const matchesModule =
      moduleFilter === "all" ||
      l.module.toLowerCase() === moduleFilter.toLowerCase();

    return matchesSearch && matchesModule;
  });

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl mx-auto animate-fade-in">
      <PageHeader
        title="Security & System Audit Logs"
        subtitle="Immutable audit trail of system events, user authentications, and clinical transactions"
        icon={<FileText size={20} />}
        actions={
          <Button size="sm" variant="outline" leftIcon={<Download size={14} />}>Export Audit Trail</Button>
        }
      />

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search audit trail..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 bg-slate-50"
            />
          </div>
          <Button size="sm" variant="outline" leftIcon={<Filter size={14} />}>Filter</Button>
        </div>

        <Tabs value={moduleFilter} onChange={setModuleFilter}>
          <div className="px-5 pt-4">
            <TabList>
              <Tab value="all">All Logs ({logs.length})</Tab>
              <Tab value="security">Security</Tab>
              <Tab value="patient">Patient</Tab>
              <Tab value="billing">Billing</Tab>
              <Tab value="clinical">Clinical</Tab>
            </TabList>
          </div>

          <TabPanel value={moduleFilter} className="pt-0">
            <Table
              keyField="auditLogId"
              loading={loading}
              data={filteredLogs}
              columns={[
                { key: "timestamp", header: "Timestamp", render: (r) => <span className="font-mono text-xs text-slate-500">{r.timestamp}</span> },
                { key: "username", header: "User", render: (r) => <div className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-primary-600" /><span className="text-sm font-semibold text-slate-800">{r.username}</span></div> },
                { key: "action", header: "Action Event", render: (r) => <Badge variant="info">{r.action}</Badge> },
                { key: "module", header: "Module", render: (r) => <span className="text-xs font-semibold text-slate-600">{r.module}</span> },
                { key: "ipAddress", header: "IP Address", render: (r) => <span className="font-mono text-xs text-slate-400">{r.ipAddress}</span> },
                { key: "details", header: "Transaction Event Details", render: (r) => <span className="text-xs text-slate-700">{r.details}</span> },
              ]}
            />
          </TabPanel>
        </Tabs>
      </div>
    </div>
  );
}
