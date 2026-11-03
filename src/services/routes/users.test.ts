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

vi.mock('../adminActionService', () => ({
  invokeAdminAction: vi.fn(),
}));

import {
  generateProfileChecksum,
  tryOfflineProfileFallback,
  addUserProfile,
  updateUserProfileRole,
  toggleUserProfileStatus,
  revokeUserProfile,
} from './users';
import { invokeAdminAction } from '../adminActionService';

describe('User Service Security & Error Sanitization (Refactor 154 & Refactor 191)', () => {
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

  describe('Database Error Sanitization & Admin Action Gateway (SEC-154-05 & Refactor 191)', () => {
    it('sanitizes duplicate email error to friendly message on addUserProfile', async () => {
      vi.mocked(invokeAdminAction).mockResolvedValue({
        success: false,
        message: 'Email tersebut sudah terdaftar di sistem.',
      });

      const res = await addUserProfile({
        email: 'duplicate@gmail.com',
        role: 'pdo',
      });

      expect(res.success).toBe(false);
      expect(res.message).toBe('Email tersebut sudah terdaftar di sistem.');
    });

    it('sanitizes technical postgres syntax error to friendly non-technical message', async () => {
      vi.mocked(invokeAdminAction).mockResolvedValue({
        success: false,
        message: 'Gagal menambahkan pengguna baru. Pastikan format email valid dan koneksi internet stabil.',
      });

      const res = await addUserProfile({
        email: 'test@gmail.com',
        role: 'pdo',
      });

      expect(res.success).toBe(false);
      expect(res.message).toBe('Gagal menambahkan pengguna baru. Pastikan format email valid dan koneksi internet stabil.');
    });

    it('preserves intentional Access Denied exception from PostgreSQL function', async () => {
      vi.mocked(invokeAdminAction).mockResolvedValue({
        success: false,
        message: 'Akses ditolak: Hanya Superadmin aktif yang berwenang mengubah peran akun pengguna.',
      });

      const res = await updateUserProfileRole('target@gmail.com', 'admin', 'acting@gmail.com');

      expect(res.success).toBe(false);
      expect(res.message).toBe('Akses ditolak: Hanya Superadmin aktif yang berwenang mengubah peran akun pengguna.');
    });

    it('sanitizes errors in toggleUserProfileStatus and revokeUserProfile', async () => {
      vi.mocked(invokeAdminAction)
        .mockResolvedValueOnce({
          success: false,
          message: 'Gagal memperbarui status aktif akun pengguna.',
        })
        .mockResolvedValueOnce({
          success: false,
          message: 'Gagal mencabut hak akses akun pengguna.',
        });

      const resToggle = await toggleUserProfileStatus('target@gmail.com', false, 'admin@gmail.com');
      expect(resToggle.success).toBe(false);
      expect(resToggle.message).toBe('Gagal memperbarui status aktif akun pengguna.');

      const resRevoke = await revokeUserProfile('target@gmail.com', 'admin@gmail.com');
      expect(resRevoke.success).toBe(false);
      expect(resRevoke.message).toBe('Gagal mencabut hak akses akun pengguna.');
    });

    it('successfully executes addUserProfile and logs activity with verified email', async () => {
      vi.mocked(invokeAdminAction).mockResolvedValue({
        success: true,
        verifiedEmail: 'verified-superadmin@transjakarta.co.id',
      });

      const res = await addUserProfile({
        email: 'newuser@transjakarta.co.id',
        full_name: 'New Operator',
        role: 'pdo',
      });

      expect(res.success).toBe(true);
      expect(invokeAdminAction).toHaveBeenCalledWith('add_user_profile', {
        email: 'newuser@transjakarta.co.id',
        fullName: 'New Operator',
        roleId: 5,
        notes: null,
      });
    });
  });
});
