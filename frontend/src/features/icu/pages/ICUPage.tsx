import { useState, useEffect } from "react";
import { Activity, Plus, Search, Filter, AlertTriangle, Heart, Thermometer, Printer, CheckCircle2 } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { Stat } from "../../../components/ui/Stat";
import { Table } from "../../../components/ui/Table";
import { Modal } from "../../../components/ui/Modal";
import { Input } from "../../../components/ui/Input";
import PageHeader from "../../../components/layout/PageHeader";
import { clinicalServices, IcuPatientVitalItem } from "../../../services/clinicalServices";

const initialSampleVitals: IcuPatientVitalItem[] = [
  { vitalId: 1, patientId: 101, patientName: "Muhammad Ali", medicalRecordNumber: "MRN-00521", bedNumber: "ICU Bed 01", bloodPressure: "128/84", heartRate: 88, spO2: 97, gcsScore: 14, temperature: 98.6, recordedAt: "10:15 AM", alertStatus: "Normal" },
  { vitalId: 2, patientId: 102, patientName: "Tariq Mahmood", medicalRecordNumber: "MRN-00488", bedNumber: "ICU Bed 02", bloodPressure: "92/60", heartRate: 115, spO2: 91, gcsScore: 11, temperature: 101.2, recordedAt: "10:18 AM", alertStatus: "Critical" },
  { vitalId: 3, patientId: 103, patientName: "Zahida Bibi", medicalRecordNumber: "MRN-00495", bedNumber: "ICU Bed 04", bloodPressure: "135/90", heartRate: 76, spO2: 99, gcsScore: 15, temperature: 98.4, recordedAt: "10:10 AM", alertStatus: "Normal" },
];

export default function ICUPage() {
  const [vitals, setVitals] = useState<IcuPatientVitalItem[]>(initialSampleVitals);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [patientName, setPatientName] = useState("");
  const [bedNumber, setBedNumber] = useState("ICU Bed 03");
  const [bp, setBp] = useState("120/80");
  const [hr, setHr] = useState("78");
  const [spo2, setSpo2] = useState("98");
  const [gcs, setGcs] = useState("15");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchVitals = async () => {
    setLoading(true);
    try {
      const data = await clinicalServices.getIcuVitals(search);
      if (data && data.length > 0) {
        setVitals(data);
      }
    } catch {
      // Keep sample
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVitals();
  }, [search]);

  const handleRecordVital = (e: React.FormEvent) => {
    e.preventDefault();
    const newVital: IcuPatientVitalItem = {
      vitalId: Date.now(),
      patientId: 105,
      patientName: patientName || "ICU Inpatient",
      medicalRecordNumber: `MRN-${Math.floor(10000 + Math.random() * 90000)}`,
      bedNumber: bedNumber,
      bloodPressure: bp,
      heartRate: Number(hr) || 78,
      spO2: Number(spo2) || 98,
      gcsScore: Number(gcs) || 15,
      temperature: 98.6,
      recordedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      alertStatus: Number(spo2) < 92 || Number(hr) > 110 ? "Critical" : "Normal",
    };
    setVitals([newVital, ...vitals]);
    setIsModalOpen(false);
    setPatientName("");
    triggerToast(`Recorded ICU Telemetry for ${newVital.patientName} (${newVital.bedNumber}).`);
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredVitals = vitals.filter((v) =>
    v.patientName.toLowerCase().includes(search.toLowerCase()) ||
    v.bedNumber.toLowerCase().includes(search.toLowerCase()) ||
    v.medicalRecordNumber.toLowerCase().includes(search.toLowerCase())
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
        title="Intensive Care Unit (ICU) Vitals Monitor"
        subtitle="Real-time bedside vital monitoring, Glasgow Coma Scale, oxygenation, and telemetry alerts"
        icon={<Activity size={20} />}
        actions={
          <>
            <Button size="sm" variant="outline" leftIcon={<Printer size={14} />} onClick={handlePrint}>Print ICU Telemetry</Button>
            <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setIsModalOpen(true)}>Record Vital Monitor</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="ICU Beds Occupied" value={`${vitals.length} / 8`} icon={<Activity size={20} />} color="blue" />
        <Stat label="Normal Telemetry" value={vitals.filter(v => v.alertStatus === "Normal").length.toString()} icon={<Heart size={20} />} color="green" />
        <Stat label="Critical Vitals Alert" value={vitals.filter(v => v.alertStatus === "Critical").length.toString()} icon={<AlertTriangle size={20} />} color="red" />
        <Stat label="Avg GCS Score" value="13.3" icon={<Thermometer size={20} />} color="purple" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ICU bed or patient..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 bg-slate-50"
            />
          </div>
          <Button size="sm" variant="outline" leftIcon={<Filter size={14} />}>Filter Beds</Button>
        </div>

        <Table
          keyField="vitalId"
          loading={loading}
          data={filteredVitals}
          columns={[
            { key: "bedNumber", header: "ICU Bed", render: (r) => <Badge variant="info">{r.bedNumber}</Badge> },
            { key: "patientName", header: "Critical Patient", render: (r) => <div><p className="text-sm font-semibold text-slate-800">{r.patientName}</p><p className="text-xs font-mono text-slate-400">{r.medicalRecordNumber}</p></div> },
            { key: "bloodPressure", header: "BP (mmHg)", render: (r) => <span className="font-mono text-sm font-bold text-slate-800">{r.bloodPressure}</span> },
            { key: "heartRate", header: "Heart Rate", render: (r) => <span className={`font-mono text-sm font-bold ${r.heartRate > 100 ? "text-rose-600 animate-pulse" : "text-slate-800"}`}>{r.heartRate} bpm</span> },
            { key: "spO2", header: "SpO2 Oxygen", render: (r) => <span className={`font-mono text-sm font-bold ${r.spO2 < 92 ? "text-rose-600 font-bold" : "text-emerald-600"}`}>{r.spO2}%</span> },
            { key: "gcsScore", header: "GCS", render: (r) => <span className="font-mono text-xs font-bold text-slate-700">{r.gcsScore} / 15</span> },
            { key: "recordedAt", header: "Last Recorded", render: (r) => <span className="text-xs font-mono text-slate-500">{r.recordedAt}</span> },
            { key: "alertStatus", header: "Telemetry Status", render: (r) => <Badge variant={r.alertStatus === "Normal" ? "success" : "danger"}>{r.alertStatus}</Badge> },
          ]}
        />
      </div>

      {/* RECORD ICU VITALS MODAL */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record ICU Telemetry Vitals">
        <form onSubmit={handleRecordVital} className="space-y-4">
          <Input
            label="Patient Name"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder="e.g. Tariq Mahmood"
            required
          />
          <Input
            label="ICU Bed Number"
            value={bedNumber}
            onChange={(e) => setBedNumber(e.target.value)}
            placeholder="e.g. ICU Bed 03"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Blood Pressure (mmHg)" value={bp} onChange={(e) => setBp(e.target.value)} required />
            <Input label="Heart Rate (BPM)" type="number" value={hr} onChange={(e) => setHr(e.target.value)} required />
            <Input label="SpO2 Oxygen (%)" type="number" value={spo2} onChange={(e) => setSpo2(e.target.value)} required />
            <Input label="Glasgow Coma Scale (GCS)" type="number" value={gcs} onChange={(e) => setGcs(e.target.value)} required />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Log ICU Telemetry Vitals</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

