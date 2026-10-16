import React, { useState, useEffect } from "react";
import { Receipt, Plus, Search, Filter, Printer, DollarSign, CheckCircle2, AlertCircle, FileText } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { Stat } from "../../../components/ui/Stat";
import { Table } from "../../../components/ui/Table";
import { Tabs, TabList, Tab, TabPanel } from "../../../components/ui/Tabs";
import { Modal } from "../../../components/ui/Modal";
import { Select } from "../../../components/ui/Select";
import { Input } from "../../../components/ui/Input";
import PageHeader from "../../../components/layout/PageHeader";
import { financialService, InvoiceItem } from "../../../services/financialService";

const initialSampleInvoices: InvoiceItem[] = [
  { invoiceId: 1, invoiceNumber: "INV-2026-0891", patientId: 101, patientName: "Muhammad Ali", medicalRecordNumber: "MRN-00521", serviceType: "IPD Admission & Surgery", totalAmount: 45000, paidAmount: 45000, balanceAmount: 0, invoiceDate: "2026-08-20", status: "Paid" },
  { invoiceId: 2, invoiceNumber: "INV-2026-0892", patientId: 102, patientName: "Ayesha Khan", medicalRecordNumber: "MRN-00498", serviceType: "OPD Consultation & Lab", totalAmount: 8500, paidAmount: 4000, balanceAmount: 4500, invoiceDate: "2026-08-20", status: "Partial" },
  { invoiceId: 3, invoiceNumber: "INV-2026-0893", patientId: 103, patientName: "Zara Ahmed", medicalRecordNumber: "MRN-00504", serviceType: "Radiology (MRI Brain)", totalAmount: 16000, paidAmount: 0, balanceAmount: 16000, invoiceDate: "2026-08-19", status: "Unpaid" },
  { invoiceId: 4, invoiceNumber: "INV-2026-0894", patientId: 104, patientName: "Usman Tariq", medicalRecordNumber: "MRN-00519", serviceType: "Emergency Care & Vitals", totalAmount: 12500, paidAmount: 12500, balanceAmount: 0, invoiceDate: "2026-08-19", status: "Paid" },
];

export default function BillingPage() {
  const [invoices, setInvoices] = useState<InvoiceItem[]>(initialSampleInvoices);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<InvoiceItem | null>(null);

  // Invoice Form
  const [patientId, setPatientId] = useState("105");
  const [patientNameInput, setPatientNameInput] = useState("");
  const [serviceType, setServiceType] = useState("OPD Consultation");
  const [amount, setAmount] = useState("3500");
  const [creating, setCreating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const data = await financialService.getInvoices(search, activeTab);
      if (data && data.length > 0) {
        setInvoices(data);
      }
    } catch {
      // Keep sample invoices
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [search, activeTab]);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const newInv: InvoiceItem = {
      invoiceId: Date.now(),
      invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId: Number(patientId) || 105,
      patientName: patientNameInput || "Billing Patient",
      medicalRecordNumber: `MRN-${Math.floor(10000 + Math.random() * 90000)}`,
      serviceType,
      totalAmount: Number(amount) || 3500,
      paidAmount: 0,
      balanceAmount: Number(amount) || 3500,
      invoiceDate: new Date().toISOString().split("T")[0],
      status: "Unpaid",
    };
    setInvoices((prev) => [newInv, ...prev]);
    setIsModalOpen(false);
    setPatientNameInput("");
    setCreating(false);
    triggerToast(`Invoice ${newInv.invoiceNumber} created for ${newInv.patientName}.`);
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredInvoices = invoices.filter((i) => {
    const matchesSearch =
      search === "" ||
      i.patientName.toLowerCase().includes(search.toLowerCase()) ||
      i.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      i.medicalRecordNumber.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      activeTab === "all" ||
      i.status.toLowerCase() === activeTab.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl mx-auto animate-fade-in print:p-0 print:m-0">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 bg-slate-900 text-white rounded-2xl shadow-xl">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      <PageHeader
        title="Billing & Patient Invoices"
        subtitle="Manage patient ledgers, generate invoices, and track outstanding balances"
        icon={<Receipt size={20} />}
        actions={
          <>
            <Button size="sm" variant="outline" leftIcon={<Printer size={14} />} onClick={handlePrint}>Print Ledger</Button>
            <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setIsModalOpen(true)}>Create Invoice</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Total Billed" value={`PKR ${(invoices.reduce((s, i) => s + i.totalAmount, 0) / 1000).toFixed(1)}k`} icon={<DollarSign size={20} />} change={10} color="blue" />
        <Stat label="Total Collected" value={`PKR ${(invoices.reduce((s, i) => s + i.paidAmount, 0) / 1000).toFixed(1)}k`} icon={<CheckCircle2 size={20} />} change={14} color="green" />
        <Stat label="Pending Balances" value={`PKR ${(invoices.reduce((s, i) => s + i.balanceAmount, 0) / 1000).toFixed(1)}k`} icon={<AlertCircle size={20} />} color="red" />
        <Stat label="Unpaid Invoices" value={invoices.filter(i => i.status === "Unpaid").length.toString()} icon={<Receipt size={20} />} color="yellow" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoices, patients, MRNs..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 bg-slate-50"
            />
          </div>
          <Button size="sm" variant="outline" leftIcon={<Filter size={14} />}>Filter</Button>
        </div>

        <Tabs value={activeTab} onChange={setActiveTab}>
          <div className="px-5 pt-4">
            <TabList>
              <Tab value="all">All Invoices ({invoices.length})</Tab>
              <Tab value="paid">Paid ({invoices.filter(i => i.status === "Paid").length})</Tab>
              <Tab value="partial">Partial ({invoices.filter(i => i.status === "Partial").length})</Tab>
              <Tab value="unpaid">Unpaid ({invoices.filter(i => i.status === "Unpaid").length})</Tab>
            </TabList>
          </div>

          <TabPanel value={activeTab} className="pt-0">
            <Table
              keyField="invoiceId"
              loading={loading}
              data={filteredInvoices}
              columns={[
                { key: "invoiceNumber", header: "Invoice No", render: (r) => <span className="font-mono text-xs font-bold text-slate-800">{r.invoiceNumber}</span> },
                { key: "patientName", header: "Patient", render: (r) => <div><p className="text-sm font-semibold text-slate-800">{r.patientName}</p><p className="text-xs font-mono text-slate-400">{r.medicalRecordNumber}</p></div> },
                { key: "serviceType", header: "Service Category", render: (r) => <span className="text-sm text-slate-700">{r.serviceType}</span> },
                { key: "totalAmount", header: "Total", render: (r) => <span className="font-mono text-sm font-bold text-slate-800">PKR {r.totalAmount.toLocaleString()}</span> },
                { key: "paidAmount", header: "Paid", render: (r) => <span className="font-mono text-sm text-emerald-600 font-semibold">PKR {r.paidAmount.toLocaleString()}</span> },
                { key: "balanceAmount", header: "Balance", render: (r) => <span className="font-mono text-sm text-rose-600 font-semibold">PKR {r.balanceAmount.toLocaleString()}</span> },
                { key: "status", header: "Status", render: (r) => <Badge variant={r.status === "Paid" ? "success" : r.status === "Partial" ? "warning" : "danger"}>{r.status}</Badge> },
                {
                  key: "actions",
                  header: "Actions",
                  align: "right",
                  render: (r) => (
                    <Button size="sm" variant="outline" leftIcon={<FileText size={13} />} onClick={() => setSelectedReceipt(r)}>
                      Receipt
                    </Button>
                  )
                },
              ]}
            />
          </TabPanel>
        </Tabs>
      </div>

      {/* PRINTABLE INVOICE RECEIPT MODAL */}
      {selectedReceipt && (
        <Modal
          open={!!selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          title={`Official Patient Invoice Receipt — ${selectedReceipt.invoiceNumber}`}
          description="Official Hospital Invoice Statement & Cashier Voucher"
        >
          <div className="space-y-6 print:p-0">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-lg">
                  INV
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg leading-tight">CuraSphere Billing & Cashier Desk</h3>
                  <p className="text-xs text-slate-500 font-mono">Invoice #: {selectedReceipt.invoiceNumber} | Date: {selectedReceipt.invoiceDate}</p>
                </div>
              </div>
              <Badge variant={selectedReceipt.status === "Paid" ? "success" : selectedReceipt.status === "Partial" ? "warning" : "danger"}>
                {selectedReceipt.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <p className="text-slate-400 font-semibold uppercase">Patient Demographics</p>
                <p className="text-sm font-bold text-slate-900 mt-1">{selectedReceipt.patientName}</p>
                <p className="text-slate-600">MRN: <span className="font-mono">{selectedReceipt.medicalRecordNumber}</span></p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold uppercase">Service Particulars</p>
                <p className="text-sm font-bold text-primary-700 mt-1">{selectedReceipt.serviceType}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Total Billed Amount:</span>
                <span className="font-mono font-bold text-slate-900">PKR {selectedReceipt.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-700 font-semibold">
                <span>Amount Paid:</span>
                <span className="font-mono">PKR {selectedReceipt.paidAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 text-rose-700 font-bold text-sm">
                <span>Outstanding Balance Due:</span>
                <span className="font-mono">PKR {selectedReceipt.balanceAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <Button variant="ghost" onClick={() => setSelectedReceipt(null)}>Close</Button>
              <Button variant="outline" leftIcon={<Printer size={14} />} onClick={handlePrint}>Print Invoice Receipt</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* NEW INVOICE MODAL */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Generate New Patient Invoice"
        description="Bill services for OPD, IPD, Surgery, Lab, or Pharmacy"
      >
        <form onSubmit={handleCreateInvoice} className="space-y-4">
          <Input
            label="Patient Name"
            value={patientNameInput}
            onChange={(e) => setPatientNameInput(e.target.value)}
            placeholder="e.g. Tariq Mahmood"
            required
          />
          <Input
            label="Patient ID / MRN"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            placeholder="Enter Patient ID"
            required
          />
          <Select
            label="Service Category"
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
            options={[
              { value: "OPD Consultation", label: "OPD Consultation" },
              { value: "IPD Admission & Ward Stay", label: "IPD Admission & Ward Stay" },
              { value: "Lab Diagnostic Test", label: "Lab Diagnostic Test" },
              { value: "Radiology Scan", label: "Radiology Scan (MRI / CT / X-Ray)" },
              { value: "Surgical Operation", label: "Surgical Operation" },
              { value: "Pharmacy Prescription", label: "Pharmacy Prescription" },
            ]}
          />
          <Input
            label="Invoice Total Amount (PKR)"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            required
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={creating}>Generate Invoice</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

