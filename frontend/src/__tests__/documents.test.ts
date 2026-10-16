import { describe, it, expect } from 'vitest';

export interface DocumentMetaData {
  documentId: number;
  documentCategory: string;
  fileSizeBytes: number;
  mimeType: string;
  digitalSignatureHash?: string;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isValidDocumentExtension(filename: string): boolean {
  const allowed = ['.pdf', '.dcm', '.jpg', '.jpeg', '.png', '.docx'];
  const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
  return allowed.includes(ext);
}

describe('Document Management Unit Tests', () => {
  it('should format file sizes in KB and MB correctly', () => {
    expect(formatFileSize(500)).toBe('500 B');
    expect(formatFileSize(256000)).toBe('250.0 KB');
    expect(formatFileSize(5242880)).toBe('5.0 MB');
  });

  it('should validate allowed medical attachment extensions', () => {
    expect(isValidDocumentExtension('scan.dcm')).toBe(true);
    expect(isValidDocumentExtension('report.pdf')).toBe(true);
    expect(isValidDocumentExtension('malware.exe')).toBe(false);
  });
});
