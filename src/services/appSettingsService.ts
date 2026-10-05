import { supabase } from './supabase';

const LOCAL_STORAGE_PREFIX = 'pdo_app_setting_';

/**
 * Membaca pengaturan sistem dari tabel public.app_settings dengan fallback ke localStorage.
 */
export async function getAppSetting(key: string, defaultValue: string = ''): Promise<string> {
  let localValue = '';
  if (typeof window !== 'undefined') {
    try {
      localValue = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${key}`) || '';
    } catch {
      // Ignore local storage error
    }
  }

  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle();

    if (!error && data?.value) {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${key}`, data.value);
        } catch {
          // Ignore
        }
      }
      return data.value;
    }
  } catch (err) {
    console.warn(`[appSettingsService] Gagal membaca app_setting ${key}:`, err);
  }

  return localValue || defaultValue;
}

/**
 * Menyimpan pengaturan sistem ke tabel public.app_settings dan localStorage secara sinkron.
 */
export async function setAppSetting(
  key: string,
  value: string,
  description?: string
): Promise<boolean> {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${key}`, value);
    } catch {
      // Ignore
    }
  }

  try {
    const payload: { key: string; value: string; description?: string; updated_at: string } = {
      key,
      value,
      updated_at: new Date().toISOString(),
    };
    if (description) {
      payload.description = description;
    }

    const { error } = await supabase
      .from('app_settings')
      .upsert(payload, { onConflict: 'key' });

    if (error) {
      console.warn(`[appSettingsService] Gagal menyimpan app_setting ${key}:`, error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`[appSettingsService] Exception saat menyimpan app_setting ${key}:`, err);
    return false;
  }
}

export const SETTING_KEYS = {
  REGIONAL_GLOBAL_SHEET_URL: 'regional_global_sheet_url',
} as const;

export async function getRegionalGlobalSheetUrl(): Promise<string> {
  return getAppSetting(
    SETTING_KEYS.REGIONAL_GLOBAL_SHEET_URL,
    'https://docs.google.com/spreadsheets/d/1Hkvs4DLGWGJMPHRISV-Sg72nL_zRIHjklTuRu1yXwFYS4/edit'
  );
}

export async function setRegionalGlobalSheetUrl(url: string): Promise<boolean> {
  return setAppSetting(
    SETTING_KEYS.REGIONAL_GLOBAL_SHEET_URL,
    url,
    'URL Google Sheets Capaian Operasi Global Wilayah Utara'
  );
}
