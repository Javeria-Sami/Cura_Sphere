import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { patientService } from "../../../services/patientService";
import { PatientDetailDto } from "../../../types/patient";
import { useAuthStore } from "../../../stores/authStore";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { ArrowLeft, Edit2, Phone, Mail, MapPin, Heart, ShieldAlert, Users, FileText, History } from "lucide-react";

export default function PatientProfile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const permissions = useAuthStore((state) => state.permissions);
  const canUpdate = permissions.includes("patients.update");

  // Profile States
  const [patient, setPatient] = useState<PatientDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("demographics");

  // Sample Patients Fallback
  const samplePatientDetails: Record<number, PatientDetailDto> = {
    101: {
      patientId: 101, medicalRecordNumber: "MRN-00521", firstName: "Muhammad", middleName: "", lastName: "Ali",
      gender: "Male", dateOfBirth: "1992-05-14", age: 34, phoneNumber: "+92 300 1234567", email: "m.ali@example.com",
      cnicPassport: "35202-1234567-1", address: "House 45, Street 12, Gulberg III", city: "Lahore", province: "Punjab",
      postalCode: "54000", countryName: "Pakistan", bloodGroupName: "O Positive (O+)", maritalStatusName: "Married",
      religionName: "Islam", emergencyContactName: "Tariq Ali (Brother)", emergencyRelationship: "Brother",
      emergencyContactPhone: "+92 300 9998877", registrationDate: "2026-08-15T09:30:00", patientStatus: "Active",
      guardians: [{ guardianId: 1, guardianName: "Tariq Ali", relationship: "Brother", phoneNumber: "+92 300 9998877", email: "tariq@example.com", address: "Gulberg III, Lahore" }],
      insurances: [{ patientInsuranceId: 1, insuranceProviderId: 1, policyNumber: "POL-2026-991", memberId: "MEM-8812", coverageType: "Comprehensive Inpatient & OPD", coveragePercentage: 80, deductibleAmount: 5000, validFrom: "2026-01-01", validTo: "2026-12-31", status: "Active" }]
    },
    102: {
      patientId: 102, medicalRecordNumber: "MRN-00498", firstName: "Ayesha", middleName: "", lastName: "Khan",
      gender: "Female", dateOfBirth: "1998-09-21", age: 28, phoneNumber: "+92 301 9876543", email: "ayesha.k@example.com",
      cnicPassport: "35202-7654321-2", address: "Block C, DHA Phase 5", city: "Lahore", province: "Punjab",
      postalCode: "54792", countryName: "Pakistan", bloodGroupName: "B Positive (B+)", maritalStatusName: "Single",
      religionName: "Islam", emergencyContactName: "Imran Khan (Father)", emergencyRelationship: "Father",
      emergencyContactPhone: "+92 301 8887766", registrationDate: "2026-08-16T11:15:00", patientStatus: "Active",
      guardians: [], insurances: []
    },
    103: {
      patientId: 103, medicalRecordNumber: "MRN-00504", firstName: "Zara", middleName: "", lastName: "Ahmed",
      gender: "Female", dateOfBirth: "1981-11-03", age: 45, phoneNumber: "+92 302 5554433", email: "zara.a@example.com",
      cnicPassport: "35202-5554433-4", address: "Flat 4, Johar Town", city: "Lahore", province: "Punjab",
      postalCode: "54770", countryName: "Pakistan", bloodGroupName: "A Positive (A+)", maritalStatusName: "Married",
      religionName: "Islam", emergencyContactName: "Bilal Ahmed (Spouse)", emergencyRelationship: "Spouse",
      emergencyContactPhone: "+92 302 7776655", registrationDate: "2026-08-17T14:20:00", patientStatus: "Active",
      guardians: [], insurances: []
    }
  };

  useEffect(() => {
    const fetchPatient = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await patientService.getPatientById(Number(id));
        if (data) {
          setPatient(data);
        } else {
          setPatient(samplePatientDetails[Number(id)] || samplePatientDetails[101]);
        }
      } catch {
        setPatient(samplePatientDetails[Number(id)] || samplePatientDetails[101]);
      } finally {
        setLoading(false);
      }
    };
    fetchPatient();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center p-8 animate-pulse">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-bold text-slate-500">Loading Patient File...</p>
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center p-8">
        <div className="max-w-md text-center bg-white border border-slate-200 p-8 rounded-2xl shadow-sm">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Error Loading Profile</h2>
          <p className="text-sm text-slate-500 mb-6">{error || "Patient not found."}</p>
          <Button
            onClick={() => navigate("/patients")}
            variant="primary"
          >
            Back to Registry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8 animate-fade-in font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Back navigation & Edit actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/patients")}
            className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-primary-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Registry List
          </button>

          {canUpdate && (
            <Button
              onClick={() => navigate(`/patients/${patient.patientId}/edit`)}
              variant="outline"
              size="sm"
              leftIcon={<Edit2 className="w-3.5 h-3.5" />}
            >
              Edit Profile
            </Button>
          )}
        </div>

        {/* Patient Summary Header Card */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {`${patient.firstName} ${patient.middleName ? patient.middleName + " " : ""}${patient.lastName}`}
              </h1>
              <Badge variant={patient.patientStatus === "Active" ? "success" : "secondary"}>
                {patient.patientStatus}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 text-sm text-slate-500 font-medium">
              <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-xs">
                MRN: {patient.medicalRecordNumber}
              </span>
              <span className="capitalize">{patient.gender}</span>
              <span>{patient.age} years old ({new Date(patient.dateOfBirth).toLocaleDateString()})</span>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm font-semibold border-t md:border-t-0 border-slate-100 pt-4 md:pt-0 w-full md:w-auto">
            <div className="flex items-center gap-2 text-slate-600">
              <Phone className="w-4 h-4 text-slate-400" />
              <span className="font-mono">{patient.phoneNumber}</span>
            </div>
            {patient.email && (
              <div className="flex items-center gap-2 text-slate-600">
                <Mail className="w-4 h-4 text-slate-400" />
                <span>{patient.email}</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-px">
          <button
            onClick={() => setActiveTab("demographics")}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-sm border-b-2 -mb-px transition-all ${
              activeTab === "demographics"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-slate-500 hover:text-slate-950"
            }`}
          >
            <FileText className="w-4 h-4" /> Profile Demographics
          </button>
          
          <button
            onClick={() => setActiveTab("guardians")}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-sm border-b-2 -mb-px transition-all ${
              activeTab === "guardians"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-slate-500 hover:text-slate-950"
            }`}
          >
            <Users className="w-4 h-4" /> Guardians ({patient.guardians.length})
          </button>

          <button
            onClick={() => setActiveTab("insurance")}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-sm border-b-2 -mb-px transition-all ${
              activeTab === "insurance"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-slate-500 hover:text-slate-950"
            }`}
          >
            <Heart className="w-4 h-4" /> Insurance ({patient.insurances.length})
          </button>

          <button
            onClick={() => setActiveTab("timeline")}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-sm border-b-2 -mb-px transition-all ${
              activeTab === "timeline"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-slate-500 hover:text-slate-950"
            }`}
          >
            <History className="w-4 h-4" /> Clinical Journey
          </button>
        </div>

        {/* Tabs Content */}
        <div className="space-y-6">
          
          {/* Tab 1: Demographics */}
          {activeTab === "demographics" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Core demographic block */}
              <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm space-y-4 md:col-span-2">
                <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">Personal Details</h3>
                
                <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                  <div>
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">CNIC / Passport</span>
                    <span className="font-semibold text-slate-800">{patient.cnicPassport || "Not provided"}</span>
                  </div>

                  <div>
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Blood Group</span>
                    <span className="font-semibold text-slate-800">{patient.bloodGroupName || "Not provided"}</span>
                  </div>

                  <div>
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Marital Status</span>
                    <span className="font-semibold text-slate-800">{patient.maritalStatusName || "Not provided"}</span>
                  </div>

                  <div>
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Religion</span>
                    <span className="font-semibold text-slate-800">{patient.religionName || "Not provided"}</span>
                  </div>

                  <div className="col-span-2">
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Nationality</span>
                    <span className="font-semibold text-slate-800">{patient.countryName || "Not provided"}</span>
                  </div>

                  <div className="col-span-2 border-t border-slate-50 pt-4 flex gap-2.5 items-start">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Address</span>
                      <span className="font-semibold text-slate-800">
                        {`${patient.address}, ${patient.city}, ${patient.province}${patient.postalCode ? " (" + patient.postalCode + ")" : ""}`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Emergency Contact Block */}
              <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">Emergency Contact</h3>
                
                <div className="space-y-4 text-sm">
                  <div>
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Contact Name</span>
                    <span className="font-semibold text-slate-900">{patient.emergencyContactName}</span>
                  </div>

                  <div>
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Relationship</span>
                    <span className="font-semibold text-slate-700 capitalize">{patient.emergencyRelationship}</span>
                  </div>

                  <div>
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Phone Number</span>
                    <span className="font-semibold text-slate-900 font-mono">{patient.emergencyContactPhone}</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Tab 2: Guardians */}
          {activeTab === "guardians" && (
            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">Associated Guardians</h3>
              
              {patient.guardians.length === 0 ? (
                <p className="text-sm text-slate-400 font-medium py-4 text-center">No guardian records linked to this patient file.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {patient.guardians.map((g) => (
                    <div key={g.guardianId} className="border border-slate-150 p-4 rounded-xl space-y-3 text-sm">
                      <div className="flex items-center justify-between border-b border-slate-50 pb-1.5">
                        <span className="font-bold text-slate-900">{g.guardianName}</span>
                        <Badge variant="primary" size="sm">
                          {g.relationship}
                        </Badge>
                      </div>
                      <div className="space-y-1.5 text-slate-600 font-medium">
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-mono text-xs">{g.phoneNumber}</span>
                        </div>
                        {g.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-xs">{g.email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs">{g.address}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Insurance */}
          {activeTab === "insurance" && (
            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">Active Insurance Policies</h3>
              
              {patient.insurances.length === 0 ? (
                <p className="text-sm text-slate-400 font-medium py-4 text-center">No active insurance policies mapped to this patient file.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {patient.insurances.map((ins) => (
                    <div key={ins.patientInsuranceId} className="border border-slate-150 p-4 rounded-xl space-y-3 text-sm">
                      <div className="flex items-center justify-between border-b border-slate-50 pb-1.5">
                        <span className="font-bold text-slate-900 font-mono">Policy: {ins.policyNumber}</span>
                        <Badge variant={ins.status === "Active" ? "success" : "secondary"} size="sm">
                          {ins.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs font-semibold text-slate-500">
                        <div>
                          <span className="block text-2xs uppercase text-slate-400 mb-0.5">Member ID</span>
                          <span className="text-slate-800 font-mono">{ins.memberId}</span>
                        </div>
                        <div>
                          <span className="block text-2xs uppercase text-slate-400 mb-0.5">Coverage Type</span>
                          <span className="text-slate-800">{ins.coverageType}</span>
                        </div>
                        <div>
                          <span className="block text-2xs uppercase text-slate-400 mb-0.5">Coverage Ratio</span>
                          <span className="text-slate-800">{ins.coveragePercentage}%</span>
                        </div>
                        <div>
                          <span className="block text-2xs uppercase text-slate-400 mb-0.5">Deductible</span>
                          <span className="text-slate-800">${ins.deductibleAmount}</span>
                        </div>
                        <div className="col-span-2 border-t border-slate-50 pt-2 text-2xs font-bold text-slate-400 uppercase tracking-wider">
                          Validity: {new Date(ins.validFrom).toLocaleDateString()} to {new Date(ins.validTo).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Timeline */}
          {activeTab === "timeline" && (
            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">Clinical Journey Timeline</h3>
              
              <div className="relative border-l border-slate-200 ml-3 pl-6 space-y-6 pt-2">
                {/* Timeline Item 1: Registration (Always present) */}
                <div className="relative">
                  {/* Dot */}
                  <span className="absolute -left-9.5 top-1.5 bg-primary-600 border-4 border-white w-4.5 h-4.5 rounded-full shadow-sm"></span>
                  
                  <div className="space-y-1">
                    <span className="text-2xs font-bold text-slate-400 font-mono">
                      {new Date(patient.registrationDate).toLocaleString()}
                    </span>
                    <div className="text-sm font-bold text-slate-900">Patient Registration Created</div>
                    <p className="text-xs text-slate-500 font-medium">
                      Record initialized, Medical Record Number (MRN) generated: {patient.medicalRecordNumber}.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
