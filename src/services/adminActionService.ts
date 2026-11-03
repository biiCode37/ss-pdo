import { supabase, isSupabaseConfigured } from './supabase';
import { getGoogleAccessToken, reauthenticateSession } from './googleSheets/auth';
import { formatUserError } from '../utils/errorFormatter';
import { TEXT_AUTH } from '../constants/texts/text_auth';
import { pdoSwal } from '../utils/alertUtils';
import { escapeHtml } from '../utils/modals/busInputModal';

export type AdminActionType =
  | 'update_user_role'
  | 'toggle_user_status'
  | 'add_user_profile'
  | 'set_page_setting'
  | 'update_page_permissions'
  | 'bulk_update_page_settings'
  | 'create_admin_session';

export interface AdminActionResult<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  verifiedEmail?: string;
  sessionToken?: string;
}

export const ADMIN_SESSION_STORAGE_KEY = 'PDO_ADMIN_SESSION_TOKEN';

export function getStoredAdminSessionToken(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(ADMIN_SESSION_STORAGE_KEY) || null;
}

export function setStoredAdminSessionToken(token: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, token);
}

export function clearStoredAdminSessionToken(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
}

/**
 * Meminta konfirmasi ramah pengguna sebelum membuka popup autentikasi Google.
 * Menghindari pemunculan popup tiba-tiba yang mengejutkan pengguna atau diblokir browser.
 */
export async function promptAdminReauth(): Promise<boolean> {
  const currentEmail =
    typeof localStorage !== 'undefined'
      ? localStorage.getItem('PDO_USER_EMAIL') || ''
      : '';

  const descText = currentEmail
    ? TEXT_AUTH.ADMIN_REAUTH_DESC_WITH_EMAIL(currentEmail)
    : TEXT_AUTH.ADMIN_REAUTH_DESC;

  const result = await pdoSwal.fire({
    title: escapeHtml(TEXT_AUTH.ADMIN_REAUTH_TITLE),
    text: descText,
    icon: 'info',
    showCancelButton: true,
    confirmButtonText: escapeHtml(TEXT_AUTH.ADMIN_REAUTH_CONFIRM_BTN),
    cancelButtonText: escapeHtml(TEXT_AUTH.ADMIN_REAUTH_CANCEL_BTN),
    confirmButtonColor: 'var(--color-brand-primary, #0284c7)',
    cancelButtonColor: 'var(--color-surface-subtle, #64748b)',
    background: 'var(--color-surface-raised, #ffffff)',
    color: 'var(--color-text-primary, #0f172a)',
  });

  if (result.isConfirmed) {
    try {
      await reauthenticateSession();
      return true;
    } catch (err) {
      console.warn('[AdminActionService] Re-autentikasi akun Google dibatalkan atau gagal:', err);
      return false;
    }
  }
  return false;
}

/**
 * Memastikan sesi admin terinisialisasi secara hening di latar belakang
 * jika Google token yang valid sudah ada di browser.
 */
export async function ensureAdminSession(): Promise<boolean> {
  if (getStoredAdminSessionToken()) return true;
  const googleToken = await getGoogleAccessToken();
  if (!googleToken) return false;

  try {
    const res = await invokeAdminAction('create_admin_session', {});
    return res.success;
  } catch {
    return false;
  }
}

/**
 * Mengirim aksi administratif melalui Supabase Edge Function 'admin-action'.
 * Mengutamakan Admin Session Token yang tahan lama (Golden Rule #3),
 * dengan fallback ke Google OAuth Token jika belum memiliki session token.
 */
export async function invokeAdminAction<T = any>(
  action: AdminActionType,
  payload: Record<string, any>,
  isRetry = false
): Promise<AdminActionResult<T>> {
  if (!isSupabaseConfigured) {
    return {
      success: false,
      message: TEXT_AUTH.DATABASE_UNCONFIGURED,
    };
  }

  try {
    let sessionToken = getStoredAdminSessionToken();
    let googleToken: string | null = null;
    const headers: Record<string, string> = {};

    if (sessionToken) {
      headers['x-admin-session-token'] = sessionToken;
    } else {
      googleToken = await getGoogleAccessToken();
      if (googleToken) {
        headers['x-google-token'] = googleToken;
      }
    }

    // Jika tidak ada token sesi dan tidak ada token Google yang valid
    if (!sessionToken && !googleToken) {
      if (!isRetry) {
        const confirmed = await promptAdminReauth();
        if (confirmed) {
          return await invokeAdminAction<T>(action, payload, true);
        }
        return {
          success: false,
          message: TEXT_AUTH.ADMIN_REAUTH_FAILED,
        };
      }
      return {
        success: false,
        message: TEXT_AUTH.ADMIN_TOKEN_MISSING,
      };
    }

    // Kirim permintaan ke Edge Function admin-action dengan token di headers DAN di body
    // (body menjamin kredensial tidak pernah terpotong oleh proxy/gateway)
    const { data, error } = await supabase.functions.invoke('admin-action', {
      body: {
        action,
        payload,
        admin_session_token: sessionToken || undefined,
        google_token: googleToken || undefined,
      },
      headers,
    });

    if (error) {
      let serverErrorMsg = error.message || TEXT_AUTH.ADMIN_NETWORK_ERROR;
      let isAuthError = false;

      // Ekstrak pesan kesalahan dari Edge Function response jika tersedia
      if ((error as any)?.context) {
        try {
          const res = (error as any).context;
          if (res.status === 401) {
            isAuthError = true;
          }
          const cloned = typeof res.clone === 'function' ? res.clone() : res;
          const errBody = await cloned.json().catch(() => null);
          if (errBody?.error) {
            serverErrorMsg = errBody.error;
            if (
              serverErrorMsg.includes('Token tidak valid') ||
              serverErrorMsg.includes('kedaluwarsa') ||
              serverErrorMsg.includes('Akses ditolak: Sesi kredensial') ||
              serverErrorMsg.includes('Invalid Value')
            ) {
              isAuthError = true;
            }
          }
        } catch {
          // Abaikan parsing error
        }
      }

      console.warn('[AdminActionService] Permintaan administratif ditolak server:', serverErrorMsg);

      // Jika session token ditolak (401), hapus cache token sesi dan coba minta verifikasi 1x
      if (isAuthError && !isRetry) {
        clearStoredAdminSessionToken();
        const confirmed = await promptAdminReauth();
        if (confirmed) {
          return await invokeAdminAction<T>(action, payload, true);
        }
        return {
          success: false,
          message: TEXT_AUTH.ADMIN_REAUTH_FAILED,
        };
      }

      return {
        success: false,
        message: formatUserError(error, serverErrorMsg) || serverErrorMsg,
      };
    }

    if (!data || data.success === false) {
      return {
        success: false,
        message: data?.error || TEXT_AUTH.ADMIN_ACTION_FAILED,
      };
    }

    // Simpan token sesi baru yang dikembalikan oleh server jika ada
    if (data.session_token) {
      setStoredAdminSessionToken(data.session_token);
    }

    return {
      success: true,
      data: data.data as T,
      verifiedEmail: data.verified_email,
      sessionToken: data.session_token,
    };
  } catch (err: any) {
    console.error(`[AdminActionService] Error executing action '${action}':`, err);
    return {
      success: false,
      message: formatUserError(err, TEXT_AUTH.ADMIN_SYS_ERROR) || TEXT_AUTH.ADMIN_SYS_ERROR,
    };
  }
}
