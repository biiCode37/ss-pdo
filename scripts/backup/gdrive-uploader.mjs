/**
 * scripts/backup/gdrive-uploader.mjs
 * Modul Pengunggah Google Drive & Pembersihan Cadangan Lama (Auto-Pruning 30 Hari).
 *
 * Standalone Node.js ES Module (Zero External Dependencies).
 */

import fs from 'node:fs';
import path from 'node:path';
import { getGoogleAccessToken, parseServiceAccountKey } from './run-backup.mjs';

/**
 * Filter file cadangan yang telah melewati batas usia retensi (default: 0 = permanen/abadi)
 */
export function filterExpiredBackupFiles(files, maxAgeDays = 0, nowTimestamp = Date.now()) {
  // Jika maxAgeDays <= 0, fitur penghapusan otomatis dinonaktifkan (penyimpanan permanen/abadi)
  if (maxAgeDays <= 0) return [];

  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;

  return (files || []).filter((file) => {
    if (!file.createdTime) return false;
    const fileTime = new Date(file.createdTime).getTime();
    if (isNaN(fileTime)) return false;
    return nowTimestamp - fileTime > maxAgeMs;
  });
}

/**
 * Mengunggah file ZIP cadangan melalui Google Apps Script Web App
 * (Solusi resmi untuk akun Gmail personal agar file dimiliki langsung oleh akun Google Anda)
 */
export async function uploadBackupViaAppsScript({
  appScriptUrl,
  fileName,
  fileBuffer,
  folderId,
  fetchImpl = fetch,
}) {
  const payload = {
    fileName,
    folderId,
    base64Data: fileBuffer.toString('base64'),
  };

  const res = await fetchImpl(appScriptUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    redirect: 'follow',
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Gagal mengunggah via Google Apps Script (${res.status}): ${errText}`);
  }

  const result = await res.json();
  if (result.status === 'error') {
    throw new Error(`Google Apps Script mengembalikan error: ${result.message}`);
  }

  return result;
}

/**
 * Mengunggah file ZIP cadangan ke folder Google Drive tujuan menggunakan Multipart Upload API v3
 */
export async function uploadBackupToDrive({
  fileName,
  fileBuffer,
  folderId,
  accessToken,
  fetchImpl = fetch,
}) {
  const boundary = `-------SSPDO_BACKUP_BOUNDARY_${Date.now()}`;
  const metadata = JSON.stringify({
    name: fileName,
    parents: folderId ? [folderId] : [],
    description: 'Automated Dual-Engine Backup SS_PDO (Database + Google Sheets SSOT)',
  });

  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const headerPart = Buffer.from(
    `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${metadata}`
  );
  const mediaHeaderPart = Buffer.from(
    `${delimiter}Content-Type: application/zip\r\n\r\n`
  );
  const footerPart = Buffer.from(closeDelimiter);

  const multipartBody = Buffer.concat([
    headerPart,
    mediaHeaderPart,
    fileBuffer,
    footerPart,
  ]);

  const uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true';
  const res = await fetchImpl(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
      'Content-Length': String(multipartBody.length),
    },
    body: multipartBody,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Gagal mengunggah file cadangan ke Google Drive (${res.status}): ${errText}`);
  }

  return res.json();
}

/**
 * Menghapus cadangan lama di folder Google Drive yang berusia lebih dari maxAgeDays
 * Jika maxAgeDays <= 0, pembersihan otomatis dinonaktifkan (arsip permanen/abadi).
 */
export async function pruneOldBackups({
  folderId,
  maxAgeDays = 0,
  accessToken,
  nowTimestamp = Date.now(),
  fetchImpl = fetch,
}) {
  if (!folderId) return [];

  // Jika retensi diatur ke 0 atau negatif, lewati pembersihan (arsip disimpan permanen)
  if (maxAgeDays <= 0) {
    console.log('[GDrive Pruning] Retensi cadangan diatur ke 0 (Penyimpanan permanen/abadi). Pembersihan otomatis dinonaktifkan.');
    return [];
  }

  // 1. Ambil daftar file di folder
  const query = encodeURIComponent(`'${folderId}' in parents and trashed = false and mimeType = 'application/zip'`);
  const listUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,createdTime)&pageSize=100&supportsAllDrives=true&includeItemsFromAllDrives=true`;

  const res = await fetchImpl(listUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    console.warn(`[GDrive Pruning] Gagal membaca daftar file lama (${res.status}): ${errText}`);
    return [];
  }

  const data = await res.json();
  const expiredFiles = filterExpiredBackupFiles(data.files || [], maxAgeDays, nowTimestamp);
  const deletedFiles = [];

  // 2. Hapus file yang kedaluwarsa satu per satu
  for (const file of expiredFiles) {
    try {
      const deleteUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}?supportsAllDrives=true`;
      const delRes = await fetchImpl(deleteUrl, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (delRes.ok || delRes.status === 204) {
        deletedFiles.push(file);
        console.log(`[GDrive Pruning] Menghapus backup usang (> ${maxAgeDays} hari): ${file.name} (${file.id})`);
      } else {
        console.warn(`[GDrive Pruning] Gagal menghapus file ${file.name} (${delRes.status})`);
      }
    } catch (delErr) {
      console.warn(`[GDrive Pruning] Exception menghapus ${file.name}:`, delErr.message);
    }
  }

  return deletedFiles;
}

/**
 * MAIN CLI RUNNER
 */
export async function main() {
  console.log('=== ☁️ MEMULAI UPLOAD GOOGLE DRIVE & PRUNING RETENSI ===');
  const rawServiceKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY || process.env.GSERVICEACCOUNT_KEY;
  const folderId = process.env.GDRIVE_BACKUP_FOLDER_ID;

  if (!rawServiceKey) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY wajib dikonfigurasi.');
  }

  if (!folderId) {
    console.warn('⚠️ Peringatan: GDRIVE_BACKUP_FOLDER_ID tidak disetel. Unggahan Google Drive dilewati.');
    return;
  }

  const serviceAccount = parseServiceAccountKey(rawServiceKey);
  if (!serviceAccount) {
    throw new Error('Gagal membaca kredensial Service Account.');
  }

  // Cari file ZIP backup target
  let targetZip = process.argv[2];
  if (!targetZip) {
    const outputBaseDir = process.env.BACKUP_OUTPUT_DIR || path.resolve(process.cwd(), 'backup_staging');
    if (fs.existsSync(outputBaseDir)) {
      const zipFiles = fs
        .readdirSync(outputBaseDir)
        .filter((f) => f.endsWith('.zip') && f.startsWith('SS_PDO_BACKUP_'))
        .sort()
        .reverse();

      if (zipFiles.length > 0) {
        targetZip = path.join(outputBaseDir, zipFiles[0]);
      }
    }
  }

  if (!targetZip || !fs.existsSync(targetZip)) {
    throw new Error(`File ZIP backup tidak ditemukan untuk diunggah: ${targetZip || 'kosong'}`);
  }

  const fileName = path.basename(targetZip);
  const fileBuffer = fs.readFileSync(targetZip);
  const fileSizeMb = (fileBuffer.length / (1024 * 1024)).toFixed(2);

  // Opsi 1: Google Apps Script Webhook (Bypass kuota 0 Service Account untuk personal Gmail)
  const appScriptUrl = process.env.GDRIVE_APPSCRIPT_URL;
  if (appScriptUrl) {
    console.log(`[GDrive] Mengunggah ${fileName} (${fileSizeMb} MB) melalui Google Apps Script Web App...`);
    try {
      const gasResult = await uploadBackupViaAppsScript({
        appScriptUrl,
        fileName,
        fileBuffer,
        folderId,
      });
      console.log(`=== ✅ Unggahan Berhasil via Google Apps Script! File ID: ${gasResult.id || gasResult.fileId || 'ok'} ===`);
      return;
    } catch (gasErr) {
      console.error('❌ Gagal mengunggah via Apps Script Web App:', gasErr.message);
      throw gasErr;
    }
  }

  // Opsi 2: Google Drive API v3 langsung via Service Account
  console.log(`[GDrive] Mengautentikasi Service Account (${serviceAccount.client_email})...`);
  const accessToken = await getGoogleAccessToken(serviceAccount);

  console.log(`[GDrive] Mengunggah ${fileName} (${fileSizeMb} MB) ke Folder ID: ${folderId}...`);
  try {
    const uploadResult = await uploadBackupToDrive({
      fileName,
      fileBuffer,
      folderId,
      accessToken,
    });
    console.log(`=== ✅ Unggahan Berhasil! File ID: ${uploadResult.id} ===`);

    // Jalankan rotasi retensi (default 0 = permanen/abadi)
    const maxAgeDays = parseInt(process.env.BACKUP_RETENTION_DAYS || '0', 10);
    if (maxAgeDays > 0) {
      console.log(`[GDrive] Menjalankan pemeriksaan retensi file (> ${maxAgeDays} hari)...`);
    }
    const pruned = await pruneOldBackups({
      folderId,
      maxAgeDays,
      accessToken,
    });

    if (maxAgeDays > 0) {
      console.log(`[GDrive] Selesai. Total file lama dibersihkan: ${pruned.length}`);
    }
  } catch (driveErr) {
    const errMsg = driveErr.message || '';
    if (errMsg.includes('storageQuotaExceeded') || errMsg.includes('Service Accounts do not have storage quota')) {
      console.warn('\n⚠️ [PERINGATAN KUOTA GOOGLE DRIVE]');
      console.warn('Google menolak penyimpanan langsung karena Service Account memiliki kuota 0-byte untuk folder Gmail personal.');
      console.warn('💡 SOLUSI: Pasang Google Apps Script Web App (setel secret GDRIVE_APPSCRIPT_URL) atau gunakan Shared Drive.');
      console.warn('ℹ️ File cadangan ZIP tetap aman dan tersimpan di GitHub Actions Artifacts.\n');
    } else {
      throw driveErr;
    }
  }
}

// Jalankan otomatis jika dipanggil langsung via CLI
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  main().catch((err) => {
    console.error('❌ Terjadi kesalahan fatal pada uploader Google Drive:', err);
    process.exit(1);
  });
}
