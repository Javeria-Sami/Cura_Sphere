import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { patientService } from "../../../services/patientService";
import { Lookup, PatientListDto, Guardian, Insurance } from "../../../types/patient";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { ArrowLeft, Save, AlertTriangle, Trash2, Plus } from "lucide-react";

export default function PatientRegistration() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  // Dropdown Lookups State
  const [bloodGroups, setBloodGroups] = useState<Lookup[]>([]);
  const [maritalStatuses, setMaritalStatuses] = useState<Lookup[]>([]);
  const [religions, setReligions] = useState<Lookup[]>([]);
  const [nationalities, setNationalities] = useState<Lookup[]>([]);

  // Core Form Fields
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("male");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [cnicPassport, setCnicPassport] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [alternatePhone, setAlternatePhone] = useState("");
  const [email, setEmail] = useState("");
  const [bloodGroupId, setBloodGroupId] = useState("");
  const [maritalStatusId, setMaritalStatusId] = useState("");
  const [nationalityId, setNationalityId] = useState("");
  const [religionId, setReligionId] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");

  // Emergency Contact Fields
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [emergencyRelationship, setEmergencyRelationship] = useState("");

  // List arrays
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [insurances, setInsurances] = useState<Insurance[]>([]);

  // Guardian Temporary Inputs
  const [tempGuardianName, setTempGuardianName] = useState("");
  const [tempGuardianRelation, setTempGuardianRelation] = useState("");
  const [tempGuardianPhone, setTempGuardianPhone] = useState("");
  const [tempGuardianEmail, setTempGuardianEmail] = useState("");
  const [tempGuardianAddress, setTempGuardianAddress] = useState("");

  // Insurance Temporary Inputs
  const tempProviderId = "1"; // 1 for Default provider
  const [tempPolicyNumber, setTempPolicyNumber] = useState("");
  const [tempMemberId, setTempMemberId] = useState("");
  const tempCoverageType = "Medical";
  const [tempValidFrom, setTempValidFrom] = useState("");
  const [tempValidTo, setTempValidTo] = useState("");
  const [tempPercentage, setTempPercentage] = useState(100);
  const [tempDeductible, setTempDeductible] = useState(0);

  // Verification & Status States
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  
  // Duplicate check warning state
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateMatches, setDuplicateMatches] = useState<PatientListDto[]>([]);

  // Load Dropdowns & Edit Profile
  useEffect(() => {
    const loadData = async () => {
      try {
        const [bg, ms, rel, nat] = await Promise.all([
          patientService.getBloodGroups(),
          patientService.getMaritalStatuses(),
          patientService.getReligions(),
          patientService.getNationalities()
        ]);
        setBloodGroups(bg);
        setMaritalStatuses(ms);
        setReligions(rel);
        setNationalities(nat);

        // Load details if editing
        if (isEditMode) {
          setLoading(true);
          const p = await patientService.getPatientById(Number(id));
          setFirstName(p.firstName);
          setMiddleName(p.middleName || "");
          setLastName(p.lastName);
          setGender(p.gender);
          setDateOfBirth(p.dateOfBirth ? p.dateOfBirth.split("T")[0] : "");
          setCnicPassport(p.cnicPassport || "");
          setPhoneNumber(p.phoneNumber);
          setAlternatePhone(p.alternatePhone || "");
          setEmail(p.email || "");
          setBloodGroupId(p.bloodGroupId ? String(p.bloodGroupId) : "");
          setMaritalStatusId(p.maritalStatusId ? String(p.maritalStatusId) : "");
          setNationalityId(p.nationalityId ? String(p.nationalityId) : "");
          setReligionId(p.religionId ? String(p.religionId) : "");
          setAddress(p.address);
          setCity(p.city);
          setProvince(p.province);
          setPostalCode(p.postalCode || "");
          setEmergencyContactName(p.emergencyContactName);
          setEmergencyContactPhone(p.emergencyContactPhone);
          setEmergencyRelationship(p.emergencyRelationship);
          setGuardians(p.guardians);
          setInsurances(p.insurances);
        }
      } catch (err) {
        setFormError("Error initializing registration lookups.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, isEditMode]);

  // Add temporary item handlers
  const addGuardian = () => {
    if (!tempGuardianName || !tempGuardianRelation || !tempGuardianPhone) {
      alert("Name, Relationship, and Phone Number are required for guardians.");
      return;
    }
    const newG: Guardian = {
      guardianName: tempGuardianName,
      relationship: tempGuardianRelation,
      phoneNumber: tempGuardianPhone,
      email: tempGuardianEmail || undefined,
      address: tempGuardianAddress || address // Defaults to patient address
    };
    setGuardians([...guardians, newG]);
    setTempGuardianName("");
    setTempGuardianRelation("");
    setTempGuardianPhone("");
    setTempGuardianEmail("");
    setTempGuardianAddress("");
  };

  const addInsurance = () => {
    if (!tempPolicyNumber || !tempMemberId || !tempValidFrom || !tempValidTo) {
      alert("Policy Number, Member ID, Valid From and Valid To dates are required.");
      return;
    }
    const newIns: Insurance = {
      insuranceProviderId: Number(tempProviderId),
      policyNumber: tempPolicyNumber,
      memberId: tempMemberId,
      coverageType: tempCoverageType,
      validFrom: tempValidFrom,
      validTo: tempValidTo,
      coveragePercentage: Number(tempPercentage),
      deductibleAmount: Number(tempDeductible)
    };
    setInsurances([...insurances, newIns]);
    setTempPolicyNumber("");
    setTempMemberId("");
    setTempValidFrom("");
    setTempValidTo("");
    setTempPercentage(100);
    setTempDeductible(0);
  };

  // Submit flow
  const handleSubmit = async (e: React.FormEvent, forceSave = false) => {
    e.preventDefault();
    setFormError("");

    // Validate fields
    if (!firstName || !lastName || !dateOfBirth || !phoneNumber || !address || !city || !province || !emergencyContactName || !emergencyContactPhone || !emergencyRelationship) {
      setFormError("Please fill in all required fields marked with an asterisk (*).");
      return;
    }

    // Validate length constraints to prevent database overflow exceptions
    if (firstName.length > 100) {
      setFormError("First Name cannot exceed 100 characters.");
      return;
    }
    if (middleName && middleName.length > 100) {
      setFormError("Middle Name cannot exceed 100 characters.");
      return;
    }
    if (lastName.length > 100) {
      setFormError("Last Name cannot exceed 100 characters.");
      return;
    }
    if (cnicPassport && cnicPassport.length > 20) {
      setFormError("CNIC / Passport Number cannot exceed 20 characters.");
      return;
    }
    if (phoneNumber.length > 20) {
      setFormError("Primary Phone Number cannot exceed 20 characters.");
      return;
    }
    if (alternatePhone && alternatePhone.length > 20) {
      setFormError("Alternate Phone Number cannot exceed 20 characters.");
      return;
    }
    if (email && email.length > 150) {
      setFormError("Email Address cannot exceed 150 characters.");
      return;
    }
    if (emergencyContactName.length > 150) {
      setFormError("Emergency Contact Name cannot exceed 150 characters.");
      return;
    }
    if (emergencyContactPhone.length > 20) {
      setFormError("Emergency Contact Phone Number cannot exceed 20 characters.");
      return;
    }
    if (emergencyRelationship.length > 50) {
      setFormError("Emergency Relationship description cannot exceed 50 characters.");
      return;
    }

    setLoading(true);
    try {
      // 1. Run Duplicate Verification check on creation (if not forced already)
      if (!isEditMode && !forceSave) {
        const dupResponse = await patientService.checkDuplicate({
          firstName,
          lastName,
          dateOfBirth,
          cnicPassport: cnicPassport || undefined
        });

        if (dupResponse.isPotentialDuplicate) {
          setDuplicateMatches(dupResponse.matches);
          setShowDuplicateModal(true);
          setLoading(false);
          return;
        }
      }

      // 2. Prepare payload
      const payload = {
        firstName,
        middleName: middleName || undefined,
        lastName,
        gender,
        dateOfBirth,
        cnicPassport: cnicPassport || undefined,
        phoneNumber,
        alternatePhone: alternatePhone || undefined,
        email: email || undefined,
        bloodGroupId: bloodGroupId ? Number(bloodGroupId) : undefined,
        maritalStatusId: maritalStatusId ? Number(maritalStatusId) : undefined,
        nationalityId: nationalityId ? Number(nationalityId) : undefined,
        religionId: religionId ? Number(religionId) : undefined,
        address,
        city,
        province,
        postalCode: postalCode || undefined,
        emergencyContactName,
        emergencyContactPhone,
        emergencyRelationship,
        patientStatus: "Active",
        guardians,
        insurances
      };

      let savedPatient;
      if (isEditMode) {
        savedPatient = await patientService.updatePatient(Number(id), payload);
      } else {
        savedPatient = await patientService.registerPatient(payload);
      }

      // Route to profile page
      navigate(`/patients/${savedPatient.patientId}`);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to save patient record. Please check fields and try again.";
      setFormError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8 animate-fade-in font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Back navigation */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/patients")}
            className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Registry List
          </button>
        </div>

        {/* Title */}
        <div className="border-b border-slate-200/60 pb-4">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {isEditMode ? "Modify Patient Profile" : "Register Patient"}
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Complete demographic information, address records, emergency contacts, and insurances.
          </p>
        </div>

        {/* Error notification */}
        {formError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium shadow-sm">
            {formError}
          </div>
        )}

        <form onSubmit={(e) => handleSubmit(e)} className="space-y-6">
          
          {/* Section 1: Demographics */}
          <Card variant="default" className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">1. Demographic Info</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="First Name"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First Name"
                maxLength={100}
              />

              <Input
                label="Middle Name"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                placeholder="Middle Name"
                maxLength={100}
              />

              <Input
                label="Last Name"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last Name"
                maxLength={100}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-xs font-semibold text-slate-700">Gender *</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full text-sm px-4 py-2.5 rounded-lg border border-slate-300 bg-surface transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 text-slate-800"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <Input
                label="Date of Birth"
                type="date"
                required
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />

              <Input
                label="CNIC / Passport Number"
                value={cnicPassport}
                onChange={(e) => setCnicPassport(e.target.value)}
                placeholder="CNIC or Passport"
                maxLength={20}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-xs font-semibold text-slate-700">Blood Group</label>
                <select
                  value={bloodGroupId}
                  onChange={(e) => setBloodGroupId(e.target.value)}
                  className="w-full text-sm px-4 py-2.5 rounded-lg border border-slate-300 bg-surface transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 text-slate-800"
                >
                  <option value="">Select Blood Group</option>
                  {bloodGroups.map((x) => (
                    <option key={x.id} value={x.id}>{x.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-xs font-semibold text-slate-700">Marital Status</label>
                <select
                  value={maritalStatusId}
                  onChange={(e) => setMaritalStatusId(e.target.value)}
                  className="w-full text-sm px-4 py-2.5 rounded-lg border border-slate-300 bg-surface transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 text-slate-800"
                >
                  <option value="">Select Status</option>
                  {maritalStatuses.map((x) => (
                    <option key={x.id} value={x.id}>{x.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-xs font-semibold text-slate-700">Religion</label>
                <select
                  value={religionId}
                  onChange={(e) => setReligionId(e.target.value)}
                  className="w-full text-sm px-4 py-2.5 rounded-lg border border-slate-300 bg-surface transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 text-slate-800"
                >
                  <option value="">Select Religion</option>
                  {religions.map((x) => (
                    <option key={x.id} value={x.id}>{x.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-xs font-semibold text-slate-700">Nationality</label>
                <select
                  value={nationalityId}
                  onChange={(e) => setNationalityId(e.target.value)}
                  className="w-full text-sm px-4 py-2.5 rounded-lg border border-slate-300 bg-surface transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 text-slate-800"
                >
                  <option value="">Select Country</option>
                  {nationalities.map((x) => (
                    <option key={x.id} value={x.id}>{x.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Section 2: Contact Details */}
          <Card variant="default" className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">2. Contact Info</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Primary Phone"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Primary Phone Number"
                maxLength={20}
              />

              <Input
                label="Alternate Phone"
                value={alternatePhone}
                onChange={(e) => setAlternatePhone(e.target.value)}
                placeholder="Alternate Phone Number"
                maxLength={20}
              />

              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@email.com"
                maxLength={150}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="Address"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street address details"
                />
              </div>

              <Input
                label="City"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
              />

              <Input
                label="Province"
                required
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                placeholder="State/Province"
              />
            </div>
          </Card>

          {/* Section 3: Emergency Contact */}
          <Card variant="default" className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">3. Emergency Contact</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Contact Name"
                required
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
                placeholder="Contact Name"
                maxLength={150}
              />

              <Input
                label="Phone Number"
                required
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                placeholder="Emergency Contact Phone"
                maxLength={20}
              />

              <Input
                label="Relationship"
                required
                value={emergencyRelationship}
                onChange={(e) => setEmergencyRelationship(e.target.value)}
                placeholder="Relationship (e.g., Spouse, Parent)"
                maxLength={50}
              />
            </div>
          </Card>

          {/* Section 4: Guardians */}
          <Card variant="default" className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">4. Guardians (Optional)</h3>
            
            {guardians.length > 0 && (
              <div className="border border-slate-200/60 rounded-xl overflow-hidden mb-4">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50">
                    <tr className="font-semibold text-slate-500 border-b border-slate-100">
                      <th className="p-3 pl-4">Name</th>
                      <th className="p-3">Relation</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3 text-center pr-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {guardians.map((g, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-3 pl-4 font-semibold">{g.guardianName}</td>
                        <td className="p-3">{g.relationship}</td>
                        <td className="p-3 font-mono">{g.phoneNumber}</td>
                        <td className="p-3 text-center pr-4">
                          <button
                            type="button"
                            onClick={() => setGuardians(guardians.filter((_, i) => i !== idx))}
                            className="p-1 hover:bg-slate-100 rounded text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100/50 pt-4">
              <Input
                label="Guardian Name"
                value={tempGuardianName}
                onChange={(e) => setTempGuardianName(e.target.value)}
                placeholder="Guardian Name"
              />

              <Input
                label="Relationship"
                value={tempGuardianRelation}
                onChange={(e) => setTempGuardianRelation(e.target.value)}
                placeholder="Relationship"
              />

              <Input
                label="Phone"
                value={tempGuardianPhone}
                onChange={(e) => setTempGuardianPhone(e.target.value)}
                placeholder="Phone"
              />
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={addGuardian}
            >
              Add Guardian
            </Button>
          </Card>

          {/* Section 5: Insurance */}
          <Card variant="default" className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">5. Insurance (Optional)</h3>
            
            {insurances.length > 0 && (
              <div className="border border-slate-200/60 rounded-xl overflow-hidden mb-4">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50">
                    <tr className="font-semibold text-slate-500 border-b border-slate-100">
                      <th className="p-3 pl-4">Policy Number</th>
                      <th className="p-3">Member ID</th>
                      <th className="p-3">Coverage Type</th>
                      <th className="p-3 text-center pr-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {insurances.map((ins, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-3 pl-4 font-semibold font-mono">{ins.policyNumber}</td>
                        <td className="p-3 font-mono">{ins.memberId}</td>
                        <td className="p-3">{ins.coverageType}</td>
                        <td className="p-3 text-center pr-4">
                          <button
                            type="button"
                            onClick={() => setInsurances(insurances.filter((_, i) => i !== idx))}
                            className="p-1 hover:bg-slate-100 rounded text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-t border-slate-100/50 pt-4">
              <Input
                label="Policy Number"
                value={tempPolicyNumber}
                onChange={(e) => setTempPolicyNumber(e.target.value)}
                placeholder="Policy Number"
              />

              <Input
                label="Member ID"
                value={tempMemberId}
                onChange={(e) => setTempMemberId(e.target.value)}
                placeholder="Member ID"
              />

              <Input
                label="Valid From"
                type="date"
                value={tempValidFrom}
                onChange={(e) => setTempValidFrom(e.target.value)}
              />

              <Input
                label="Valid To"
                type="date"
                value={tempValidTo}
                onChange={(e) => setTempValidTo(e.target.value)}
              />
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={addInsurance}
            >
              Add Policy
            </Button>
          </Card>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pb-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/patients")}
            >
              Cancel
            </Button>
            
            <Button
              type="submit"
              variant="primary"
              isLoading={loading}
              leftIcon={<Save className="w-4 h-4" />}
            >
              {isEditMode ? "Save Changes" : "Register Patient"}
            </Button>
          </div>

        </form>

        {/* Duplicate Warning Dialog Modal */}
        {showDuplicateModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-slide-up">
              <div className="flex items-center gap-3 text-amber-600">
                <div className="p-2 bg-amber-50 rounded-xl">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Potential Duplicate Record!</h3>
                  <p className="text-xs text-slate-500 font-medium">Matching profiles were detected in the database.</p>
                </div>
              </div>

              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <div className="p-3 bg-slate-50 text-xs font-semibold text-slate-500 border-b border-slate-100">
                  Existing Matches:
                </div>
                <div className="divide-y divide-slate-100 text-xs text-slate-700 max-h-48 overflow-y-auto">
                  {duplicateMatches.map((match) => (
                    <div key={match.patientId} className="p-3 flex items-center justify-between hover:bg-slate-50/50">
                      <div>
                        <div className="font-bold text-slate-900">{`${match.firstName} ${match.lastName}`}</div>
                        <div className="text-slate-400 font-semibold mt-0.5 font-mono">{match.medicalRecordNumber}</div>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/patients/${match.patientId}`)}
                      >
                        View Profile
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDuplicateModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 focus:ring-amber-500 border-amber-600 text-white"
                  onClick={(e) => {
                    setShowDuplicateModal(false);
                    handleSubmit(e, true); // Force submit
                  }}
                >
                  Proceed with New Registration
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
