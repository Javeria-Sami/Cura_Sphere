import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Plus,
  Search,
  DollarSign,
  CheckCircle2,
  TrendingUp,
  Filter,
  Printer,
  Receipt
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
  PaymentItem,
  InvoiceItem,
  BillingSummary
} from "../../../services/financialService";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [pendingInvoices, setPendingInvoices] = useState<InvoiceItem[]>([]);
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
  const [methodFilter, setMethodFilter] = useState("all");

  // Modal States
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState<PaymentItem | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Collect Payment Form State
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>("");
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [transactionRef, setTransactionRef] = useState("");
  const [cashierNotes, setCashierNotes] = useState("");
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [paymentsData, summaryData, invoicesData] = await Promise.all([
        financialService.getPayments(search),
        financialService.getBillingSummary(),
        financialService.getInvoices(undefined, "Unpaid")
      ]);

      if (paymentsData) setPayments(paymentsData);
      if (summaryData) setSummary(summaryData);
      if (invoicesData) setPendingInvoices(invoicesData);
    } catch (err) {
      console.error("Failed to load payment history", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  // Selected invoice in collect modal
  const activeInvoice = pendingInvoices.find((i) => i.invoiceId.toString() === selectedInvoiceId);

  // When invoice selection changes, auto-populate the remaining balance
  const handleInvoiceChange = (invId: string) => {
    setSelectedInvoiceId(invId);
    const found = pendingInvoices.find((i) => i.invoiceId.toString() === invId);
    if (found) {
      setPaymentAmount(found.balanceAmount.toString());
    } else {
      setPaymentAmount("");
    }
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId) {
      triggerToast("Please select an invoice to record payment.");
      return;
    }

    const numericAmount = parseFloat(paymentAmount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      triggerToast("Please enter a valid positive payment amount.");
      return;
    }

    if (activeInvoice && numericAmount > activeInvoice.balanceAmount) {
      triggerToast(`Payment amount ($${numericAmount}) cannot exceed outstanding balance ($${activeInvoice.balanceAmount.toFixed(2)}).`);
      return;
    }

    setPaymentProcessing(true);
    try {
      const createdPayment = await financialService.processPayment({
        invoiceId: parseInt(selectedInvoiceId),
        amount: numericAmount,
        paymentMethod: paymentMethod,
        transactionReference: transactionRef.trim() || undefined,
        notes: cashierNotes.trim() || undefined
      });

      triggerToast(`Payment ${createdPayment.paymentNumber} of $${numericAmount.toFixed(2)} recorded successfully.`);
      setIsCollectModalOpen(false);
      setSelectedInvoiceId("");
      setPaymentAmount("");
      setTransactionRef("");
      setCashierNotes("");

      // Open receipt automatically for printing
      setSelectedReceiptPayment(createdPayment);
      setIsReceiptModalOpen(true);

      // Refresh list
      loadData();
    } catch (err: any) {
      console.error("Failed to process payment", err);
      triggerToast(err.response?.data?.message || "Failed to process payment. Please verify the invoice.");
    } finally {
      setPaymentProcessing(false);
    }
  };

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.patientName.toLowerCase().includes(search.toLowerCase()) ||
      p.paymentNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      (p.transactionReference && p.transactionReference.toLowerCase().includes(search.toLowerCase()));

    const matchesMethod =
      methodFilter === "all" || p.paymentMethod.toLowerCase() === methodFilter.toLowerCase();

    return matchesSearch && matchesMethod;
  });

  const cashTotal = payments
    .filter((p) => p.paymentMethod === "Cash")
    .reduce((s, p) => s + p.amount, 0);

  const cardTotal = payments
    .filter((p) => p.paymentMethod === "Card" || p.paymentMethod === "Bank Transfer")
    .reduce((s, p) => s + p.amount, 0);

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl mx-auto animate-fade-in print:p-0 print:m-0">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-700 animate-slide-in">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="Payment & Collections"
        subtitle="Cashier payment ledger, multi-channel receipts, and daily point-of-sale reconciliations"
        icon={<CreditCard size={20} />}
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" leftIcon={<Printer size={14} />} onClick={() => window.print()}>
              Print Ledger
            </Button>
            <Button
              size="sm"
              variant="primary"
              leftIcon={<Plus size={14} />}
              onClick={() => setIsCollectModalOpen(true)}
            >
              Collect Payment
            </Button>
          </div>
        }
      />

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat
          label="Total Collected"
          value={`$${summary.totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<DollarSign size={20} />}
          change={12}
          color="green"
        />
        <Stat
          label="Cash Receipts"
          value={`$${cashTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<Receipt size={20} />}
          color="blue"
        />
        <Stat
          label="Card / Digital"
          value={`$${cardTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<TrendingUp size={20} />}
          color="purple"
        />
        <Stat
          label="Total Transactions"
          value={payments.length.toString()}
          icon={<CheckCircle2 size={20} />}
          color="green"
        />
      </div>

      {/* Main Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative flex-1 max-w-sm w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by receipt ID, invoice, patient, or auth..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 bg-white"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Filter size={12} /> Channel:
            </span>
            {[
              { id: "all", label: "All" },
              { id: "Cash", label: "Cash" },
              { id: "Card", label: "Card POS" },
              { id: "Bank Transfer", label: "Bank Transfer" },
              { id: "Insurance Claim", label: "Insurance" }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setMethodFilter(f.id)}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                  methodFilter === f.id
                    ? "bg-primary-600 text-white shadow-xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <Table
          keyField="paymentId"
          loading={loading}
          data={filteredPayments}
          columns={[
            {
              key: "paymentNumber",
              header: "Receipt #",
              render: (r) => (
                <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                  {r.paymentNumber}
                </span>
              )
            },
            {
              key: "invoiceNumber",
              header: "Invoice Ref",
              render: (r) => (
                <span className="font-mono text-xs text-slate-600 font-semibold">
                  {r.invoiceNumber}
                </span>
              )
            },
            {
              key: "patientName",
              header: "Patient",
              render: (r) => (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-xs font-bold">
                    {r.patientName.charAt(0)}
                  </div>
                  <span className="text-sm font-semibold text-slate-800">{r.patientName}</span>
                </div>
              )
            },
            {
              key: "amount",
              header: "Amount Paid",
              render: (r) => (
                <span className="font-mono text-sm font-bold text-emerald-600">
                  ${r.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              )
            },
            {
              key: "paymentMethod",
              header: "Method",
              render: (r) => {
                let badgeVariant: "success" | "info" | "warning" | "secondary" = "secondary";
                if (r.paymentMethod === "Cash") badgeVariant = "success";
                if (r.paymentMethod === "Card") badgeVariant = "info";
                if (r.paymentMethod === "Bank Transfer") badgeVariant = "warning";
                return <Badge variant={badgeVariant}>{r.paymentMethod}</Badge>;
              }
            },
            {
              key: "transactionReference",
              header: "Tx / Auth Ref",
              render: (r) => (
                <span className="text-xs text-slate-500 font-mono">
                  {r.transactionReference || "—"}
                </span>
              )
            },
            {
              key: "cashierName",
              header: "Cashier",
              render: (r) => <span className="text-xs text-slate-600">{r.cashierName}</span>
            },
            {
              key: "paymentDate",
              header: "Timestamp",
              render: (r) => <span className="text-xs text-slate-500 font-mono">{r.paymentDate}</span>
            },
            {
              key: "status",
              header: "Status",
              render: (r) => <Badge variant="success">{r.status}</Badge>
            },
            {
              key: "actions",
              header: "Action",
              render: (r) => (
                <Button
                  size="sm"
                  variant="ghost"
                  leftIcon={<Receipt size={12} />}
                  onClick={() => {
                    setSelectedReceiptPayment(r);
                    setIsReceiptModalOpen(true);
                  }}
                >
                  Receipt
                </Button>
              )
            }
          ]}
        />
      </div>

      {/* Collect Payment Modal */}
      <Modal
        open={isCollectModalOpen}
        onClose={() => setIsCollectModalOpen(false)}
        title="Collect Patient Payment"
        description="Record cashier payment against an outstanding patient invoice"
      >
        <form onSubmit={handleProcessPayment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select Outstanding Invoice *
            </label>
            {pendingInvoices.length > 0 ? (
              <select
                value={selectedInvoiceId}
                onChange={(e) => handleInvoiceChange(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                required
              >
                <option value="">-- Choose an outstanding invoice --</option>
                {pendingInvoices.map((inv) => (
                  <option key={inv.invoiceId} value={inv.invoiceId.toString()}>
                    {inv.invoiceNumber} — {inv.patientName} (Balance: ${inv.balanceAmount.toFixed(2)})
                  </option>
                ))}
              </select>
            ) : (
              <Input
                placeholder="Enter Invoice ID"
                value={selectedInvoiceId}
                onChange={(e) => setSelectedInvoiceId(e.target.value)}
                required
              />
            )}
          </div>

          {activeInvoice && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs space-y-1">
              <div className="flex justify-between text-slate-700 font-semibold">
                <span>Patient:</span>
                <span>{activeInvoice.patientName}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Invoice Amount:</span>
                <span>${activeInvoice.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Previously Paid:</span>
                <span>${activeInvoice.paidAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-amber-800 font-bold border-t border-amber-200 pt-1">
                <span>Outstanding Balance:</span>
                <span>${activeInvoice.balanceAmount.toFixed(2)}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Amount to Receive ($) *"
              type="number"
              step="0.01"
              min="0.01"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="0.00"
              required
            />

            <Select
              label="Payment Method *"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              options={[
                { value: "Cash", label: "Cash (Counter)" },
                { value: "Card", label: "Credit / Debit Card POS" },
                { value: "Bank Transfer", label: "Direct Bank Transfer" },
                { value: "Insurance Claim", label: "Insurance Pre-Authorization" }
              ]}
            />
          </div>

          <Input
            label="Transaction / Authorization Reference"
            value={transactionRef}
            onChange={(e) => setTransactionRef(e.target.value)}
            placeholder="e.g. POS Auth Code, Cheque #, or Wire Ref"
          />

          <Input
            label="Cashier Notes (Optional)"
            value={cashierNotes}
            onChange={(e) => setCashierNotes(e.target.value)}
            placeholder="Additional notes for receipt record"
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsCollectModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={paymentProcessing}>
              Confirm & Issue Receipt
            </Button>
          </div>
        </form>
      </Modal>

      {/* Printable Receipt Modal */}
      <Modal
        open={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        title="Official Cashier Receipt"
        description="Printable Point-of-Sale / Thermal Receipt for Patient Records"
      >
        {selectedReceiptPayment && (
          <div className="space-y-4">
            {/* Thermal POS 80mm preview box */}
            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-6 text-slate-800 font-mono text-xs max-w-sm mx-auto shadow-inner">
              <div className="text-center pb-3 border-b border-dashed border-slate-300 space-y-1">
                <p className="font-bold text-sm tracking-widest uppercase">CURASPHERE CLINIC</p>
                <p className="text-[10px] text-slate-500 font-sans">Primary Outpatient Healthcare Center</p>
                <p className="text-[10px] text-slate-500">Official Cashier Transaction Receipt</p>
              </div>

              <div className="py-3 border-b border-dashed border-slate-300 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Receipt #:</span>
                  <span className="font-bold">{selectedReceiptPayment.paymentNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Invoice Ref:</span>
                  <span>{selectedReceiptPayment.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date/Time:</span>
                  <span>{selectedReceiptPayment.paymentDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Patient:</span>
                  <span className="font-bold">{selectedReceiptPayment.patientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cashier:</span>
                  <span>{selectedReceiptPayment.cashierName}</span>
                </div>
                {selectedReceiptPayment.transactionReference && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Auth / Tx Ref:</span>
                    <span>{selectedReceiptPayment.transactionReference}</span>
                  </div>
                )}
              </div>

              <div className="py-3 border-b border-dashed border-slate-300 space-y-1">
                <div className="flex justify-between text-sm font-bold">
                  <span>TOTAL PAID ({selectedReceiptPayment.paymentMethod.toUpperCase()}):</span>
                  <span className="text-emerald-700">${selectedReceiptPayment.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Payment Status:</span>
                  <span className="font-bold text-emerald-600">{selectedReceiptPayment.status}</span>
                </div>
              </div>

              <div className="pt-3 text-center text-[10px] text-slate-400 font-sans space-y-0.5">
                <p>Thank you for choosing CuraSphere Health.</p>
                <p>Please retain this receipt for insurance & audit claims.</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="ghost" onClick={() => setIsReceiptModalOpen(false)}>
                Close
              </Button>
              <Button
                variant="primary"
                leftIcon={<Printer size={14} />}
                onClick={() => window.print()}
              >
                Print Receipt
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
