export interface Lookup {
  id: number;
  name: string;
}

export interface PatientListDto {
  patientId: number;
  medicalRecordNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  age: number;
  phoneNumber: string;
  patientStatus: string;
}

export interface Guardian {
  guardianId?: number;
  guardianName: string;
  relationship: string;
  phoneNumber: string;
  email?: string;
  address: string;
}

export interface Insurance {
  patientInsuranceId?: number;
  insuranceProviderId: number;
  policyNumber: string;
  memberId: string;
  coverageType: string;
  validFrom: string;
  validTo: string;
  coveragePercentage: number;
  deductibleAmount: number;
  status?: string;
}

export interface PatientDetailDto {
  patientId: number;
  medicalRecordNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  age?: number;
  cnicPassport?: string;
  phoneNumber: string;
  alternatePhone?: string;
  email?: string;
  
  bloodGroupId?: number;
  bloodGroupName?: string;
  maritalStatusId?: number;
  maritalStatusName?: string;
  nationalityId?: number;
  countryName?: string;
  religionId?: number;
  religionName?: string;
  
  address: string;
  city: string;
  province: string;
  postalCode?: string;
  
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyRelationship: string;
  
  patientPhoto?: string;
  registrationDate: string;
  patientStatus: string;
  
  guardians: Guardian[];
  insurances: Insurance[];
}

export interface RegisterPatientDto {
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  cnicPassport?: string;
  phoneNumber: string;
  alternatePhone?: string;
  email?: string;
  
  bloodGroupId?: number;
  maritalStatusId?: number;
  nationalityId?: number;
  religionId?: number;
  
  address: string;
  city: string;
  province: string;
  postalCode?: string;
  
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyRelationship: string;
  
  patientPhoto?: string;
  patientStatus: string;
  
  guardians: Guardian[];
  insurances: Insurance[];
}

export interface DuplicateCheckRequest {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  cnicPassport?: string;
}

export interface DuplicateCheckResponse {
  isPotentialDuplicate: boolean;
  matches: PatientListDto[];
}

export interface PagedResultDto<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}
