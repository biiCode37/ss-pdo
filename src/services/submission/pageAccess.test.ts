import { describe, it, expect } from 'vitest';
import { evaluatePageAccess } from '../../../supabase/functions/_shared/pageAccess.ts';

const base = {
  is_enabled: true,
  allowed_roles: ['superadmin', 'korlap'],
  allowed_user_emails: ['pj@x.id'],
  denied_user_emails: ['blok@x.id'],
};

describe('evaluatePageAccess (cermin canAccessPage)', () => {
  it('superadmin selalu boleh, termasuk saat halaman nonaktif', () => {
    expect(evaluatePageAccess('regional_monitoring', { ...base, is_enabled: false }, 'superadmin', 'a@x.id')).toBe(true);
  });
  it('halaman nonaktif menolak selain superadmin', () => {
    expect(evaluatePageAccess('regional_monitoring', { ...base, is_enabled: false }, 'korlap', 'k@x.id')).toBe(false);
  });
  it('blacklist mengalahkan role, whitelist mengalahkan role', () => {
    expect(evaluatePageAccess('regional_monitoring', base, 'korlap', 'BLOK@x.id')).toBe(false);
    expect(evaluatePageAccess('regional_monitoring', base, 'pdo', 'pj@x.id')).toBe(true);
  });
  it('role baseline, termasuk normalisasi petugas → pdo', () => {
    expect(evaluatePageAccess('regional_monitoring', base, 'korlap', 'k@x.id')).toBe(true);
    expect(evaluatePageAccess('regional_monitoring', base, 'pdo', 'p@x.id')).toBe(false);
    expect(evaluatePageAccess('x', { is_enabled: true, allowed_roles: ['pdo'] }, 'petugas', 'p@x.id')).toBe(true);
  });
  it('tanpa setting = boleh; tanpa allowed_roles memakai legacy guard pdo', () => {
    expect(evaluatePageAccess('regional_monitoring', null, 'pdo', 'p@x.id')).toBe(true);
    expect(evaluatePageAccess('regional_monitoring', { is_enabled: true, allowed_roles: [] }, 'pdo', 'p@x.id')).toBe(false);
    expect(evaluatePageAccess('other_page', { is_enabled: true, allowed_roles: [] }, 'pdo', 'p@x.id')).toBe(true);
  });
});
