# Laporan Pelaksanaan Fase 1: Inventaris dan Kontrak Perapihan — Refact 80

- **Tanggal Pelaksanaan:** 27 September 2026
- **Pelaksana:** AntiGravity / Gemini (Executor)
- **Peran Mitra:** Codex (Orchestrator) & Project Owner
- **Branch:** `devmode` (Wajib, terisolasi dari branch utama)
- **HEAD Komit:** `2e15090ef04c7ea0e8434ce43af738fbd0b13e38`
- **Referensi Paket:** `refactor-ss-pdo/refact_79/GEMINI_PHASE_01.md`
- **Status Akhir Fase 1:** **`READY_FOR_REVIEW`** (Menunggu review orchestrator Codex sebelum Fase 2 dimulai)

---

## 1. Ringkasan Eksekutif Hasil Fase 1

Sesuai dengan mandat instruksi `refact_79/GEMINI_PHASE_01.md`, seluruh pekerjaan pada **Fase 1** difokuskan penuh pada **audit komprehensif, inventarisasi 100% permukaan antarmuka (UI), validasi temuan domain awal, serta penyusunan kontrak baku implementasi**.

**Pernyataan Batas Tugas:**
> *Belum ada perubahan atau pengeditan kode sumber aplikasi (`src/`) pada Fase 1 ini.*
> Seluruh kode aplikasi dan perubahan lokal awal di working tree tetap dipertahankan murni tanpa modifikasi. Implementasi perbaikan dijadwalkan secara terisolasi mulai dari Fase 2 setelah review dan persetujuan dari Codex.

### Output Artefak yang Dihasilkan pada `refactor-ss-pdo/refact_80/`:
1. **`COMPONENT_INVENTORY.csv`**: Peta inventarisasi lengkap dari **167 file komponen TS/TSX non-test** (dari total 202 file komponen di `src/components/` dan `src/App.tsx`). Mencakup kolom: Path, Peran, Fitur/Pemilik, Tanggung Jawab, Baris Fisik, Pemanggil, Dependensi Domain, Pola UI, Teks & Gaya, Test Relevan, dan Keputusan Arsitektur.
2. **`AUDIT_BUGS.md`**: Validasi mendalam atas 7 temuan awal Codex (R79-01 s.d. R79-07) beserta 3 temuan baru (R80-08 s.d. R80-10) lengkap dengan bukti kode baris demi baris, dampak lapangan, dan mitigasinya.
3. **`UI_CONTRACTS.md`**: Standar kontrak antarmuka untuk 12 keluarga UI, props minimum, manajemen aksesibilitas ARIA, pengelolaan modal & bottom sheet (portal, Escape, Android hardware back, stack-aware scroll lock), serta matriks skenario pengujian.
4. **`IMPLEMENTATION_BATCHES.md`**: Rencana kerja mikro Fase 2 (Batch 2.1 Ritase & Kamus, Batch 2.2 Reusable Input Field Pilot, Batch 2.3 Modal Shell Foundation) dan roadmap Fase 3 s.d. 6.
5. **`evidence/`**: Arsip bukti verifikasi baseline (`baseline.json`, `lint.txt`, `lint-exit.txt`, `build.txt`, `build-exit.txt`, `tests.txt`, `tests-exit.txt`).

---

## 2. Before vs After (Dokumentasi & Keputusan Arsitektur)

| Aspek | Before (Refact 79 Baseline) | After (Refact 80 Hasil Fase 1) |
| :--- | :--- | :--- |
| **Peta Komponen UI** | Estimasi umum ~244 file sumber TS/TSX dan 74 file test. Belum ada pemetaan rinci per komponen. | **167 file komponen non-test** dipetakan secara tuntas di `COMPONENT_INVENTORY.csv` lengkap dengan peran, pemanggil aktif, dependensi domain, dan keputusan arsitektur. |
| **Validasi Bug Ritase (R79-05)** | Temuan statis di `MonitoringRouteDetailModal.tsx:73` (`Math.round(totalTrips / 2)`). | **Tervalidasi 100%**. Bukti menunjukkan 101 trip menghasilkan 51 ritase alih-alih 50,5 ritase PP. Dipastikan sebagai satu-satunya lokasi pembulatan sepihak di codebase. Solusi desimal presisi disiapkan di Batch 2.1. |
| **Duplikasi Input Shift 1/2 (R79-02)** | Dugaan duplikasi gaya pada form modal. | **Tervalidasi 100% identik**. Objek `heroInputStyle`, `secondaryInputStyle`, dan `getChipStyle` sama persis. Kontrak `BusFormField` dirumuskan sebagai pilot Batch 2.2. |
| **Kontrak Modal & Scroll Lock (R79-03)** | Diketahui adanya perbedaan implementasi modal. | Dipetakan lengkap dalam matriks 6 modal utama. Ditemukan bug **R80-10** (kebocoran scroll lock saat modal kedua ditutup). Kontrak `ModalShell` baku dirumuskan di `UI_CONTRACTS.md`. |
| **String Label Validasi (R79-06)** | Terindikasi label error hardcoded di hook. | Ditemukan lokasi persis: `"Shift 1"`, `"Shift 2"`, `"TOA Shift 2"` di `useBusInputForm.ts`. Dikonfirmasi belum ada di `text_alerts.ts` dan dijadwalkan masuk kamus sentral di Batch 2.1. |
| **God Component Baru (R80-08)** | Belum teridentifikasi secara eksplisit. | Teridentifikasi `MonitoringRouteDetailModal.tsx` (831 baris fisik) menggabungkan 5 ranah tanggung jawab. Dijadwalkan didekomposisi pada Fase 4. |
| **Rencana Eksekusi** | Roadmap makro tingkat tinggi. | Rencana batch mikro terukur dengan file terdampak, acceptance criteria, dan prosedur rollback per batch di `IMPLEMENTATION_BATCHES.md`. |

---

## 3. Case: Skenario Lapangan

### Skenario Lapangan 1: Petugas Berpindah Shift 1 ke Shift 2 di Bawah Terik Matahari
- **Kasus Aktual:** Petugas mencatat TOA dan KM pada Shift 1, lalu siang hari beralih mencatat Shift 2.
- **Masalah Saat Ini:** Jika perbaikan kontras atau ukuran padding field hero diterapkan di Shift 1, field Shift 2 berisiko tidak konsisten karena stylenya terduplikasi secara statis (R79-02 / R80-02).
- **Solusi Fase 2:** Mengintegrasikan `BusFormField` bersama pada Batch 2.2 sehingga seluruh perubahan tema dan kontras otomatis seragam di kedua shift, dengan tetap menjaga logika bisnis independen masing-masing shift.

### Skenario Lapangan 2: Pengawas Memeriksa Rute Ganjil (101 Trip)
- **Kasus Aktual:** Rute BRT mencatat akumulasi 101 trip satu arah pada hari itu, sementara kolom `totalRitasePp` dari data sheet kosong.
- **Masalah Saat Ini:** Modal ringkasan rute saat ini menghitung `Math.round(101 / 2) = 51 ritase PP`. Data pengawas kelebihan 0,5 ritase PP dari kenyataan sebenarnya (50,5 ritase PP), melanggar aturan SSOT.
- **Solusi Fase 2:** Menghapus `Math.round` pada Batch 2.1 dan menggantinya dengan desimal presisi murni tanpa pembulatan sepihak, disertai test suite trip ganjil (101 $\rightarrow$ 50,5), genap (100 $\rightarrow$ 50), dan nol (0 $\rightarrow$ 0).

### Skenario Lapangan 3: Penutupan Dialog Bertumpuk pada Layar Sentuh Mobile
- **Kasus Aktual:** Petugas membuka form bus, lalu muncul dialog konfirmasi antrean offline atau bantuan. Petugas kemudian menutup dialog kedua tersebut.
- **Masalah Saat Ini:** Penutupan dialog kedua mengeksekusi `document.body.style.overflow = ""` yang mereset scroll lock modal form pertama (R80-10). Mengusap layar menyebabkan dashboard di belakang bergulir liar.
- **Solusi Fase 2:** Menerapkan stack-aware body scroll lock pada `ModalShell` di Batch 2.3 yang menyimpan `prevOverflow` asli dan hanya memulihkannya ketika seluruh rantai modal telah tertutup.

---

## 4. Status Verifikasi Baseline (Quality Gates)

Verifikasi baseline dijalankan secara langsung pada lingkungan kerja aktual dengan hasil sebagai berikut:

| Quality Gate | Perintah Eksekusi | Status | Hasil Aktual & Catatan Bukti |
| :--- | :--- | :--- | :--- |
| **Git Branch** | `git branch --show-current` | **PASS** | Aktif pada branch `devmode`. Branch utama tidak disentuh. |
| **Linter** | `pnpm run lint` | **PASS** | Exit code 0; 72 warnings (57 di `src/`, 15 di `.agent/`), 0 errors. Sesuai baseline refact 79 (`evidence/lint.txt`). |
| **Unit Test Suite** | `pnpm run test --dir src` | **PASS** | Exit code 0; **74 test files passed**, **524 tests passed** 100% (`evidence/tests.txt`). |
| **TypeScript & Build** | `pnpm run build` | **PASS** | Exit code 0; `tsc -b` lulus tanpa error; Vite production build selesai dalam 1,81s (`evidence/build.txt`). |
| **Working Tree** | `git status --short` | **PASS** | Seluruh perubahan lokal awal (`docs/`, `contoh_file_ss/`, `MonitoringToaBarChart`, `src/index.css`) terjaga aman dan tidak terganggu. |

---

## 5. Rekomendasi Pilot & Langkah Selanjutnya

1. **Rekomendasi Pilot:**
   - **Batch 2.1 (Domain & Text):** Aritmatika Ritase (`MonitoringRouteDetailModal.tsx`) dan Kamus Label (`text_alerts.ts`).
   - **Batch 2.2 (UI Control):** Pilot komponen bersama `BusFormField` pada `BusInputModalShift1.tsx` dan `BusInputModalShift2.tsx`.
2. **Kesiapan Fase 2:**
   - Seluruh kontrak, dependensi, dan kriteria penerimaan telah siap.
   - Status program saat ini: **`READY_FOR_REVIEW`**.
   - Menunggu pemeriksaan kode (*diff review*) dan instruksi orkestrasi lanjutan dari **Codex**.
