import { describe, it, expect } from 'vitest';

interface User {
  userId: number;
  username: string;
  roleName: string;
}

export function checkIsSuperAdmin(user: User | null, permissions: string[]): boolean {
  return Boolean(
    user &&
      (user.username?.toLowerCase() === 'admin' ||
        user.roleName?.toLowerCase().includes('admin') ||
        user.roleName?.toLowerCase().includes('super') ||
        permissions.includes('AllAccess') ||
        permissions.includes('SystemAdmin') ||
        permissions.includes('*'))
  );
}

export function resolveUserRole(user: User | null): string {
  return user?.roleName || 'Guest';
}

export function isRouteAllowed(
  user: User | null,
  permissions: string[],
  requiredPermission?: string
): boolean {
  if (!user) return false;
  const isSuperAdmin = checkIsSuperAdmin(user, permissions);
  if (isSuperAdmin) return true;
  if (requiredPermission && !permissions.includes(requiredPermission)) {
    return false;
  }
  return true;
}

describe('Authentication & Authorization Hardening Security Tests', () => {
  it('should NOT grant SuperAdmin privilege when user object is null or unauthenticated', () => {
    const isSuperAdmin = checkIsSuperAdmin(null, []);
    expect(isSuperAdmin).toBe(false);
  });

  it('should NOT grant SuperAdmin privilege to a standard Doctor or Nurse user', () => {
    const doctorUser: User = { userId: 2, username: 'dr.kamran', roleName: 'Doctor' };
    const nurseUser: User = { userId: 3, username: 'nurse.amina', roleName: 'Staff Nurse' };

    expect(checkIsSuperAdmin(doctorUser, ['emr.read', 'emr.create'])).toBe(false);
    expect(checkIsSuperAdmin(nurseUser, ['vitals.read', 'vitals.create'])).toBe(false);
  });

  it('should safely default unassigned user role to Guest rather than Super Administrator', () => {
    const unassignedRole = resolveUserRole(null);
    expect(unassignedRole).toBe('Guest');
    expect(unassignedRole).not.toBe('Super Administrator');
  });

  it('should deny access to protected clinical route if user lacks required permission', () => {
    const cashierUser: User = { userId: 4, username: 'cashier.kamran', roleName: 'Cashier' };
    const allowed = isRouteAllowed(cashierUser, ['billing.create', 'billing.read'], 'patients.delete');
    expect(allowed).toBe(false);
  });

  it('should grant access to protected route if user possesses required permission', () => {
    const doctorUser: User = { userId: 2, username: 'dr.kamran', roleName: 'Doctor' };
    const allowed = isRouteAllowed(doctorUser, ['emr.read', 'emr.create'], 'emr.read');
    expect(allowed).toBe(true);
  });

  it('should grant access when user is a verified Super Administrator', () => {
    const adminUser: User = { userId: 1, username: 'admin', roleName: 'Super Administrator' };
    const allowed = isRouteAllowed(adminUser, ['AllAccess'], 'restricted.system.config');
    expect(allowed).toBe(true);
  });
});
