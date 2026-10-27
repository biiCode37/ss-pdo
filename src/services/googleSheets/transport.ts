import { supabase, isSupabaseConfigured } from '../supabase';
import { withAuthRetry, getGapi } from './auth';

// ponytail: native getGapiSheets eliminates external gapi-script dependency
const getGapiSheets = () => {
  const gapiObj = getGapi();
  return (gapiObj?.client as any)?.sheets?.spreadsheets;
};

export type TransportMode = 'service_account' | 'client_oauth' | 'auto';

let cachedProxyStatus: {
  checked: boolean;
  active: boolean;
  clientEmail: string | null;
} = {
  checked: false,
  active: false,
  clientEmail: null,
};

let manualModeOverride: TransportMode = 'auto';

/**
 * Mengatur override mode transport secara manual (untuk testing / konfigurasi admin)
 */
export function setTransportMode(mode: TransportMode): void {
  manualModeOverride = mode;
}

export function getTransportMode(): TransportMode {
  return manualModeOverride;
}

/**
 * Mengecek ketersediaan dan status konfigurasi Google Service Account pada Supabase Edge Function
 */
export async function checkProxyHealth(forceRefresh = false): Promise<{
  active: boolean;
  clientEmail: string | null;
}> {
  if (manualModeOverride === 'client_oauth') {
    return { active: false, clientEmail: null };
  }

  if (cachedProxyStatus.checked && !forceRefresh) {
    return {
      active: cachedProxyStatus.active,
      clientEmail: cachedProxyStatus.clientEmail,
    };
  }

  if (!isSupabaseConfigured) {
    cachedProxyStatus = { checked: true, active: false, clientEmail: null };
    return { active: false, clientEmail: null };
  }

  try {
    const { data, error } = await supabase.functions.invoke('sheets-proxy', {
      body: { action: 'health' },
    });

    if (!error && data && data.ok && data.configured) {
      cachedProxyStatus = {
        checked: true,
        active: true,
        clientEmail: data.client_email || null,
      };
      console.log('[Transport] Google Service Account Proxy aktif via Supabase Edge Function:', data.client_email);
      return { active: true, clientEmail: data.client_email };
    }
  } catch (err) {
    console.warn('[Transport] Gagal mengecek status sheets-proxy Edge Function:', err);
  }

  cachedProxyStatus = { checked: true, active: false, clientEmail: null };
  return { active: false, clientEmail: null };
}

/**
 * Mengetahui apakah sistem saat ini menggunakan Service Account Proxy
 */
export function isUsingServiceAccount(): boolean {
  if (manualModeOverride === 'service_account') return true;
  if (manualModeOverride === 'client_oauth') return false;
  return cachedProxyStatus.active;
}

/**
 * Memanggil sheets-proxy Edge Function dengan dukungan Auto-Retry Exponential Backoff
 * untuk menangani penolakan HTTP 429 (Too Many Requests) dari Google API / Supabase.
 */
async function invokeSheetsProxyWithRetry(
  body: any,
  maxRetries = 3
): Promise<{ data: any; error: any }> {
  let attempt = 0;
  let delayMs = 1500;

  while (attempt < maxRetries) {
    attempt++;
    const res = await supabase.functions.invoke('sheets-proxy', { body });

    const errMsg = (res.error?.message || '').toLowerCase();
    const dataErr = (typeof res.data?.error === 'string' ? res.data.error : '').toLowerCase();
    const status = (res.error as any)?.context?.status || (res.data as any)?.status;

    const isRateLimited =
      status === 429 ||
      errMsg.includes('429') ||
      errMsg.includes('non-2xx') ||
      dataErr.includes('429') ||
      dataErr.includes('too many requests') ||
      dataErr.includes('quota exceeded') ||
      dataErr.includes('rate limit');

    if (isRateLimited && attempt < maxRetries) {
      console.warn(
        `[Transport] sheets-proxy 429 Rate Limit (percobaan ${attempt}/${maxRetries}). Menunggu ${delayMs}ms sebelum retry...`
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      delayMs *= 2;
      continue;
    }

    return res;
  }

  return await supabase.functions.invoke('sheets-proxy', { body });
}

/**
 * Mengambil metadata spreadsheet (nama lembar, properties, sheetId/gid)
 */
export async function fetchSpreadsheetMeta(
  spreadsheetId: string,
  fields?: string
): Promise<any> {
  const health = await checkProxyHealth();
  if (health.active) {
    const { data, error } = await invokeSheetsProxyWithRetry({
      action: 'spreadsheets.get',
      spreadsheetId,
      params: fields ? { fields } : undefined,
    });
    if (!error && data && !data.error) {
      return { result: data };
    }
    // Jika proxy gagal unconfigured di tengah jalan, fallback ke gapi
    if (data?.code === 'SERVICE_ACCOUNT_UNCONFIGURED') {
      cachedProxyStatus.active = false;
    } else if (error || data?.error) {
      throw new Error(data?.error || error?.message || 'Gagal memuat metadata spreadsheet via proxy');
    }
  }

  // Fallback: Panggilan langsung Google API client (gapi)
  return withAuthRetry(async () => {
    return await getGapiSheets().get({
      spreadsheetId,
      fields,
    });
  });
}

/**
 * Membaca nilai dari satu range tabel spreadsheet
 */
export async function fetchSheetValues(
  spreadsheetId: string,
  range: string,
  valueRenderOption?: string
): Promise<any> {
  const health = await checkProxyHealth();
  if (health.active) {
    const { data, error } = await invokeSheetsProxyWithRetry({
      action: 'values.get',
      spreadsheetId,
      params: { range, valueRenderOption },
    });
    if (!error && data && !data.error) {
      return { result: data };
    }
    if (data?.code === 'SERVICE_ACCOUNT_UNCONFIGURED') {
      cachedProxyStatus.active = false;
    } else if (error || data?.error) {
      throw new Error(data?.error || error?.message || 'Gagal membaca range nilai via proxy');
    }
  }

  // Fallback: Panggilan langsung Google API client (gapi)
  return withAuthRetry(async () => {
    return await getGapiSheets().values.get({
      spreadsheetId,
      range,
      valueRenderOption,
    });
  });
}

/**
 * Membaca nilai dari beberapa range tabel spreadsheet sekaligus (Batch Get)
 */
export async function fetchSheetValuesBatch(
  spreadsheetId: string,
  ranges: string[],
  valueRenderOption?: string
): Promise<any> {
  const health = await checkProxyHealth();
  if (health.active) {
    const { data, error } = await invokeSheetsProxyWithRetry({
      action: 'values.batchGet',
      spreadsheetId,
      params: { ranges, valueRenderOption },
    });
    if (!error && data && !data.error) {
      return { result: data };
    }
    if (data?.code === 'SERVICE_ACCOUNT_UNCONFIGURED') {
      cachedProxyStatus.active = false;
    } else if (error || data?.error) {
      throw new Error(data?.error || error?.message || 'Gagal membaca batch nilai via proxy');
    }
  }

  // Fallback: Panggilan langsung Google API client (gapi)
  return withAuthRetry(async () => {
    return await getGapiSheets().values.batchGet({
      spreadsheetId,
      ranges,
      valueRenderOption,
    });
  });
}

/**
 * Memperbarui nilai sel spreadsheet dalam batch (Batch Update Values)
 */
export async function updateSheetValuesBatch(
  spreadsheetId: string,
  payload: {
    valueInputOption: string;
    data: Array<{ range: string; values: any[][] }>;
  }
): Promise<any> {
  const health = await checkProxyHealth();
  if (health.active) {
    const { data, error } = await invokeSheetsProxyWithRetry({
      action: 'values.batchUpdate',
      spreadsheetId,
      payload,
    });
    if (!error && data && !data.error) {
      return { result: data };
    }
    if (data?.code === 'SERVICE_ACCOUNT_UNCONFIGURED') {
      cachedProxyStatus.active = false;
    } else if (error || data?.error) {
      throw new Error(data?.error || error?.message || 'Gagal memperbarui nilai spreadsheet via proxy');
    }
  }

  // Fallback: Panggilan langsung Google API client (gapi)
  return withAuthRetry(async () => {
    return await getGapiSheets().values.batchUpdate({
      spreadsheetId,
      resource: payload,
    });
  });
}

/**
 * Menjalankan modifikasi struktural spreadsheet (format warna, tambah tab, sisip baris)
 */
export async function batchUpdateSpreadsheet(
  spreadsheetId: string,
  requests: any[]
): Promise<any> {
  const health = await checkProxyHealth();
  if (health.active) {
    const { data, error } = await invokeSheetsProxyWithRetry({
      action: 'batchUpdate',
      spreadsheetId,
      payload: { requests },
    });
    if (!error && data && !data.error) {
      return { result: data };
    }
    if (data?.code === 'SERVICE_ACCOUNT_UNCONFIGURED') {
      cachedProxyStatus.active = false;
    } else if (error || data?.error) {
      throw new Error(data?.error || error?.message || 'Gagal batchUpdate struktural via proxy');
    }
  }

  // Fallback: Panggilan langsung Google API client (gapi)
  return withAuthRetry(async () => {
    return await getGapiSheets().batchUpdate({
      spreadsheetId,
      resource: { requests },
    });
  });
}
