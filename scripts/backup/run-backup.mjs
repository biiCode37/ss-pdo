/**
 * scripts/backup/run-backup.mjs
 * Unified Dual-Engine Backup Script (Supabase Database + Google Sheets SSOT).
 *
 * Standalone Node.js ES Module (Zero External Dependencies).
 * Berjalan otomatis pada GitHub Actions Cron harian atau eksekusi manual CLI.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

/**
 * UTILITY 1: Menghitung waktu WIB (UTC+7) secara deterministik
 */
export function getWibDateParts(date = new Date()) {
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const wib = new Date(utc + 7 * 3600000);
  const year = wib.getFullYear();
  const month = wib.getMonth() + 1;
  const day = wib.getDate();
  const hours = String(wib.getHours()).padStart(2, '0');
  const minutes = String(wib.getMinutes()).padStart(2, '0');
  const seconds = String(wib.getSeconds()).padStart(2, '0');
  const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const timeString = `${hours}${minutes}${seconds}`;

  return { year, month, day, hours, minutes, seconds, dateString, timeString };
}

/**
 * UTILITY 2: Format nama file cadangan terpadu
 */
export function formatBackupFileName(dateStr, timeStr) {
  return `SS_PDO_BACKUP_${dateStr}_${timeStr}.zip`;
}

/**
 * UTILITY 3: Pembuat metadata manifest cadangan
 */
export function generateBackupManifest({
  dateStr,
  timestampIso,
  hasDatabaseDump,
  routesBackedUp,
}) {
  return {
    version: '1.0.0',
    system: 'SS_PDO Enterprise Backup System',
    date: dateStr,
    generatedAt: timestampIso || new Date().toISOString(),
    databaseDumpPresent: Boolean(hasDatabaseDump),
    totalRoutes: routesBackedUp.length,
    routes: routesBackedUp,
  };
}

/**
 * ENGINE A: Mengambil daftar 18 spreadsheet aktif dari Supabase (Single Source of Truth)
 */
export async function fetchActiveRouteSheets({
  supabaseUrl,
  supabaseKey,
  year,
  month,
  fetchImpl = fetch,
}) {
  const url = `${supabaseUrl}/rest/v1/route_sheets?select=spreadsheet_id,year,month,routes(route_code)&year=eq.${year}&month=eq.${month}`;
  const res = await fetchImpl(url, {
    method: 'GET',
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Gagal fetch route_sheets dari Supabase (${res.status}): ${errText}`);
  }

  const rows = await res.json();
  const results = [];

  for (const row of rows || []) {
    const routeCode = row.routes?.route_code || '';
    const sheetId = row.spreadsheet_id || '';
    if (routeCode && sheetId) {
      results.push({ routeCode, sheetId });
    }
  }

  return results;
}

/**
 * UTILITY: Autentikasi Google Service Account (Zero Dependencies)
 */
export async function getGoogleAccessToken(serviceAccount, fetchImpl = fetch) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claimSet = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file',
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

  const res = await fetchImpl(serviceAccount.token_uri || 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Google OAuth error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.access_token;
}

/**
 * ENGINE B: Mengunduh Google Spreadsheet ke format Microsoft Excel (.xlsx)
 */
export async function downloadSpreadsheetAsXlsx({ sheetId, accessToken, fetchImpl = fetch }) {
  const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(sheetId)}/export?mimeType=application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`;
  const res = await fetchImpl(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Gagal export spreadsheet ID '${sheetId}' (${res.status}): ${errText}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * PARSER KREDENSIAL SERVICE ACCOUNT
 */
export function parseServiceAccountKey(rawKey) {
  if (!rawKey) return null;
  let text = rawKey.trim();
  if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
    try {
      const unquoted = JSON.parse(text);
      if (typeof unquoted === 'string') text = unquoted.trim();
    } catch {
      text = text.slice(1, -1).trim();
    }
  }

  if (text.includes('{')) {
    return JSON.parse(text);
  }
  return JSON.parse(Buffer.from(text, 'base64').toString('utf8'));
}

/**
 * PEMBUNGKUS FILE ZIP (CLI NATIVE OS)
 */
export function createZipArchive(sourceDir, zipFilePath) {
  const isWindows = process.platform === 'win32';
  if (isWindows) {
    // Gunakan PowerShell Compress-Archive di peranti lokal Windows
    const psCmd = `Compress-Archive -Path '${sourceDir}/*' -DestinationPath '${zipFilePath}' -Force`;
    execFileSync('powershell', ['-NoProfile', '-Command', psCmd], { stdio: 'inherit' });
  } else {
    // Gunakan utility zip standar di Linux / GitHub Actions runner
    execFileSync('zip', ['-r', '-q', zipFilePath, '.'], { cwd: sourceDir, stdio: 'inherit' });
  }
}

/**
 * FUNGSI UTAMA (MAIN RUNNER)
 */
export async function runDualEngineBackup() {
  console.log('=== 🚀 MEMULAI PIPELINE PENCADANGAN GANDA SS_PDO ===');
  const wib = getWibDateParts();
  console.log(`[Waktu WIB] Tanggal: ${wib.dateString} Pukul: ${wib.hours}:${wib.minutes}:${wib.seconds}`);

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const rawServiceKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY || process.env.GSERVICEACCOUNT_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib dikonfigurasi.');
  }

  const serviceAccount = parseServiceAccountKey(rawServiceKey);
  if (!serviceAccount) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY wajib dikonfigurasi.');
  }

  const outputBaseDir = process.env.BACKUP_OUTPUT_DIR || path.resolve(process.cwd(), 'backup_staging');
  const stagingDir = path.join(outputBaseDir, `staging_${wib.dateString}_${wib.timeString}`);
  const dbDir = path.join(stagingDir, 'database');
  const sheetsDir = path.join(stagingDir, 'spreadsheets');

  fs.mkdirSync(dbDir, { recursive: true });
  fs.mkdirSync(sheetsDir, { recursive: true });

  // 1. Cek ketersediaan Dump Database PostgreSQL
  const dbDumpSource = process.env.SQL_DUMP_PATH || path.resolve(process.cwd(), 'supabase_backup.sql.gz');
  let hasDbDump = false;
  if (fs.existsSync(dbDumpSource)) {
    const destSql = path.join(dbDir, 'supabase_backup.sql.gz');
    fs.copyFileSync(dbDumpSource, destSql);
    hasDbDump = true;
    const stats = fs.statSync(destSql);
    console.log(`[Engine A] Database dump disertakan: ${(stats.size / 1024).toFixed(1)} KB`);
  } else {
    console.warn('[Engine A] Catatan: supabase_backup.sql.gz tidak ditemukan di staging lokal.');
  }

  // 2. Ambil token Google API
  console.log('[Engine B] Mengautentikasi Google Service Account...');
  const accessToken = await getGoogleAccessToken(serviceAccount);

  // 3. Ambil daftar rute aktif dari Supabase
  console.log(`[Engine B] Menarik daftar rute aktif periode ${wib.year}-${wib.month}...`);
  const activeRoutes = await fetchActiveRouteSheets({
    supabaseUrl,
    supabaseKey,
    year: wib.year,
    month: wib.month,
  });

  console.log(`[Engine B] Ditemukan ${activeRoutes.length} rute aktif di Supabase.`);
  const routesBackedUp = [];

  // 4. Unduh 18 file spreadsheet sebagai .xlsx
  for (let i = 0; i < activeRoutes.length; i++) {
    const { routeCode, sheetId } = activeRoutes[i];
    const safeRoute = routeCode.replace(/[^a-zA-Z0-9.-]/g, '_');
    const targetFile = path.join(sheetsDir, `${safeRoute}_${wib.year}-${String(wib.month).padStart(2, '0')}.xlsx`);

    try {
      console.log(`[Engine B] [${i + 1}/${activeRoutes.length}] Mengunduh ${routeCode}...`);
      const xlsxBuffer = await downloadSpreadsheetAsXlsx({ sheetId, accessToken });
      fs.writeFileSync(targetFile, xlsxBuffer);
      routesBackedUp.push({
        routeCode,
        sheetId,
        sizeBytes: xlsxBuffer.length,
      });
    } catch (err) {
      console.error(`[Engine B] GAGAL mengunduh ${routeCode} (${sheetId}):`, err.message);
    }
  }

  // 5. Buat Manifest
  const manifest = generateBackupManifest({
    dateStr: wib.dateString,
    timestampIso: new Date().toISOString(),
    hasDatabaseDump: hasDbDump,
    routesBackedUp,
  });

  fs.writeFileSync(path.join(stagingDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

  // 6. Buat Arsip ZIP Terpadu
  const zipFileName = formatBackupFileName(wib.dateString, wib.timeString);
  const finalZipPath = path.join(outputBaseDir, zipFileName);

  console.log(`[Packaging] Membungkus seluruh aset ke arsip ZIP: ${zipFileName}...`);
  createZipArchive(stagingDir, finalZipPath);

  const zipStats = fs.statSync(finalZipPath);
  console.log(`=== ✅ SELESAI: Backup berhasil dibuat (${(zipStats.size / (1024 * 1024)).toFixed(2)} MB) ===`);
  console.log(`File arsip: ${finalZipPath}`);

  return {
    zipPath: finalZipPath,
    zipFileName,
    manifest,
  };
}

// Jalankan otomatis jika dipanggil langsung via CLI
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  runDualEngineBackup().catch((err) => {
    console.error('❌ Terjadi kesalahan fatal pada pipeline backup:', err);
    process.exit(1);
  });
}
