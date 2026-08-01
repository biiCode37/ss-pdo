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
            scope: 'https://www.googleapis.com/auth/spreadsheets',
            callback: (tokenResponse: any) => {
              if (tokenResponse && tokenResponse.access_token) {
                gapi.client.setToken({ access_token: tokenResponse.access_token });
                localStorage.setItem('PDO_IS_SIGNED_IN', 'true');
                localStorage.setItem('GAPI_ACCESS_TOKEN', JSON.stringify({
                  token: tokenResponse.access_token,
                  expiresAt: Date.now() + tokenResponse.expires_in * 1000
                }));
                // Notify UI that login succeeded
                window.dispatchEvent(new Event('google-login-success'));
                // BUG-11: Mulai timer refresh token otomatis
                startTokenRefreshTimer(tokenResponse.expires_in * 1000);
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
      reject(new Error('Login timeout — tidak ada respons dari Google. Silakan coba lagi.'));
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
  gapi.client.setToken(null);
};

export const checkSignedIn = (): boolean => {
  const isPersistentSignedIn = localStorage.getItem('PDO_IS_SIGNED_IN') === 'true';
  const tokenStr = localStorage.getItem('GAPI_ACCESS_TOKEN');

  if (!isPersistentSignedIn && !tokenStr) {
    return false;
  }

  if (tokenStr) {
    try {
      const tokenObj = JSON.parse(tokenStr);
      gapi.client.setToken({ access_token: tokenObj.token });
      
      const remainingMs = tokenObj.expiresAt - Date.now();
      if (remainingMs > 0) {
        startTokenRefreshTimer(remainingMs);
      } else if (tokenClient) {
        // Silent refresh di background tanpa me-logout user
        tokenClient.requestAccessToken({ prompt: '' });
      }
    } catch (e) {
      // Ignore parse error, tetap pertahankan login persisten
    }
  }

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
      // Gagal silent refresh — user akan diminta login ulang saat simpan berikutnya
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

export function parseIndonesianNumber(val: any): number {
  if (val === undefined || val === null || val === '') return NaN;
  if (typeof val === 'number') return isNaN(val) ? NaN : val;
  
  let str = String(val).trim();
  if (str === '' || str.startsWith('#')) return NaN;

  // Handle Indonesian currency/number formats like "5.589,06" or "4.670" or "192,73"
  if (str.includes('.') && str.includes(',')) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (str.includes(',')) {
    str = str.replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(str)) {
    str = str.replace(/\./g, '');
  }

  const num = Number(str);
  return isNaN(num) ? NaN : num;
}

export const getBusData = async (sheetId: string, tabName: string): Promise<{ data: BusData[], headerMap: HeaderMap, missingColumns: string[], sheetSummary: Record<string, number> }> => {
  try {
    const response = await (gapi.client as any).sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${tabName}!A1:ZZ`, 
    });

    const rows = response.result.values;
    if (!rows || rows.length === 0) {
      throw new Error('Tidak ada data di sheet ini.');
    }

    // --- NEW LOGIC: Dynamic Header Row Detection ---
    let headerRowIndex = -1;
    // Scan up to first 5 rows to find "Unit" / "No Body" keyword
    for (let i = 0; i < Math.min(5, rows.length); i++) {
      if (findColumnIndex(rows[i], HEADER_KEYWORDS.unit) !== -1) {
        // BUG-10: Validasi tambahan — baris header seharusnya berisi mayoritas teks, bukan angka murni
        const nonEmptyCells = rows[i].filter((cell: any) => cell !== undefined && cell !== null && String(cell).trim() !== '');
        const textCells = nonEmptyCells.filter((cell: any) => isNaN(Number(cell)));
        // Baris dianggap header jika ≥ 50% sel non-kosong berupa teks (bukan angka)
        if (nonEmptyCells.length === 0 || textCells.length / nonEmptyCells.length >= 0.5) {
          headerRowIndex = i;
          break;
        }
        // Jika mayoritas angka, ini kemungkinan baris data — lanjut cari baris berikutnya
      }
    }

    if (headerRowIndex === -1) {
      throw new Error('Tidak bisa menemukan kolom "No Body / Unit". Pastikan header berisikan kata "No Body" atau "Unit".');
    }

    // Determine if the next row is a sub-header (merged cell format)
    let isSubHeader = false;
    if (headerRowIndex + 1 < rows.length) {
      const nextRow = rows[headerRowIndex + 1];
      const unitColIdx = findColumnIndex(rows[headerRowIndex], HEADER_KEYWORDS.unit);
      const unitNextVal = nextRow[unitColIdx] ? String(nextRow[unitColIdx]).trim() : '';
      // If unit column is empty on the next row, it's highly likely a subheader
      if (unitNextVal === '') {
        isSubHeader = true;
      }
    }

    const compositeHeaders: string[] = [];
    const maxCols = Math.max(
      rows[headerRowIndex].length,
      isSubHeader ? (rows[headerRowIndex + 1]?.length || 0) : 0
    );

    // Build composite headers handling horizontal merges on the main header row
    let lastMainHeader = '';
    for (let j = 0; j < maxCols; j++) {
      let mainHeaderVal = rows[headerRowIndex][j] ? String(rows[headerRowIndex][j]).trim() : '';
      if (mainHeaderVal !== '') {
        lastMainHeader = mainHeaderVal;
      } else {
        // Inherit from left if empty (horizontal merge)
        mainHeaderVal = lastMainHeader;
      }
      
      let headerText = mainHeaderVal;
      
      // If sub-header exists, append it
      if (isSubHeader && rows[headerRowIndex + 1] && rows[headerRowIndex + 1][j]) {
        const subHeaderVal = String(rows[headerRowIndex + 1][j]).trim();
        if (subHeaderVal !== '') {
          headerText += ' ' + subHeaderVal;
        }
      }
      
      compositeHeaders[j] = headerText;
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
          const tot = parseInt(totalToaVal, 10) || 0;
          const t1 = parseInt(toaShift1Val, 10) || 0;
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
    throw new Error(error?.result?.error?.message || 'Gagal mengambil data dari Google Sheets. Pastikan link benar dan Anda memiliki akses.');
  }
};

export const getBusRowData = async (
  sheetId: string, 
  tabName: string, 
  rowIndex: number, 
  headerMap: HeaderMap
): Promise<Partial<BusData>> => {
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
    throw new Error(error?.result?.error?.message || 'Gagal menyimpan data.');
  }
};

export const getMonthlyToaTrend = async (
  sheetId: string, 
  maxDay: number
): Promise<{ day: string; totalToa: number }[]> => {
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

    for (let idx = 0; idx < maxDay; idx++) {
      const dayStr = (idx + 1).toString();
      const vr = valueRanges[idx];
      const rows = vr?.values;

      if (!rows || rows.length === 0) {
        trendData.push({ day: dayStr, totalToa: 0 });
        continue;
      }

      // Detect header row index
      let headerRowIndex = -1;
      for (let i = 0; i < Math.min(5, rows.length); i++) {
        if (findColumnIndex(rows[i], HEADER_KEYWORDS.unit) !== -1) {
          headerRowIndex = i;
          break;
        }
      }

      if (headerRowIndex === -1) {
        trendData.push({ day: dayStr, totalToa: 0 });
        continue;
      }

      // Check subheader
      let isSubHeader = false;
      if (headerRowIndex + 1 < rows.length) {
        const unitColIdx = findColumnIndex(rows[headerRowIndex], HEADER_KEYWORDS.unit);
        const unitNextVal = rows[headerRowIndex + 1]?.[unitColIdx] ? String(rows[headerRowIndex + 1][unitColIdx]).trim() : '';
        if (unitNextVal === '') isSubHeader = true;
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
        if (isSubHeader && rows[headerRowIndex + 1]?.[j]) {
          const subHeaderVal = String(rows[headerRowIndex + 1][j]).trim();
          if (subHeaderVal !== '') headerText += ' ' + subHeaderVal;
        }
        compositeHeaders[j] = headerText;
      }

      const unitColIdx = findColumnIndex(compositeHeaders, HEADER_KEYWORDS.unit);
      const toaShift1ColIdx = findColumnIndex(compositeHeaders, HEADER_KEYWORDS.toaShift1);
      const toaShift2ColIdx = findColumnIndex(compositeHeaders, HEADER_KEYWORDS.toaShift2);
      const manualShift1ColIdx = findColumnIndex(compositeHeaders, HEADER_KEYWORDS.manualShift1);
      const manualShift2ColIdx = findColumnIndex(compositeHeaders, HEADER_KEYWORDS.manualShift2);

      const startRowIdx = headerRowIndex + (isSubHeader ? 2 : 1);
      const tabSummary: Record<string, number> = {};
      let totalToaShift1 = 0;
      let totalManualShift1 = 0;
      let totalToaShift2 = 0;
      let totalManualShift2 = 0;

      for (let r = startRowIdx; r < rows.length; r++) {
        const row = rows[r];
        if (!row || row.length === 0) continue;

        const unitVal = unitColIdx !== -1 && row[unitColIdx] ? String(row[unitColIdx]).trim() : '';

        if (unitVal !== '') {
          // Bus data row
          let toa1 = toaShift1ColIdx !== -1 ? parseIndonesianNumber(row[toaShift1ColIdx]) : NaN;
          let man1 = manualShift1ColIdx !== -1 ? parseIndonesianNumber(row[manualShift1ColIdx]) : NaN;
          let toa2 = toaShift2ColIdx !== -1 ? parseIndonesianNumber(row[toaShift2ColIdx]) : NaN;
          let man2 = manualShift2ColIdx !== -1 ? parseIndonesianNumber(row[manualShift2ColIdx]) : NaN;

          if (!isNaN(toa1)) totalToaShift1 += toa1;
          if (!isNaN(man1)) totalManualShift1 += man1;
          if (!isNaN(toa2)) totalToaShift2 += toa2;
          if (!isNaN(man2)) totalManualShift2 += man2;
        } else {
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

      const calculatedTotalPassengers = totalToaShift1 + totalManualShift1 + totalToaShift2 + totalManualShift2;
      const finalDayTotal = tabSummary['totalPassengers'] !== undefined && !isNaN(tabSummary['totalPassengers'])
        ? tabSummary['totalPassengers']
        : calculatedTotalPassengers;

      trendData.push({ day: dayStr, totalToa: Math.round(finalDayTotal) });
    }
  } catch (error) {
    console.error('Error fetching batch monthly TOA trend:', error);
    for (let day = 1; day <= maxDay; day++) {
      trendData.push({ day: day.toString(), totalToa: 0 });
    }
  }

  return trendData;
};
