import React, { useState } from "react";
import { Upload, FileText, Download, ShieldCheck, Eye } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { Table, Column } from "../../../components/ui/Table";
import { Modal } from "../../../components/ui/Modal";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import PageHeader from "../../../components/layout/PageHeader";

export interface PatientDocumentItem {
  documentId: number;
  documentNumber: string;
  patientId: number;
  patientName: string;
  category: string;
  title: string;
  fileSizeBytes: number;
  uploadedBy: string;
  uploadedAt: string;
  digitalSignatureHash: string;
  status: string;
}

const sampleDocuments: PatientDocumentItem[] = [
  {
    documentId: 1,
    documentNumber: "DOC-20260824-A101",
    patientId: 101,
    patientName: "Muhammad Ali",
    category: "Radiology Image (DICOM)",
    title: "Chest X-Ray DICOM Scan",
    fileSizeBytes: 1450000,
    uploadedBy: "Dr. Adeel Khan",
    uploadedAt: "2026-08-24 10:15 AM",
    digitalSignatureHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    status: "Active"
  },
  {
    documentId: 2,
    documentNumber: "DOC-20260824-B102",
    patientId: 102,
    patientName: "Ayesha Khan",
    category: "Lab Report",
    title: "Complete Blood Count (CBC) Panel",
    fileSizeBytes: 245000,
    uploadedBy: "Lab Technician",
    uploadedAt: "2026-08-24 10:45 AM",
    digitalSignatureHash: "a94a8fe5ccb19ba61c4c0873d391e987982fbbd3",
    status: "Active"
  }
];

export default function DocumentManagementPage() {
  const [documents, setDocuments] = useState<PatientDocumentItem[]>(sampleDocuments);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Form states
  const [patientId, setPatientId] = useState("101");
  const [category, setCategory] = useState("Lab Report");
  const [title, setTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newDoc: PatientDocumentItem = {
      documentId: Date.now(),
      documentNumber: `DOC-20260824-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId: Number(patientId),
      patientName: patientId === "101" ? "Muhammad Ali" : "Ayesha Khan",
      category,
      title: title || (selectedFile ? selectedFile.name : "Uploaded Medical Document"),
      fileSizeBytes: selectedFile ? selectedFile.size : 256000,
      uploadedBy: "Current User",
      uploadedAt: new Date().toLocaleString(),
      digitalSignatureHash: Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(""),
      status: "Active"
    };

    setDocuments([newDoc, ...documents]);
    setIsUploadModalOpen(false);
    setTitle("");
    setSelectedFile(null);
  };

  const columns: Column<PatientDocumentItem>[] = [
    { key: "documentNumber", header: "Doc #" },
    {
      key: "patientName",
      header: "Patient",
      render: (row) => (
        <div>
          <div className="font-medium text-slate-900">{row.patientName}</div>
          <div className="text-xs text-slate-500">ID: #{row.patientId}</div>
        </div>
      )
    },
    {
      key: "title",
      header: "Category & Title",
      render: (row) => (
        <div>
          <div className="font-semibold text-blue-700 flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            {row.title}
          </div>
          <div className="text-xs text-slate-500 font-mono mt-0.5">{row.category}</div>
        </div>
      )
    },
    {
      key: "fileSizeBytes",
      header: "Size",
      render: (row) => <span className="font-mono text-xs text-slate-600">{formatFileSize(row.fileSizeBytes)}</span>
    },
    {
      key: "uploadedBy",
      header: "Uploaded By",
      render: (row) => (
        <div>
          <div>{row.uploadedBy}</div>
          <div className="text-xs text-slate-400">{row.uploadedAt}</div>
        </div>
      )
    },
    {
      key: "digitalSignatureHash",
      header: "Digital Signature",
      render: (row) => (
        <Badge variant="success" className="font-mono text-[10px] flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" />
          {row.digitalSignatureHash.substring(0, 10)}...
        </Badge>
      )
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <Badge variant="success">{row.status}</Badge>
    },
    {
      key: "actions",
      header: "Actions",
      render: () => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-600">
            <Eye className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-600">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Document Management System (DMS)"
        subtitle="Secure patient attachments, DICOM radiology imaging, and digitally signed medical records"
        actions={
          <Button variant="primary" onClick={() => setIsUploadModalOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Upload Document
          </Button>
        }
      />

      <Table<PatientDocumentItem>
        columns={columns}
        data={documents}
        keyField="documentId"
      />

      <Modal
        open={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Patient Medical Attachment"
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <Select
            label="Patient"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            options={[
              { value: "101", label: "Muhammad Ali (MRN-00521)" },
              { value: "102", label: "Ayesha Khan (MRN-00498)" }
            ]}
          />

          <Select
            label="Document Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={[
              { value: "Lab Report", label: "Lab Diagnostic Report" },
              { value: "Radiology Image (DICOM)", label: "Radiology Image (DICOM Scan)" },
              { value: "Consent Form", label: "Signed Patient Consent Form" },
              { value: "Discharge Summary", label: "Hospital Discharge Summary" },
              { value: "ID Verification", label: "Government ID / CNIC Copy" }
            ]}
          />

          <Input
            label="Document Title"
            placeholder="e.g. Chest CT Scan / Full Blood Panel"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Select File</label>
            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={() => setIsUploadModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Upload & Generate Signature
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
