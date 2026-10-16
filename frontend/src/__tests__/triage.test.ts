import { describe, it, expect } from 'vitest';

export type TriageLevel = 'P1' | 'P2' | 'P3';

export function calculateTriageCategory(vitals: {
  spo2: number;
  bpSystolic: number;
  gcs: number;
}): { level: TriageLevel; label: string } {
  if (vitals.spo2 < 90 || vitals.bpSystolic < 80 || vitals.gcs <= 8) {
    return { level: 'P1', label: 'P1 - Resuscitation / Critical' };
  }
  if (vitals.spo2 < 95 || vitals.bpSystolic < 90 || vitals.gcs <= 12) {
    return { level: 'P2', label: 'P2 - Emergent / Urgent' };
  }
  return { level: 'P3', label: 'P3 - Non-Urgent / Standard' };
}

describe('Emergency Triage Priority Unit Tests', () => {
  it('should categorize patient with SpO2 < 90 as P1 Critical', () => {
    const result = calculateTriageCategory({ spo2: 85, bpSystolic: 120, gcs: 15 });
    expect(result.level).toBe('P1');
    expect(result.label).toContain('Critical');
  });

  it('should categorize patient with low GCS <= 8 as P1 Critical', () => {
    const result = calculateTriageCategory({ spo2: 98, bpSystolic: 110, gcs: 7 });
    expect(result.level).toBe('P1');
  });

  it('should categorize stable vital signs as P3 Standard', () => {
    const result = calculateTriageCategory({ spo2: 98, bpSystolic: 120, gcs: 15 });
    expect(result.level).toBe('P3');
  });
});
