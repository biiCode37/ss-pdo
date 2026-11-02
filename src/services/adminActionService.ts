import { supabase, isSupabaseConfigured } from './supabase';
import { getGoogleAccessToken } from './googleSheets/auth';
import { formatUserError } from '../utils/errorFormatter';
import { TEXT_AUTH } from '../constants/texts/text_auth';

export type AdminActionType =
  | 'update_user_role'
  | 'toggle_user_status'
  | 'add_user_profile'
  | 'set_page_setting'
  | 'update_page_permissions'
  | 'bulk_update_page_settings';

export interface AdminActionResult<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  verifiedEmail?: string;
}

/**
 * Mengirim aksi administratif melalui Supabase Edge Function 'admin-action'.
 * Mengotentikasi pemanggil secara kriptografis menggunakan Google OAuth Access Token.
 */
export async function invokeAdminAction<T = any>(
  action: AdminActionType,
  payload: Record<string, any>
): Promise<AdminActionResult<T>> {
  if (!isSupabaseConfigured) {
    return {
      success: false,
      message: TEXT_AUTH.DATABASE_UNCONFIGURED,
    };
  }

  try {
    // 1. Dapatkan Google Access Token yang masih valid
    const googleToken = await getGoogleAccessToken();
    if (!googleToken) {
      return {
        success: false,
        message: TEXT_AUTH.ADMIN_TOKEN_MISSING,
      };
    }

    // 2. Kirim permintaan ke Edge Function admin-action
    const { data, error } = await supabase.functions.invoke('admin-action', {
      body: {
        action,
        payload,
      },
      headers: {
        'x-google-token': googleToken,
      },
    });

    if (error) {
      const errorMsg = error.message || TEXT_AUTH.ADMIN_NETWORK_ERROR;
      return {
        success: false,
        message: formatUserError(error, errorMsg) || errorMsg,
      };
    }

    if (!data || data.success === false) {
      return {
        success: false,
        message: data?.error || TEXT_AUTH.ADMIN_ACTION_FAILED,
      };
    }

    return {
      success: true,
      data: data.data as T,
      verifiedEmail: data.verified_email,
    };
  } catch (err: any) {
    console.error(`[AdminActionService] Error executing action '${action}':`, err);
    return {
      success: false,
      message: formatUserError(err, TEXT_AUTH.ADMIN_SYS_ERROR) || TEXT_AUTH.ADMIN_SYS_ERROR,
    };
  }
}
