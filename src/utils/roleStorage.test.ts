// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { getStoredUserRole } from './roleStorage';

describe('getStoredUserRole', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns valid role when stored value is valid', () => {
    localStorage.setItem('PDO_USER_ROLE', 'superadmin');
    expect(getStoredUserRole()).toBe('superadmin');

    localStorage.setItem('PDO_USER_ROLE', 'admin');
    expect(getStoredUserRole()).toBe('admin');

    localStorage.setItem('PDO_USER_ROLE', 'korwil');
    expect(getStoredUserRole()).toBe('korwil');

    localStorage.setItem('PDO_USER_ROLE', 'korlap');
    expect(getStoredUserRole()).toBe('korlap');

    localStorage.setItem('PDO_USER_ROLE', 'pdo');
    expect(getStoredUserRole()).toBe('pdo');
  });

  it('migrates legacy petugas role to pdo', () => {
    localStorage.setItem('PDO_USER_ROLE', 'petugas');
    expect(getStoredUserRole()).toBe('pdo');
  });

  it('falls back to pdo for arbitrary/garbage stored values', () => {
    localStorage.setItem('PDO_USER_ROLE', 'hax0r');
    expect(getStoredUserRole()).toBe('pdo');

    localStorage.setItem('PDO_USER_ROLE', '');
    expect(getStoredUserRole()).toBe('pdo');
  });

  it('falls back to pdo when key missing', () => {
    expect(getStoredUserRole()).toBe('pdo');
  });

  it('prevents client-side RBAC spoofing when verified profile role differs (SEC-154-03)', () => {
    localStorage.setItem('PDO_USER_EMAIL', 'petugas@transjakarta.co.id');
    localStorage.setItem(
      'PDO_LAST_VERIFIED_PROFILE_petugas@transjakarta.co.id',
      JSON.stringify({
        profile: {
          email: 'petugas@transjakarta.co.id',
          role: 'pdo',
          role_id: 5,
          is_active: true,
        },
        verifiedAt: new Date().toISOString(),
      })
    );

    // Attacker modifies PDO_USER_ROLE in console
    localStorage.setItem('PDO_USER_ROLE', 'superadmin');

    // Anti-spoofing guard must revert to verified profile role
    expect(getStoredUserRole()).toBe('pdo');
  });

  it('allows administrative role if verified profile matches (SEC-154-03)', () => {
    localStorage.setItem('PDO_USER_EMAIL', 'admin@transjakarta.co.id');
    localStorage.setItem(
      'PDO_LAST_VERIFIED_PROFILE_admin@transjakarta.co.id',
      JSON.stringify({
        profile: {
          email: 'admin@transjakarta.co.id',
          role: 'admin',
          role_id: 2,
          is_active: true,
        },
        verifiedAt: new Date().toISOString(),
      })
    );

    localStorage.setItem('PDO_USER_ROLE', 'admin');
    expect(getStoredUserRole()).toBe('admin');
  });
});
