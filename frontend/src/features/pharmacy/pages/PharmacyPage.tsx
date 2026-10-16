import React, { useState, useEffect } from "react";
import { Pill, Plus, Search, Filter, AlertTriangle, CheckCircle2, Box, Printer } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { Stat } from "../../../components/ui/Stat";
import { Table } from "../../../components/ui/Table";
import { Modal } from "../../../components/ui/Modal";
import { Select } from "../../../components/ui/Select";
import { Input } from "../../../components/ui/Input";
import PageHeader from "../../../components/layout/PageHeader";
import { clinicalServices, PharmacyStockItem } from "../../../services/clinicalServices";

const initialSampleStock: PharmacyStockItem[] = [
  { drugId: 1, drugCode: "MED-091", drugName: "Paracetamol 500mg", genericName: "Acetaminophen", dosageForm: "Tablet", quantityInStock: 2500, minimumThreshold: 200, unitPrice: 5, expiryDate: "2027-12-31", status: "Available" },
  { drugId: 2, drugCode: "MED-092", drugName: "Amoxicillin 250mg", genericName: "Amoxicillin Trihydrate", dosageForm: "Capsule", quantityInStock: 45, minimumThreshold: 100, unitPrice: 15, expiryDate: "2026-11-15", status: "Low Stock" },
  { drugId: 3, drugCode: "MED-093", drugName: "Ciprofloxacin 500mg", genericName: "Ciprofloxacin HCl", dosageForm: "Tablet", quantityInStock: 800, minimumThreshold: 150, unitPrice: 28, expiryDate: "2027-06-30", status: "Available" },
  { drugId: 4, drugCode: "MED-094", drugName: "IV Normal Saline 1000ml", genericName: "Sodium Chloride 0.9%", dosageForm: "Infusion", quantityInStock: 120, minimumThreshold: 50, unitPrice: 180, expiryDate: "2028-01-20", status: "Available" },
  { drugId: 5, drugCode: "MED-095", drugName: "Omeprazole 20mg", genericName: "Omeprazole Sodium", dosageForm: "Capsule", quantityInStock: 15, minimumThreshold: 80, unitPrice: 22, expiryDate: "2026-09-01", status: "Low Stock" },
];

export default function PharmacyPage() {
  const [stock, setStock] = useState<PharmacyStockItem[]>(initialSampleStock);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Dispense Form
  const [drugId, setDrugId] = useState("1");
  const [patientMrn, setPatientMrn] = useState("MRN-00521");
  const [qty, setQty] = useState("10");
  const [dispensing, setDispensing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchStock = async () => {
    setLoading(true);
    try {
      const data = await clinicalServices.getPharmacyStock(search);
      if (data && data.length > 0) {
        setStock(data);
      }
    } catch {
      // Keep sample
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, [search]);

  const handleDispense = (e: React.FormEvent) => {
    e.preventDefault();
    setDispensing(true);
    const targetDrug = stock.find((s) => s.drugId === Number(drugId));
    setTimeout(() => {
      setStock((prev) =>
        prev.map((item) =>
          item.drugId === Number(drugId)
            ? { ...item, quantityInStock: Math.max(0, item.quantityInStock - Number(qty)) }
            : item
        )
      );
      setDispensing(false);
      setIsModalOpen(false);
      triggerToast(`Dispensed ${qty} units of ${targetDrug?.drugName || "Medication"} for ${patientMrn}.`);
    }, 400);
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredStock = stock.filter((s) =>
    s.drugName.toLowerCase().includes(search.toLowerCase()) ||
    s.drugCode.toLowerCase().includes(search.toLowerCase()) ||
    s.genericName.toLowerCase().includes(search.toLowerCase())
  );

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
        title="Pharmacy & Prescription Dispensing"
        subtitle="Manage pharmaceutical formulary, prescription order fulfillment, and batch expiry tracking"
        icon={<Pill size={20} />}
        actions={
          <>
            <Button size="sm" variant="outline" leftIcon={<Printer size={14} />} onClick={handlePrint}>Print Formulary</Button>
            <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setIsModalOpen(true)}>Dispense Medication</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Total Formulations" value={stock.length.toString()} icon={<Box size={20} />} change={6} color="blue" />
        <Stat label="Available Stock" value={stock.filter(s => s.status === "Available").length.toString()} icon={<CheckCircle2 size={20} />} color="green" />
        <Stat label="Reorder Alerts" value={stock.filter(s => s.status === "Low Stock").length.toString()} icon={<AlertTriangle size={20} />} color="yellow" />
        <Stat label="Expiring Soon (30d)" value="2" icon={<AlertTriangle size={20} />} color="red" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search drug formulary..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 bg-slate-50"
            />
          </div>
          <Button size="sm" variant="outline" leftIcon={<Filter size={14} />}>Form Filter</Button>
        </div>

        <Table
          keyField="drugId"
          loading={loading}
          data={filteredStock}
          columns={[
            { key: "drugCode", header: "Drug Code", render: (r) => <span className="font-mono text-xs font-bold text-slate-800">{r.drugCode}</span> },
            { key: "drugName", header: "Medication Name", render: (r) => <div><p className="text-sm font-semibold text-slate-800">{r.drugName}</p><p className="text-xs text-slate-400 italic">{r.genericName}</p></div> },
            { key: "dosageForm", header: "Dosage Form", render: (r) => <Badge variant="info">{r.dosageForm}</Badge> },
            { key: "quantityInStock", header: "Stock Level", render: (r) => <span className="font-mono text-sm font-bold text-slate-800">{r.quantityInStock} Units</span> },
            { key: "unitPrice", header: "Price / Unit", render: (r) => <span className="font-mono text-xs text-slate-700">PKR {r.unitPrice}</span> },
            { key: "expiryDate", header: "Expiry Date", render: (r) => <span className="text-xs font-mono text-slate-500">{r.expiryDate}</span> },
            { key: "status", header: "Status", render: (r) => <Badge variant={r.status === "Available" ? "success" : "warning"}>{r.status}</Badge> },
            { key: "actions", header: "", align: "right", render: (r) => <Button size="sm" variant="outline" onClick={() => { setDrugId(r.drugId.toString()); setIsModalOpen(true); }}>Dispense</Button> },
          ]}
        />
      </div>

      {/* Dispense Medication Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Dispense Prescription Order"
        description="Fulfil medication order against patient electronic prescription"
      >
        <form onSubmit={handleDispense} className="space-y-4">
          <Select
            label="Select Medication"
            value={drugId}
            onChange={(e) => setDrugId(e.target.value)}
            options={stock.map((s) => ({ value: s.drugId.toString(), label: `${s.drugName} (Stock: ${s.quantityInStock})` }))}
          />
          <Input
            label="Patient MRN / ID"
            value={patientMrn}
            onChange={(e) => setPatientMrn(e.target.value)}
            required
          />
          <Input
            label="Dispense Quantity"
            type="number"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            required
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={dispensing}>Dispense & Update Stock</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

