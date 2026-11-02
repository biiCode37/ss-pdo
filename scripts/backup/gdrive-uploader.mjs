#!/usr/bin/env node
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
 * Filter file cadangan yang telah melewati batas usia retensi (default: 30 hari)
 */
export function filterExpiredBackupFiles(files, maxAgeDays = 30, nowTimestamp = Date.now()) {
  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;

  return (files || []).filter((file) => {
    if (!file.createdTime) return false;
    const fileTime = new Date(file.createdTime).getTime();
    if (isNaN(fileTime)) return false;
    return nowTimestamp - fileTime > maxAgeMs;
  });
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

  const uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
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
 */
export async function pruneOldBackups({
  folderId,
  maxAgeDays = 30,
  accessToken,
  nowTimestamp = Date.now(),
  fetchImpl = fetch,
}) {
  if (!folderId) return [];

  // 1. Ambil daftar file di folder
  const query = encodeURIComponent(`'${folderId}' in parents and trashed = false and mimeType = 'application/zip'`);
  const listUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,createdTime)&pageSize=100`;

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
      const deleteUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}`;
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

  console.log(`[GDrive] Mengautentikasi Service Account (${serviceAccount.client_email})...`);
  const accessToken = await getGoogleAccessToken(serviceAccount);

  console.log(`[GDrive] Mengunggah ${fileName} (${fileSizeMb} MB) ke Folder ID: ${folderId}...`);
  const uploadResult = await uploadBackupToDrive({
    fileName,
    fileBuffer,
    folderId,
    accessToken,
  });

  console.log(`=== ✅ Unggahan Berhasil! File ID: ${uploadResult.id} ===`);

  // Jalankan rotasi retensi (hapus file lebih dari 30 hari di folder tersebut)
  console.log('[GDrive] Menjalankan pemeriksaan retensi file (> 30 hari)...');
  const pruned = await pruneOldBackups({
    folderId,
    maxAgeDays: 30,
    accessToken,
  });

  console.log(`[GDrive] Selesai. Total file lama dibersihkan: ${pruned.length}`);
}

// Jalankan otomatis jika dipanggil langsung via CLI
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  main().catch((err) => {
    console.error('❌ Terjadi kesalahan fatal pada uploader Google Drive:', err);
    process.exit(1);
  });
}
