import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Receipt,
  Plus,
  Search,
  Printer,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  FileText,
  CreditCard,
  Trash2,
  TrendingUp
} from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { Stat } from "../../../components/ui/Stat";
import { Table } from "../../../components/ui/Table";
import { Modal } from "../../../components/ui/Modal";
import { Select } from "../../../components/ui/Select";
import { Input } from "../../../components/ui/Input";
import PageHeader from "../../../components/layout/PageHeader";
import {
  financialService,
  InvoiceItem,
  InvoiceDetailItem,
  InvoiceLineItem,
  BillingSummary,
  PaymentItem
} from "../../../services/financialService";
import { patientService } from "../../../services/patientService";
import { PatientListDto } from "../../../types/patient";

// Standard Outpatient Service Pricing Catalog
const CLINIC_SERVICE_PRESETS: { label: string; serviceType: string; price: number; category: string }[] = [
  { label: "General Outpatient Consultation", serviceType: "OPD Consultation", price: 30, category: "Consultation" },
  { label: "Specialist Consultation (Cardiology / Internal Med)", serviceType: "Specialist Consultation", price: 50, category: "Consultation" },
  { label: "Pediatric Consultation & Checkup", serviceType: "Pediatric Consultation", price: 35, category: "Consultation" },
  { label: "Follow-Up Consultation (Within 14 Days)", serviceType: "Follow-up Consultation", price: 15, category: "Consultation" },
  { label: "Basic Metabolic & Complete Blood Count (CBC)", serviceType: "Laboratory Diagnostic", price: 25, category: "Lab" },
  { label: "Outpatient Wound Dressing & Minor Care", serviceType: "Minor Procedure", price: 40, category: "Procedure" },
  { label: "Prescription Medications Dispensation", serviceType: "Pharmacy", price: 20, category: "Medication" },
];

export default function BillingPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL Query pre-population from appointment / EMR
  const urlPatientId = searchParams.get("patientId");
  const urlPatientName = searchParams.get("patientName");
  const urlMrn = searchParams.get("mrn");
  const urlServiceType = searchParams.get("serviceType");
  const urlAmount = searchParams.get("amount");

  // Invoices & Summary State
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [summary, setSummary] = useState<BillingSummary>({
    totalBilled: 0,
    totalCollected: 0,
    totalOutstanding: 0,
    paidCount: 0,
    partialCount: 0,
    unpaidCount: 0,
    totalTransactions: 0,
  });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(Boolean(urlPatientId));
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isThermalReceiptOpen, setIsThermalReceiptOpen] = useState(false);

  // Selected Records
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<InvoiceItem | null>(null);
  const [selectedInvoiceDetail, setSelectedInvoiceDetail] = useState<InvoiceDetailItem | null>(null);
  const [latestPaymentRecord, setLatestPaymentRecord] = useState<PaymentItem | null>(null);

  // Create Invoice Form State
  const [patientSearch, setPatientSearch] = useState(urlPatientName || "");
  const [patientResults, setPatientResults] = useState<PatientListDto[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<{ id: number; name: string; mrn: string } | null>(
    urlPatientId ? { id: Number(urlPatientId), name: urlPatientName || "Patient", mrn: urlMrn || "MRN-Pending" } : null
  );
  const [serviceType, setServiceType] = useState(urlServiceType || "OPD Consultation");
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    {
      description: urlServiceType || "General Outpatient Consultation",
      category: "Consultation",
      quantity: 1,
      unitPrice: urlAmount ? Number(urlAmount) : 30,
    },
  ]);
  const [discountPercent, setDiscountPercent] = useState("0");
  const [taxPercent, setTaxPercent] = useState("0");
  const [invoiceNotes, setInvoiceNotes] = useState("");
  const [creating, setCreating] = useState(false);

  // Collect Payment Form State
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [cashierName, setCashierName] = useState("Main Cashier");
  const [transactionRef, setTransactionRef] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);

  // Feedback Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch Summary
  const loadSummary = async () => {
    try {
      const sumData = await financialService.getBillingSummary();
      setSummary(sumData);
    } catch (err) {
      console.error("Failed to load billing summary", err);
    }
  };

  // Fetch Invoices (using debounced search)
  const loadInvoices = async (query: string, tab: string) => {
    setLoading(true);
    try {
      const invList = await financialService.getInvoices(query, tab);
      setInvoices(invList);
    } catch (err) {
      console.error("Failed to load invoices", err);
    } finally {
      setLoading(false);
    }
  };

  const loadBillingData = async () => {
    await Promise.all([loadInvoices(debouncedSearch, activeTab), loadSummary()]);
  };

  useEffect(() => {
    loadSummary();
  }, [activeTab]);

  useEffect(() => {
    loadInvoices(debouncedSearch, activeTab);
  }, [debouncedSearch, activeTab]);

  // Live Patient Search for Invoice Creation
  useEffect(() => {
    if (!patientSearch || patientSearch.length < 2 || selectedPatient) return;

    const timer = setTimeout(async () => {
      try {
        const res = await patientService.getPagedPatients(patientSearch, 1, 5);
        setPatientResults(res?.items ?? []);
      } catch {
        setPatientResults([]);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [patientSearch, selectedPatient]);

  // Real-time Line Items Subtotal Calculation
  const subTotalCalculated = lineItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const discountAmountCalculated = Math.round(subTotalCalculated * (parseFloat(discountPercent || "0") / 100) * 100) / 100;
  const taxableAmount = subTotalCalculated - discountAmountCalculated;
  const taxAmountCalculated = Math.round(taxableAmount * (parseFloat(taxPercent || "0") / 100) * 100) / 100;
  const grandTotalCalculated = Math.max(0, Math.round((taxableAmount + taxAmountCalculated) * 100) / 100);

  // Line item handlers
  const handleAddLineItem = () => {
    setLineItems([
      ...lineItems,
      { description: "Outpatient Clinical Service", category: "Consultation", quantity: 1, unitPrice: 20 },
    ]);
  };

  const handleRemoveLineItem = (idx: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, i) => i !== idx));
  };

  const handleUpdateLineItem = (idx: number, field: keyof InvoiceLineItem, val: any) => {
    setLineItems(
      lineItems.map((item, i) => (i === idx ? { ...item, [field]: val } : item))
    );
  };

  const handleSelectPreset = (preset: typeof CLINIC_SERVICE_PRESETS[0]) => {
    setServiceType(preset.serviceType);
    setLineItems([
      {
        description: preset.label,
        category: preset.category,
        quantity: 1,
        unitPrice: preset.price,
      },
    ]);
  };

  // Submit Invoice Creation
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) {
      triggerToast("Please select a registered patient for this invoice.");
      return;
    }

    if (lineItems.length === 0 || subTotalCalculated <= 0) {
      triggerToast("Invoice must contain at least one valid line item with positive price.");
      return;
    }

    try {
      setCreating(true);
      const payload = {
        patientId: selectedPatient.id,
        serviceType,
        discountPercent: parseFloat(discountPercent) || 0,
        taxPercent: parseFloat(taxPercent) || 0,
        notes: invoiceNotes.trim() || undefined,
        lineItems,
        totalAmount: grandTotalCalculated,
      };

      const created = await financialService.createInvoice(payload);
      triggerToast(`Invoice #${created.invoiceNumber} created for ${created.patientName} ($${created.totalAmount.toFixed(2)}).`);

      setIsCreateModalOpen(false);
      setSelectedPatient(null);
      setPatientSearch("");
      setInvoiceNotes("");
      setSearchParams({});
      loadBillingData();
    } catch (err: any) {
      console.error("Failed to create invoice", err);
      triggerToast(err.response?.data?.message || "Failed to generate clinic invoice.");
    } finally {
      setCreating(false);
    }
  };

  // Open Payment Modal
  const handleOpenPayment = (invoice: InvoiceItem) => {
    setSelectedInvoiceForPayment(invoice);
    setPaymentAmount(invoice.balanceAmount.toString());
    setPaymentMethod("Cash");
    setTransactionRef("");
    setPaymentNotes("");
    setIsPaymentModalOpen(true);
  };

  // Submit Payment Collection
  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForPayment) return;

    const amt = parseFloat(paymentAmount);
    if (!amt || amt <= 0) {
      triggerToast("Payment amount must be greater than zero.");
      return;
    }

    if (amt > selectedInvoiceForPayment.balanceAmount) {
      triggerToast(`Payment cannot exceed outstanding balance of $${selectedInvoiceForPayment.balanceAmount.toFixed(2)}.`);
      return;
    }

    try {
      setProcessingPayment(true);
      const res = await financialService.processPayment({
        invoiceId: selectedInvoiceForPayment.invoiceId,
        amount: amt,
        paymentMethod,
        cashierName: cashierName.trim() || "Main Cashier",
        transactionReference: transactionRef.trim() || undefined,
        notes: paymentNotes.trim() || undefined,
      });

      triggerToast(`Payment of $${amt.toFixed(2)} collected successfully (${paymentMethod}).`);
      setLatestPaymentRecord(res);
      setIsPaymentModalOpen(false);
      setIsThermalReceiptOpen(true); // Open printable POS slip
      loadBillingData();
    } catch (err: any) {
      console.error("Failed to process payment", err);
      triggerToast(err.response?.data?.message || "Failed to collect payment.");
    } finally {
      setProcessingPayment(false);
    }
  };

  // Open Invoice Detail Modal
  const handleOpenDetail = async (invoiceId: number) => {
    try {
      const detail = await financialService.getInvoiceById(invoiceId);
      if (detail) {
        setSelectedInvoiceDetail(detail);
        setIsDetailModalOpen(true);
      }
    } catch (err) {
      console.error("Failed to fetch invoice details", err);
      triggerToast("Could not load invoice details.");
    }
  };

  const statusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "success";
      case "partial":
        return "warning";
      case "unpaid":
        return "danger";
      default:
        return "secondary";
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl mx-auto animate-fade-in print:p-0 print:m-0">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-700 animate-slide-in">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <PageHeader
        title="Clinic Invoices & Patient Billing"
        subtitle="Manage outpatient consultation bills, itemized service charges, payment collections, and POS cashier receipts"
        icon={<Receipt size={20} />}
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" leftIcon={<Printer size={14} />} onClick={() => window.print()}>
              Print Register
            </Button>
            <Button size="sm" variant="primary" leftIcon={<Plus size={14} />} onClick={() => setIsCreateModalOpen(true)}>
              Create Invoice
            </Button>
          </div>
        }
      />

      {/* Financial Overview KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat
          label="Total Revenue Invoiced"
          value={`$${summary.totalBilled.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<DollarSign size={20} />}
          color="blue"
        />
        <Stat
          label="Collected to Date"
          value={`$${summary.totalCollected.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<TrendingUp size={20} />}
          color="green"
        />
        <Stat
          label="Outstanding Balances Due"
          value={`$${summary.totalOutstanding.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<AlertCircle size={20} />}
          color="yellow"
        />
        <Stat
          label="Completed Payments"
          value={summary.totalTransactions.toString()}
          icon={<CreditCard size={20} />}
          color="cyan"
        />
      </div>

      {/* Invoices Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by invoice #, patient name, MRN..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-slate-50"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant={activeTab === "all" ? "primary" : "ghost"}
              onClick={() => setActiveTab("all")}
            >
              All Invoices ({invoices.length})
            </Button>
            <Button
              size="sm"
              variant={activeTab === "unpaid" ? "primary" : "ghost"}
              onClick={() => setActiveTab("unpaid")}
            >
              Unpaid ({summary.unpaidCount})
            </Button>
            <Button
              size="sm"
              variant={activeTab === "partial" ? "primary" : "ghost"}
              onClick={() => setActiveTab("partial")}
            >
              Partial ({summary.partialCount})
            </Button>
            <Button
              size="sm"
              variant={activeTab === "paid" ? "primary" : "ghost"}
              onClick={() => setActiveTab("paid")}
            >
              Paid ({summary.paidCount})
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-slate-400">Loading billing records...</div>
        ) : invoices.length > 0 ? (
          <Table
            keyField="invoiceId"
            data={invoices}
            columns={[
              {
                key: "invoiceNumber",
                header: "Invoice #",
                render: (r) => <span className="font-mono text-xs font-bold text-slate-900">{r.invoiceNumber}</span>,
              },
              {
                key: "patientName",
                header: "Patient Details",
                render: (r) => (
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{r.patientName}</p>
                    <p className="text-xs font-mono text-slate-400">{r.medicalRecordNumber}</p>
                  </div>
                ),
              },
              {
                key: "serviceType",
                header: "Service Description",
                render: (r) => <span className="text-xs text-slate-700 font-medium">{r.serviceType}</span>,
              },
              {
                key: "totalAmount",
                header: "Total Billed",
                render: (r) => <span className="font-mono text-xs font-bold text-slate-900">${r.totalAmount.toFixed(2)}</span>,
              },
              {
                key: "paidAmount",
                header: "Amount Paid",
                render: (r) => <span className="font-mono text-xs text-emerald-600 font-semibold">${r.paidAmount.toFixed(2)}</span>,
              },
              {
                key: "balanceAmount",
                header: "Outstanding Balance",
                render: (r) => (
                  <span className={`font-mono text-xs font-bold ${r.balanceAmount > 0 ? "text-rose-600" : "text-slate-400"}`}>
                    ${r.balanceAmount.toFixed(2)}
                  </span>
                ),
              },
              {
                key: "invoiceDate",
                header: "Issue Date",
                render: (r) => <span className="text-xs font-mono text-slate-600">{r.invoiceDate}</span>,
              },
              {
                key: "status",
                header: "Payment Status",
                render: (r) => (
                  <Badge variant={statusBadgeVariant(r.status)} size="sm">
                    {r.status}
                  </Badge>
                ),
              },
              {
                key: "actions",
                header: "Cashier Actions",
                align: "right",
                render: (r) => (
                  <div className="flex items-center justify-end gap-1.5 flex-wrap">
                    {r.balanceAmount > 0 && (
                      <Button
                        size="sm"
                        variant="primary"
                        leftIcon={<CreditCard size={12} />}
                        onClick={() => handleOpenPayment(r)}
                      >
                        Collect
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<FileText size={12} />}
                      onClick={() => handleOpenDetail(r.invoiceId)}
                    >
                      View / Print
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        ) : (
          <div className="p-12 text-center text-sm text-slate-400">
            No invoices matching search criteria.
          </div>
        )}
      </div>

      {/* CREATE INVOICE MODAL */}
      <Modal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Outpatient Consultation Invoice"
        description="Generate itemized clinic charges for consultation, diagnostics, and medications"
      >
        <form onSubmit={handleCreateInvoice} className="space-y-4">
          {/* Patient Selection & Auto-complete */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Patient <span className="text-rose-500">*</span>
            </label>
            {selectedPatient ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-primary-50 border border-primary-200 text-xs">
                <div>
                  <p className="font-bold text-slate-900">{selectedPatient.name}</p>
                  <p className="text-slate-500 font-mono">MRN: {selectedPatient.mrn}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setSelectedPatient(null)}>
                  Change
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Input
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  placeholder="Type patient full name or MRN to lookup..."
                  required
                />
                {patientResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-100">
                    {patientResults.map((p) => (
                      <div
                        key={p.patientId}
                        className="p-2.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between text-xs"
                        onClick={() => {
                          setSelectedPatient({
                            id: p.patientId,
                            name: `${p.firstName} ${p.lastName}`,
                            mrn: p.medicalRecordNumber,
                          });
                          setPatientResults([]);
                        }}
                      >
                        <div>
                          <p className="font-bold text-slate-900">{p.firstName} {p.lastName}</p>
                          <p className="text-[11px] font-mono text-slate-400">{p.medicalRecordNumber} · {p.phoneNumber}</p>
                        </div>
                        <Badge variant="secondary" size="sm">{p.gender}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Service Presets */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Quick Service Templates
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {CLINIC_SERVICE_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-slate-50 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-800 transition-colors"
                >
                  {p.label} (${p.price})
                </button>
              ))}
            </div>
          </div>

          {/* Line Items Builder */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700">
                Itemized Invoice Line Items <span className="text-rose-500">*</span>
              </label>
              <Button size="sm" variant="ghost" leftIcon={<Plus size={12} />} onClick={handleAddLineItem}>
                Add Line Item
              </Button>
            </div>

            <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/60 max-h-52 overflow-y-auto">
              {lineItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <input
                    value={item.description}
                    onChange={(e) => handleUpdateLineItem(idx, "description", e.target.value)}
                    placeholder="Item description (e.g. Consultation Fee)"
                    className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                    required
                  />
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleUpdateLineItem(idx, "quantity", parseInt(e.target.value) || 1)}
                    className="w-16 px-2 py-1.5 border border-slate-200 rounded-lg bg-white text-center"
                    title="Quantity"
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400 font-mono">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.unitPrice}
                      onChange={(e) => handleUpdateLineItem(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                      className="w-20 px-2 py-1.5 border border-slate-200 rounded-lg bg-white text-right font-mono"
                      title="Unit Price"
                    />
                  </div>
                  <span className="font-mono font-bold text-slate-800 w-16 text-right">
                    ${(item.quantity * item.unitPrice).toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveLineItem(idx)}
                    disabled={lineItems.length === 1}
                    className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Discounts, Taxes & Financial Summary */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Discount (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Tax / VAT (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={taxPercent}
                onChange={(e) => setTaxPercent(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-mono"
              />
            </div>
          </div>

          {/* Total Preview Box */}
          <div className="p-3 rounded-xl bg-slate-900 text-white text-xs space-y-1.5">
            <div className="flex justify-between text-slate-300">
              <span>Subtotal:</span>
              <span className="font-mono">${subTotalCalculated.toFixed(2)}</span>
            </div>
            {discountAmountCalculated > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Discount ({discountPercent}%):</span>
                <span className="font-mono">-${discountAmountCalculated.toFixed(2)}</span>
              </div>
            )}
            {taxAmountCalculated > 0 && (
              <div className="flex justify-between text-slate-300">
                <span>Tax ({taxPercent}%):</span>
                <span className="font-mono">+${taxAmountCalculated.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm text-white pt-1 border-t border-slate-700">
              <span>Authoritative Total Billed:</span>
              <span className="font-mono text-emerald-300">${grandTotalCalculated.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={creating}>
              {creating ? "Generating Invoice..." : "Create & Issue Invoice"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* COLLECT PAYMENT MODAL */}
      {selectedInvoiceForPayment && (
        <Modal
          open={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          title={`Collect Payment — ${selectedInvoiceForPayment.invoiceNumber}`}
          description={`Record outpatient payment transaction for ${selectedInvoiceForPayment.patientName}`}
        >
          <form onSubmit={handleProcessPayment} className="space-y-4">
            {/* Invoice Balance Summary */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Invoice Amount:</span>
                <span className="font-mono font-bold text-slate-900">${selectedInvoiceForPayment.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Already Paid to Date:</span>
                <span className="font-mono font-semibold text-emerald-600">${selectedInvoiceForPayment.paidAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-sm">
                <span className="text-slate-900">Remaining Balance Due:</span>
                <span className="font-mono text-rose-600">${selectedInvoiceForPayment.balanceAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Fields */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Amount Received ($) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={selectedInvoiceForPayment.balanceAmount}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder={selectedInvoiceForPayment.balanceAmount.toString()}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                required
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Supports partial payment or full settlement up to remaining balance.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Select
                  label="Payment Method"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  options={[
                    { value: "Cash", label: "Cash (Front Desk POS)" },
                    { value: "Card", label: "Debit / Credit Card" },
                    { value: "Bank Transfer", label: "Bank Transfer / Raast" },
                    { value: "Insurance Claim", label: "Insurance Direct Bill" },
                  ]}
                />
              </div>

              <div>
                <Input
                  label="Cashier Staff Name"
                  value={cashierName}
                  onChange={(e) => setCashierName(e.target.value)}
                  required
                />
              </div>
            </div>

            {(paymentMethod === "Card" || paymentMethod === "Bank Transfer") && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Card / Transfer Authorization Reference #
                </label>
                <input
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="e.g. AUTH-98234 or Bank Ref #..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  required
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="ghost" onClick={() => setIsPaymentModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={processingPayment}>
                {processingPayment ? "Recording Payment..." : "Confirm & Issue Receipt"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* PRINTABLE A4 INVOICE DETAIL MODAL */}
      {selectedInvoiceDetail && (
        <Modal
          open={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Outpatient Invoice — ${selectedInvoiceDetail.invoiceNumber}`}
          description="Official Patient Billing Record"
        >
          <div className="space-y-6 print:p-0" id="printable-a4-invoice">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b-2 border-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xl">
                  CS
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-lg uppercase tracking-wide">
                    CuraSphere Outpatient Medical Clinic
                  </h2>
                  <p className="text-xs text-slate-500 font-mono">
                    Invoice #: {selectedInvoiceDetail.invoiceNumber} · Date: {selectedInvoiceDetail.invoiceDate}
                  </p>
                </div>
              </div>
              <Badge variant={statusBadgeVariant(selectedInvoiceDetail.status)} size="md">
                {selectedInvoiceDetail.status}
              </Badge>
            </div>

            {/* Demographics */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Billed Patient</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedInvoiceDetail.patientName}</p>
                <p className="text-slate-600 font-mono mt-0.5">MRN: {selectedInvoiceDetail.medicalRecordNumber}</p>
                {selectedInvoiceDetail.patientPhone && <p className="text-slate-500">Phone: {selectedInvoiceDetail.patientPhone}</p>}
              </div>
              <div className="text-right">
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Service Department</p>
                <p className="text-sm font-bold text-primary-700 mt-0.5">{selectedInvoiceDetail.serviceType}</p>
                <p className="text-slate-500 mt-0.5">Due Date: {selectedInvoiceDetail.dueDate || "Due upon receipt"}</p>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Service / Line Item</th>
                    <th className="p-3 text-center">Category</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Unit Price</th>
                    <th className="p-3 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                  {selectedInvoiceDetail.lineItems.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-3 font-semibold text-slate-900">{item.description}</td>
                      <td className="p-3 text-center text-slate-500">{item.category || "Consultation"}</td>
                      <td className="p-3 text-center">{item.quantity}</td>
                      <td className="p-3 text-right font-mono">${item.unitPrice.toFixed(2)}</td>
                      <td className="p-3 text-right font-mono font-bold">${(item.quantity * item.unitPrice).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary Breakdown */}
            <div className="flex justify-end text-xs">
              <div className="w-64 space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono">${selectedInvoiceDetail.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Total Paid to Date:</span>
                  <span className="font-mono">-${selectedInvoiceDetail.paidAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-slate-900 pt-1 border-t border-slate-200">
                  <span>Remaining Balance:</span>
                  <span className="font-mono text-rose-600">${selectedInvoiceDetail.balanceAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment History Log */}
            {selectedInvoiceDetail.payments.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-200 text-xs">
                <p className="font-semibold text-slate-700 uppercase tracking-wide text-[10px]">
                  Recorded Payment Receipts ({selectedInvoiceDetail.payments.length}):
                </p>
                <div className="space-y-1.5">
                  {selectedInvoiceDetail.payments.map((pay, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[11px]">
                      <span>Receipt: <strong>{pay.paymentNumber}</strong></span>
                      <span>Method: {pay.paymentMethod}</span>
                      <span>Date: {pay.paymentDate}</span>
                      <span className="font-bold text-emerald-600">+${pay.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-200 print:hidden">
              <Button variant="ghost" onClick={() => setSelectedInvoiceDetail(null)}>
                Close
              </Button>
              <div className="flex items-center gap-2">
                {selectedInvoiceDetail.balanceAmount > 0 && (
                  <Button
                    variant="primary"
                    leftIcon={<CreditCard size={14} />}
                    onClick={() => {
                      setSelectedInvoiceDetail(null);
                      handleOpenPayment(selectedInvoiceDetail);
                    }}
                  >
                    Collect Balance
                  </Button>
                )}
                <Button variant="outline" leftIcon={<Printer size={14} />} onClick={() => window.print()}>
                  Print A4 Invoice
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* PRINTABLE 80MM CASHIER THERMAL RECEIPT MODAL */}
      {latestPaymentRecord && (
        <Modal
          open={isThermalReceiptOpen}
          onClose={() => setIsThermalReceiptOpen(false)}
          title="Cashier Payment Receipt (80mm Thermal POS)"
          description="Customer thermal receipt copy"
        >
          <div className="space-y-4 max-w-sm mx-auto p-4 bg-white border border-slate-200 rounded-xl shadow-sm text-xs font-mono">
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
              <h3 className="font-bold text-sm tracking-wider uppercase text-slate-900">CURASPHERE CLINIC</h3>
              <p className="text-[10px] text-slate-500">Outpatient Medical Services</p>
              <p className="text-[10px] text-slate-500">Official Payment Receipt</p>
            </div>

            <div className="space-y-1 text-[11px] text-slate-600">
              <div className="flex justify-between">
                <span>Receipt #:</span>
                <span className="font-bold text-slate-900">{latestPaymentRecord.paymentNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Invoice #:</span>
                <span>{latestPaymentRecord.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Date & Time:</span>
                <span>{latestPaymentRecord.paymentDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Patient:</span>
                <span className="font-bold text-slate-900">{latestPaymentRecord.patientName}</span>
              </div>
              <div className="flex justify-between">
                <span>Cashier Staff:</span>
                <span>{latestPaymentRecord.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Method:</span>
                <span className="font-bold">{latestPaymentRecord.paymentMethod}</span>
              </div>
            </div>

            <div className="pt-3 pb-3 border-t border-b border-dashed border-slate-300 text-center">
              <span className="text-[10px] uppercase text-slate-500">Amount Received</span>
              <p className="text-xl font-bold text-slate-900 mt-0.5">
                ${latestPaymentRecord.amount.toFixed(2)}
              </p>
              <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold mt-1">
                TRANSACTION CONFIRMED
              </span>
            </div>

            <div className="text-center text-[10px] text-slate-400 space-y-1">
              <p>Thank you for choosing CuraSphere Clinic.</p>
              <p>Please retain this receipt for insurance or tax purposes.</p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 print:hidden">
              <Button size="sm" variant="ghost" onClick={() => setIsThermalReceiptOpen(false)}>
                Close
              </Button>
              <Button size="sm" variant="primary" leftIcon={<Printer size={13} />} onClick={() => window.print()}>
                Print Thermal Slip
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
