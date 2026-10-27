#!/usr/bin/env node
/**
 * scripts/ingest-regional.mjs
 * Script Otomasi Penarikan Data (Ingestion) dari 18 Google Sheet Rute ke Supabase.
 *
 * Standalone Node.js ES Module (Zero External Dependencies).
 * Mendukung eksekusi lokal (CLI) dan runner server/CI (GitHub Actions Cron).
 *
 * Penggunaan:
 *   node --env-file=.env scripts/ingest-regional.mjs
 *   node --env-file=.env scripts/ingest-regional.mjs --date=2026-10-18
 *   node --env-file=.env scripts/ingest-regional.mjs --route="JAK 01" --dry-run
 *   node --env-file=.env scripts/ingest-regional.mjs --force
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// --- 1. Load Environment Variables Fallback ---
if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach((line) => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let val = match[2] || '';
          if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
          if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
          if (!process.env[key]) process.env[key] = val.trim();
        }
      });
    }
  } catch (err) {
    console.warn('[Env] Peringatan membaca .env:', err.message);
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Error: SUPABASE_URL dan SUPABASE_KEY wajib tersedia di environment.');
  process.exit(1);
}

// --- 2. Load Google Service Account ---
function loadServiceAccount() {
  const envKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY || process.env.GSERVICEACCOUNT_KEY;
  if (envKey) {
    try {
      let raw = envKey.trim();
      if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
        try {
          const unquoted = JSON.parse(raw);
          if (typeof unquoted === 'string') raw = unquoted.trim();
        } catch {
          raw = raw.slice(1, -1).trim();
        }
      }
      return raw.includes('{') ? JSON.parse(raw) : JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
    } catch (err) {
      console.warn('[SA] Gagal mem-parse GOOGLE_SERVICE_ACCOUNT_KEY dari env:', err.message);
    }
  }

  // Fallback ke file lokal jika ada
  const localFile = path.resolve(process.cwd(), 'ss-pdo-ce9a8a2f7815.json');
  if (fs.existsSync(localFile)) {
    return JSON.parse(fs.readFileSync(localFile, 'utf8'));
  }

  throw new Error('Kredensial Google Service Account tidak ditemukan (env atau file lokal).');
}

const serviceAccount = loadServiceAccount();

// --- 3. Google OAuth2 Token Generator ---
let cachedGoogleToken = null;

async function getGoogleAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  if (cachedGoogleToken && cachedGoogleToken.expiresAt - now > 180) {
    return cachedGoogleToken.token;
  }

  const header = { alg: 'RS256', typ: 'JWT' };
  const claimSet = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
    aud: serviceAccount.token_uri || 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const signInput = `${b64(header)}.${b64(claimSet)}`;

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signInput);
  const jwt = `${signInput}.${sign.sign(serviceAccount.private_key, 'base64url')}`;

  const params = new URLSearchParams();
  params.set('grant_type', 'urn:ietf:params:oauth:grant-type:jwt-bearer');
  params.set('assertion', jwt);

  const res = await fetch(serviceAccount.token_uri || 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google OAuth error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  cachedGoogleToken = {
    token: data.access_token,
    expiresAt: now + (data.expires_in || 3600),
  };
  return cachedGoogleToken.token;
}

// --- 4. Supabase REST Helper ---
async function supabaseRest(endpoint, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Supabase REST Error (${res.status} ${endpoint}): ${errText}`);
  }
  return res.json().catch(() => null);
}

// --- 5. Number Parsing Utility (Format Indonesia) ---
function parseIndonesianNumber(val) {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = String(val).trim();
  if (str === '-' || str === '') return 0;

  // Hapus format ribuan titik jika ada desimal koma (1.234,56 -> 1234.56)
  if (str.includes(',') && str.includes('.')) {
    const clean = str.replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  }
  // Koma sebagai desimal (123,45 -> 123.45)
  if (str.includes(',')) {
    const parsed = parseFloat(str.replace(',', '.'));
    return isNaN(parsed) ? 0 : parsed;
  }
  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
}

// --- 6. Keyword Normalizer & Column Matcher ---
function normalizeString(str) {
  if (!str) return '';
  return String(str).toLowerCase().replace(/[^a-z0-9]/g, '');
}

const KEYWORDS = {
  unit: ['nobody', 'unit', 'bus', 'body'],
  tripPergi: ['pergi', 'priokplumpang', 'trip1'],
  tripPulang: ['pulang', 'plumpangpriok', 'trip2'],
  toaShift1: ['toashift1', 'toashifti', 'toas1', 'toasi'],
  manualShift1: ['manualshift1', 'manualshifti', 'manual1', 'manuals1'],
  toaShift2: ['toashift2', 'toashiftii', 'toas2', 'toasii'],
  manualShift2: ['manualshift2', 'manualshiftii', 'manual2', 'manuals2'],
  keterangan: ['keterangan', 'ket', 'notes', 'catatan'],
  kmAwal1: ['kilometerawalshift1', 'kmawalshift1', 'kmawal1', 'kmawals1'],
  kmAkhir1: ['kilometerakhirshift1', 'kmakhirshift1', 'kmakhir1', 'kmakhirs1'],
  kmAwal2: ['kilometerawalshift2', 'kmawalshift2', 'kmawal2', 'kmawals2'],
  kmAkhir2: ['kilometerakhirshift2', 'kmakhirshift2', 'kmakhir2', 'kmakhirs2'],
  totalKm: ['totalkm', 'totalkilometer'],
};

function matchColumn(headers, keywordList) {
  for (let i = 0; i < headers.length; i++) {
    const norm = normalizeString(headers[i]);
    if (keywordList.some((kw) => norm.includes(kw))) {
      return i;
    }
  }
  return -1;
}

// --- 7. CLI Argument Parsing ---
const args = process.argv.slice(2);
let targetDate = '';
let startDate = '';
let endDate = '';
let targetRoute = '';
let isDryRun = false;
let isForce = false;

for (const arg of args) {
  if (arg.startsWith('--date=')) {
    targetDate = arg.split('=')[1].trim();
  } else if (arg.startsWith('--start-date=')) {
    startDate = arg.split('=')[1].trim();
  } else if (arg.startsWith('--end-date=')) {
    endDate = arg.split('=')[1].trim();
  } else if (arg.startsWith('--route=')) {
    targetRoute = arg.split('=')[1].trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  } else if (arg === '--dry-run') {
    isDryRun = true;
  } else if (arg === '--force') {
    isForce = true;
  }
}

function generateDateRange(startStr, endStr) {
  const [sY, sM, sD] = startStr.split('-').map(Number);
  const [eY, eM, eD] = endStr.split('-').map(Number);
  const start = new Date(Date.UTC(sY, sM - 1, sD));
  const end = new Date(Date.UTC(eY, eM - 1, eD));
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return [];
  const from = start <= end ? start : end;
  const to = start <= end ? end : start;
  const dates = [];
  const cur = new Date(from.getTime());
  while (cur <= to) {
    const y = cur.getUTCFullYear();
    const m = String(cur.getUTCMonth() + 1).padStart(2, '0');
    const d = String(cur.getUTCDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return dates;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Default ke tanggal hari ini (WIB / Asia/Jakarta) jika tidak ada parameter tanggal
if (!targetDate && (!startDate || !endDate)) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const y = parts.find((p) => p.type === 'year')?.value;
  const m = parts.find((p) => p.type === 'month')?.value;
  const d = parts.find((p) => p.type === 'day')?.value;
  targetDate = `${y}-${m}-${d}`;
}

const datesToProcess = (startDate && endDate)
  ? generateDateRange(startDate, endDate)
  : [targetDate];

console.log('='.repeat(65));
console.log('🚌 SS_PDO REGIONAL INGESTION RUNNER (AUTOMATED CRON/CLI)');
console.log('='.repeat(65));
if (startDate && endDate) {
  console.log(`📅 Rentang Target : ${startDate} s.d. ${endDate} (${datesToProcess.length} Hari)`);
} else {
  console.log(`📅 Tanggal Target : ${targetDate}`);
}
console.log(`🤖 Service Account: ${serviceAccount.client_email}`);
console.log(`⚙️  Mode Eksekusi : ${isDryRun ? 'DRY RUN (Simulasi, Tanpa Tulis DB)' : 'LIVE (Upsert Supabase)'}`);
if (targetRoute) console.log(`🎯 Filter Rute   : ${targetRoute}`);
if (isForce) console.log(`⚠️  Force Mode    : Mengabaikan status submitted/verified`);
// --- 7b. Helper Renops Dinamis (Kategori Hari) ---
function getDynamicRenops(route, dateStr) {
  if (!dateStr || !route) return route?.default_renops || 0;
  const parts = dateStr.split('-');
  if (parts.length < 3) return route.default_renops || 0;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  const dateObj = new Date(year, month - 1, day);
  const dayOfWeek = dateObj.getDay(); // 0 = Minggu, 6 = Sabtu

  const defaultRenops = route.default_renops || 0;
  if (dayOfWeek === 0) {
    return route.renops_sunday ?? defaultRenops;
  }
  if (dayOfWeek === 6) {
    return route.renops_saturday ?? defaultRenops;
  }
  return route.renops_weekday ?? defaultRenops;
}

// --- 8. Core Ingestion Execution ---
async function run() {
  const token = await getGoogleAccessToken();

  // 1. Ambil daftar master rute
  const routes = await supabaseRest('routes?select=*&order=id.asc');
  if (!routes || routes.length === 0) {
    throw new Error('Daftar master rute di Supabase tidak ditemukan.');
  }

  let totalSynced = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  console.log(`Menemukan ${routes.length} master rute terdaftar.`);

  for (let d = 0; d < datesToProcess.length; d++) {
    const curDate = datesToProcess[d];
    const [yearStr, monthStr, dayStr] = curDate.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);
    const tabName = String(day);

    console.log(`\n📅 [PROSES TANGGAL] ${curDate} (${d + 1}/${datesToProcess.length}) - Tab Sheet: "${tabName}"`);
    console.log('-'.repeat(65));

    // 2. Ambil pemetaan route_sheets untuk bulan & tahun bersangkutan
    const routeSheets = await supabaseRest(
      `route_sheets?select=*&year=eq.${year}&month=eq.${month}`
    );
    const sheetMap = new Map();
    (routeSheets || []).forEach((s) => sheetMap.set(s.route_id, s));

    // 3. Ambil laporan existing di Supabase untuk Smart Skip
    const existingReports = await supabaseRest(
      `daily_route_reports?select=route_id,route_code,status&date=eq.${curDate}`
    );
    const statusMap = new Map();
    (existingReports || []).forEach((r) => statusMap.set(r.route_id, r.status));

    let daySynced = 0;
    let daySkipped = 0;
    let dayErrors = 0;

    for (const route of routes) {
      const cleanCode = route.route_code.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (targetRoute && cleanCode !== targetRoute) {
        continue;
      }

      const currentStatus = statusMap.get(route.id);
      if (!isForce && (currentStatus === 'submitted' || currentStatus === 'verified')) {
        console.log(`⏩ [SKIP] ${route.route_code.padEnd(8)}: Sudah berstatus "${currentStatus}" dari aplikasi.`);
        daySkipped++;
        totalSkipped++;
        continue;
      }

      const sheetConfig = sheetMap.get(route.id);
      if (!sheetConfig || !sheetConfig.spreadsheet_id) {
        console.log(`⚠️  [MISS] ${route.route_code.padEnd(8)}: Belum ada konfigurasi spreadsheet_id di route_sheets.`);
        dayErrors++;
        totalErrors++;
        continue;
      }

      try {
        // Ambil data tab harian (A1:W50)
        const range = encodeURIComponent(`'${tabName}'!A1:W50`);
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetConfig.spreadsheet_id}/values/${range}?valueRenderOption=FORMATTED_VALUE`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

        if (!res.ok) {
          if (res.status === 404) {
            console.log(`❌ [FAIL] ${route.route_code.padEnd(8)}: Tab "${tabName}" tidak ditemukan di spreadsheet.`);
          } else {
            console.log(`❌ [FAIL] ${route.route_code.padEnd(8)}: Google Sheets error (${res.status}).`);
          }
          dayErrors++;
          totalErrors++;
          continue;
        }

        const sheetData = await res.json();
        const rows = sheetData.values || [];
        if (rows.length < 2) {
          console.log(`⚠️  [EMPTY] ${route.route_code.padEnd(8)}: Data baris kosong pada tab "${tabName}".`);
          continue;
        }

        // Deteksi baris header
        let headerRowIndex = 0;
        for (let i = 0; i < Math.min(5, rows.length); i++) {
          if (matchColumn(rows[i], KEYWORDS.unit) !== -1) {
            headerRowIndex = i;
            break;
          }
        }

        const headers = rows[headerRowIndex] || [];
        const colMap = {
          unit: matchColumn(headers, KEYWORDS.unit),
          trip1: matchColumn(headers, KEYWORDS.tripPergi),
          trip2: matchColumn(headers, KEYWORDS.tripPulang),
          toaS1: matchColumn(headers, KEYWORDS.toaShift1),
          manS1: matchColumn(headers, KEYWORDS.manualShift1),
          toaS2: matchColumn(headers, KEYWORDS.toaShift2),
          manS2: matchColumn(headers, KEYWORDS.manualShift2),
          ket: matchColumn(headers, KEYWORDS.keterangan),
          kmA1: matchColumn(headers, KEYWORDS.kmAwal1),
          kmAkh1: matchColumn(headers, KEYWORDS.kmAkhir1),
          kmA2: matchColumn(headers, KEYWORDS.kmAwal2),
          kmAkh2: matchColumn(headers, KEYWORDS.kmAkhir2),
          totalKm: matchColumn(headers, KEYWORDS.totalKm),
        };

        let calcKm = 0;
        let calcToaS1 = 0;
        let calcManS1 = 0;
        let calcToaS2 = 0;
        let calcManS2 = 0;
        let calcTrips = 0;
        let activeBuses = 0;

        for (let r = headerRowIndex + 1; r < rows.length; r++) {
          const row = rows[r];
          if (!row || row.length === 0) continue;
          const unitName = colMap.unit !== -1 ? String(row[colMap.unit] || '').trim() : '';

          // Abaikan baris subtotal / footer
          if (!unitName || /jumlah|total|rekap/i.test(unitName)) continue;

          const kmA1 = colMap.kmA1 !== -1 ? parseIndonesianNumber(row[colMap.kmA1]) : 0;
          const kmAkh1 = colMap.kmAkh1 !== -1 ? parseIndonesianNumber(row[colMap.kmAkh1]) : 0;
          const kmA2 = colMap.kmA2 !== -1 ? parseIndonesianNumber(row[colMap.kmA2]) : 0;
          const kmAkh2 = colMap.kmAkh2 !== -1 ? parseIndonesianNumber(row[colMap.kmAkh2]) : 0;

          const km1 = kmAkh1 > kmA1 ? kmAkh1 - kmA1 : 0;
          const km2 = kmAkh2 > kmA2 ? kmAkh2 - kmA2 : 0;
          const kmRow = colMap.totalKm !== -1 ? parseIndonesianNumber(row[colMap.totalKm]) : 0;
          const kmBus = (km1 + km2 > 0) ? (km1 + km2) : kmRow;
          calcKm += kmBus;

          const toaS1 = colMap.toaS1 !== -1 ? parseIndonesianNumber(row[colMap.toaS1]) : 0;
          const manS1 = colMap.manS1 !== -1 ? parseIndonesianNumber(row[colMap.manS1]) : 0;
          const toaS2 = colMap.toaS2 !== -1 ? parseIndonesianNumber(row[colMap.toaS2]) : 0;
          const manS2 = colMap.manS2 !== -1 ? parseIndonesianNumber(row[colMap.manS2]) : 0;

          calcToaS1 += toaS1;
          calcManS1 += manS1;
          calcToaS2 += toaS2;
          calcManS2 += manS2;

          const t1 = colMap.trip1 !== -1 ? parseIndonesianNumber(row[colMap.trip1]) : 0;
          const t2 = colMap.trip2 !== -1 ? parseIndonesianNumber(row[colMap.trip2]) : 0;
          calcTrips += (t1 + t2);

          const ket = colMap.ket !== -1 ? String(row[colMap.ket] || '').toUpperCase() : '';
          const isOff = ket.includes('OFF');
          const hasActivity = (kmBus > 0) || (toaS1 + toaS2 > 0) || (t1 + t2 > 0);
          if (!isOff && hasActivity) {
            activeBuses++;
          }
        }

        const totalPassengers = calcToaS1 + calcManS1 + calcToaS2 + calcManS2;
        const dynamicRenops = getDynamicRenops(route, curDate);
        const realops = activeBuses > 0 ? activeBuses : dynamicRenops;
        const achievementKm = realops > 0 ? Number((calcKm / realops).toFixed(2)) : 0;

        // Sesuai Standar Domain SS_PDO:
        // 1 Ritase = 2 Trip (PP / Pulang-Pergi). Total Ritase = totalKm / km_baku. Fallback: calcTrips / 2.
        const kmBaku = Number(route.km_baku) || 0;
        const totalRitase = kmBaku > 0 && calcKm > 0
          ? Number((calcKm / kmBaku).toFixed(1))
          : Number((calcTrips / 2).toFixed(1));

        const payload = {
          route_id: route.id,
          route_code: route.route_code,
          date: curDate,
          renops_shift1: dynamicRenops,
          realops_shift1: realops,
          renops_shift2: dynamicRenops,
          realops_shift2: realops,
          toa_shift1: calcToaS1,
          manual_shift1: calcManS1,
          toa_shift2: calcToaS2,
          manual_shift2: calcManS2,
          total_passengers: totalPassengers,
          total_km: Number(calcKm.toFixed(2)),
          achievement_km: achievementKm,
          total_trip: totalRitase,
          status: 'draft',
          data_source: 'sheet_ingestion',
          last_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        if (!isDryRun) {
          await supabaseRest('daily_route_reports?on_conflict=route_id,date', {
            method: 'POST',
            headers: {
              Prefer: 'resolution=merge-duplicates,return=representation',
            },
            body: JSON.stringify(payload),
          });
        }

        console.log(
          `✅ [SYNC] ${route.route_code.padEnd(8)}: Ops=${String(realops).padStart(2)} | ` +
          `Pax=${String(totalPassengers).padStart(4)} | ` +
          `KM=${String(calcKm.toFixed(0)).padStart(5)} | ` +
          `Rit PP=${String(totalRitase).padStart(4)} | ` +
          `TOA S1/S2=${calcToaS1}/${calcToaS2}`
        );
        daySynced++;
        totalSynced++;

        // Jeda halus antar rute untuk perlindungan kuota Google API
        await sleep(250);
      } catch (routeErr) {
        console.log(`❌ [ERR]  ${route.route_code.padEnd(8)}: ${routeErr.message}`);
        dayErrors++;
        totalErrors++;
      }
    }

    console.log(`Ringkasan ${curDate}: ${daySynced} synced | ${daySkipped} skipped | ${dayErrors} error`);

    // Jeda napas antar tanggal jika memproses multi-hari
    if (d < datesToProcess.length - 1) {
      console.log(`⏳ Jeda 1.2 detik sebelum memproses tanggal berikutnya...`);
      await sleep(1200);
    }
  }

  console.log('='.repeat(65));
  console.log(`📊 TOTAL RINGKASAN: ${totalSynced} Berhasil Disinkronkan | ${totalSkipped} Dilewati (App) | ${totalErrors} Gagal/Error`);
  console.log('='.repeat(65));
}

run().catch((err) => {
  console.error('Fatal Runner Exception:', err);
  process.exit(1);
});
