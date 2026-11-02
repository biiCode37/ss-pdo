# Audit Temuan Arsitektur, Resolusi Konflik, & Ketahanan Antrean Offline - Refactor 194

Dokumen ini mencatat audit arsitektur ketahanan data (*disaster recovery & backup resilience*), penanganan tabrakan data (*concurrency control & OCC*), integritas antrean offline (*offline queue resilience*), serta ergonomi antarmuka pengguna pada proyek **SS_PDO**.

---

## Ringkasan Temuan Audit

| ID Temuan | Lokasi Kode / Infra | Kategori | Keparahan | Deskripsi & Dampak Pengguna/Sistem | Mitigasi |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ARCH-194-01** | Dashboard Supabase / Infra | Disaster Recovery & Backup | 🔴 **High** | **Ketiadaan Mekanisme Backup Database & Spreadsheet (No Backups):** Dashboard Supabase menampilkan status `LAST BACKUP: No backups` karena akun berada pada Free Plan. Tidak ada mekanisme otomatis untuk mencadangkan data relasional (akun pengguna RBAC, pengaturan halaman, relasi 18 rute, status armada, dan audit trail) maupun ke-18 file Google Sheets yang menjadi Single Source of Truth (SSOT).<br><br>*Dampak:* Jika terjadi insiden kerusakan database, manipulasi data yang tidak sengaja, atau korupsi spreadsheet di Google Drive, organisasi tidak memiliki *point-in-time snapshot* untuk memulihkan sistem secara cepat. | 1. Bangun pipeline pencadangan ganda (*Unified Dual-Engine Backup*) menggunakan GitHub Actions Cron malam hari (02:00 WIB).<br>2. Engine A: Dump database Supabase via `pg_dump` ke `supabase_backup.sql.gz`.<br>3. Engine B: Ekspor 18 Google Sheets secara dinamis dari `route_sheets` ke format `.xlsx`.<br>4. Kemas seluruh aset ke file ZIP dengan `manifest.json`.<br>5. Simpan secara ganda di GitHub Artifacts dan unggah otomatis ke Google Drive pengguna via Service Account dengan opsi retensi permanen/abadi (0 hari). |
| **BUG-194-01** | `src/components/busCard/useBusCardSave.ts`<br>`src/utils/conflictMerge.ts` | Data Integrity & Concurrency Control | 🔴 **Critical** | **Inverted Conflict Resolution ("Gunakan Data Server" Menimpa Server):** Ketika tabrakan data (OCC collision) terdeteksi, dialog menawarkan opsi "Gunakan Data Server". Namun secara paradoks, handler memanggil `mergeRemoteBusDataWithLocalUpdates(remoteData, updates)` yang secara default memprioritaskan input lokal pengguna, lalu mengeksekusi `handleSaveUpdates(mergedUpdates, true)`.<br><br>*Dampak:* Alih-alih membatalkan editan lokal dan menerima data server, aplikasi justru menulis paksa ke Google Sheets dan menimpa perubahan operator lain yang sah di spreadsheet! | 1. Ubah tombol "Gunakan Data Server" menjadi operasi murni *zero-write* (sama sekali tidak mengirimkan mutasi atau request penulisan ke Google Sheets).<br>2. Sinkronkan formulir lokal (`formData`) dan state reaktif UI (`onUpdateBus`) langsung dengan data server (`remoteData`).<br>3. Tampilkan toast informasi konfirmasi bahwa tampilan telah diperbarui dengan data server terbaru.<br>4. Tambahkan parameter eksplisit `priority: 'local' \| 'remote'` pada utilitas `mergeRemoteBusDataWithLocalUpdates`. |
| **BUG-194-02** | `src/hooks/useOfflineSync.ts`<br>(fungsi `addToQueue`) | Offline Resilience & Data Integrity | 🔴 **High** | **Penghapusan Item Antrean Offline pada Baris yang Sama (Queue Loss on Overwrite):** Ketika pengguna mengedit unit bus yang sama lebih dari satu kali saat offline (misal: input TOA Shift 1 pada pukul 10:00, lalu input KM Akhir Shift 1 pada pukul 11:30), fungsi `addToQueue` menggunakan `.filter()` untuk membuang antrean lama pada baris tersebut sebelum menambahkan item baru.<br><br>*Dampak:* Perubahan kolom sebelumnya (TOA Shift 1) terhapus dari antrean offline dan hilang selamanya saat sinkronisasi online berjalan. Hanya editan terakhir (KM Akhir) yang terkirim ke spreadsheet. | 1. Terapkan algoritma *Smart Queue Merging* pada `addToQueue`.<br>2. Jika baris yang sama sudah ada di antrean, cari indeks eksisting dan gabungkan objek pembaruan (`updates: { ...existingItem.updates, ...item.updates }`).<br>3. Pertahankan snapshot baseline awal (*Baseline Snapshot Preservation*): simpan acuan data awal sebelum editan pertama (`mergedSnapshot: { ...item.originalSnapshot, ...existingItem.originalSnapshot }`) agar perbandingan OCC saat online tetap akurat.<br>4. Pertahankan `id` unik antrean dan reset status ke `'pending'`. |
| **BUG-194-03** | `src/components/busCard/useBusCardSave.ts`<br>(fungsi `handleSaveUpdates`) | Concurrency & Field Protection | 🟠 **Medium** | **Pengiriman Seluruh 11 Kolom Memicu Tabrakan Semu (All-Column Overwrite Collision):** Pada penyimpanan form penuh ([Semua Kolom]), seluruh 11 kolom data unit dikirimkan dalam payload `updates`, meskipun pengguna hanya mengubah 1 field saja. Jika operator lain telah memperbarui field lain di spreadsheet, penyimpanan full-payload ini memicu tabrakan data palsu atau menimpa kolom milik operator lain.<br><br>*Dampak:* Sering terjadi konflik OCC semu yang mengganggu alur kerja petugas, risiko menimpa data petugas shift lain, dan pemborosan bandwidth jaringan karena pengiriman data yang tidak berubah. | 1. Implementasikan ekstraksi perubahan delta murni (*dirty-only delta extraction*).<br>2. Bandingkan setiap field dengan nilai baseline lokal (`bus[field]`) menggunakan `normalizeFieldValue()`.<br>3. Hanya kolom yang benar-benar dimodifikasi pengguna yang dimasukkan ke dalam `deltaUpdates`.<br>4. Proteksi kolom berumus: abaikan kolom formula seperti `toaShift2` dari payload mutasi.<br>5. Lakukan *early exit* tanpa request jaringan jika tidak ada perubahan riil pada data unit. |
| **UX-194-01** | `src/utils/alertUtils.ts`<br>`src/constants/texts/text_alerts.ts` | UI/UX & User Ergonomics | 🟡 **Medium** | **Dialog Konflik Tanpa Komparasi Visual (Uninformative Collision Dialog):** Dialog SweetAlert2 saat terjadi tabrakan data hanya menyajikan teks peringatan generik tanpa menampilkan rincian kolom apa saja yang berbeda dan berapa nilai di server vs input pengguna.<br><br>*Dampak:* Petugas di lapangan mengalami kebingungan (*blind decision-making*) karena tidak tahu angka mana yang benar, apakah perbedaannya krusial (misal KM berselisih ratusan) atau sekadar perbedaan kecil, sehingga berpotensi salah memilih aksi "Tetap Timpa" atau "Gunakan Data Server". | 1. Bangun komponen tabel komparasi visual (*Side-by-Side Visual Diff Table*) di dalam SweetAlert2 via fungsi `buildConflictDiffHtml`.<br>2. Sajikan perbandingan dua kolom: "Data Server" vs "Input Baru Anda" dengan latar kontras tinggi.<br>3. Gunakan label nama kolom ramah operasional bahasa Indonesia dari kamus sentral `BUS_FIELD_LABELS`.<br>4. Terapkan sanitasi ketat anti-XSS melalui `escapeHtml()` pada seluruh nilai dinamis.<br>5. Gunakan token warna semantik CSS Variables (`--color-surface-raised`, `--color-warning-border`, dll) yang lolos WCAG. |

---

## Rincian Temuan & Analisis Akar Masalah

### 1. BUG-194-01: Inverted Conflict Resolution ("Gunakan Data Server" Menimpa Server)
- **Komponen Terdampak:** `src/components/busCard/useBusCardSave.ts`, `src/utils/conflictMerge.ts`
- **Analisis Akar Masalah:** 
  Pada implementasi awal, ketika terdeteksi kondisi tabrakan data (Three-Way Collision Rule terpenuhi), dialog resolusi konflik dipanggil dengan tombol:
  - Konfirmasi: *"Timpa Data SS"*
  - Deny: *"Gunakan & Gabung Data SS"*
  
  Pada callback `onUseServer`, kode mengeksekusi:
  ```typescript
  // SEBELUM PERBAIKAN:
  onUseServer: () => {
    const mergedUpdates = mergeRemoteBusDataWithLocalUpdates(
      remoteData,
      updates,
    );
    handleSaveUpdates(mergedUpdates, true); // Menulis paksa ke server!
  }
  ```
  Di dalam fungsi `mergeRemoteBusDataWithLocalUpdates`, baris implementasi adalah:
  ```typescript
  if (remoteValue !== undefined) merged[field] = remoteValue as never;
  if (localValue !== undefined) merged[field] = localValue as never;
  ```
  Artinya, jika `localValue` ada nilainya (yang selalu ada karena user baru saja menginputnya), nilai `localValue` menimpa `remoteValue`. Kemudian `handleSaveUpdates(mergedUpdates, true)` dipanggil dengan parameter `forceOverwrite = true`, yang membypass OCC dan menuliskan input lokal pengguna ke Google Sheets.
- **Konsekuensi Lapangan:** Petugas yang berniat mengalah dan mempercayai data server justru secara tidak sengaja menimpa dan memusnahkan data server yang baru saja diinput oleh rekannya.

### 2. BUG-194-02: Offline Queue Overwrite Loss (Penghapusan Antrean Offline pada Baris yang Sama)
- **Komponen Terdampak:** `src/hooks/useOfflineSync.ts` (`addToQueue`)
- **Analisis Akar Masalah:**
  Pada implementasi fungsi `addToQueue`, ketika item baru dimasukkan, kode melakukan pemfilteran:
  ```typescript
  // SEBELUM PERBAIKAN:
  const currentQueue = readQueueFromStorage();
  const filtered = currentQueue.filter(
    q => !(q.sheetId === item.sheetId && q.tabName === item.tabName && q.rowIndex === item.rowIndex)
  );
  const newItem = { ...item, id: uniqueId, status: 'pending', retryCount: 0 };
  const newQueue = [...filtered, newItem];
  ```
  Jika petugas berada di area blank spot sinyal (misal pool bawah tanah atau terminal terpencil) dan melakukan dua kali aksi:
  1. Pukul 08:00: Menginput KM Awal & TOA Shift 1 pada bus 01 (tersimpan ke antrean).
  2. Pukul 09:30: Mengisi Keterangan armada pada bus 01 yang sama (memanggil `addToQueue` kedua).
  Filter di atas akan membuang item pertama dari antrean, dan hanya menyisakan item kedua (`{ keterangan: "..." }`).
- **Konsekuensi Lapangan:** Saat ponsel kembali terhubung ke internet, sinkronisasi hanya mengirimkan data Keterangan. Angka TOA dan KM yang telah diinput sebelumnya hilang tanpa jejak.

### 3. BUG-194-03: All-Column Overwrite Collision (Lack of Delta Updates)
- **Komponen Terdampak:** `src/components/busCard/useBusCardSave.ts` (`handleSaveUpdates`)
- **Analisis Akar Masalah:**
  Pada komponen form kartu bus mode [Semua Kolom], objek `updates` yang dikirimkan oleh form mengandung 11 atribut (`tripPergi`, `tripPulang`, `toaShift1`, `manualShift1`, `totalToa`, `kmAwal1`, `kmAkhir1`, `kmAwal2`, `kmAkhir2`, `keterangan`, dll).
  Tanpa adanya ekstraksi delta, seluruh 11 kolom ini dikirimkan ke `updateBusData`.
  Jika petugas A mengedit `kmAkhir1`, sementara petugas B di tempat lain baru saja mengedit `keterangan` di Google Sheets, sistem akan menganggap terjadi tabrakan data pada kolom `keterangan` karena nilai lokal di memori petugas A berbeda dari nilai baru di spreadsheet petugas B.
- **Konsekuensi Lapangan:** Terjadi alarm tabrakan palsu (*false collision*) yang membingungkan operator lapangan, atau jika dipaksa simpan, kolom `keterangan` milik petugas B akan tertimpa oleh data usang dari petugas A.

### 4. UX-194-01: Uninformative Collision Dialog (Ketiadaan Komparasi Visual Diff)
- **Komponen Terdampak:** `src/utils/alertUtils.ts`, `src/constants/texts/text_alerts.ts`
- **Analisis Akar Masalah:**
  Dialog tabrakan SweetAlert2 hanya memuat teks: *"Data unit X di Google Sheets baru saja diperbarui oleh pihak lain. Apakah Anda ingin menimpa perubahan tersebut atau menggabungkannya dengan data SS?"*. Dialog tidak memberitahukan field apa yang berbeda (apakah KM, TOA, atau Keterangan) dan berapa angka yang ada di spreadsheet vs angka yang baru saja diketikkan pengguna.
- **Konsekuensi Lapangan:** Operator tidak memiliki informasi untuk membuat keputusan yang tepat, berujung pada keraguan atau salah menekan tombol yang berakibat fatal bagi keakuratan laporan operasional.
