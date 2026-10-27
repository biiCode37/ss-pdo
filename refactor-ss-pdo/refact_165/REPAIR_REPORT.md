# REPAIR REPORT: Refactor 165 - Penyempurnaan Generator Laporan WA Format 3 & Rincian Kesiapan Armada

## Informasi Siklus
- **ID Siklus:** `refact_165`
- **Fokus Utama:** Generator Laporan WhatsApp Format 3 (Status Kesiapan Armada Per Shift: Shift 1 & Shift 2), Rincian Unit Kendala/OFF/Catatan Khusus, Normalisasi Pemadanan Kode Rute, Sinkronisasi Otomatis DB, dan Pencegahan Pemotongan Ganda Realops.
- **Branch Kerja:** `devmode` (terisolasi penuh dari branch `main`).
- **Verifikasi Quality Gates:**
  - `pnpm vitest run src/`: 120 test files passed, 871 tests passed (100% PASS).
  - `pnpm run build`: `tsc -b` & Vite build passed dengan 0 error.

---

## Rincian Perbaikan (Implementation & Before vs After)

### 1. Penyempurnaan Template Laporan WA Format 3 (`src/utils/waReportGenerator.ts`)
- **Implementasi:**
  - Memisahkan unit non-SGO menjadi 3 kelompok secara presisi:
    1. `kendalaUnits`: unit tidak beroperasi karena kendala teknis/operasional (`!u.isOff && !u.isOperatingWithNote`).
    2. `offUnits`: unit tidak beroperasi karena jadwal libur/cadangan (`u.isOff`).
    3. `specialOperatingUnits`: unit tetap beroperasi tetapi memiliki keterangan khusus (`u.isOperatingWithNote`).
  - Menambahkan penanda fallback jelas saat status rute `TIDAK LENGKAP` namun rincian nomor unit belum diisi di database: `TEXT_WA_REPORT.TEMPLATE.FORMAT_3_NO_UNIT_DETAILS(routeTidakOps)`.
  - Menampilkan catatan hambatan rute jika ada (`operationalIssues`).
- **Before vs After:**
  - *Before:*
    ```
    *01. JAK.01 | Tanjung Priok - Plumpang*
    - Mayasari Bakti
    Target SGO    : 10 Unit
    Realisasi Ops : 8 Unit
    Tidak Ops     : 2 Unit
    Status        : TIDAK LENGKAP ✖️
    (Tidak ada rincian unit apa pun yang muncul, korlap/korwil bingung)
    ```
  - *After:*
    ```
    *01. JAK.01 | Tanjung Priok - Plumpang*
    - Mayasari Bakti
    Target SGO    : 10 Unit
    Realisasi Ops : 8 Unit
    Tidak Ops     : 2 Unit
    Status        : TIDAK LENGKAP ✖️
    *Rincian Tidak Ops:*
    - MB-001 : Mogok radiator bocor
    *Unit Libur (OFF) / Keterangan Khusus:*
    - MB-002 : Libur berkala
    *Catatan Khusus Unit (Beroperasi):*
    - MB-003 : Tukar shift 2
    *Catatan Operasional Rute:*
    - Simpang Enggano padat merayap
    ```
- **Case Skenario Lapangan:**
  - *Skenario:* Korlap JAK.01 mengirim laporan Shift 1 di grup WhatsApp manajemen. Manajemen langsung melihat unit mana yang mogok di jalan (MB-001) dan unit mana yang memang dijadwalkan libur (MB-002), serta mengetahui bahwa MB-003 tetap beroperasi namun tukar pengemudi di Shift 2. Tidak ada lagi pertanyaan berulang "Kenapa JAK.01 kurang 2 unit?".

---

### 2. Normalisasi Kode Rute & Fallback Cerdas Unit Spreadsheet (`src/components/monitoring/tabs/MonitoringWaReportTab.tsx`)
- **Implementasi:**
  - Mengimpor `normalizeRouteCode` dari `@/services/googleSheets/globalReportReader`.
  - Memperbaiki pencocokan `matchingShift`: `s.shift === format3Shift && ((s.route_id && s.route_id === r.id) || s.route_code === r.routeCode || normalizeRouteCode(s.route_code) === normalizeRouteCode(r.routeCode))`.
  - Menambahkan fallback unit cerdas: jika shift terdaftar di DB tetapi belum ada rincian unit non-SGO (`dbUnits.length === 0`), sistem secara otomatis menggunakan data unit dari spreadsheet (`ssNonSgo`).
  - Meneruskan `operationalIssues: r.operationalIssues` ke Format 3.
- **Before vs After:**
  - *Before:* Pencarian hanya membandingkan string mentah `s.route_code === r.routeCode`. Jika di DB tersimpan `JAK 01` dan di rute `JAK.01`, pencocokan gagal. Selain itu, jika korlap hanya input angka tanpa unit, data unit spreadsheet diabaikan.
  - *After:* Pencocokan aman dari variasi format spasi/titik. Jika korlap hanya mengonfirmasi angka realops, rincian unit otomatis ditarik dari hasil pembacaan spreadsheet.
- **Case Skenario Lapangan:**
  - *Skenario:* Petugas A2 menginput laporan kesiapan armada untuk rute `JAK 15` (dengan spasi). Di tabel monitoring yang menggunakan `JAK.15`, status kesiapan armada dan unit kendala tetap terhubung sempurna tanpa rute berstatus "Data Belum Lengkap".

---

### 3. Penataan Fallback Data Unit pada Service Monitoring (`src/services/allRouteMonitoringService.ts`)
- **Implementasi:**
  - Mengambil data dari `daily_fleet_non_sgo_units` saat memuat `daily_fleet_shifts` per tanggal.
  - Menyediakan fallback: jika `todayReport?.fleet_status_shift1` kosong (karena sinkronisasi spreadsheet global hanya membawa angka agregat), sistem otomatis mengisi `fleetStatusShift1` dari unit non-SGO milik `daily_fleet_shifts`.
- **Before vs After:**
  - *Before:* `fleetStatusShift1: todayReport?.fleet_status_shift1 || []`. Jika data harian berasal dari sheet master, unit non-SGO selalu bernilai array kosong `[]`.
  - *After:* Jika `todayReport?.fleet_status_shift1` kosong, sistem mengambil unit dari `fsS1?.non_sgo_units`.
- **Case Skenario Lapangan:**
  - *Skenario:* Korlap telah menginput catatan kendala unit di aplikasi. Ketika admin melakukan sinkronisasi rekap global wilayah, data unit kendala yang sudah diinput Korlap tetap muncul dan tidak hilang di dashboard monitoring.

---

### 4. Perbaikan Akurasi Realops & Penghapusan Pemalsuan Shift 2 (`src/components/waReport/useWaReportData.ts`)
- **Implementasi:**
  - Menghapus rumus keliru `Math.max(r.realopsShift2 || 0, r.realopsShift1 || 0)`.
  - Menghapus pemotongan ganda `Math.min(rawRealops, Math.max(0, renops - kendalaCount))`.
  - Memetakan properti `isOperatingWithNote` dan `operationalIssues`.
- **Before vs After:**
  - *Before:* Realops Shift 2 dipaksa setidaknya sama dengan Shift 1 dengan `Math.max`, sehingga rute yang armadanya berkurang di Shift 2 tetap dilaporkan penuh seperti Shift 1. Selain itu, jika ada unit kendala, realops dipotong dua kali.
  - *After:* Realops Shift 1 dan Shift 2 independen dan akurat sesuai fakta lapangan (`rawRealops = selectedShift === 1 ? r.realopsShift1 : r.realopsShift2`).
- **Case Skenario Lapangan:**
  - *Skenario:* Rute JAK.115 beroperasi 20 unit di Shift 1, namun di Shift 2 hanya 18 unit karena 2 armada mengalami kendala di siang hari. Laporan Shift 2 kini benar-benar mencantumkan 18 unit (bukan 20 unit).

---

### 5. Parser Regex Cerdas Catatan Unit Korlap (`src/components/fleetStatus/QuickKorlapFleetModal.tsx`)
- **Implementasi:**
  - Mengembangkan fungsi `parseKorlapUnitNote` dengan regex multi-prefix yang mampu mengenali operator Mikrotrans: `KWK 222177`, `SAF 05`, `TS.02`, `BA 01`, `222180`.
  - Menggunakan boundary regex `hasWord` untuk mendeteksi status (`MOGOK`, `RUSAK`, `SO`, `OFF`, `TO`) agar substring seperti "RADIATOR" tidak keliru dideteksi sebagai "TO".
  - Menambahkan sinkronisasi otomatis ke tabel `daily_route_reports` saat Korlap menyimpan data armada cepat.
- **Before vs After:**
  - *Before:* Teks "TS.02 Radiator bocor" terdeteksi sebagai status TO (karena substring "TO" dalam "RADIA**TO**R"), dan sinkronisasi ke laporan rute harian belum otomatis.
  - *After:* Unit "TS.02" diklasifikasikan dengan tepat sebagai kendala MOGOK/RUSAK dengan catatan "Radiator bocor", dan langsung tersinkron ke `daily_route_reports`.
- **Case Skenario Lapangan:**
  - *Skenario:* Korlap mengetik cepat di ponsel: `"TS.02 Radiator bocor, KWK 222180 libur"`. Sistem langsung memisahkan unit TS.02 (Kendala Rusak) dan KWK 222180 (Libur/OFF) tanpa salah interpretasi kode status.

---

### 6. Klasifikasi Unit Operasi dengan Catatan di Ingestion Service (`src/services/regionalIngestionService.ts`)
- **Implementasi:**
  - Membedakan antara `isExplicitKendala` (mogok/rusak/laka), `isExplicitOff` (libur/spare/off), dan `isOperatingWithNote` (unit aktif beroperasi tapi memiliki keterangan tertulis di spreadsheet).
- **Before vs After:**
  - *Before:* Seluruh baris yang memiliki teks di kolom Keterangan dimasukkan sebagai unit kendala non-SGO dan memotong angka armada aktif (`activeBuses`).
  - *After:* Unit yang beroperasi namun memiliki catatan keterangan (misal: "Ganti supir di pool", "Tukar shift") tetap dihitung sebagai unit operasi aktif, namun catatannya tetap ditampilkan di laporan WA pada subheader khusus.
- **Case Skenario Lapangan:**
  - *Skenario:* Di spreadsheet rute JAK.05 tertulis keterangan "TUKAR SHIFT 2" pada unit TJ-101 yang memiliki 8 trip di Shift 1. Unit tersebut tetap dihitung aktif 1 unit dan masuk di laporan WA pada bagian `*Catatan Khusus Unit (Beroperasi):*` tanpa membuat rute dianggap kekurangan armada.

---

### 7. Ekstraksi Rincian Unit & Safe Realtime Guard pada Webhook Ingestion (`supabase/functions/sheet-sync-webhook/index.ts`)
- **Implementasi:**
  - Mengambil data laporan harian eksisting (`existingReport`) dari tabel `daily_route_reports` sebelum memproses sel spreadsheet.
  - Mengekstrak array rincian unit `nonSgoUnitsS1` dan `nonSgoUnitsS2` selama loop baris bus armada (menyimpan properti `unit`, `note`, `isOff`, dan `isOperatingWithNote`).
  - Menerapkan **Safe Realtime Guard**:
    - Memeriksa status konfirmasi resmi Korlap (`is_fleet_confirmed_s1`, `is_fleet_confirmed_s2`) dan sumber data manual (`data_source === "app_input"`).
    - Jika shift sudah disahkan/dikonfirmasi manual oleh Korlap di aplikasi, data unit dan angka realops manual Korlap **TIDAK DITIMPA** oleh payload otomatis webhook.
    - Jika belum ada konfirmasi resmi di aplikasi, data otomatis hasil ekstraksi baris spreadsheet langsung dimasukkan ke `fleet_status_shift1` dan `fleet_status_shift2`.
  - Mengunggah dan men-deploy Edge Function versi 4 ke server Supabase via MCP Supabase (`slug: sheet-sync-webhook`, status: `ACTIVE`).
- **Before vs After:**
  - *Before:* Webhook Google Apps Script (`CentralizedMasterRealtimeSync.js`) yang tertrigger on-edit hanya menghitung angka total bus aktif (`activeBusesS1/S2`) tanpa menyimpan nomor unit dan keterangan kendala ke database. Akibatnya, `fleet_status_shift1/2` di database selalu `[]` kosong dan Generator Format 3 menampilkan peringatan `- Rincian unit belum dilengkapi (-N unit)`.
  - *After:* Setiap kali staf pool atau operator mengedit baris armada di spreadsheet rute tunggal, webhook otomatis mengekstrak nomor bodi unit beserta kendalanya ke `fleet_status_shift1/2` di database Supabase secara realtime tanpa menimpa konfirmasi resmi Korlap jika sudah ada. Laporan Format 3 langsung menampilkan rincian unit kendala/OFF secara otomatis.
- **Case Skenario Lapangan:**
  - *Skenario:* Staf pool JAK.01 mencatat di spreadsheet rute tunggal pada baris bodi MB-012 dengan keterangan "MOGOK DEREK". Dalam hitungan detik setelah sel diedit, webhook Google Apps Script mengirim payload ke Supabase. Edge Function versi 4 langsung mengekstrak MB-012 ke dalam `fleet_status_shift1`. Korwil atau Korlap yang membuka Generator Format 3 langsung melihat unit MB-012 tercantum di bawah `*Rincian Tidak Ops:* - MB-012 : MOGOK DEREK` tanpa perlu input ulang secara manual.

---

### 8. Perbaikan Status Webhook Mesin & Penyelarasan Smart Skip Tombol "Load All" (`sheet-sync-webhook` & `regionalIngestionService.ts`)
- **Implementasi:**
  - Mengubah status bawaan `sheet-sync-webhook` saat baris baru dibuat oleh trigger spreadsheet menjadi **`'draft'`** (bukan `'submitted'`), serta hanya mempertahankan status `'submitted'` jika rute tersebut memang sebelumnya disahkan oleh Korlap melalui aplikasi (`isAppManual || isS1Confirmed || isS2Confirmed`).
  - Memperbaiki logika pra-penyaringan Smart Skip pada fungsi `ingestRegionalRouteSummaries` dan `ingestRegionalRouteSummariesForRange` di `src/services/regionalIngestionService.ts`:
    - Rute hanya di-skip sebagai `skippedFromApp` jika statusnya `verified` (disahkan Pengawas) ATAU statusnya `submitted` DAN bukan berasal dari tarikan spreadsheet (`!isFromSheet`).
    - Jika `data_source === 'sheet_ingestion'`, sistem mengizinkan penarikan ulang dari Google Sheets saat tombol **"Load All"** di-tap.
  - Menerapkan Safe Realtime Guard pada fungsi `extractRouteDailyMetrics` agar saat tombol Load All menarik data spreadsheet, data nomor unit dan realops yang sudah dikonfirmasi resmi oleh Korlap di aplikasi tidak terhapus.
  - Menambahkan unit test pencegahan regresi di `src/services/regionalIngestionService.test.ts`.
- **Before vs After:**
  - *Before:* Webhook spreadsheet otomatis menyimpan status `submitted`. Saat tombol "Load All" di-tap, filter Smart Skip mengira laporan tersebut adalah inputan manual final dari aplikasi, sehingga rute di-skip secara diam-diam dan data spreadsheet terbaru tidak pernah ditarik.
  - *After:* Data tarikan mesin berstatus `'draft'`. Jika ada rute berstatus `submitted` dari tarikan sheet lama pun, tombol "Load All" kini tetap menarik data terbaru dari Google Sheets tanpa menjegal proses sinkronisasi, sementara input manual resmi Korlap tetap terlindungi.
- **Case Skenario Lapangan:**
  - *Skenario:* Korwil menekan tombol "Load All" di pagi hari untuk menyegarkan seluruh 18 rute dari Google Sheets. Seluruh rute yang diperbarui staf pool di spreadsheet rute tunggal ditarik sempurna 100% tanpa ada rute yang ter-skip keliru, dan rute yang sudah dikonfirmasi resmi oleh Korlap di aplikasi tetap aman terjaga.

---

## Verifikasi Pengujian

| Komponen / Modul | File Uji | Jumlah Test | Status |
|---|---|---|---|
| Generator Laporan WA | `src/utils/waReportGenerator.test.ts` | 11 tests | **PASSED** |
| Kamus Teks Sentral | `src/constants/texts/texts.test.ts` | 23 tests | **PASSED** |
| Modal Input Cepat Korlap | `src/components/fleetStatus/QuickKorlapFleetModal.test.tsx` | 6 tests | **PASSED** |
| Ingestion Service Wilayah | `src/services/regionalIngestionService.test.ts` | 13 tests | **PASSED** |
| Tab Monitoring WA Report | `src/components/monitoring/tabs/MonitoringWaReportTab.test.tsx` | 6 tests | **PASSED** |
| Service Monitoring Wilayah | `src/services/allRouteMonitoringService.test.ts` | 8 tests | **PASSED** |
| Modal Generator Laporan WA | `src/components/waReport/WaReportModal.test.tsx` | 4 tests | **PASSED** |
| **Total Test Suite Workspace** | `pnpm vitest run src/` | **872 tests (120 files)** | **100% PASSED** |
| **TypeScript & Bundle Build** | `pnpm run build` | `tsc -b && vite build` | **0 ERROR** |

