// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  invokeAdminAction,
  clearStoredAdminSessionToken,
  setStoredAdminSessionToken,
  getStoredAdminSessionToken,
  ensureAdminSession,
} from './adminActionService';

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
  reauthenticateSession: vi.fn(),
}));

vi.mock('../utils/alertUtils', () => ({
  pdoSwal: {
    fire: vi.fn(),
  },
}));

import { supabase } from './supabase';
import { getGoogleAccessToken, reauthenticateSession } from './googleSheets/auth';
import { pdoSwal } from '../utils/alertUtils';

describe('AdminActionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearStoredAdminSessionToken();
  });

  it('gagal jika token tidak tersedia dan pengguna membatalkan konfirmasi', async () => {
    vi.mocked(getGoogleAccessToken).mockResolvedValue(null);
    vi.mocked(pdoSwal.fire).mockResolvedValue({ isConfirmed: false } as any);

    const res = await invokeAdminAction('update_user_role', { targetEmail: 'target@test.com', newRoleId: 2 });
    expect(res.success).toBe(false);
    expect(pdoSwal.fire).toHaveBeenCalledTimes(1);
    expect(res.message).toContain('dibatalkan atau tidak selesai');
  });

  it('berhasil memanggil Edge Function dengan x-admin-session-token jika tersedia', async () => {
    setStoredAdminSessionToken('mock-session-token-xyz');
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: { success: true, data: true, verified_email: 'superadmin@transjakarta.co.id' },
      error: null,
    });

    const res = await invokeAdminAction('update_user_role', { targetEmail: 'budi@test.com', newRoleId: 2 });
    expect(res.success).toBe(true);
    expect(supabase.functions.invoke).toHaveBeenCalledWith('admin-action', {
      body: {
        action: 'update_user_role',
        payload: { targetEmail: 'budi@test.com', newRoleId: 2 },
        admin_session_token: 'mock-session-token-xyz',
        google_token: undefined,
      },
      headers: { 'x-admin-session-token': 'mock-session-token-xyz' },
    });
    // Tidak perlu memanggil getGoogleAccessToken karena session token ada
    expect(getGoogleAccessToken).not.toHaveBeenCalled();
  });

  it('berhasil memanggil Edge Function dengan x-google-token jika belum punya session token', async () => {
    vi.mocked(getGoogleAccessToken).mockResolvedValue('mock-google-token-123');
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: {
        success: true,
        data: true,
        verified_email: 'superadmin@transjakarta.co.id',
        session_token: 'fresh-session-token-456',
      },
      error: null,
    });

    const res = await invokeAdminAction('update_user_role', { targetEmail: 'budi@test.com', newRoleId: 2 });
    expect(res.success).toBe(true);
    expect(supabase.functions.invoke).toHaveBeenCalledWith('admin-action', {
      body: {
        action: 'update_user_role',
        payload: { targetEmail: 'budi@test.com', newRoleId: 2 },
        admin_session_token: undefined,
        google_token: 'mock-google-token-123',
      },
      headers: { 'x-google-token': 'mock-google-token-123' },
    });
    // Auto-upgrade: session token baru harus tersimpan di localStorage
    expect(getStoredAdminSessionToken()).toBe('fresh-session-token-456');
  });

  it('mengembalikan pesan ramah pengguna jika Edge Function mengembalikan error akses ditolak', async () => {
    setStoredAdminSessionToken('mock-session-token-xyz');
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: { success: false, error: 'Akses ditolak: Hanya Superadmin aktif yang berwenang mengubah peran akun pengguna.' },
      error: null,
    });

    const res = await invokeAdminAction('update_user_role', { targetEmail: 'budi@test.com', newRoleId: 1 });
    expect(res.success).toBe(false);
    expect(res.message).toContain('Akses ditolak');
  });

  it('menangani error network atau exception dari invoke', async () => {
    setStoredAdminSessionToken('mock-session-token-xyz');
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null,
      error: { message: 'Failed to send request to Edge Function' },
    });

    const res = await invokeAdminAction('toggle_user_status', { targetEmail: 'budi@test.com', isActive: false });
    expect(res.success).toBe(false);
    expect(res.message).toBeDefined();
  });

  it('mengekstrak pesan error dari context.json() dan melakukan reauth konfirmasi saat 401 token kedaluwarsa', async () => {
    vi.mocked(getGoogleAccessToken)
      .mockResolvedValueOnce('expired-token')
      .mockResolvedValueOnce('fresh-token');
    vi.mocked(pdoSwal.fire).mockResolvedValue({ isConfirmed: true } as any);
    vi.mocked(reauthenticateSession).mockResolvedValueOnce();

    vi.mocked(supabase.functions.invoke)
      .mockResolvedValueOnce({
        data: null,
        error: {
          name: 'FunctionsHttpError',
          message: 'Edge Function returned a non-2xx status code',
          context: {
            status: 401,
            json: async () => ({
              success: false,
              error: 'Autentikasi gagal: Token Google tidak valid atau telah kedaluwarsa.',
            }),
          },
        } as any,
      })
      .mockResolvedValueOnce({
        data: {
          success: true,
          data: true,
          verified_email: 'superadmin@transjakarta.co.id',
          session_token: 'renewed-session-token',
        },
        error: null,
      });

    const res = await invokeAdminAction('update_page_permissions', {
      pageKey: 'plotting',
      allowedRoles: ['superadmin'],
      allowedUserEmails: ['biiaby370@gmail.com'],
      deniedUserEmails: [],
    });

    expect(pdoSwal.fire).toHaveBeenCalledTimes(1);
    expect(reauthenticateSession).toHaveBeenCalledTimes(1);
    expect(supabase.functions.invoke).toHaveBeenCalledTimes(2);
    expect(res.success).toBe(true);
    expect(getStoredAdminSessionToken()).toBe('renewed-session-token');
  });

  it('ensureAdminSession mengembalikan true langsung jika session token sudah ada', async () => {
    setStoredAdminSessionToken('existing-token');
    const ok = await ensureAdminSession();
    expect(ok).toBe(true);
    expect(getGoogleAccessToken).not.toHaveBeenCalled();
  });

  it('ensureAdminSession mencoba membuat session token jika Google token tersedia', async () => {
    vi.mocked(getGoogleAccessToken).mockResolvedValue('fresh-google-token');
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: {
        success: true,
        session_token: 'new-session-token-from-exchange',
      },
      error: null,
    });

    const ok = await ensureAdminSession();
    expect(ok).toBe(true);
    expect(getStoredAdminSessionToken()).toBe('new-session-token-from-exchange');
  });
});
