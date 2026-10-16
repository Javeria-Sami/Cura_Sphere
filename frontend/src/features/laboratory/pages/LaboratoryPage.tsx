import { useState } from "react";
import { FlaskConical, Plus, Search, Filter, Printer, Clock, CheckCircle2, AlertTriangle, TestTube2, FileText } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { Stat } from "../../../components/ui/Stat";
import { Table } from "../../../components/ui/Table";
import { Tabs, TabList, Tab, TabPanel } from "../../../components/ui/Tabs";
import { Modal } from "../../../components/ui/Modal";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import PageHeader from "../../../components/layout/PageHeader";

interface LabItem {
  id: string;
  mrn: string;
  patient: string;
  test: string;
  category: string;
  ordered: string;
  status: string;
  result: string;
  referenceRange: string;
  doctor: string;
}

const initialTests: LabItem[] = [
  { id: "LAB-001", mrn: "MRN-00521", patient: "Muhammad Ali", test: "Complete Blood Count (CBC)", category: "Hematology", ordered: "09:00 AM", status: "Critical", result: "Hgb: 6.2 g/dL (Low)", referenceRange: "13.5 - 17.5 g/dL", doctor: "Dr. Sana Qureshi" },
  { id: "LAB-002", mrn: "MRN-00498", patient: "Ayesha Khan", test: "Liver Function Tests (LFTs)", category: "Biochemistry", ordered: "09:30 AM", status: "Processing", result: "ALT: 45 U/L", referenceRange: "7 - 56 U/L", doctor: "Dr. Adeel Khan" },
  { id: "LAB-003", mrn: "MRN-00504", patient: "Zara Ahmed", test: "Urine Routine / Examination", category: "Urinalysis", ordered: "10:00 AM", status: "Completed", result: "Pus cells: 1-2 /hpf (Normal)", referenceRange: "0 - 5 /hpf", doctor: "Dr. Mehwish Ali" },
  { id: "LAB-004", mrn: "MRN-00519", patient: "Usman Tariq", test: "Thyroid Profile (T3, T4, TSH)", category: "Endocrine", ordered: "10:30 AM", status: "Pending", result: "Pending analysis", referenceRange: "0.4 - 4.0 mIU/L", doctor: "Dr. Faisal Siddiqui" },
  { id: "LAB-005", mrn: "MRN-00487", patient: "Fatima Malik", test: "Blood Glucose Fasting", category: "Biochemistry", ordered: "11:00 AM", status: "Completed", result: "105 mg/dL (Desirable)", referenceRange: "70 - 99 mg/dL", doctor: "Dr. Amna Sheikh" },
];

const statusVariant = (s: string) => s === "Critical" ? "danger" : s === "Completed" ? "success" : s === "Processing" ? "warning" : "default";

export default function LaboratoryPage() {
  const [testsList, setTestsList] = useState<LabItem[]>(initialTests);
  const [search, setSearch] = useState("");
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<LabItem | null>(null);

  // Form
  const [patientName, setPatientName] = useState("");
  const [testCategory, setTestCategory] = useState("Hematology");
  const [testName, setTestName] = useState("");
  const [doctorName, setDoctorName] = useState("Dr. Sana Qureshi");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCreateLabOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const newTest: LabItem = {
      id: `LAB-${Math.floor(100 + Math.random() * 900)}`,
      mrn: `MRN-${Math.floor(10000 + Math.random() * 90000)}`,
      patient: patientName || "Patient",
      test: testName || "Blood Profile Test",
      category: testCategory,
      ordered: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: "Pending",
      result: "Pending Laboratory Analysis",
      referenceRange: "Standard Range",
      doctor: doctorName,
    };
    setTestsList([newTest, ...testsList]);
    setIsNewOrderOpen(false);
    setPatientName("");
    setTestName("");
    triggerToast(`New Lab Order ${newTest.id} created for ${newTest.patient}.`);
  };

  const handlePrint = () => {
    window.print();
  };

  const filtered = testsList.filter(
    (t) =>
      t.patient.toLowerCase().includes(search.toLowerCase()) ||
      t.test.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.mrn.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl mx-auto animate-fade-in print:p-0 print:m-0">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 bg-slate-900 text-white rounded-2xl shadow-xl">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      <PageHeader
        title="Laboratory Management"
        subtitle="Manage laboratory test ordering, sample processing, and diagnostic result reports"
        icon={<FlaskConical size={20} />}
        actions={
          <>
            <Button size="sm" variant="outline" leftIcon={<Printer size={14} />} onClick={handlePrint}>Print Lab Log</Button>
            <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setIsNewOrderOpen(true)}>New Lab Order</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Total Tests" value={testsList.length.toString()} icon={<TestTube2 size={20} />} change={18} color="purple" />
        <Stat label="Pending" value={testsList.filter(t => t.status === "Pending" || t.status === "Processing").length.toString()} icon={<Clock size={20} />} color="yellow" />
        <Stat label="Completed" value={testsList.filter(t => t.status === "Completed").length.toString()} icon={<CheckCircle2 size={20} />} change={25} color="green" />
        <Stat label="Critical Values" value={testsList.filter(t => t.status === "Critical").length.toString()} icon={<AlertTriangle size={20} />} color="red" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tests, patients, MRNs..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 bg-slate-50"
            />
          </div>
          <Button size="sm" variant="outline" leftIcon={<Filter size={14} />}>Category Filter</Button>
        </div>

        <Tabs defaultTab="all">
          <div className="px-5 pt-4">
            <TabList>
              <Tab value="all">All Tests ({filtered.length})</Tab>
              <Tab value="pending">Pending ({filtered.filter(t => t.status === "Pending").length})</Tab>
              <Tab value="critical">Critical ({filtered.filter(t => t.status === "Critical").length})</Tab>
              <Tab value="completed">Completed ({filtered.filter(t => t.status === "Completed").length})</Tab>
            </TabList>
          </div>

          <TabPanel value="all">
            <Table
              keyField="id"
              data={filtered}
              columns={[
                { key: "id", header: "Lab ID", render: (r) => <span className="font-mono text-xs font-bold text-slate-800">{r.id}</span> },
                { key: "patient", header: "Patient", render: (r) => <div><p className="text-sm font-semibold text-slate-800">{r.patient}</p><p className="text-xs font-mono text-slate-400">{r.mrn}</p></div> },
                { key: "test", header: "Test / Category", render: (r) => <div><p className="text-sm text-slate-700 font-medium">{r.test}</p><p className="text-xs text-slate-400">{r.category}</p></div> },
                { key: "result", header: "Result Output", render: (r) => <span className={`text-sm font-bold ${r.status === "Critical" ? "text-danger-600" : "text-slate-800"}`}>{r.result}</span> },
                { key: "ordered", header: "Ordered Time", render: (r) => <span className="text-sm font-mono text-slate-600">{r.ordered}</span> },
                { key: "status", header: "Status", render: (r) => <Badge variant={statusVariant(r.status) as any}>{r.status}</Badge> },
                {
                  key: "actions",
                  header: "Actions",
                  align: "right",
                  render: (r) => (
                    <Button size="sm" variant="outline" leftIcon={<FileText size={13} />} onClick={() => setSelectedReport(r)}>
                      View Report
                    </Button>
                  )
                },
              ]}
            />
          </TabPanel>
          <TabPanel value="pending">
            <Table
              keyField="id"
              data={filtered.filter(t => t.status === "Pending" || t.status === "Processing")}
              columns={[
                { key: "id", header: "Lab ID", render: (r) => <span className="font-mono text-xs font-bold text-slate-800">{r.id}</span> },
                { key: "patient", header: "Patient", render: (r) => <p className="text-sm font-semibold text-slate-800">{r.patient}</p> },
                { key: "test", header: "Test", render: (r) => <p className="text-sm text-slate-700">{r.test}</p> },
                { key: "status", header: "Status", render: (r) => <Badge variant="warning">{r.status}</Badge> },
                { key: "actions", header: "", align: "right", render: (r) => <Button size="sm" variant="outline" onClick={() => setSelectedReport(r)}>View</Button> },
              ]}
            />
          </TabPanel>
          <TabPanel value="critical">
            <Table
              keyField="id"
              data={filtered.filter(t => t.status === "Critical")}
              columns={[
                { key: "id", header: "Lab ID", render: (r) => <span className="font-mono text-xs font-bold text-slate-800">{r.id}</span> },
                { key: "patient", header: "Patient", render: (r) => <p className="text-sm font-semibold text-slate-800">{r.patient}</p> },
                { key: "test", header: "Test", render: (r) => <p className="text-sm text-slate-700">{r.test}</p> },
                { key: "result", header: "Critical Result", render: (r) => <span className="text-sm font-bold text-danger-600">{r.result}</span> },
                { key: "actions", header: "", align: "right", render: (r) => <Button size="sm" variant="outline" onClick={() => setSelectedReport(r)}>View</Button> },
              ]}
            />
          </TabPanel>
          <TabPanel value="completed">
            <Table
              keyField="id"
              data={filtered.filter(t => t.status === "Completed")}
              columns={[
                { key: "id", header: "Lab ID", render: (r) => <span className="font-mono text-xs font-bold text-slate-800">{r.id}</span> },
                { key: "patient", header: "Patient", render: (r) => <p className="text-sm font-semibold text-slate-800">{r.patient}</p> },
                { key: "test", header: "Test", render: (r) => <p className="text-sm text-slate-700">{r.test}</p> },
                { key: "result", header: "Result", render: (r) => <span className="text-sm font-medium text-slate-800">{r.result}</span> },
                { key: "actions", header: "", align: "right", render: (r) => <Button size="sm" variant="outline" onClick={() => setSelectedReport(r)}>View</Button> },
              ]}
            />
          </TabPanel>
        </Tabs>
      </div>

      {/* PRINTABLE LAB REPORT MODAL */}
      {selectedReport && (
        <Modal
          open={!!selectedReport}
          onClose={() => setSelectedReport(null)}
          title={`Diagnostic Lab Report — ${selectedReport.id}`}
          description="Official Hospital Laboratory Results Sheet"
        >
          <div className="space-y-6 print:p-0">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-lg">
                  LAB
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg leading-tight">CuraSphere Diagnostic Laboratory</h3>
                  <p className="text-xs text-slate-500 font-mono">Report ID: {selectedReport.id} | Date: {new Date().toLocaleDateString()}</p>
                </div>
              </div>
              <Badge variant={statusVariant(selectedReport.status) as any}>{selectedReport.status}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <p className="text-slate-400 font-semibold uppercase">Patient Information</p>
                <p className="text-sm font-bold text-slate-900 mt-1">{selectedReport.patient}</p>
                <p className="text-slate-600">MRN: <span className="font-mono">{selectedReport.mrn}</span></p>
                <p className="text-slate-600">Ordered: {selectedReport.ordered}</p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold uppercase">Ordering Physician & Category</p>
                <p className="text-sm font-bold text-slate-900 mt-1">{selectedReport.doctor}</p>
                <p className="text-slate-600">Department: {selectedReport.category}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase">Test Parameter & Output Result</p>
              <div className="flex justify-between items-center text-sm font-semibold border-b border-slate-100 pb-2">
                <span className="text-slate-900">{selectedReport.test}</span>
                <span className={selectedReport.status === "Critical" ? "text-danger-600 font-bold" : "text-primary-700"}>
                  {selectedReport.result}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Reference Range:</span>
                <span className="font-mono text-slate-700">{selectedReport.referenceRange}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <Button variant="ghost" onClick={() => setSelectedReport(null)}>Close Report</Button>
              <Button variant="outline" leftIcon={<Printer size={14} />} onClick={handlePrint}>Print Lab Report</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* NEW LAB ORDER MODAL */}
      <Modal
        open={isNewOrderOpen}
        onClose={() => setIsNewOrderOpen(false)}
        title="Create New Laboratory Order"
        description="Order diagnostic test for patient"
      >
        <form onSubmit={handleCreateLabOrder} className="space-y-4">
          <Input
            label="Patient Name"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder="e.g. Muhammad Ali"
            required
          />
          <Select
            label="Test Category"
            value={testCategory}
            onChange={(e) => setTestCategory(e.target.value)}
            options={[
              { value: "Hematology", label: "Hematology (CBC, ESR, Blood Grouping)" },
              { value: "Biochemistry", label: "Biochemistry (LFTs, RFTs, Electrolytes)" },
              { value: "Urinalysis", label: "Urinalysis & Stool Examination" },
              { value: "Endocrine", label: "Endocrine & Hormonal Profile" },
            ]}
          />
          <Input
            label="Test Name"
            value={testName}
            onChange={(e) => setTestName(e.target.value)}
            placeholder="e.g. Complete Blood Count (CBC)"
            required
          />
          <Select
            label="Ordering Physician"
            value={doctorName}
            onChange={(e) => setDoctorName(e.target.value)}
            options={[
              { value: "Dr. Sana Qureshi", label: "Dr. Sana Qureshi" },
              { value: "Dr. Adeel Khan", label: "Dr. Adeel Khan" },
              { value: "Dr. Mehwish Ali", label: "Dr. Mehwish Ali" },
              { value: "Dr. Faisal Siddiqui", label: "Dr. Faisal Siddiqui" },
            ]}
          />
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsNewOrderOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Submit Lab Order</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

