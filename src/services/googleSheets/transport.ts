import { supabase, isSupabaseConfigured } from '../supabase';
import { withAuthRetry, getGapi, getGoogleAccessToken } from './auth';

// Sesi proxy bertanda tangan server (12 jam) yang ditukar dari token Google pengguna (BUG-SEC-205-01)
export const PROXY_SESSION_STORAGE_KEY = 'PDO_SHEETS_PROXY_SESSION';
const SESSION_RENEW_MARGIN_MS = 5 * 60 * 1000;
// ponytail: bila penukaran sesi gagal non-401 (mis. proxy versi lama saat transisi deploy), jeda 60 dtk
// agar tiap panggilan Sheets tidak ikut memicu penukaran ulang
const SESSION_RETRY_COOLDOWN_MS = 60_000;
let sessionPromise: Promise<string | null> | null = null;
let sessionUnavailableUntil = 0;

function readStoredProxySession(): string | null {
  try {
    const raw = localStorage.getItem(PROXY_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (s?.sessionToken && Number(s.expiresAt) - Date.now() > SESSION_RENEW_MARGIN_MS) {
      return String(s.sessionToken);
    }
  } catch {
    /* storage tidak tersedia / rusak */
  }
  return null;
}

export function clearProxySession(): void {
  try {
    localStorage.removeItem(PROXY_SESSION_STORAGE_KEY);
  } catch {
    /* silent */
  }
}

/**
 * Mengambil sesi proxy tersimpan, atau menukar token Google pengguna dengan sesi baru.
 * In-flight guard: panggilan paralel (mis. sinkron 18 rute) berbagi satu penukaran.
 */
export async function getProxySession(forceRenew = false): Promise<string | null> {
  if (!forceRenew) {
    const stored = readStoredProxySession();
    if (stored) return stored;
    if (Date.now() < sessionUnavailableUntil) return null;
  }
  if (!sessionPromise) {
    sessionPromise = (async () => {
      const googleToken = await getGoogleAccessToken();
      if (!googleToken) return null;
      const { data, error } = await supabase.functions.invoke('sheets-proxy', {
        body: { action: 'session' },
        headers: { 'x-google-token': googleToken },
      });
      if (error || !data?.sessionToken) {
        sessionUnavailableUntil = Date.now() + SESSION_RETRY_COOLDOWN_MS;
        return null;
      }
      try {
        localStorage.setItem(
          PROXY_SESSION_STORAGE_KEY,
          JSON.stringify({ sessionToken: data.sessionToken, expiresAt: data.expiresAt })
        );
      } catch {
        /* silent */
      }
      return String(data.sessionToken);
    })().finally(() => {
      sessionPromise = null;
    });
  }
  return sessionPromise;
}

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
      return { active: true, clientEmail: data.client_email || null };
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
  let session = await getProxySession();
  let sessionRenewed = false;
  const invoke = () =>
    supabase.functions.invoke('sheets-proxy', {
      body,
      headers: session ? { 'x-proxy-session': session } : undefined,
    });

  while (attempt < maxRetries) {
    attempt++;
    const res = await invoke();

    const errMsg = (res.error?.message || '').toLowerCase();
    const dataErr = (typeof res.data?.error === 'string' ? res.data.error : '').toLowerCase();
    const status = (res.error as any)?.context?.status || (res.data as any)?.status;

    // Sesi proxy ditolak (kedaluwarsa/dicabut): perbarui sekali dari token Google, lalu ulangi.
    // Jika token Google juga tidak tersedia, minta pengguna masuk ulang lewat prompt re-auth yang sudah ada.
    if (status === 401) {
      if (sessionRenewed) return res;
      sessionRenewed = true;
      clearProxySession();
      session = await getProxySession(true);
      if (!session) {
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('google-auth-expired'));
        return res;
      }
      attempt--;
      continue;
    }

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

  return await invoke();
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
