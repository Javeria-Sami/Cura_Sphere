import React, { useState, useEffect } from "react";
import { Stethoscope, Plus, Search, Filter, Download, RefreshCw, Users, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { Stat } from "../../../components/ui/Stat";
import { Table } from "../../../components/ui/Table";
import { Modal } from "../../../components/ui/Modal";
import { Select } from "../../../components/ui/Select";
import { Input } from "../../../components/ui/Input";
import PageHeader from "../../../components/layout/PageHeader";
import { opdService, OpdTokenItem } from "../../../services/opdService";

const initialSampleTokens: OpdTokenItem[] = [
  { opdTokenId: 1, tokenNumber: "T-012", patientId: 101, patientName: "Muhammad Ali", medicalRecordNumber: "MRN-00521", age: 34, doctorId: 1, doctorName: "Dr. Sana Qureshi", departmentName: "General Medicine", queuePosition: 12, status: "Waiting", vitals: "Normal", chiefComplaint: "Fever and headaches" },
  { opdTokenId: 2, tokenNumber: "T-013", patientId: 102, patientName: "Ayesha Khan", medicalRecordNumber: "MRN-00498", age: 28, doctorId: 2, doctorName: "Dr. Adeel Khan", departmentName: "Cardiology", queuePosition: 13, status: "Consulting", vitals: "BP High", chiefComplaint: "Chest discomfort" },
  { opdTokenId: 3, tokenNumber: "T-014", patientId: 103, patientName: "Zara Ahmed", medicalRecordNumber: "MRN-00504", age: 45, doctorId: 3, doctorName: "Dr. Mehwish Ali", departmentName: "Orthopedics", queuePosition: 14, status: "Completed", vitals: "Normal", chiefComplaint: "Back stiffness" },
  { opdTokenId: 4, tokenNumber: "T-015", patientId: 104, patientName: "Usman Tariq", medicalRecordNumber: "MRN-00519", age: 52, doctorId: 4, doctorName: "Dr. Faisal Siddiqui", departmentName: "Neurology", queuePosition: 15, status: "Waiting", vitals: "Stable", chiefComplaint: "Migraine follow-up" },
];

export default function OPDPage() {
  const [tokens, setTokens] = useState<OpdTokenItem[]>(initialSampleTokens);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Issue Token form state
  const [patientId, setPatientId] = useState("1");
  const [doctorId, setDoctorId] = useState("1");
  const [departmentId, setDepartmentId] = useState("1");
  const [complaint, setComplaint] = useState("");
  const [issuing, setIssuing] = useState(false);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const data = await opdService.getQueue(search);
      if (data && data.length > 0) {
        setTokens(data);
      }
    } catch {
      // Keep sample tokens
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [search]);

  const handleIssueToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setIssuing(true);
    try {
      const created = await opdService.issueToken({
        patientId: Number(patientId),
        doctorId: Number(doctorId),
        departmentId: Number(departmentId),
        chiefComplaint: complaint,
      });

      if (created) {
        setTokens((prev) => [created, ...prev]);
      }
      setIsModalOpen(false);
    } catch {
      const newToken: OpdTokenItem = {
        opdTokenId: Date.now(),
        tokenNumber: `T-${(tokens.length + 1).toString().padStart(3, "0")}`,
        patientId: Number(patientId),
        patientName: "OPD Patient",
        medicalRecordNumber: "MRN-OPD",
        age: 30,
        doctorId: Number(doctorId),
        doctorName: "Dr. Consultant",
        departmentName: "OPD",
        queuePosition: tokens.length + 1,
        status: "Waiting",
        vitals: "Normal",
        chiefComplaint: complaint,
      };
      setTokens((prev) => [newToken, ...prev]);
      setIsModalOpen(false);
    } finally {
      setIssuing(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl mx-auto animate-fade-in">
      <PageHeader
        title="Outpatient Department (OPD)"
        subtitle="Manage outpatient consultations, tokens, and doctor queues"
        icon={<Stethoscope size={20} />}
        actions={
          <>
            <Button size="sm" variant="outline" leftIcon={<Download size={14} />}>Export</Button>
            <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setIsModalOpen(true)}>New Token</Button>
          </>
        }
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Today's OPD" value={tokens.length.toString()} icon={<Users size={20} />} change={12} color="blue" />
        <Stat label="Currently Waiting" value={tokens.filter(t => t.status === "Waiting").length.toString()} icon={<Clock size={20} />} color="yellow" />
        <Stat label="Consulting" value={tokens.filter(t => t.status === "Consulting").length.toString()} icon={<Stethoscope size={20} />} color="purple" />
        <Stat label="Completed" value={tokens.filter(t => t.status === "Completed").length.toString()} icon={<CheckCircle2 size={20} />} change={15} color="green" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patients, token number..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 bg-slate-50"
            />
          </div>
          <Button size="sm" variant="outline" leftIcon={<Filter size={14} />}>Filter</Button>
          <Button size="sm" variant="ghost" leftIcon={<RefreshCw size={14} />} onClick={fetchQueue}>Refresh</Button>
        </div>
        <Table
          keyField="opdTokenId"
          loading={loading}
          data={tokens}
          columns={[
            { key: "tokenNumber", header: "Token", render: (r) => <span className="font-mono font-bold text-primary-600">{r.tokenNumber}</span> },
            { key: "patientName", header: "Patient", render: (r) => <div><p className="text-sm font-semibold text-slate-800">{r.patientName}</p><p className="text-xs font-mono text-slate-400">{r.medicalRecordNumber} · Age {r.age}</p></div> },
            { key: "doctorName", header: "Doctor", render: (r) => <div><p className="text-sm text-slate-700">{r.doctorName}</p><p className="text-xs text-slate-400">{r.departmentName}</p></div> },
            { key: "vitals", header: "Vitals", render: (r) => <Badge variant={r.vitals === "Normal" ? "success" : "warning"}>{r.vitals}</Badge> },
            { key: "status", header: "Status", render: (r) => <Badge variant={r.status === "Completed" ? "success" : r.status === "Consulting" ? "info" : "secondary"}>{r.status}</Badge> },
            { key: "actions", header: "", align: "right", render: (r) => <Button size="sm" variant="ghost" onClick={() => opdService.updateStatus(r.opdTokenId, "Consulting")}>Consult</Button> },
          ]}
        />
      </div>

      {/* New OPD Token Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Issue OPD Consultation Token"
        description="Generate daily consultation queue token for registered patient"
      >
        <form onSubmit={handleIssueToken} className="space-y-4">
          <Input
            label="Patient ID / MRN"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            placeholder="Enter Patient ID"
            required
          />
          <Select
            label="Department"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            options={[
              { value: "1", label: "General OPD" },
              { value: "2", label: "Cardiology" },
              { value: "3", label: "Orthopedics" },
              { value: "4", label: "Neurology" },
            ]}
          />
          <Select
            label="Assigned Physician"
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            options={[
              { value: "1", label: "Dr. Sana Qureshi" },
              { value: "2", label: "Dr. Adeel Khan" },
              { value: "3", label: "Dr. Mehwish Ali" },
              { value: "4", label: "Dr. Faisal Siddiqui" },
            ]}
          />
          <Input
            label="Chief Complaint"
            value={complaint}
            onChange={(e) => setComplaint(e.target.value)}
            placeholder="Fever, cough, joint pain, etc."
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={issuing}>Issue Token</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
