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
});
