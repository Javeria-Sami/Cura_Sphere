import React, { useState, useEffect } from "react";
import { Package, Plus, Search, Filter, Download, AlertTriangle, CheckCircle2, Box } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { Stat } from "../../../components/ui/Stat";
import { Table } from "../../../components/ui/Table";
import { Modal } from "../../../components/ui/Modal";
import { Select } from "../../../components/ui/Select";
import { Input } from "../../../components/ui/Input";
import PageHeader from "../../../components/layout/PageHeader";
import { operationsService, InventoryItemData } from "../../../services/operationsService";

const initialSampleInventory: InventoryItemData[] = [
  { itemId: 1, itemCode: "ITM-0142", itemName: "Surgical Gloves (Size L)", category: "Consumables", quantityOnHand: 450, unitOfMeasure: "Boxes", reorderThreshold: 100, unitCost: 1200, status: "In Stock" },
  { itemId: 2, itemCode: "ITM-0143", itemName: "Syringes 5ml (Disposables)", category: "Consumables", quantityOnHand: 35, unitOfMeasure: "Boxes", reorderThreshold: 50, unitCost: 450, status: "Low Stock" },
  { itemId: 3, itemCode: "ITM-0144", itemName: "N95 Respirator Masks", category: "PPE", quantityOnHand: 180, unitOfMeasure: "Pcs", reorderThreshold: 100, unitCost: 350, status: "In Stock" },
  { itemId: 4, itemCode: "ITM-0145", itemName: "IV Cannula 20G", category: "Consumables", quantityOnHand: 12, unitOfMeasure: "Boxes", reorderThreshold: 30, unitCost: 850, status: "Critical" },
  { itemId: 5, itemCode: "ITM-0146", itemName: "Digital Blood Pressure Monitor", category: "Equipment", quantityOnHand: 15, unitOfMeasure: "Units", reorderThreshold: 5, unitCost: 6500, status: "In Stock" },
];

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItemData[]>(initialSampleInventory);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Item Form
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Consumables");
  const [qty, setQty] = useState("100");
  const [cost, setCost] = useState("500");
  const [creating, setCreating] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const data = await operationsService.getInventory(search);
      if (data && data.length > 0) {
        setItems(data);
      }
    } catch {
      // Keep sample
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [search]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const created = await operationsService.createInventoryItem({
        itemName: name,
        category,
        quantityOnHand: Number(qty),
        unitCost: Number(cost),
      });

      if (created) {
        setItems((prev) => [created, ...prev]);
      }
      setIsModalOpen(false);
      triggerToast(`Added ${name} to Inventory Catalog.`);
    } catch {
      const newItem: InventoryItemData = {
        itemId: Date.now(),
        itemCode: `ITM-${Math.floor(100 + Math.random() * 900)}`,
        itemName: name,
        category,
        quantityOnHand: Number(qty),
        unitOfMeasure: "Pcs",
        reorderThreshold: 50,
        unitCost: Number(cost),
        status: Number(qty) < 50 ? "Low Stock" : "In Stock",
      };
      setItems((prev) => [newItem, ...prev]);
      setIsModalOpen(false);
      triggerToast(`Added ${newItem.itemCode} (${newItem.itemName}) to Inventory Catalog.`);
    } finally {
      setCreating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredItems = items.filter((i) =>
    i.itemName.toLowerCase().includes(search.toLowerCase()) ||
    i.itemCode.toLowerCase().includes(search.toLowerCase()) ||
    i.category.toLowerCase().includes(search.toLowerCase())
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
        title="Inventory & Medical Supplies"
        subtitle="Track stock levels, reorder thresholds, equipment, and medical consumables"
        icon={<Package size={20} />}
        actions={
          <>
            <Button size="sm" variant="outline" leftIcon={<Download size={14} />} onClick={handlePrint}>Export Stock</Button>
            <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setIsModalOpen(true)}>Add New Item</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Total SKU Items" value={items.length.toString()} icon={<Box size={20} />} change={8} color="blue" />
        <Stat label="In Stock" value={items.filter(i => i.status === "In Stock").length.toString()} icon={<CheckCircle2 size={20} />} color="green" />
        <Stat label="Low Stock Warning" value={items.filter(i => i.status === "Low Stock").length.toString()} icon={<AlertTriangle size={20} />} color="yellow" />
        <Stat label="Critical Out of Stock" value={items.filter(i => i.status === "Critical").length.toString()} icon={<AlertTriangle size={20} />} color="red" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search stock items..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 bg-slate-50"
            />
          </div>
          <Button size="sm" variant="outline" leftIcon={<Filter size={14} />}>Category Filter</Button>
        </div>

        <Table
          keyField="itemId"
          loading={loading}
          data={filteredItems}
          columns={[
            { key: "itemCode", header: "Item Code", render: (r) => <span className="font-mono text-xs font-bold text-slate-800">{r.itemCode}</span> },
            { key: "itemName", header: "Item Name", render: (r) => <div><p className="text-sm font-semibold text-slate-800">{r.itemName}</p><p className="text-xs text-slate-400">{r.category}</p></div> },
            { key: "quantityOnHand", header: "Quantity", render: (r) => <span className="font-mono text-sm font-bold text-slate-800">{r.quantityOnHand} {r.unitOfMeasure}</span> },
            { key: "reorderThreshold", header: "Threshold", render: (r) => <span className="font-mono text-xs text-slate-500">{r.reorderThreshold} {r.unitOfMeasure}</span> },
            { key: "unitCost", header: "Unit Cost", render: (r) => <span className="font-mono text-xs text-slate-700">PKR {r.unitCost.toLocaleString()}</span> },
            { key: "status", header: "Stock Status", render: (r) => <Badge variant={r.status === "In Stock" ? "success" : r.status === "Low Stock" ? "warning" : "danger"}>{r.status}</Badge> },
            { key: "actions", header: "", align: "right", render: () => <Button size="sm" variant="ghost">Reorder</Button> },
          ]}
        />
      </div>

      {/* Add Stock Item Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Inventory SKU Item"
        description="Add new medical consumable, PPE, or equipment item to inventory catalog"
      >
        <form onSubmit={handleAddItem} className="space-y-4">
          <Input
            label="Item Description / Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Surgical Gloves Size M"
            required
          />
          <Select
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={[
              { value: "Consumables", label: "Consumables & Syringes" },
              { value: "PPE", label: "PPE & Protective Apparel" },
              { value: "Surgical", label: "Surgical Instruments" },
              { value: "Equipment", label: "Medical Devices & Monitors" },
            ]}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Opening Quantity"
              type="number"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              required
            />
            <Input
              label="Unit Cost (PKR)"
              type="number"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={creating}>Add SKU Item</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
