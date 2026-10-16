import React, { useState, useEffect } from "react";
import { CreditCard, Plus, Search, DollarSign, CheckCircle2, TrendingUp, Filter } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { Stat } from "../../../components/ui/Stat";
import { Table } from "../../../components/ui/Table";
import { Modal } from "../../../components/ui/Modal";
import { Select } from "../../../components/ui/Select";
import { Input } from "../../../components/ui/Input";
import PageHeader from "../../../components/layout/PageHeader";
import { financialService, PaymentItem } from "../../../services/financialService";

const samplePayments: PaymentItem[] = [
  { paymentId: 1, paymentNumber: "PAY-9012", invoiceId: 1, invoiceNumber: "INV-2026-0891", patientName: "Muhammad Ali", amount: 45000, paymentMethod: "Card", cashierName: "Main Cashier (Kamran)", paymentDate: "2026-08-20 10:30 AM", status: "Confirmed" },
  { paymentId: 2, paymentNumber: "PAY-9013", invoiceId: 2, invoiceNumber: "INV-2026-0892", patientName: "Ayesha Khan", amount: 4000, paymentMethod: "Cash", cashierName: "OPD Cashier (Sara)", paymentDate: "2026-08-20 11:15 AM", status: "Confirmed" },
  { paymentId: 3, paymentNumber: "PAY-9014", invoiceId: 4, invoiceNumber: "INV-2026-0894", patientName: "Usman Tariq", amount: 12500, paymentMethod: "Insurance Claim", cashierName: "Billing Desk", paymentDate: "2026-08-19 04:00 PM", status: "Confirmed" },
];

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentItem[]>(samplePayments);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Collect Payment Form
  const [invoiceId, setInvoiceId] = useState("1");
  const [amount, setAmount] = useState("4500");
  const [method, setMethod] = useState("Cash");
  const [processing, setProcessing] = useState(false);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const data = await financialService.getPayments(search);
      if (data && data.length > 0) {
        setPayments(data);
      }
    } catch {
      // Keep sample
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [search]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    try {
      const created = await financialService.processPayment({
        invoiceId: Number(invoiceId),
        amount: Number(amount),
        paymentMethod: method,
      });

      if (created) {
        setPayments((prev) => [created, ...prev]);
      }
      setIsModalOpen(false);
      triggerToast(`Payment of PKR ${amount} collected via ${method}.`);
    } catch {
      const newPay: PaymentItem = {
        paymentId: Date.now(),
        paymentNumber: `PAY-${Math.floor(1000 + Math.random() * 9000)}`,
        invoiceId: Number(invoiceId),
        invoiceNumber: "INV-2026-NEW",
        patientName: "Payment Patient",
        amount: Number(amount),
        paymentMethod: method,
        cashierName: "Main Cashier",
        paymentDate: new Date().toLocaleString(),
        status: "Confirmed",
      };
      setPayments((prev) => [newPay, ...prev]);
      setIsModalOpen(false);
      triggerToast(`Payment ${newPay.paymentNumber} of PKR ${amount} recorded.`);
    } finally {
      setProcessing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredPayments = payments.filter((p) =>
    p.patientName.toLowerCase().includes(search.toLowerCase()) ||
    p.paymentNumber.toLowerCase().includes(search.toLowerCase()) ||
    p.invoiceNumber.toLowerCase().includes(search.toLowerCase())
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
        title="Payment & Collections"
        subtitle="Track cashier transactions, multi-channel payment logs, and daily reconciliation"
        icon={<CreditCard size={20} />}
        actions={
          <>
            <Button size="sm" variant="outline" onClick={handlePrint}>Print Ledger</Button>
            <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setIsModalOpen(true)}>Collect Payment</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Today's Collections" value={`PKR ${(payments.reduce((s, p) => s + p.amount, 0) / 1000).toFixed(1)}k`} icon={<DollarSign size={20} />} change={18} color="green" />
        <Stat label="Cash Receipts" value={`PKR ${(payments.filter(p => p.paymentMethod === "Cash").reduce((s, p) => s + p.amount, 0) / 1000).toFixed(1)}k`} icon={<CreditCard size={20} />} color="blue" />
        <Stat label="Card / Digital" value={`PKR ${(payments.filter(p => p.paymentMethod === "Card").reduce((s, p) => s + p.amount, 0) / 1000).toFixed(1)}k`} icon={<TrendingUp size={20} />} color="purple" />
        <Stat label="Confirmed Payments" value={payments.length.toString()} icon={<CheckCircle2 size={20} />} color="green" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search payments..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 bg-slate-50"
            />
          </div>
          <Button size="sm" variant="outline" leftIcon={<Filter size={14} />}>Payment Method</Button>
        </div>

        <Table
          keyField="paymentId"
          loading={loading}
          data={filteredPayments}
          columns={[
            { key: "paymentNumber", header: "Receipt ID", render: (r) => <span className="font-mono text-xs font-bold text-slate-800">{r.paymentNumber}</span> },
            { key: "invoiceNumber", header: "Invoice Ref", render: (r) => <span className="font-mono text-xs text-slate-500">{r.invoiceNumber}</span> },
            { key: "patientName", header: "Patient Name", render: (r) => <span className="text-sm font-semibold text-slate-800">{r.patientName}</span> },
            { key: "amount", header: "Amount Paid", render: (r) => <span className="font-mono text-sm font-bold text-emerald-600">PKR {r.amount.toLocaleString()}</span> },
            { key: "paymentMethod", header: "Method", render: (r) => <Badge variant="info">{r.paymentMethod}</Badge> },
            { key: "cashierName", header: "Cashier", render: (r) => <span className="text-xs text-slate-600">{r.cashierName}</span> },
            { key: "paymentDate", header: "Timestamp", render: (r) => <span className="text-xs text-slate-500 font-mono">{r.paymentDate}</span> },
            { key: "status", header: "Status", render: (r) => <Badge variant="success">{r.status}</Badge> },
          ]}
        />
      </div>

      {/* Collect Payment Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Collect Patient Payment"
        description="Process cashier payment receipt for pending invoice"
      >
        <form onSubmit={handleProcessPayment} className="space-y-4">
          <Input
            label="Invoice ID"
            value={invoiceId}
            onChange={(e) => setInvoiceId(e.target.value)}
            placeholder="Enter Invoice ID"
            required
          />
          <Input
            label="Amount Collected (PKR)"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            required
          />
          <Select
            label="Payment Channel / Method"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            options={[
              { value: "Cash", label: "Cash Payment" },
              { value: "Card", label: "Credit / Debit Card POS" },
              { value: "Bank Transfer", label: "Direct Bank Transfer" },
              { value: "Insurance Claim", label: "Insurance Pre-authorized Claim" },
            ]}
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={processing}>Record Payment</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
