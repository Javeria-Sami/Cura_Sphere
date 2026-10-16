import { describe, it, expect } from 'vitest';

// Patient Data Validation Helpers
export function validateMRN(mrn: string): boolean {
  return /^MRN-\d{4}-\d{5}$/.test(mrn);
}

export function calculatePatientAge(dob: string): number {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(amount);
}

describe('Patient Domain Logic Unit Tests', () => {
  it('should validate medical record number (MRN) format correctly', () => {
    expect(validateMRN('MRN-2026-00101')).toBe(true);
    expect(validateMRN('INVALID-MRN')).toBe(false);
  });

  it('should compute patient age accurately from date of birth', () => {
    const age = calculatePatientAge('1995-05-15');
    expect(age).toBeGreaterThanOrEqual(30);
  });

  it('should format PKR currency totals correctly', () => {
    const formatted = formatCurrency(15000);
    expect(formatted).toContain('15,000');
  });
});
