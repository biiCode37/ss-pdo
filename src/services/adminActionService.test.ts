// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { invokeAdminAction } from './adminActionService';

vi.mock('./supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

vi.mock('./googleSheets/auth', () => ({
  getGoogleAccessToken: vi.fn(),
}));

import { supabase } from './supabase';
import { getGoogleAccessToken } from './googleSheets/auth';

describe('AdminActionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('gagal jika Google access token tidak tersedia (offline atau sesi habis)', async () => {
    vi.mocked(getGoogleAccessToken).mockResolvedValue(null);

    const res = await invokeAdminAction('update_user_role', { targetEmail: 'target@test.com', newRoleId: 2 });
    expect(res.success).toBe(false);
    expect(res.message).toContain('Token autentikasi Google tidak ditemukan');
  });

  it('berhasil memanggil Edge Function admin-action dengan token di headers', async () => {
    vi.mocked(getGoogleAccessToken).mockResolvedValue('mock-google-token-123');
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: { success: true, data: true, verified_email: 'superadmin@transjakarta.co.id' },
      error: null,
    });

    const res = await invokeAdminAction('update_user_role', { targetEmail: 'budi@test.com', newRoleId: 2 });
    expect(res.success).toBe(true);
    expect(supabase.functions.invoke).toHaveBeenCalledWith('admin-action', {
      body: { action: 'update_user_role', payload: { targetEmail: 'budi@test.com', newRoleId: 2 } },
      headers: { 'x-google-token': 'mock-google-token-123' },
    });
  });

  it('mengembalikan pesan ramah pengguna jika Edge Function mengembalikan error akses ditolak', async () => {
    vi.mocked(getGoogleAccessToken).mockResolvedValue('mock-google-token-123');
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: { success: false, error: 'Akses ditolak: Hanya Superadmin aktif yang berwenang mengubah peran akun pengguna.' },
      error: null,
    });

    const res = await invokeAdminAction('update_user_role', { targetEmail: 'budi@test.com', newRoleId: 1 });
    expect(res.success).toBe(false);
    expect(res.message).toContain('Akses ditolak');
  });

  it('menangani error network atau exception dari invoke', async () => {
    vi.mocked(getGoogleAccessToken).mockResolvedValue('mock-google-token-123');
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null,
      error: { message: 'Failed to send request to Edge Function' },
    });

    const res = await invokeAdminAction('toggle_user_status', { targetEmail: 'budi@test.com', isActive: false });
    expect(res.success).toBe(false);
    expect(res.message).toBeDefined();
  });
});
