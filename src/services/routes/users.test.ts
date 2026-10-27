// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

vi.mock('./audit', () => ({
  logActivity: vi.fn().mockResolvedValue(undefined),
}));

import { supabase } from '../supabase';
import {
  generateProfileChecksum,
  tryOfflineProfileFallback,
  addUserProfile,
  updateUserProfileRole,
  toggleUserProfileStatus,
  revokeUserProfile,
} from './users';

describe('User Service Security & Error Sanitization (Refactor 154)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Offline Profile Integrity & Anti-Tamper (SEC-154-04)', () => {
    it('successfully validates offline profile when checksum matches', () => {
      const email = 'budi@transjakarta.co.id';
      const verifiedAt = new Date().toISOString();
      const checksum = generateProfileChecksum(email, 'pdo', 5, true, verifiedAt);

      localStorage.setItem(
        `PDO_LAST_VERIFIED_PROFILE_${email}`,
        JSON.stringify({
          profile: {
            id: 10,
            email,
            role: 'pdo',
            role_id: 5,
            is_active: true,
          },
          verifiedAt,
          checksum,
        })
      );

      const result = tryOfflineProfileFallback(email);
      expect(result).not.toBeNull();
      expect(result?.isAllowed).toBe(true);
      expect(result?.profile.email).toBe(email);
    });

    it('rejects offline profile fallback when cache has been tampered (checksum mismatch)', () => {
      const email = 'budi@transjakarta.co.id';
      const verifiedAt = new Date().toISOString();
      const validChecksum = generateProfileChecksum(email, 'pdo', 5, true, verifiedAt);

      // Attacker tampers role to superadmin but leaves original checksum
      localStorage.setItem(
        `PDO_LAST_VERIFIED_PROFILE_${email}`,
        JSON.stringify({
          profile: {
            id: 10,
            email,
            role: 'superadmin',
            role_id: 1,
            is_active: true,
          },
          verifiedAt,
          checksum: validChecksum,
        })
      );

      const result = tryOfflineProfileFallback(email);
      expect(result).toBeNull();
    });

    it('rejects legacy cache without checksum claiming administrative role (SEC-154-04)', () => {
      const email = 'hacker@transjakarta.co.id';
      const verifiedAt = new Date().toISOString();

      localStorage.setItem(
        `PDO_LAST_VERIFIED_PROFILE_${email}`,
        JSON.stringify({
          profile: {
            id: 99,
            email,
            role: 'superadmin',
            role_id: 1,
            is_active: true,
          },
          verifiedAt,
          // no checksum
        })
      );

      const result = tryOfflineProfileFallback(email);
      expect(result).toBeNull();
    });
  });

  describe('Database Error Sanitization (SEC-154-05)', () => {
    it('sanitizes duplicate email error to friendly message on addUserProfile', async () => {
      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: null,
            error: { code: '23505', message: 'duplicate key value violates unique constraint "user_profiles_email_key"' },
          }),
        }),
      });

      const res = await addUserProfile({
        email: 'duplicate@gmail.com',
        role: 'pdo',
      });

      expect(res.success).toBe(false);
      expect(res.message).toBe('Email tersebut sudah terdaftar di sistem.');
      expect(res.message).not.toContain('violates unique constraint');
    });

    it('sanitizes technical postgres syntax error to friendly non-technical message', async () => {
      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: null,
            error: { code: '42601', message: 'syntax error at or near "WHERE"' },
          }),
        }),
      });

      const res = await addUserProfile({
        email: 'test@gmail.com',
        role: 'pdo',
      });

      expect(res.success).toBe(false);
      expect(res.message).not.toContain('syntax error');
      expect(res.message).toBe('Gagal menambahkan pengguna baru. Pastikan format email valid dan koneksi internet stabil.');
    });

    it('preserves intentional Access Denied exception from PostgreSQL function', async () => {
      (supabase.rpc as any).mockResolvedValue({
        data: null,
        error: { message: 'Akses ditolak: Hanya Superadmin aktif yang berwenang mengubah peran akun pengguna.' },
      });

      const res = await updateUserProfileRole('target@gmail.com', 'admin', 'acting@gmail.com');

      expect(res.success).toBe(false);
      expect(res.message).toBe('Akses ditolak: Hanya Superadmin aktif yang berwenang mengubah peran akun pengguna.');
    });

    it('sanitizes errors in toggleUserProfileStatus and revokeUserProfile', async () => {
      (supabase.rpc as any).mockResolvedValue({
        data: null,
        error: { code: '42501', message: 'permission denied for function admin_toggle_user_status' },
      });
      (supabase.from as any).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              data: null,
              error: { code: '42501', message: 'permission denied for table user_profiles' },
            }),
          }),
        }),
      });

      const resToggle = await toggleUserProfileStatus('target@gmail.com', false, 'admin@gmail.com');
      expect(resToggle.success).toBe(false);
      expect(resToggle.message).toBe('Gagal memperbarui status aktif akun pengguna.');

      const resRevoke = await revokeUserProfile('target@gmail.com', 'admin@gmail.com');
      expect(resRevoke.success).toBe(false);
      expect(resRevoke.message).toBe('Gagal mencabut hak akses akun pengguna.');
    });
  });
});
