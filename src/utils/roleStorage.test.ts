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

    localStorage.setItem('PDO_USER_ROLE', 'petugas');
    expect(getStoredUserRole()).toBe('petugas');
  });

  it('falls back to petugas for arbitrary/garbage stored values', () => {
    localStorage.setItem('PDO_USER_ROLE', 'hax0r');
    expect(getStoredUserRole()).toBe('petugas');

    localStorage.setItem('PDO_USER_ROLE', '');
    expect(getStoredUserRole()).toBe('petugas');
  });

  it('falls back to petugas when key missing', () => {
    expect(getStoredUserRole()).toBe('petugas');
  });
});
