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
                localStorage.setItem('GAPI_ACCESS_TOKEN', JSON.stringify({
                  token: tokenResponse.access_token,
                  expiresAt: Date.now() + tokenResponse.expires_in * 1000
                }));
                // Notify UI that login succeeded
                window.dispatchEvent(new Event('google-login-success'));
              }
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
    
    const handleSuccess = () => {
      window.removeEventListener('google-login-success', handleSuccess);
      resolve();
    };
    window.addEventListener('google-login-success', handleSuccess);
    
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
  gapi.client.setToken(null);
};

export const checkSignedIn = () => {
  const tokenStr = localStorage.getItem('GAPI_ACCESS_TOKEN');
  if (!tokenStr) return false;
  try {
    const tokenObj = JSON.parse(tokenStr);
    if (Date.now() > tokenObj.expiresAt) {
      localStorage.removeItem('GAPI_ACCESS_TOKEN');
      return false;
    }
    gapi.client.setToken({ access_token: tokenObj.token });
    return true;
  } catch (e) {
    return false;
  }
};

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

export const getBusData = async (sheetId: string, tabName: string): Promise<{ data: BusData[], headerMap: HeaderMap }> => {
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
        headerRowIndex = i;
        break;
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
      manualShift1: findColumnIndex(compositeHeaders, HEADER_KEYWORDS.manualShift1),
      manualShift2: findColumnIndex(compositeHeaders, HEADER_KEYWORDS.manualShift2),
      totalToa: findColumnIndex(compositeHeaders, HEADER_KEYWORDS.totalToa),
      kmAwal1: findColumnIndex(compositeHeaders, HEADER_KEYWORDS.kmAwal1),
      kmAkhir1: findColumnIndex(compositeHeaders, HEADER_KEYWORDS.kmAkhir1),
      kmAwal2: findColumnIndex(compositeHeaders, HEADER_KEYWORDS.kmAwal2),
      kmAkhir2: findColumnIndex(compositeHeaders, HEADER_KEYWORDS.kmAkhir2),
      keterangan: findColumnIndex(compositeHeaders, HEADER_KEYWORDS.keterangan),
    };

    const getValue = (row: any[], idx: number) => {
      if (idx === -1) return '';
      const val = row[idx];
      return val !== undefined && val !== null ? String(val) : '';
    };

    const data: BusData[] = [];
    // Data starts after the header(s)
    const dataStartIndex = isSubHeader ? headerRowIndex + 2 : headerRowIndex + 1;
    for (let i = dataStartIndex; i < rows.length; i++) {
      const row = rows[i];
      const unitVal = row[headerMap.unit];
      
      // Skip empty rows
      if (!unitVal || String(unitVal).trim() === '') continue;

      data.push({
        rowIndex: i + 1, // Sheets API uses 1-based index (A1)
        unit: String(unitVal),
        toaShift1: getValue(row, headerMap.toaShift1),
        manualShift1: getValue(row, headerMap.manualShift1),
        manualShift2: getValue(row, headerMap.manualShift2),
        totalToa: getValue(row, headerMap.totalToa),
        kmAwal1: getValue(row, headerMap.kmAwal1),
        kmAkhir1: getValue(row, headerMap.kmAkhir1),
        kmAwal2: getValue(row, headerMap.kmAwal2),
        kmAkhir2: getValue(row, headerMap.kmAkhir2),
        keterangan: getValue(row, headerMap.keterangan),
        originalRow: row
      });
    }

    return { data, headerMap };
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
