# Laporan Implementasi Perbaikan Arsitektur & Integritas Data Operasional (Refactor 194)

Dokumen ini mencatat seluruh implementasi perbaikan skala industri pada **Refactor 194** untuk proyek **SS_PDO**, mencakup:
1. Sistem Pencadangan Ganda Otomatis (*Unified Dual-Engine Backup Pipeline: Supabase PostgreSQL + 18 Google Sheets SSOT* via GitHub Actions & Google Drive Offsite Storage).
2. Perbaikan Logika Resolusi Konflik (*Zero-Write Safe Server Sync*).
3. Penggabungan Cerdas Antrean Offline (*Smart Offline Queue Merging & Baseline Snapshot Preservation*).
4. Ekstraksi Perubahan Murni (*Dirty-Only Delta Updates & Formula Protection*).
5. Kartu Komparasi Visual (*Side-by-Side Conflict Diff Table*) dan Kamus Teks Sentral.

---

## 1. ARCH-194-01: Pembangunan Mesin Pencadangan Ganda Terpadu

- **Komponen Utama:**
  1. `scripts/backup/run-backup.mjs` (Mesin pengumpul aset cadangan)
  2. `scripts/backup/gdrive-uploader.mjs` (Modul pengunggah Google Drive & rotasi retensi)
  3. `.github/workflows/nightly-backup.yml` (Workflow otomasi GitHub Actions)
  4. `docs/BACKUP_SETUP_GUIDE.md` (Panduan operasional setup pengguna)
- **Sebelum Perbaikan:**
  - Status pencadangan di dashboard Supabase: `LAST BACKUP: No backups`.
  - Tidak ada cadangan berkala untuk database relasional Supabase.
  - Tidak ada mekanisme ekspor offline untuk ke-18 file spreadsheet Google Sheets rute resmi.
  - Risiko kehilangan data atau waktu henti (*downtime*) tinggi jika terjadi kegagalan infrastruktur.
- **Sesudah Perbaikan:**
  - Terpasang alur kerja otomatis GitHub Actions yang dieksekusi setiap hari pukul **02.00 WIB** (19:00 UTC) serta dapat dipicu manual 1-klik melalui tombol *workflow_dispatch*.
  - **Engine A:** Melakukan dump native PostgreSQL via `pg_dump` ke dalam format teks SQL terkompresi `gzip` (`supabase_backup.sql.gz`).
  - **Engine B:** Menarik daftar rute aktif secara dinamis dari tabel `route_sheets` (Single Source of Truth), lalu mengekspor seluruh 18 file spreadsheet ke dalam format Microsoft Excel (`.xlsx`), mempertahankan seluruh tab tanggal 1 s/d 31 beserta rumus spreadsheet aslinya.
  - **Packaging & Manifest:** Menyatukan seluruh file SQL, 18 Excel, dan file `manifest.json` ke dalam arsip ZIP tunggal `SS_PDO_BACKUP_YYYY-MM-DD_HHmmss.zip`.
  - **Penyimpanan Ganda (*Dual Offsite Storage*):**
    1. Disimpan di **GitHub Actions Artifacts** (retensi 30 hari).
    2. Diunggah langsung ke **Folder Google Drive Pribadi Pengguna** menggunakan otorisasi Service Account. Pemilik folder Google Drive bebas menggunakan akun mana pun (tidak harus sama dengan Service Account).
    3. Kebijakan retensi Google Drive diatur secara baku ke **0 (Permanen/Abadi)**, sehingga file cadangan tidak akan pernah dihapus otomatis dan tersimpan utuh selamanya. Mengingat ukuran harian hanya ~4–5 MB (~150 MB/bln), kapasitas Google Drive gratis (15 GB) mampu menampung data cadangan hingga 8–10 tahun mendatang. Retensi juga dapat dikustomisasi fleksibel via GitHub Secrets `BACKUP_RETENTION_DAYS`.
- **Before vs After:**
  - *Sebelum:* 0 pencadangan otomatis (ketergantungan 100% pada ketahanan cloud pihak ketiga tanpa snapshot offline).
  - *Sesudah:* 2 lapisan cadangan independen setiap hari (GitHub + Google Drive pribadi), siap di-restore dalam hitungan menit kapan saja.
- **Case: Skenario Lapangan:**
  - *Kasus 1 (Pemulihan Skema Akun):* Seorang admin tidak sengaja menghapus tabel konfigurasi atau role user terkorupsi. Admin cukup mengunduh arsip ZIP dari Google Drive atau GitHub Artifacts, mengekstrak `supabase_backup.sql.gz`, lalu menjalankan 1 perintah `psql` untuk mengembalikan seluruh akun dan konfigurasi rute seperti sedia kala.
  - *Kasus 2 (Audit Offline Operasional):* Manajemen atau auditor pengawas memerlukan data operasional bulan berjalan tanpa harus membuka internet atau meminta izin akses ke Google Sheets satu per satu. Admin cukup membuka folder `SS_PDO_Backups` di Google Drive dan membuka file `.xlsx` rute yang bersangkutan langsung di laptop secara offline.

---

## 2. BUG-194-01: Perbaikan Inverted Conflict Resolution (Zero-Write Safe Server Sync)

- **Lokasi Kode:** `src/components/busCard/useBusCardSave.ts`, `src/utils/conflictMerge.ts`
- **Sebelum Perbaikan:**
  Ketika terjadi tabrakan data (OCC), tombol "Gunakan Data Server" (`onUseServer`) memanggil `mergeRemoteBusDataWithLocalUpdates(remoteData, updates)` lalu mengeksekusi `handleSaveUpdates(mergedUpdates, true)`. Karena fungsi merge memprioritaskan properti lokal, nilai lokal pengguna justru dituliskan kembali ke server dengan *force overwrite*, menimpa perubahan operator lain secara keliru.
- **Sesudah Perbaikan:**
  1. Tombol "Gunakan Data Server" diubah menjadi operasi murni **zero-write**: sama sekali tidak memanggil API penulisan ke Google Sheets.
  2. Formulir lokal pengguna (`formData`) dan state reaktif UI (`onUpdateBus`) disinkronkan secara langsung dengan nilai `remoteData` terbaru dari spreadsheet.
  3. Status penyimpanan diatur kembali ke `idle` (`setSaveStatus('idle')`), spinner dimatikan (`setIsLoading(false)`), dan toast notifikasi informatif ditampilkan kepada pengguna (`TEXT_ALERTS.CONFLICT.TOAST_SERVER_DATA_APPLIED`).
  4. Utilitas `mergeRemoteBusDataWithLocalUpdates` diperluas dengan parameter eksplisit `priority: 'local' | 'remote'` untuk fleksibilitas skenario penggabungan di modul lain.
- **Before vs After:**
  ```typescript
  // SEBELUM:
  onUseServer: () => {
    const mergedUpdates = mergeRemoteBusDataWithLocalUpdates(
      remoteData,
      updates,
    );
    handleSaveUpdates(mergedUpdates, true); // BAHAYA: Menimpa server secara paksa!
  }

  // SESUDAH:
  onUseServer: () => {
    // Zero-Write: Batalkan write lokal, sinkronkan UI lokal dengan remote data server
    const newFormData = { ...formData, ...remoteData };
    setFormData(newFormData);
    if (onUpdateBus) {
      onUpdateBus(remoteData);
    }
    setIsLoading(false);
    setSaveStatus("idle");
    showInfoToast(TEXT_ALERTS.CONFLICT.TOAST_SERVER_DATA_APPLIED);
  }
  ```
- **Case: Skenario Lapangan:**
  - *Skenario:* Pengawas Pool A dan Pengawas Pool B mengawasi unit bus yang sama (TJ-088). Pengawas B baru saja menginput KM Akhir 305.200 di spreadsheet. Pengawas A mencoba menginput KM Akhir 305.150 dari browser yang belum di-refresh.
  - Dialog tabrakan data muncul di layar Pengawas A memperlihatkan selisih angka tersebut. Pengawas A menyadari data Pengawas B lebih baru dan memilih tombol **"Gunakan Data Server"**.
  - Aplikasi seketika memperbarui formulir Pengawas A menjadi 305.200 tanpa menulis apa pun ke spreadsheet. Data akurat Pengawas B di spreadsheet tetap aman 100% tanpa risiko tertimpa.

---

## 3. BUG-194-02: Smart Offline Queue Merging dengan Preservasi Baseline Snapshot

- **Lokasi Kode:** `src/hooks/useOfflineSync.ts` (`addToQueue`)
- **Sebelum Perbaikan:**
  Fungsi `addToQueue` menggunakan `.filter()` untuk menghapus antrean lama pada baris bus yang sama sebelum menambahkan item baru. Pengeditan bertahap saat offline mengakibatkan kolom yang diinput sebelumnya hilang dari antrean.
- **Sesudah Perbaikan:**
  1. Diterapkan algoritma *Smart Queue Merging*: sistem mencari apakah baris yang sama (`sheetId`, `tabName`, `rowIndex`) sudah ada di antrean (`existingIndex >= 0`).
  2. Jika sudah ada, objek pembaruan digabungkan secara cerdas:
     `mergedUpdates = { ...existingItem.updates, ...item.updates }`
     sehingga kolom lama (misal `toaShift1`) tetap ada, dan kolom baru (misal `kmAkhir1`) ikut ditambahkan.
  3. Dilakukan **Preservasi Baseline Snapshot Awal**:
     `mergedSnapshot = { ...item.originalSnapshot, ...existingItem.originalSnapshot }`
     Baseline awal sebelum editan pertama tetap menjadi acuan utama untuk deteksi konflik OCC saat sinkronisasi online berjalan.
  4. ID unik antrean dipertahankan dan status antrean di-reset ke `'pending'`.
- **Before vs After:**
  ```typescript
  // SEBELUM:
  const currentQueue = readQueueFromStorage();
  const filtered = currentQueue.filter(
    q => !(q.sheetId === item.sheetId && q.tabName === item.tabName && q.rowIndex === item.rowIndex)
  );
  const newItem: SyncItem = {
    ...item,
    id: uniqueId,
    status: 'pending',
    retryCount: 0,
  };
  const newQueue = [...filtered, newItem]; // Antrean lama pada baris yang sama musnah!

  // SESUDAH:
  const currentQueue = readQueueFromStorage();
  const existingIndex = currentQueue.findIndex(
    q => q.sheetId === item.sheetId && q.tabName === item.tabName && q.rowIndex === item.rowIndex
  );

  let newQueue: SyncItem[];
  let payloadToBackup = item.updates;

  if (existingIndex >= 0) {
    const existingItem = currentQueue[existingIndex];
    // Gabungkan updates antar sesi edit offline
    const mergedUpdates = {
      ...existingItem.updates,
      ...item.updates,
    };
    // Preservasi snapshot baseline awal
    const mergedSnapshot = (item.originalSnapshot || existingItem.originalSnapshot)
      ? {
          ...item.originalSnapshot,
          ...existingItem.originalSnapshot,
        }
      : undefined;

    const updatedItem: SyncItem = {
      ...existingItem,
      updates: mergedUpdates,
      headerMap: item.headerMap || existingItem.headerMap,
      originalSnapshot: mergedSnapshot,
      status: 'pending',
      retryCount: 0,
    };
    newQueue = [...currentQueue];
    newQueue[existingIndex] = updatedItem;
    payloadToBackup = mergedUpdates;
  } else {
    // Tambah item baru jika belum ada
    ...
  }
  ```
- **Case: Skenario Lapangan:**
  - *Skenario:* Petugas lapangan bertugas di halte transit bawah tanah tanpa sinyal GSM. Pada pukul 14:00, petugas mencatat `toaShift1: "150"`. Aplikasi menyimpannya ke antrean offline.
  - Pada pukul 15:30 (masih offline), bus selesai rotasi dan petugas mengisi `kmAkhir1: "300500"`.
  - Sistem menggabungkan kedua input tersebut menjadi satu paket payload: `{ toaShift1: "150", kmAkhir1: "300500" }` dengan baseline snapshot utuh.
  - Saat petugas keluar ke area bersinyal, kedua kolom berhasil tersinkronisasi ke Google Sheets tanpa kehilangan data sedikit pun.

---

## 4. BUG-194-03: Ekstraksi Delta Updates (Dirty-Only Payload) & Proteksi Rumus

- **Lokasi Kode:** `src/components/busCard/useBusCardSave.ts` (`handleSaveUpdates`)
- **Sebelum Perbaikan:**
  Pada form mode penuh, seluruh 11 kolom dikirim ke `updateBusData` dan antrean offline, terlepas dari apakah kolom tersebut diedit oleh user atau tidak. Ini memicu tabrakan semu dan pemborosan request.
- **Sesudah Perbaikan:**
  1. Ekstraksi *dirty-only delta*: setiap kolom kandidat dibandingkan dengan baseline lokal `bus[field]` menggunakan `normalizeFieldValue()`.
  2. Hanya field yang mengalami perbedaan nilai riil yang dimasukkan ke dalam `deltaUpdates`.
  3. Proteksi Kolom Berumus: kolom formula seperti `toaShift2` dan kolom yang terdaftar di `FORMULA_FIELDS` secara tegas diabaikan dari payload mutasi.
  4. Optimasi *Zero-Change*: jika `deltaUpdates` kosong (tidak ada perubahan nyata), fungsi langsung keluar (*early return*) dengan status `success` tanpa mengirimkan request jaringan, menghemat kuota Google Sheets API.
- **Before vs After:**
  ```typescript
  // SEBELUM:
  await updateBusData(
    sheetId,
    tabName,
    bus.rowIndex,
    updates, // Seluruh 11 kolom dikirim mentah-mentah!
    headerMap,
    bus,
  );

  // SESUDAH:
  const candidateFields = Object.keys(updates) as (keyof BusData)[];
  const deltaUpdates: Partial<BusData> = {};
  for (const field of candidateFields) {
    if (FORMULA_FIELDS.has(field) || field === "toaShift2") continue;

    const updateNorm = normalizeFieldValue(updates[field]);
    const baseNorm = normalizeFieldValue(bus[field]);
    if (updateNorm !== baseNorm) {
      (deltaUpdates as any)[field] = updates[field];
    }
  }

  // Jika tidak ada perubahan riil dari baseline lokal, akhiri tanpa request jaringan
  if (!forceOverwrite && Object.keys(deltaUpdates).length === 0) {
    setIsLoading(false);
    setSaveStatus("success");
    return;
  }

  const payloadToSend = forceOverwrite ? updates : deltaUpdates;
  await updateBusData(sheetId, tabName, bus.rowIndex, payloadToSend, headerMap, bus);
  ```
- **Case: Skenario Lapangan:**
  - *Skenario:* Petugas membuka form bus TJ-002 pada mode semua kolom. Petugas hanya mengoreksi nomor trip pergi dari 4 menjadi 5, lalu menekan Simpan.
  - Tanpa delta, 10 kolom lainnya (termasuk KM dan Keterangan) akan ikut dikirim. Jika ada operator lain yang mengedit Keterangan di saat bersamaan, tabrakan data akan muncul.
  - Dengan perbaikan ini, hanya payload `{ tripPergi: "5" }` yang dikirim ke jaringan. Kolom lain tidak disentuh sama sekali, menghindari tabrakan dan melindungi formula lembar kerja.

---

## 5. UX-194-01: Visual Side-by-Side Diff Comparison Dialog & Kamus Teks Sentral

- **Lokasi Kode:** 
  - `src/constants/texts/text_alerts.ts` (`BUS_FIELD_LABELS`, `TEXT_ALERTS.CONFLICT_DIFF`)
  - `src/utils/alertUtils.ts` (`buildConflictDiffHtml`, `showQueueConflictDialog`)
- **Sebelum Perbaikan:**
  Dialog tabrakan hanya menyajikan teks deskripsi umum tanpa menampilkan kolom yang berbenturan ataupun membandingkan nilainya.
- **Sesudah Perbaikan:**
  1. Dibuat modul kamus `BUS_FIELD_LABELS` yang memetakan nama field teknis (misal `kmAkhir1`, `toaShift1`) ke label ramah operasional bahasa Indonesia (*"KM Akhir Shift 1"*, *"TOA Shift 1"*).
  2. Dibangun komponen visual `buildConflictDiffHtml(diffs, introText)` di dalam SweetAlert2:
     - Menampilkan container bergaya kartu modern dengan pembatas halus (`var(--color-border-subtle)`).
     - Menampilkan perbandingan dua kolom (*Side-by-Side*):
       - Kartu Kiri: **Data Server** (latar `var(--color-surface-raised)`, teks `var(--color-text-primary)`).
       - Kartu Kanan: **Input Baru Anda** (latar `var(--color-surface-raised)`, border penanda `var(--color-warning-border)`, teks aksen `var(--color-warning-fg)`).
     - Menampilkan teks bantuan `(Kosong)` jika salah satu nilai tidak terisi.
     - Sanitasi anti-XSS menyeluruh via `escapeHtml()` pada seluruh label dan nilai data.
- **Visual Representation (Side-by-Side Diff Layout):**
  ```
  +---------------------------------------------------------------+
  |  ⚠️  Data Spreadsheet Telah Berubah                           |
  |  Data unit TJ-088 di Google Sheets baru saja diperbarui oleh  |
  |  pihak lain. Silakan tinjau perbedaan data di bawah ini:      |
  |                                                               |
  |  RINCIAN PERBEDAAN KOLOM:                                     |
  |  +---------------------------------------------------------+  |
  |  | 🔹 KM Akhir Shift 1                                     |  |
  |  | +---------------------------+-------------------------+ |  |
  |  | | Data Server:              | Input Baru Anda:        | |  |
  |  | | 305.200                   | 305.150                 | |  |
  |  | +---------------------------+-------------------------+ |  |
  |  | 🔹 Keterangan                                           |  |
  |  | +---------------------------+-------------------------+ |  |
  |  | | Data Server:              | Input Baru Anda:        | |  |
  |  | | Unit selesai servis AC    | (Kosong)                | |  |
  |  | +---------------------------+-------------------------+ |  |
  |  +---------------------------------------------------------+  |
  |                                                               |
  |  [Tetap Timpa (Force)]   [Gunakan Data Server]   [Batal]      |
  +---------------------------------------------------------------+
  ```
- **Case: Skenario Lapangan:**
  - Ketika terjadi tabrakan, petugas lapangan langsung melihat kartu perbandingan visual yang jelas dan bersih di layar ponsel. Petugas dapat melihat secara pasti bahwa perbedaan hanya terletak pada kolom "KM Akhir Shift 1" dan dapat mengambil keputusan tepat dalam hitungan detik.

---

## 6. Rangkuman Pengujian & Verifikasi Kualitas Otomatis

Seluruh modul yang terdampak Refactor 194 telah diverifikasi menggunakan pengujian unit otomatis dan quality gates:

1. **Pengujian Unit Modul Refactor 194:**
   - `src/constants/texts/texts.test.ts` ➔ **28 passed (100%)**
   - `src/utils/alertUtils.test.ts` ➔ **49 passed (100%)**
   - `src/components/busCard/useBusCardSave.test.tsx` ➔ **10 passed (100%)**
   - `src/utils/conflictMerge.test.ts` ➔ **7 passed (100%)**
   - `src/hooks/__tests__/useOfflineSync.test.tsx` ➔ **13 passed (100%)**
   - **Total:** **107/107 unit tests passed**.

2. **Pengujian Mesin Pencadangan (ARCH-194-01):**
   - `scripts/backup/__tests__/backup-engine.test.ts` ➔ **5 passed (100%)**
   - `scripts/backup/__tests__/gdrive-uploader.test.ts` ➔ **5 passed (100%)**
   - **Total:** **10/10 tests passed**.

3. **Pengujian Kontrak Warna & WCAG Accessibility:**
   - `src/styles/tokens/color-contract.test.ts` ➔ **116 passed (100%)**
   - Memastikan tidak ada hardcoded color dan rasio kontras WCAG AA/AAA terpenuhi pada mode Light & Dark.
   - Pemanfaatan CSS Variables semantik (`--color-surface-raised`, `--color-warning-border`, `--color-warning-fg`, dll) valid.

4. **Kompilasi TypeScript & Build Produksi:**
   - TypeScript strict mode check (`tsc -b`) & Vite build: **0 Error / 0 Warning**.
