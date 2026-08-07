import { gapi } from 'gapi-script';

export const getGoogleCreds = () => {
  return {
    clientId: import.meta.env.VITE_GAPI_CLIENT_ID || '',
    apiKey: import.meta.env.VITE_GAPI_API_KEY || ''
  };
};

export const hasGoogleCreds = () => {
  const creds = getGoogleCreds();
  return !!creds.clientId && !!creds.apiKey;
};

let tokenClient: any;

export const initGoogleApi = async (): Promise<void> => {
  const creds = getGoogleCreds();
  if (!hasGoogleCreds()) throw new Error('API Credentials missing');

  return new Promise((resolve, reject) => {
    // 1. Load the GAPI client for API calls (without auth2)
    gapi.load('client', async () => {
      try {
        await gapi.client.init({
          apiKey: creds.apiKey,
          discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
        });
        
        // 2. Load Google Identity Services script for modern Auth
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.onload = () => {
          tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
            client_id: creds.clientId,
            scope: 'https://www.googleapis.com/auth/spreadsheets email profile',
            callback: (tokenResponse: any) => {
              if (tokenResponse && tokenResponse.access_token) {
                gapi.client.setToken({ access_token: tokenResponse.access_token });
                localStorage.setItem('PDO_IS_SIGNED_IN', 'true');
                localStorage.setItem('GAPI_ACCESS_TOKEN', JSON.stringify({
                  token: tokenResponse.access_token,
                  expiresAt: Date.now() + tokenResponse.expires_in * 1000
                }));

                // Fetch Google profile userinfo SEBELUM dispatch success
                // agar PDO_USER_EMAIL tersedia saat LoginScreen melanjutkan
                fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                })
                  .then(res => res.json())
                  .then(info => {
                    if (info && info.email) {
                      localStorage.setItem('PDO_USER_EMAIL', info.email);
                      localStorage.setItem('PDO_USER_NAME', info.name || info.email);
                      localStorage.setItem('PDO_USER_AVATAR', info.picture || '');
                    }
                    // Dispatch SETELAH userinfo tersimpan ke localStorage
                    window.dispatchEvent(new CustomEvent('google-login-success', {
                      detail: { email: info?.email, name: info?.name, avatar: info?.picture }
                    }));
                  })
                  .catch(() => {
                    // Fallback: tetap dispatch success meskipun userinfo gagal
                    window.dispatchEvent(new Event('google-login-success'));
                  });

                // BUG-11: Mulai timer refresh token otomatis
                startTokenRefreshTimer(tokenResponse.expires_in * 1000);
              } else if (tokenResponse && tokenResponse.error) {
                window.dispatchEvent(new CustomEvent('google-login-error', { detail: tokenResponse }));
              }
            },
            // BUG-04: Tangkap semua kegagalan popup (ditutup user, akses ditolak, dll.)
            error_callback: (err: any) => {
              window.dispatchEvent(new CustomEvent('google-login-error', { detail: err }));
            },
          });
          resolve();
        };
        script.onerror = () => reject(new Error('Gagal memuat Google Identity Services'));
        document.body.appendChild(script);
        
      } catch (error) {
        reject(error);
      }
    });
  });
};

export const signIn = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Token client belum siap'));
      return;
    }
    
    let settled = false;

    const cleanup = () => {
      window.removeEventListener('google-login-success', handleSuccess);
      window.removeEventListener('google-login-error', handleError as EventListener);
      clearTimeout(timeoutId);
    };

    const handleSuccess = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    };

    // BUG-04: Tangkap error dari popup (ditutup/dibatalkan user)
    const handleError = (e: CustomEvent) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(e.detail || new Error('Login dibatalkan'));
    };

    // BUG-04: Timeout pengaman 60 detik jika Google tidak memberi respons apa pun
    const timeoutId = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error('Login timeout: tidak ada respons dari Google. Silakan coba lagi.'));
    }, 60000);

    window.addEventListener('google-login-success', handleSuccess);
    window.addEventListener('google-login-error', handleError as EventListener);
    
    // Trigger popup
    tokenClient.requestAccessToken({ prompt: 'consent' });
  });
};

export const signOut = async () => {
  const tokenStr = localStorage.getItem('GAPI_ACCESS_TOKEN');
  if (tokenStr) {
    try {
      const tokenObj = JSON.parse(tokenStr);
      if ((window as any).google) {
        (window as any).google.accounts.oauth2.revoke(tokenObj.token, () => {});
      }
    } catch (e) {}
  }
  localStorage.removeItem('GAPI_ACCESS_TOKEN');
  localStorage.removeItem('PDO_IS_SIGNED_IN');
  localStorage.removeItem('PDO_USER_EMAIL');
  localStorage.removeItem('PDO_USER_NAME');
  localStorage.removeItem('PDO_USER_AVATAR');
  gapi.client.setToken(null);
};

export const ensureValidToken = async (): Promise<void> => {
  const isPersistentSignedIn = localStorage.getItem('PDO_IS_SIGNED_IN') === 'true';
  if (!isPersistentSignedIn) return;

  const tokenStr = localStorage.getItem('GAPI_ACCESS_TOKEN');
  if (tokenStr) {
    try {
      const tokenObj = JSON.parse(tokenStr);
      // Jika token masih berlaku lebih dari 2 menit, pasang ke gapi client
      if (tokenObj.token && tokenObj.expiresAt && tokenObj.expiresAt - Date.now() > 2 * 60 * 1000) {
        if (gapi.client) {
          gapi.client.setToken({ access_token: tokenObj.token });
        }
        return;
      }
    } catch (e) {}
  }

  // Lakukan silent token refresh tanpa prompt consent
  await refreshTokenInteractiveOrSilent(true);
};

export function isAuthError(err: any): boolean {
  if (!err) return false;

  const status = err.status || err.result?.error?.code || err.code;
  const statusStr = String(err.statusText || err.result?.error?.status || '').toUpperCase();
  const message = String(err.message || err.result?.error?.message || err.error?.message || '').toLowerCase();

  // 401 is ALWAYS an authentication token error
  if (status === 401 || statusStr === 'UNAUTHENTICATED') return true;

  // File permission error ("The caller does not have permission") is NOT an auth token error!
  // It means the user is logged in, but their Google account doesn't have access to this specific Google Sheet file.
  if (message.includes('caller does not have permission') || message.includes('does not have permission')) {
    return false;
  }

  // 403 is an auth error ONLY IF it is due to insufficient scopes or invalid credentials
  if (status === 403 || statusStr === 'PERMISSION_DENIED' || statusStr === 'FORBIDDEN') {
    return (
      message.includes('insufficient') ||
      message.includes('scope') ||
      message.includes('invalid credentials') ||
      message.includes('token expired') ||
      message.includes('access token') ||
      message.includes('oauth')
    );
  }

  return (
    message.includes('401') ||
    message.includes('unauthenticated') ||
    message.includes('invalid credentials') ||
    message.includes('token expired')
  );
}

let tokenRefreshPromise: Promise<void> | null = null;

export const refreshTokenInteractiveOrSilent = async (silentOnly = false): Promise<void> => {
  if (!tokenClient) return;
  if (tokenRefreshPromise) return tokenRefreshPromise;

  tokenRefreshPromise = new Promise<void>((resolve) => {
    let settled = false;

    const cleanup = () => {
      window.removeEventListener('google-login-success', handleSuccess);
      window.removeEventListener('google-login-error', handleError);
      tokenRefreshPromise = null;
    };

    const handleSuccess = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    };

    const handleError = () => {
      if (settled) return;
      settled = true;
      cleanup();
      if (!silentOnly && tokenClient) {
        // Jika silent refresh gagal dan butuh interaksi, jalankan consent prompt
        try {
          tokenClient.requestAccessToken({ prompt: 'consent' });
        } catch (e) {}
      }
      resolve();
    };

    window.addEventListener('google-login-success', handleSuccess);
    window.addEventListener('google-login-error', handleError);

    try {
      tokenClient.requestAccessToken({ prompt: '' });
    } catch (e) {
      if (!settled) {
        settled = true;
        cleanup();
        resolve();
      }
    }

    setTimeout(() => {
      if (!settled) {
        settled = true;
        cleanup();
        resolve();
      }
    }, 8000); // ponytail: 8 detik untuk mengakomodasi sinyal lemah di lapangan (BUG-38)
  });

  return tokenRefreshPromise;
};

export const reauthenticateSession = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Token client belum siap'));
      return;
    }
    
    let settled = false;

    const cleanup = () => {
      window.removeEventListener('google-login-success', handleSuccess);
      window.removeEventListener('google-login-error', handleError as EventListener);
      clearTimeout(timeoutId);
    };

    const handleSuccess = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    };

    const handleError = (e: CustomEvent) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(e.detail || new Error('Perbaruan sesi dibatalkan'));
    };

    const timeoutId = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error('Perbaruan sesi timeout: tidak ada respons dari Google. Silakan coba lagi.'));
    }, 60000);

    window.addEventListener('google-login-success', handleSuccess);
    window.addEventListener('google-login-error', handleError as EventListener);
    
    // Trigger popup directly from user gesture (click event)
    // Omit prompt: 'consent' so GIS uses existing consent for instant 1-tap token renewal
    try {
      tokenClient.requestAccessToken();
    } catch (e) {
      tokenClient.requestAccessToken({ prompt: 'select_account' });
    }
  });
};

export async function withAuthRetry<T>(apiFn: () => Promise<T>): Promise<T> {
  await ensureValidToken();
  try {
    return await apiFn();
  } catch (err: any) {
    if (isAuthError(err)) {
      console.warn('[GoogleSheets] Access Token kedaluwarsa/unauthorized (401/403). Memicu modal re-auth...');
      window.dispatchEvent(new CustomEvent('google-auth-expired'));
    }
    throw err;
  }
}

export const checkSignedIn = (): boolean => {
  const isPersistentSignedIn = localStorage.getItem('PDO_IS_SIGNED_IN') === 'true';
  if (!isPersistentSignedIn) return false;

  const tokenStr = localStorage.getItem('GAPI_ACCESS_TOKEN');
  if (tokenStr) {
    try {
      const tokenObj = JSON.parse(tokenStr);
      if (tokenObj.token && gapi.client) {
        gapi.client.setToken({ access_token: tokenObj.token });
      }
      if (tokenObj.expiresAt && tokenObj.expiresAt > Date.now()) {
        startTokenRefreshTimer(tokenObj.expiresAt - Date.now());
      } else {
        ensureValidToken();
      }
    } catch (e) {
      ensureValidToken();
    }
  } else {
    ensureValidToken();
  }

  // ATURAN EMAS #3: Sesi login dibuat PERMANEN tanpa batas waktu.
  // Selama PDO_IS_SIGNED_IN === 'true', tetap pertahankan pengguna di halaman utama!
  return true;
};

// BUG-11: Timer refresh token proaktif
let refreshTimerId: ReturnType<typeof setTimeout> | null = null;

function startTokenRefreshTimer(expiresInMs: number) {
  stopTokenRefreshTimer();
  // Refresh 5 menit sebelum kedaluwarsa (atau segera jika < 5 menit tersisa)
  const FIVE_MINUTES = 5 * 60 * 1000;
  const refreshDelay = Math.max(expiresInMs - FIVE_MINUTES, 0);
  
  refreshTimerId = setTimeout(async () => {
    try {
      if (tokenClient) {
        // Silent refresh — tanpa prompt consent
        tokenClient.requestAccessToken({ prompt: '' });
      }
    } catch {
      window.dispatchEvent(new CustomEvent('google-token-expiring'));
    }
  }, refreshDelay);
}

function stopTokenRefreshTimer() {
  if (refreshTimerId !== null) {
    clearTimeout(refreshTimerId);
    refreshTimerId = null;
  }
}

export const extractSheetId = (urlOrId: string) => {
  if (!urlOrId) return '';
  // match /d/SPREADSHEET_ID/
  const match = urlOrId.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return urlOrId; // fallback if they just pasted the ID
};

export interface HeaderMap {
  [key: string]: number;
}

export interface BusData {
  rowIndex: number; // 1-based index in the sheet
  unit: string;
  toaShift1: string;
  toaShift2: string;
  manualShift1: string;
  manualShift2: string;
  totalToa: string;
  kmAwal1: string;
  kmAkhir1: string;
  kmAwal2: string;
  kmAkhir2: string;
  keterangan: string;
  originalRow: string[];
}

// Function to normalize header strings for fuzzy matching
const normalizeString = (str: string) => {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
};

// Map keywords to standard fields
const HEADER_KEYWORDS: Record<string, string[]> = {
  unit: ['nobody', 'unit', 'bus', 'body'],
  toaShift1: ['toashift1', 'toashifti', 'toas1', 'toasi'],
  toaShift2: ['toashift2', 'toashiftii', 'toas2', 'toasii'],
  manualShift1: ['manualshift1', 'manualshifti', 'manual1', 'manuals1', 'manualsi'],
  manualShift2: ['manualshift2', 'manualshiftii', 'manual2', 'manuals2', 'manualsii'],
  totalToa: ['totaltoa', 'total'],
  kmAwal1: ['kilometerawalshift1', 'kmawalshift1', 'kmawal1', 'kmawalshifti', 'kmawals1', 'kmawalsi'],
  kmAkhir1: ['kilometerakhirshift1', 'kmakhirshift1', 'kmakhir1', 'kmakhirshifti', 'kmakhirs1', 'kmakhirsi'],
  kmAwal2: ['kilometerawalshift2', 'kmawalshift2', 'kmawal2', 'kmawalshiftii', 'kmawals2', 'kmawalsii'],
  kmAkhir2: ['kilometerakhirshift2', 'kmakhirshift2', 'kmakhir2', 'kmakhirshiftii', 'kmakhirs2', 'kmakhirsii'],
  keterangan: ['keterangan', 'ket', 'notes', 'catatan'],
};

const findColumnIndex = (headers: string[], keywords: string[]): number => {
  for (let i = 0; i < headers.length; i++) {
    const header = normalizeString(headers[i]);
    if (keywords.some(kw => header.includes(kw))) {
      return i;
    }
  }
  return -1;
};

import { parseIndonesianNumber } from '../utils/numberUtils';
export { parseIndonesianNumber };

export function detectHeaderRowAndBuildComposite(rows: any[][]): { headerRowIndex: number; isSubHeader: boolean; compositeHeaders: string[] } {
  let headerRowIndex = -1;
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    const row = rows[i];
    if (!row) continue;
    if (findColumnIndex(row, HEADER_KEYWORDS.unit) !== -1) {
      // BUG-10: Validasi tambahan — baris header seharusnya berisi mayoritas teks (≥50%), bukan angka murni
      const nonEmptyCells = row.filter((cell: any) => cell !== undefined && cell !== null && String(cell).trim() !== '');
      const textCells = nonEmptyCells.filter((cell: any) => isNaN(Number(String(cell).trim())));
      if (nonEmptyCells.length === 0 || textCells.length / nonEmptyCells.length >= 0.5) {
        headerRowIndex = i;
        break;
      }
    }
  }

  if (headerRowIndex === -1) {
    return { headerRowIndex: -1, isSubHeader: false, compositeHeaders: [] };
  }

  let isSubHeader = false;
  if (headerRowIndex + 1 < rows.length) {
    const nextRow = rows[headerRowIndex + 1];
    const unitColIdx = findColumnIndex(rows[headerRowIndex], HEADER_KEYWORDS.unit);
    const unitNextVal = nextRow && nextRow[unitColIdx] ? String(nextRow[unitColIdx]).trim() : '';
    if (unitNextVal === '') {
      isSubHeader = true;
    }
  }

  const compositeHeaders: string[] = [];
  const maxCols = Math.max(
    rows[headerRowIndex].length,
    isSubHeader ? (rows[headerRowIndex + 1]?.length || 0) : 0
  );

  let lastMainHeader = '';
  for (let j = 0; j < maxCols; j++) {
    let mainHeaderVal = rows[headerRowIndex][j] ? String(rows[headerRowIndex][j]).trim() : '';
    if (mainHeaderVal !== '') {
      lastMainHeader = mainHeaderVal;
    } else {
      mainHeaderVal = lastMainHeader;
    }
    
    let headerText = mainHeaderVal;
    if (isSubHeader && rows[headerRowIndex + 1] && rows[headerRowIndex + 1][j]) {
      const subHeaderVal = String(rows[headerRowIndex + 1][j]).trim();
      if (subHeaderVal !== '') {
        headerText += ' ' + subHeaderVal;
      }
    }
    
    compositeHeaders[j] = headerText;
  }

  return { headerRowIndex, isSubHeader, compositeHeaders };
}

export const getBusData = async (sheetId: string, tabName: string): Promise<{ data: BusData[], headerMap: HeaderMap, missingColumns: string[], sheetSummary: Record<string, number> }> => {
  return withAuthRetry(async () => {
    try {
      const response = await (gapi.client as any).sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${tabName}!A1:ZZ`, 
    });

    const rows = response.result.values;
    if (!rows || rows.length === 0) {
      throw new Error('Tidak ada data di sheet ini.');
    }

    // BUG-26: Use unified header detection with BUG-10 text validation
    const { headerRowIndex, isSubHeader, compositeHeaders } = detectHeaderRowAndBuildComposite(rows);

    if (headerRowIndex === -1) {
      throw new Error('Tidak bisa menemukan kolom "No Body / Unit". Pastikan header berisikan kata "No Body" atau "Unit".');
    }
    
    const headerMap: HeaderMap = {
      unit: findColumnIndex(compositeHeaders, HEADER_KEYWORDS.unit),
      toaShift1: findColumnIndex(compositeHeaders, HEADER_KEYWORDS.toaShift1),
      toaShift2: findColumnIndex(compositeHeaders, HEADER_KEYWORDS.toaShift2),
      manualShift1: findColumnIndex(compositeHeaders, HEADER_KEYWORDS.manualShift1),
      manualShift2: findColumnIndex(compositeHeaders, HEADER_KEYWORDS.manualShift2),
      totalToa: findColumnIndex(compositeHeaders, HEADER_KEYWORDS.totalToa),
      kmAwal1: findColumnIndex(compositeHeaders, HEADER_KEYWORDS.kmAwal1),
      kmAkhir1: findColumnIndex(compositeHeaders, HEADER_KEYWORDS.kmAkhir1),
      kmAwal2: findColumnIndex(compositeHeaders, HEADER_KEYWORDS.kmAwal2),
      kmAkhir2: findColumnIndex(compositeHeaders, HEADER_KEYWORDS.kmAkhir2),
      keterangan: findColumnIndex(compositeHeaders, HEADER_KEYWORDS.keterangan),
    };

    // BUG-05: Validasi SEMUA field, bukan hanya 'unit'
    const FIELD_LABELS: Record<string, string> = {
      toaShift1: 'TOA Shift 1',
      manualShift1: 'Manual Shift 1',
      manualShift2: 'Manual Shift 2',
      totalToa: 'Total TOA',
      kmAwal1: 'KM Awal Shift 1',
      kmAkhir1: 'KM Akhir Shift 1',
      kmAwal2: 'KM Awal Shift 2',
      kmAkhir2: 'KM Akhir Shift 2',
      keterangan: 'Keterangan',
    };
    const missingColumns: string[] = [];
    for (const [key, label] of Object.entries(FIELD_LABELS)) {
      if (headerMap[key] === -1) {
        missingColumns.push(label);
      }
    }

    const getValue = (row: any[], idx: number) => {
      if (idx === -1) return '';
      const val = row[idx];
      return val !== undefined && val !== null ? String(val) : '';
    };

    const km1Idx = findColumnIndex(compositeHeaders, ['km1']);
    const km2Idx = findColumnIndex(compositeHeaders, ['km2']);

    const data: BusData[] = [];
    const sheetSummary: Record<string, number> = {};

    // Data starts after the header(s)
    const dataStartIndex = isSubHeader ? headerRowIndex + 2 : headerRowIndex + 1;
    for (let i = dataStartIndex; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;
      const unitVal = row[headerMap.unit];
      
      // If unit is present, parse bus data
      if (unitVal && String(unitVal).trim() !== '') {
        let kmAwal1Val = getValue(row, headerMap.kmAwal1);
        let kmAkhir1Val = getValue(row, headerMap.kmAkhir1);
        let kmAwal2Val = getValue(row, headerMap.kmAwal2);
        let kmAkhir2Val = getValue(row, headerMap.kmAkhir2);

        // Fallback: If individual KM fields are empty, parse from KM 1 (Col O) or KM 2 (Col P) if available (e.g., 14.011 -> 14 & 011)
        if ((!kmAwal1Val || !kmAkhir1Val) && km1Idx !== -1) {
          const rawKm1 = getValue(row, km1Idx);
          if (rawKm1 && rawKm1.includes('.')) {
            const parts = rawKm1.split('.');
            if (!kmAwal1Val) kmAwal1Val = parts[0];
            if (!kmAkhir1Val) kmAkhir1Val = parts[1];
          }
        }

        if ((!kmAwal2Val || !kmAkhir2Val) && km2Idx !== -1) {
          const rawKm2 = getValue(row, km2Idx);
          if (rawKm2 && rawKm2.includes('.')) {
            const parts = rawKm2.split('.');
            if (!kmAwal2Val) kmAwal2Val = parts[0];
            if (!kmAkhir2Val) kmAkhir2Val = parts[1];
          }
        }

        let toaShift1Val = getValue(row, headerMap.toaShift1);
        let toaShift2Val = getValue(row, headerMap.toaShift2);
        let totalToaVal = getValue(row, headerMap.totalToa);

        if (!toaShift2Val && totalToaVal && toaShift1Val) {
          const tot = parseIndonesianNumber(totalToaVal);
          const t1 = parseIndonesianNumber(toaShift1Val);
          toaShift2Val = Math.max(0, tot - t1).toString();
        }

        data.push({
          rowIndex: i + 1, // Sheets API uses 1-based index (A1)
          unit: String(unitVal),
          toaShift1: toaShift1Val,
          toaShift2: toaShift2Val || '0',
          manualShift1: getValue(row, headerMap.manualShift1),
          manualShift2: getValue(row, headerMap.manualShift2),
          totalToa: totalToaVal,
          kmAwal1: kmAwal1Val,
          kmAkhir1: kmAkhir1Val,
          kmAwal2: kmAwal2Val,
          kmAkhir2: kmAkhir2Val,
          keterangan: getValue(row, headerMap.keterangan),
          originalRow: row
        });
      } else {
        // Scan summary rows below table
        row.forEach((cellVal: any, colIdx: number) => {
          if (!cellVal) return;
          const cleanStr = String(cellVal).replace(/\s+/g, ' ').trim().toLowerCase();

          let key = '';
          if (cleanStr.includes('pelanggan/km') || cleanStr.includes('pelanggan / km') || cleanStr.includes('pelanggan/ km')) {
            key = 'passengersPerKm';
          } else if (cleanStr.includes('km/bus') || cleanStr.includes('km / bus') || cleanStr.includes('km /bus') || cleanStr.includes('km/ bus')) {
            key = 'kmPerBus';
          } else if (cleanStr.includes('total pelanggan')) {
            key = 'totalPassengers';
          } else if (cleanStr.includes('total km')) {
            key = 'totalKm';
          } else if (cleanStr.includes('toa shift 1') || cleanStr.includes('toa s1')) {
            key = 'totalToaShift1';
          } else if (cleanStr.includes('manual shift 1') || cleanStr.includes('manual s1')) {
            key = 'totalManualShift1';
          } else if (cleanStr.includes('shift 1') || cleanStr.includes('total s1')) {
            key = 'totalShift1';
          } else if (cleanStr.includes('toa shift 2') || cleanStr.includes('toa s2')) {
            key = 'totalToaShift2';
          } else if (cleanStr.includes('manual shift 2') || cleanStr.includes('manual s2')) {
            key = 'totalManualShift2';
          } else if (cleanStr.includes('shift 2') || cleanStr.includes('total s2')) {
            key = 'totalShift2';
          } else if (cleanStr === 'total toa' || cleanStr.startsWith('total toa')) {
            key = 'grandTotalToa';
          } else if (cleanStr === 'total manual' || cleanStr.startsWith('total manual')) {
            key = 'grandTotalManual';
          }

          if (key && sheetSummary[key] === undefined) {
            for (let offset = 1; offset <= 3; offset++) {
              const nextVal = row[colIdx + offset];
              const parsedNum = parseIndonesianNumber(nextVal);
              if (!isNaN(parsedNum)) {
                sheetSummary[key] = parsedNum;
                break;
              }
            }
          }
        });
      }
    }

    return { data, headerMap, missingColumns, sheetSummary };
  } catch (error: any) {
    console.error('Error fetching data', error);
    if (isAuthError(error)) {
      throw error;
    }
    throw new Error(error?.result?.error?.message || 'Gagal mengambil data dari Google Sheets. Pastikan link benar dan Anda memiliki akses.');
  }
  });
};

export const getBusRowData = async (
  sheetId: string, 
  tabName: string, 
  rowIndex: number, 
  headerMap: HeaderMap
): Promise<Partial<BusData>> => {
  return withAuthRetry(async () => {
    try {
      const response = await (gapi.client as any).sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${tabName}!A${rowIndex}:ZZ${rowIndex}`, 
    });

    const rows = response.result.values;
    if (!rows || rows.length === 0) {
      return {}; // Row is empty
    }

    const row = rows[0];
    
    const getValue = (idx: number) => {
      if (idx === -1) return '';
      const val = row[idx];
      return val !== undefined && val !== null ? String(val) : '';
    };

    return {
      toaShift1: getValue(headerMap.toaShift1),
      manualShift1: getValue(headerMap.manualShift1),
      manualShift2: getValue(headerMap.manualShift2),
      totalToa: getValue(headerMap.totalToa),
      kmAwal1: getValue(headerMap.kmAwal1),
      kmAkhir1: getValue(headerMap.kmAkhir1),
      kmAwal2: getValue(headerMap.kmAwal2),
      kmAkhir2: getValue(headerMap.kmAkhir2),
      keterangan: getValue(headerMap.keterangan),
    };
  } catch (error: any) {
    throw new Error(error?.result?.error?.message || 'Gagal melakukan pengecekan data.');
  }
  });
};

const numberToColumnName = (num: number): string => {
  let col = '';
  let n = num + 1; // 1-based
  while (n > 0) {
    let mod = (n - 1) % 26;
    col = String.fromCharCode(65 + mod) + col;
    n = Math.floor((n - mod) / 26);
  }
  return col;
};

export const updateBusData = async (
  sheetId: string, 
  tabName: string, 
  rowIndex: number, 
  updates: Partial<BusData>, 
  headerMap: HeaderMap
): Promise<void> => {
  return withAuthRetry(async () => {
    // We construct individual updates for each cell to avoid overwriting formulas
    const data: any[] = [];
    
    const addUpdate = (key: keyof HeaderMap, value: any) => {
      const colIndex = headerMap[key];
      if (colIndex !== -1 && value !== undefined) {
        const colName = numberToColumnName(colIndex);
        data.push({
          range: `${tabName}!${colName}${rowIndex}`,
          values: [[value]]
        });
      }
    };

    addUpdate('toaShift1', updates.toaShift1);
    addUpdate('manualShift1', updates.manualShift1);
    addUpdate('manualShift2', updates.manualShift2);
    addUpdate('totalToa', updates.totalToa);
    addUpdate('kmAwal1', updates.kmAwal1);
    addUpdate('kmAkhir1', updates.kmAkhir1);
    addUpdate('kmAwal2', updates.kmAwal2);
    addUpdate('kmAkhir2', updates.kmAkhir2);
    addUpdate('keterangan', updates.keterangan);

    if (data.length === 0) return; // Nothing to update

    try {
      await (gapi.client as any).sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: sheetId,
        resource: {
          valueInputOption: 'USER_ENTERED', // So numbers/formulas are parsed properly
          data: data
        }
      });
    } catch (error: any) {
      console.error('Error updating data', error);
      if (isAuthError(error)) {
        throw error;
      }
      throw new Error(error?.result?.error?.message || 'Gagal menyimpan data.');
    }
  });
};

const monthlyToaTrendCache = new Map<string, { day: string; totalToa: number }[]>();

export function clearMonthlyToaTrendCache(): void {
  monthlyToaTrendCache.clear();
}

export const getMonthlyToaTrend = async (
  sheetId: string, 
  maxDay: number,
  unitFilter?: string,
  bypassCache = false
): Promise<{ day: string; totalToa: number }[]> => {
  const cacheKey = `${sheetId}_${maxDay}_${unitFilter || 'ALL'}`;
  if (!bypassCache && monthlyToaTrendCache.has(cacheKey)) {
    return monthlyToaTrendCache.get(cacheKey)!;
  }

  return withAuthRetry(async () => {
    const trendData: { day: string; totalToa: number }[] = [];
    
    if (!sheetId || maxDay < 1) return trendData;

  const ranges: string[] = [];
  for (let day = 1; day <= maxDay; day++) {
    ranges.push(`${day}!A1:ZZ100`);
  }

  try {
    const response = await (gapi.client as any).sheets.spreadsheets.values.batchGet({
      spreadsheetId: sheetId,
      ranges: ranges,
    });

    const valueRanges = response?.result?.valueRanges || [];
    const normalizedUnitFilter = unitFilter ? unitFilter.trim().toLowerCase() : null;

    for (let idx = 0; idx < maxDay; idx++) {
      const dayStr = (idx + 1).toString();
      const vr = valueRanges[idx];
      const rows = vr?.values;

      if (!rows || rows.length === 0) {
        trendData.push({ day: dayStr, totalToa: 0 });
        continue;
      }

      // BUG-26: Use unified header detection with text cell percentage check
      const { headerRowIndex, isSubHeader, compositeHeaders } = detectHeaderRowAndBuildComposite(rows);

      if (headerRowIndex === -1) {
        trendData.push({ day: dayStr, totalToa: 0 });
        continue;
      }

      const unitColIdx = findColumnIndex(compositeHeaders, HEADER_KEYWORDS.unit);
      const toaShift1ColIdx = findColumnIndex(compositeHeaders, HEADER_KEYWORDS.toaShift1);
      const toaShift2ColIdx = findColumnIndex(compositeHeaders, HEADER_KEYWORDS.toaShift2);
      const totalToaColIdx = findColumnIndex(compositeHeaders, HEADER_KEYWORDS.totalToa);
      const manualShift1ColIdx = findColumnIndex(compositeHeaders, HEADER_KEYWORDS.manualShift1);
      const manualShift2ColIdx = findColumnIndex(compositeHeaders, HEADER_KEYWORDS.manualShift2);

      const startRowIdx = headerRowIndex + (isSubHeader ? 2 : 1);
      const tabSummary: Record<string, number> = {};
      let totalToaShift1 = 0;
      let totalManualShift1 = 0;
      let totalToaShift2 = 0;
      let totalManualShift2 = 0;
      let unitDayTotal = 0;
      let unitFound = false;

      for (let r = startRowIdx; r < rows.length; r++) {
        const row = rows[r];
        if (!row || row.length === 0) continue;

        const unitVal = unitColIdx !== -1 && row[unitColIdx] ? String(row[unitColIdx]).trim() : '';

        if (unitVal !== '') {
          if (normalizedUnitFilter) {
            if (unitVal.toLowerCase() === normalizedUnitFilter) {
              unitFound = true;
              let tot = totalToaColIdx !== -1 ? parseIndonesianNumber(row[totalToaColIdx], NaN) : NaN;
              let toa1 = toaShift1ColIdx !== -1 ? parseIndonesianNumber(row[toaShift1ColIdx], NaN) : NaN;
              let toa2 = toaShift2ColIdx !== -1 ? parseIndonesianNumber(row[toaShift2ColIdx], NaN) : NaN;
              let man1 = manualShift1ColIdx !== -1 ? parseIndonesianNumber(row[manualShift1ColIdx], NaN) : NaN;
              let man2 = manualShift2ColIdx !== -1 ? parseIndonesianNumber(row[manualShift2ColIdx], NaN) : NaN;

              if (!isNaN(tot)) {
                unitDayTotal += tot;
              } else {
                const s1 = isNaN(toa1) ? 0 : toa1;
                const s2 = isNaN(toa2) ? 0 : toa2;
                const m1 = isNaN(man1) ? 0 : man1;
                const m2 = isNaN(man2) ? 0 : man2;
                unitDayTotal += (s1 + s2 + m1 + m2);
              }
            }
          } else {
            // Bus data row for overall route
            let toa1 = toaShift1ColIdx !== -1 ? parseIndonesianNumber(row[toaShift1ColIdx], NaN) : NaN;
            let man1 = manualShift1ColIdx !== -1 ? parseIndonesianNumber(row[manualShift1ColIdx], NaN) : NaN;
            let toa2 = toaShift2ColIdx !== -1 ? parseIndonesianNumber(row[toaShift2ColIdx], NaN) : NaN;
            let man2 = manualShift2ColIdx !== -1 ? parseIndonesianNumber(row[manualShift2ColIdx], NaN) : NaN;

            if (!isNaN(toa1)) totalToaShift1 += toa1;
            if (!isNaN(man1)) totalManualShift1 += man1;
            if (!isNaN(toa2)) totalToaShift2 += toa2;
            if (!isNaN(man2)) totalManualShift2 += man2;
          }
        } else if (!normalizedUnitFilter) {
          // Summary row below table (exact match to getBusData summary scanning)
          row.forEach((cellVal: any, colIdx: number) => {
            if (!cellVal) return;
            const cleanStr = String(cellVal).replace(/\s+/g, ' ').trim().toLowerCase();

            let key = '';
            if (cleanStr.includes('total pelanggan') || cleanStr === 'total pnp') {
              key = 'totalPassengers';
            } else if (cleanStr === 'total toa' || cleanStr.startsWith('total toa')) {
              key = 'grandTotalToa';
            }

            if (key && tabSummary[key] === undefined) {
              for (let offset = 1; offset <= 3; offset++) {
                const nextVal = row[colIdx + offset];
                const parsedNum = parseIndonesianNumber(nextVal);
                if (!isNaN(parsedNum)) {
                  tabSummary[key] = parsedNum;
                  break;
                }
              }
            }
          });
        }
      }

      if (normalizedUnitFilter) {
        trendData.push({ day: dayStr, totalToa: unitFound ? unitDayTotal : 0 });
      } else {
        const calculatedTotalPassengers = totalToaShift1 + totalManualShift1 + totalToaShift2 + totalManualShift2;
        const finalDayTotal = tabSummary['totalPassengers'] !== undefined && !isNaN(tabSummary['totalPassengers'])
          ? tabSummary['totalPassengers']
          : calculatedTotalPassengers;

        // BUG-21: Preserve pure raw decimal SSOT value without rounding in service layer
        trendData.push({ day: dayStr, totalToa: finalDayTotal });
      }
    }
  } catch (error) {
    console.error('Error fetching batch monthly TOA trend:', error);
    for (let day = 1; day <= maxDay; day++) {
      trendData.push({ day: day.toString(), totalToa: 0 });
    }
  }

  if (trendData.length > 0) {
    monthlyToaTrendCache.set(cacheKey, trendData);
  }
  return trendData;
  });
};

export const getAccumulatedBusData = async (
  sheetId: string,
  maxDay: number
): Promise<{ data: BusData[]; headerMap: HeaderMap; missingColumns: string[]; sheetSummary: Record<string, number> }> => {
  return withAuthRetry(async () => {
    const today = new Date().getDate();
    const targetEndDay = Math.min(maxDay, Math.max(1, today));

    const ranges = Array.from({ length: targetEndDay }, (_, i) => `${i + 1}!A1:ZZ`);

    let valueRanges: any[] = [];
    try {
      const response = await (gapi.client as any).sheets.spreadsheets.values.batchGet({
        spreadsheetId: sheetId,
        ranges,
      });
      valueRanges = response.result.valueRanges || [];
    } catch (_err) {
      // Fallback if batchGet fails
      const singleRes = await getBusData(sheetId, String(targetEndDay));
      return singleRes;
    }

    const unitMap = new Map<string, BusData>();
    let firstHeaderMap: HeaderMap | null = null;

    for (let idx = 0; idx < valueRanges.length; idx++) {
      const vr = valueRanges[idx];
      const rows = vr?.values;
      if (!rows || rows.length === 0) continue;

      const { headerRowIndex, isSubHeader, compositeHeaders } = detectHeaderRowAndBuildComposite(rows);
      if (headerRowIndex === -1) continue;

      const headerMap: HeaderMap = {
        unit: findColumnIndex(compositeHeaders, HEADER_KEYWORDS.unit),
        toaShift1: findColumnIndex(compositeHeaders, HEADER_KEYWORDS.toaShift1),
        toaShift2: findColumnIndex(compositeHeaders, HEADER_KEYWORDS.toaShift2),
        manualShift1: findColumnIndex(compositeHeaders, HEADER_KEYWORDS.manualShift1),
        manualShift2: findColumnIndex(compositeHeaders, HEADER_KEYWORDS.manualShift2),
        totalToa: findColumnIndex(compositeHeaders, HEADER_KEYWORDS.totalToa),
        kmAwal1: findColumnIndex(compositeHeaders, HEADER_KEYWORDS.kmAwal1),
        kmAkhir1: findColumnIndex(compositeHeaders, HEADER_KEYWORDS.kmAkhir1),
        kmAwal2: findColumnIndex(compositeHeaders, HEADER_KEYWORDS.kmAwal2),
        kmAkhir2: findColumnIndex(compositeHeaders, HEADER_KEYWORDS.kmAkhir2),
        keterangan: findColumnIndex(compositeHeaders, HEADER_KEYWORDS.keterangan),
      };

      if (!firstHeaderMap && headerMap.unit !== -1) {
        firstHeaderMap = headerMap;
      }

      const startRowIdx = headerRowIndex + (isSubHeader ? 2 : 1);

      for (let r = startRowIdx; r < rows.length; r++) {
        const row = rows[r];
        if (!row || row.length === 0) continue;

        const getVal = (colIdx: number) => (colIdx !== -1 && row[colIdx] !== undefined ? String(row[colIdx]).trim() : "");
        const unitName = getVal(headerMap.unit);
        if (!unitName) continue;

        const kmA1 = parseIndonesianNumber(getVal(headerMap.kmAwal1));
        const kmAkh1 = parseIndonesianNumber(getVal(headerMap.kmAkhir1));
        const kmA2 = parseIndonesianNumber(getVal(headerMap.kmAwal2));
        const kmAkh2 = parseIndonesianNumber(getVal(headerMap.kmAkhir2));
        const kmS1 = kmAkh1 > kmA1 ? kmAkh1 - kmA1 : 0;
        const kmS2 = kmAkh2 > kmA2 ? kmAkh2 - kmA2 : 0;

        const toa1 = parseIndonesianNumber(getVal(headerMap.toaShift1));
        const man1 = parseIndonesianNumber(getVal(headerMap.manualShift1));
        const toa2 = parseIndonesianNumber(getVal(headerMap.toaShift2));
        const man2 = parseIndonesianNumber(getVal(headerMap.manualShift2));
        const totToa = parseIndonesianNumber(getVal(headerMap.totalToa));
        const ket = getVal(headerMap.keterangan);

        const existing = unitMap.get(unitName);
        if (!existing) {
          unitMap.set(unitName, {
            rowIndex: r + 1,
            unit: unitName,
            toaShift1: toa1 > 0 ? toa1.toString() : "",
            manualShift1: man1 > 0 ? man1.toString() : "",
            toaShift2: toa2 > 0 ? toa2.toString() : "",
            manualShift2: man2 > 0 ? man2.toString() : "",
            totalToa: totToa > 0 ? totToa.toString() : (toa1 + toa2).toString(),
            kmAwal1: "0",
            kmAkhir1: kmS1.toString(),
            kmAwal2: "0",
            kmAkhir2: kmS2.toString(),
            keterangan: ket,
            originalRow: row.map(String),
          });
        } else {
          const exKmA1 = parseIndonesianNumber(existing.kmAwal1);
          const exKmAkh1 = parseIndonesianNumber(existing.kmAkhir1);
          const exKmA2 = parseIndonesianNumber(existing.kmAwal2);
          const exKmAkh2 = parseIndonesianNumber(existing.kmAkhir2);
          const exKmS1 = exKmAkh1 > exKmA1 ? exKmAkh1 - exKmA1 : 0;
          const exKmS2 = exKmAkh2 > exKmA2 ? exKmAkh2 - exKmA2 : 0;

          const newKmS1 = exKmS1 + kmS1;
          const newKmS2 = exKmS2 + kmS2;

          const exToa1 = parseIndonesianNumber(existing.toaShift1);
          const exMan1 = parseIndonesianNumber(existing.manualShift1);
          const exToa2 = parseIndonesianNumber(existing.toaShift2);
          const exMan2 = parseIndonesianNumber(existing.manualShift2);
          const exTotToa = parseIndonesianNumber(existing.totalToa);

          const sumToa1 = exToa1 + toa1;
          const sumMan1 = exMan1 + man1;
          const sumToa2 = exToa2 + toa2;
          const sumMan2 = exMan2 + man2;
          const sumTotToa = exTotToa + (totToa > 0 ? totToa : toa1 + toa2);

          existing.toaShift1 = sumToa1 > 0 ? sumToa1.toString() : "";
          existing.manualShift1 = sumMan1 > 0 ? sumMan1.toString() : "";
          existing.toaShift2 = sumToa2 > 0 ? sumToa2.toString() : "";
          existing.manualShift2 = sumMan2 > 0 ? sumMan2.toString() : "";
          existing.totalToa = sumTotToa > 0 ? sumTotToa.toString() : "";
          existing.kmAwal1 = "0";
          existing.kmAkhir1 = newKmS1.toString();
          existing.kmAwal2 = "0";
          existing.kmAkhir2 = newKmS2.toString();

          if (ket) {
            const exNotes = existing.keterangan ? existing.keterangan.split(" | ") : [];
            if (!exNotes.includes(ket)) {
              exNotes.push(ket);
              existing.keterangan = exNotes.join(" | ");
            }
          }
        }
      }
    }

    return {
      data: Array.from(unitMap.values()),
      headerMap: firstHeaderMap || { unit: 0, toaShift1: 1, toaShift2: 2, manualShift1: 3, manualShift2: 4, totalToa: 5, kmAwal1: 6, kmAkhir1: 7, kmAwal2: 8, kmAkhir2: 9, keterangan: 10 },
      missingColumns: [],
      sheetSummary: {},
    };
  });
};
