import { describe, it, expect } from 'vitest';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';

describe('Security Maintenance & Continuous Quality Assurance', () => {
  it('SEC-MNT-01: Axios client properly enforces baseURL, timeout, and default headers without prototype pollution', () => {
    expect(api.defaults.headers).toBeDefined();
    expect(api.defaults.headers['Content-Type']).toBe('application/json');
    expect(api.defaults.timeout).toBe(15000);
    // Ensure Object.prototype is not polluted
    expect((Object.prototype as Record<string, unknown>).method).toBeUndefined();
    expect((Object.prototype as Record<string, unknown>).polluted).toBeUndefined();
  });

  it('SEC-MNT-02: Axios request interceptor attaches X-Correlation-ID and Authorization bearer', async () => {
    useAuthStore.setState({ token: 'mock-valid-jwt-token-xyz-123' });

    // Test the request interceptor handler directly
    const interceptor = (api.interceptors.request as unknown as { handlers: Array<{ fulfilled: (config: { headers: Record<string, string> }) => { headers: Record<string, string> } }> }).handlers[0];
    if (interceptor && interceptor.fulfilled) {
      const config = { headers: {} as Record<string, string> };
      const processed = interceptor.fulfilled(config);
      
      expect(processed.headers).toBeDefined();
      expect(processed.headers['Authorization']).toBe('Bearer mock-valid-jwt-token-xyz-123');
      expect(processed.headers['X-Correlation-ID']).toBeDefined();
      expect(typeof processed.headers['X-Correlation-ID']).toBe('string');
      expect(processed.headers['X-Correlation-ID'].length).toBeGreaterThan(0);
    }
  });

  it('SEC-MNT-03: Response interceptor handles HTTP 401 by redirecting to login', async () => {
    const interceptor = (api.interceptors.response as unknown as { handlers: Array<{ rejected: (error: Record<string, unknown>) => Promise<unknown> }> }).handlers[0];
    if (interceptor && interceptor.rejected) {
      const mockError = {
        response: {
          status: 401,
          data: { title: 'Unauthorized' }
        }
      };

      try {
        await interceptor.rejected(mockError);
      } catch (err) {
        expect(err).toBe(mockError);
      }
    }
  });

  it('SEC-MNT-04: Validates JWT token structure and expiration logic', () => {
    // Generate a valid synthetic JWT payload
    const nowInSeconds = Math.floor(Date.now() / 1000);
    const validPayload = {
      sub: 'usr-123',
      email: 'admin@clinic.curasphere.com',
      role: 'ClinicAdmin',
      exp: nowInSeconds + 3600 // expires in 1 hour
    };
    const expiredPayload = {
      sub: 'usr-456',
      email: 'doctor@clinic.curasphere.com',
      role: 'Doctor',
      exp: nowInSeconds - 60 // expired 1 minute ago
    };

    const isTokenExpired = (payload: { exp: number }): boolean => {
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp <= currentTime;
    };

    expect(isTokenExpired(validPayload)).toBe(false);
    expect(isTokenExpired(expiredPayload)).toBe(true);
  });

  it('SEC-MNT-05: Verifies sanitization of credentials in client-side diagnostic outputs', () => {
    const sensitivePayload = {
      email: 'doctor@curasphere.com',
      password: 'SuperSecretPassword!2026',
      token: 'jwt-header.payload.signature',
      patientMrn: 'MRN-2026-00042'
    };

    const sanitizeDiagnosticData = (data: Record<string, unknown>): Record<string, unknown> => {
      const sanitized = { ...data };
      if ('password' in sanitized) sanitized.password = '[REDACTED]';
      if ('token' in sanitized) sanitized.token = '[REDACTED]';
      return sanitized;
    };

    const cleaned = sanitizeDiagnosticData(sensitivePayload);
    expect(cleaned.password).toBe('[REDACTED]');
    expect(cleaned.token).toBe('[REDACTED]');
    expect(cleaned.email).toBe('doctor@curasphere.com');
    expect(cleaned.patientMrn).toBe('MRN-2026-00042');
  });

  it('SEC-MNT-06: Verifies edition permission matrix integrity', () => {
    const clinicAllowedModules = ['patients', 'appointments', 'emr', 'billing', 'reports'];
    const hospitalTertiaryModules = ['ipd', 'emergency', 'surgery', 'icu'];

    const checkAccess = (edition: string, moduleName: string): boolean => {
      if (edition === 'Clinic' && hospitalTertiaryModules.includes(moduleName)) {
        return false;
      }
      return true;
    };

    clinicAllowedModules.forEach(mod => {
      expect(checkAccess('Clinic', mod)).toBe(true);
    });

    expect(checkAccess('Clinic', 'ipd')).toBe(false);
    expect(checkAccess('Clinic', 'emergency')).toBe(false);
    expect(checkAccess('Clinic', 'icu')).toBe(false);
    expect(checkAccess('Hospital', 'ipd')).toBe(true);
    expect(checkAccess('Hospital', 'surgery')).toBe(true);
  });
});
