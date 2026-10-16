import { useState } from "react";
import { Shield, Plus, Search, CheckCircle2, Clock, AlertTriangle, FileText, Printer } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { Stat } from "../../../components/ui/Stat";
import { Table } from "../../../components/ui/Table";
import { Modal } from "../../../components/ui/Modal";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import PageHeader from "../../../components/layout/PageHeader";

interface ClaimItem {
  id: string;
  mrn: string;
  patient: string;
  insurer: string;
  policy: string;
  service: string;
  amount: number;
  approved: number;
  status: string;
}

const initialClaims: ClaimItem[] = [
  { id: "CLM-001", mrn: "MRN-00487", patient: "Fatima Malik", insurer: "State Life Insurance", policy: "SLI-234567", service: "Maternity Care", amount: 85000, approved: 72000, status: "Approved" },
  { id: "CLM-002", mrn: "MRN-00498", patient: "Ayesha Khan", insurer: "EFU Health Insurance", policy: "EFU-89234", service: "Cardiac Surgery", amount: 120000, approved: 0, status: "Under Review" },
  { id: "CLM-003", mrn: "MRN-00504", patient: "Zara Ahmed", insurer: "Jubilee Health TPA", policy: "JHL-45678", service: "IPD Surgery", amount: 95000, approved: 0, status: "Pending" },
  { id: "CLM-004", mrn: "MRN-00519", patient: "Usman Tariq", insurer: "Adamjee Insurance", policy: "ADJ-12345", service: "OPD Consultation", amount: 5000, approved: 0, status: "Rejected" },
];

export default function InsurancePage() {
  const [claimsList, setClaimsList] = useState<ClaimItem[]>(initialClaims);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Claim Form State
  const [patientName, setPatientName] = useState("");
  const [insurer, setInsurer] = useState("State Life Insurance");
  const [policyNumber, setPolicyNumber] = useState("");
  const [serviceCategory, setServiceCategory] = useState("IPD Admission");
  const [claimedAmount, setClaimedAmount] = useState("50000");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCreateClaim = (e: React.FormEvent) => {
    e.preventDefault();
    const newClaim: ClaimItem = {
      id: `CLM-${Math.floor(100 + Math.random() * 900)}`,
      mrn: `MRN-${Math.floor(10000 + Math.random() * 90000)}`,
      patient: patientName || "Claim Patient",
      insurer: insurer,
      policy: policyNumber || `POL-${Math.floor(10000 + Math.random() * 90000)}`,
      service: serviceCategory,
      amount: Number(claimedAmount) || 50000,
      approved: 0,
      status: "Under Review",
    };
    setClaimsList([newClaim, ...claimsList]);
    setIsModalOpen(false);
    setPatientName("");
    setPolicyNumber("");
    triggerToast(`Insurance Claim ${newClaim.id} submitted for ${newClaim.patient} (${newClaim.insurer}).`);
  };

  const handlePrint = () => {
    window.print();
  };

  const filtered = claimsList.filter(
    (c) =>
      c.patient.toLowerCase().includes(search.toLowerCase()) ||
      c.insurer.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.mrn.toLowerCase().includes(search.toLowerCase())
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
        title="Insurance & TPA Claims Management"
        subtitle="Pre-authorization claims processing, insurer liaison, policy verifications, and payout ledgers"
        icon={<Shield size={20} />}
        actions={
          <>
            <Button size="sm" variant="outline" leftIcon={<Printer size={14} />} onClick={handlePrint}>Print Claims Report</Button>
            <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setIsModalOpen(true)}>Submit New Claim</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Total Active Claims" value={claimsList.length.toString()} icon={<FileText size={20} />} change={5} color="blue" />
        <Stat label="Approved Claims" value={claimsList.filter(c => c.status === "Approved").length.toString()} icon={<CheckCircle2 size={20} />} change={8} color="green" />
        <Stat label="Under Review" value={claimsList.filter(c => c.status === "Under Review" || c.status === "Pending").length.toString()} icon={<Clock size={20} />} color="yellow" />
        <Stat label="Rejected Claims" value={claimsList.filter(c => c.status === "Rejected").length.toString()} icon={<AlertTriangle size={20} />} color="red" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search claims, patients, policy numbers..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 bg-slate-50"
            />
          </div>
        </div>

        <Table
          keyField="id"
          data={filtered}
          columns={[
            { key: "id", header: "Claim ID", render: (r) => <span className="font-mono text-xs font-bold text-slate-800">{r.id}</span> },
            { key: "patient", header: "Patient", render: (r) => <div><p className="text-sm font-semibold text-slate-800">{r.patient}</p><p className="text-xs font-mono text-slate-400">{r.mrn}</p></div> },
            { key: "insurer", header: "Insurer & Policy", render: (r) => <div><p className="text-sm font-semibold text-slate-700">{r.insurer}</p><p className="text-xs font-mono text-slate-400">{r.policy}</p></div> },
            { key: "service", header: "Service Covered", render: (r) => <Badge variant="info">{r.service}</Badge> },
            { key: "amount", header: "Claimed (PKR)", render: (r) => <span className="font-mono text-sm font-semibold text-slate-800">PKR {r.amount.toLocaleString()}</span> },
            { key: "approved", header: "Approved (PKR)", render: (r) => <span className={`font-mono text-sm font-bold ${r.approved > 0 ? "text-emerald-600" : "text-slate-400"}`}>PKR {r.approved.toLocaleString()}</span> },
            { key: "status", header: "Status", render: (r) => <Badge variant={r.status === "Approved" ? "success" : r.status === "Rejected" ? "danger" : r.status === "Under Review" ? "warning" : "default"}>{r.status}</Badge> },
          ]}
        />
      </div>

      {/* SUBMIT NEW CLAIM MODAL */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Submit New Insurance Claim">
        <form onSubmit={handleCreateClaim} className="space-y-4">
          <Input
            label="Patient Name"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder="e.g. Fatima Malik"
            required
          />
          <Select
            label="Insurance Company / TPA Provider"
            value={insurer}
            onChange={(e) => setInsurer(e.target.value)}
            options={[
              { value: "State Life Insurance", label: "State Life Insurance (Health Policy)" },
              { value: "EFU Health Insurance", label: "EFU Health Insurance" },
              { value: "Jubilee Health TPA", label: "Jubilee Health TPA" },
              { value: "Adamjee Insurance", label: "Adamjee Insurance" },
              { value: "Askari Health Insurance", label: "Askari Health Insurance" },
            ]}
          />
          <Input
            label="Policy / Member ID Number"
            value={policyNumber}
            onChange={(e) => setPolicyNumber(e.target.value)}
            placeholder="e.g. SLI-998822"
            required
          />
          <Select
            label="Covered Service Category"
            value={serviceCategory}
            onChange={(e) => setServiceCategory(e.target.value)}
            options={[
              { value: "IPD Admission & Surgery", label: "IPD Admission & Surgical Procedure" },
              { value: "Maternity & Neonatal Care", label: "Maternity & Neonatal Care" },
              { value: "Cardiac Intervention", label: "Cardiac Intervention" },
              { value: "Emergency Trauma Care", label: "Emergency Trauma Care" },
              { value: "OPD Consultation & Diagnostic", label: "OPD Consultation & Diagnostic" },
            ]}
          />
          <Input
            label="Claimed Amount (PKR)"
            type="number"
            value={claimedAmount}
            onChange={(e) => setClaimedAmount(e.target.value)}
            placeholder="Enter total claimed PKR amount"
            required
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Submit Pre-Auth Claim</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

