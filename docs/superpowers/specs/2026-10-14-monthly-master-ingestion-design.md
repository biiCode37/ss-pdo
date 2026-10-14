# Spesifikasi Desain: Fitur Tarik Data 1 Bulan Sekaligus (Monthly Master Ingestion)

- **Tanggal Dokumen:** 14 Oktober 2026
- **Cabang Git (Branch):** `devmode`
- **Tujuan:** Mengatasi kekosongan data historis pada masa transisi dengan menyediakan fitur penarikan data massal 1 bulan sekaligus dari Spreadsheet Rekap Master Wilayah (contoh: tab `OKTOBER 2026`) langsung ke Supabase `daily_route_reports` dalam hitungan detik.

---

## 1. Latar Belakang & Masalah

1. **Kekosongan Data Masa Transisi:** Tab Mingguan, Bulanan, dan Rekap Korwil pada Dashboard Monitoring Wilayah menarik data teragregasi dari tabel database Supabase `daily_route_reports`.
2. **Keterbatasan Alat Saat Ini:** Tombol penarikan data yang ada saat ini (`ingestRegionalRouteSummaries`) hanya menarik 1 tanggal aktif dari 18 sheet rute individu. Mengisi 14 hari membutuhkan 14 kali klik manual dan 252 request HTTP yang lambat dan rentan pembatasan kuota Google API.
3. **Ketersediaan Master Sheet:** Wilayah operasional memiliki Spreadsheet Rekap Master (seperti sheet `OKTOBER 2026`) yang merangkum seluruh 18 rute dari tanggal 1 hingga akhir bulan dalam 1 tab.
4. **Tantangan Bulan Berjalan:** Saat dijalankan di tengah bulan (misalnya tanggal 14), tanggal 15 s.d. 31 masih kosong atau belum ada realisasi operasional, sehingga sistem wajib menyaring dan mengabaikan tanggal masa depan serta baris tanpa operasional.

---

## 2. Arsitektur & Logika Pemrosesan (`monthlyMasterIngestionService.ts`)

### A. Pengambilan Data Cepat (Single Request CSV)
- Menggunakan endpoint Google Sheets CSV export:
  `https://docs.google.com/spreadsheets/d/{spreadsheetId}/gviz/tq?tqx=out:csv&sheet={encodedSheetName}`
- Melakukan 1 kali panggilan HTTP cepat (ukuran respon ~100–150 KB, waktu baca ~1.5–2 detik).

### B. Pemetaan Struktur Baris & Tanggal
- Memindai baris CSV untuk menemukan judul blok tanggal dengan pola regex:
  `^"?([A-Za-z]+),\s*(\d{1,2})\s*([A-Za-z]+)\s*(\d{4})"?`
  (Contoh: `"Kamis, 01 Oktober 2026"`, `"Rabu, 14 Oktober 2026"`).
- Menghasilkan daftar tanggal dalam format ISO `YYYY-MM-DD`.

### C. Penyaringan Tanggal (Date Limit Filter)
- **Bulan Berjalan (Current Month):**
  Jika tahun dan bulan sama dengan bulan hari ini, batas maksimal hari yang diproses adalah tanggal hari ini (`currentDay = new Date().getDate()`). Tanggal di atas hari ini (misal tanggal 15–31) otomatis dilewati (*skip*).
- **Bulan Lampau (Past Month):**
  Jika tahun dan bulan lebih kecil dari bulan hari ini, memproses seluruh tanggal dalam bulan tersebut (1 s.d. akhir bulan).

### D. Pemetaan Kolom Data Rute
Di bawah setiap judul tanggal, terdapat baris untuk ke-18 rute dengan pemetaan kolom:
- **Kolom 2 (Col C):** Kode Rute (contoh: `JAK 01`, `JAK 117`, `JAK 110A`)
- **Kolom 3 (Col D):** Renops (default jadwal operasi armada)
- **Kolom 4 (Col E):** Realops (realisasi armada aktif)
- **Kolom 5 (Col F):** KM Tempuh (jarak tempuh operasional)
- **Kolom 6 (Col G):** TOA Shift 1
- **Kolom 7 (Col H):** Manual Shift 1
- **Kolom 9 (Col J):** TOA Shift 2
- **Kolom 10 (Col K):** Manual Shift 2
- **Kolom 12 (Col M):** Total Pelanggan
- **Kolom 19 (Col T):** Total Ritase PP

Semua angka numerik diformat menggunakan utilitas `parseIndonesianNumber()`.

### E. Aturan Integritas Data & Proteksi (Golden Rules)
1. **Activity Guard:** Jika `realops === 0 && total_km === 0 && total_passengers === 0`, baris rute tersebut dilewati (belum ada aktivitas operasional).
2. **Smart Skip (Aplikasi SSOT):** Sebelum melakukan upsert, periksa tabel `daily_route_reports` untuk rentang tanggal yang diproses. Jika laporan rute tersebut sudah berstatus `submitted` atau `verified` (diinput pengawas lewat aplikasi), data spreadsheet **TIDAK AKAN menimpa**.
3. **Terminologi Ritase PP:** Sesuai aturan domain, 1 Ritase = Pulang-Pergi (PP). Jika nilai di kolom ritase sheet tersedia, gunakan nilai tersebut; jika tidak, hitung $\frac{\text{Total KM}}{\text{km\_baku}}$. Dilarang memasukkan trip satu arah mentah.
4. **Batch Upsert:** Menyimpan payload ke Supabase `daily_route_reports` dengan batasan `onConflict: 'route_id,date'` dalam batch (misal 50 baris per putaran).

---

## 3. Desain Antarmuka Pengguna (UI/UX)

### A. Pemicu Pintar di Header (`MonitoringHeader.tsx`)
- Menggunakan tombol `<CloudDownload>` yang sudah ada di header:
  - Jika periode aktif adalah **Harian (`daily`)**: Tombol memicu sinkronisasi harian rute aktif (`onSync18Routes`).
  - Jika periode aktif adalah **Mingguan (`weekly`)**, **Bulanan (`monthly`)**, atau **Kustom (`custom`)**: Tombol membuka modal **Tarik Data 1 Bulan Sekaligus** (`onOpenMonthlySyncModal`).
- Tooltip dan aria-label menyesuaikan periode secara dinamis.

### B. Modal Sinkronisasi Bulanan (`MonthlySyncModal.tsx`)
- **Desain:** Modern glassmorphism, mobile-first, transisi halus iOS `cubic-bezier(0.32, 0.72, 0, 1)`.
- **Elemen:**
  - Header dengan judul `"Tarik Data 1 Bulan Sekaligus"`.
  - Input field **Link Spreadsheet Rekap Master Wilayah** (tersimpan otomatis di `localStorage['ss_pdo_master_sheet_url']` agar pengguna tidak perlu memasukkan ulang).
  - Input field **Nama Lembar / Tab Bulan** (otomatis terisi nama bulan aktif, contoh: `OKTOBER 2026`).
  - Badge info: `"Menyinkronkan Tanggal 1 s.d. 14 Oktober 2026 (18 Rute)"`.
  - Tombol **Mulai Sinkronisasi** dan **Batal**.
- **Indikator Progres:**
  - Menampilkan progress bar persentase (0% s.d. 100%) dan teks status dinamis (contoh: `"Membaca spreadsheet master...", "Memproses tanggal 5 Oktober... (85/252)"`).
- **Hasil Akhir (Toast / Summary):**
  - Menampilkan ringkasan: `X rute berhasil ditarik, Y dilewati (sudah diinput di app)`.

---

## 4. Standar Kamus Teks Sentral (`text_monitoring.ts`)

Seluruh teks baru wajib didefinisikan di `src/constants/texts/text_monitoring.ts` pada namespace `TEXT_MONITORING.MONTHLY_SYNC`:
- `TITLE`: `"Tarik Data 1 Bulan Sekaligus"`
- `DESC`: `"Tarik otomatis seluruh riwayat operasional 18 rute dari Spreadsheet Rekap Master ke database Supabase."`
- `LABEL_URL`: `"Link Spreadsheet Rekap Master Wilayah"`
- `LABEL_TAB`: `"Nama Lembar (Tab Bulan)"`
- `BTN_START`: `"Mulai Sinkronisasi"`
- `BTN_CANCEL`: `"Batal"`
- `RANGE_INFO`: `(start: number, end: number, monthName: string, year: number) => `Menyinkronkan Tanggal ${start} s.d. ${end} ${monthName} ${year} (18 Rute)``
- `STATUS_FETCHING`: `"Mengunduh data spreadsheet master..."`
- `STATUS_PARSING`: `"Menganalisis baris data 18 rute..."`
- `STATUS_SAVING`: `(processed: number, total: number) => `Menyimpan data ke database (${processed}/${total})...``
- `SUCCESS_TITLE`: `"Sinkronisasi Bulanan Selesai"`
- `SUCCESS_SUMMARY`: `(saved: number, skipped: number) => `${saved} laporan rute berhasil diperbarui, ${skipped} dilewati (sudah diisi di aplikasi).``

---

## 5. Rencana Pengujian & Quality Gates

1. **Unit Test Service (`monthlyMasterIngestionService.test.ts`):**
   - Menguji pemotongan tanggal masa depan (tanggal 15–31 di-skip pada bulan berjalan).
   - Menguji pengabaian baris rute yang kosong (`realops === 0 && total_km === 0`).
   - Menguji perlindungan Smart Skip (tidak menimpa status `submitted`/`verified`).
   - Menguji kalkulasi ritase PP dan parsing angka format Indonesia.
2. **Unit Test Komponen Modal (`MonthlySyncModal.test.tsx`):**
   - Menguji render input URL dan tab name.
   - Menguji validasi URL spreadsheet.
   - Menguji pemanggilan servis dan tampilan progress bar.
3. **Unit Test Header & Integrasi Halaman (`MonitoringHeader.test.tsx`, `AllRouteMonitoringPage.test.tsx`):**
   - Menguji tombol CloudDownload membuka modal ketika periode bukan Harian.
4. **Verifikasi Build & Test:**
   - `pnpm vitest run src/` lulus 100%.
   - `pnpm run build` lulus 0 error.
   - `graphify update .` sukses memperbarui graf pengetahuan.
