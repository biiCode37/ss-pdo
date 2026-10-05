# Laporan Implementasi Fase 3 Batch 3.3: Validasi dan Payload Simpan

**Status:** `READY_FOR_REVIEW`  
**Branch:** `devmode`  
**Fase:** Fase 3 (Modularisasi Bus Input Modal) — Batch 3.3  
**Folder Dokumentasi:** `refactor-ss-pdo/refact_113/`

---

## 1. Ringkasan Eksekutif

Batch 3.3 menuntaskan ekstraksi tanggung jawab validasi formulir dan pembentukan payload simpan dari hook `useBusInputForm.ts` ke modul fungsi murni mandiri, serta menyelesaikan temuan **R112-01**:

1. **Ekstraksi Validasi Murni (`busInputValidation.ts`):** Seluruh logika evaluasi kesalahan submit pada mode Single Focus maupun Mode All dipindahkan ke fungsi murni `validateBusInputForm`. Modul ini mengonsolidasikan validator eksisting (`validateKmPair`, `validateKmCrossShift`, `validateKmCrossDay`, `validateToaPair`, `validateToaValue`, `validateTripCount`), parsing angka format Indonesia (`parseIndonesianNumber`), custom header label, serta bypass odometer reset.
2. **Ekstraksi Pembentukan Payload Simpan (`busInputPayload.ts`):** Seluruh logika penyusunan objek pembaruan `Partial<BusData>` dipindahkan ke fungsi murni `buildBusInputPayload` dan `computeEffectiveTotalToa`. Kontrak **Scoped Updates** (pada Single Focus hanya kolom kategori aktif yang dikirim sehingga tidak menimpa data kolom lain), sanitasi angka odometer, dan proteksi cascading lock dipertahankan 100%.
3. **Penyelesaian R112-01 (Penyegaran Angka pada Error Pasangan KM Pasca-Rollover):** Pada saat rollover diterapkan, jika formulir sedang dalam status menampilkan kesalahan submit (`validationErrors.length > 0`), sistem memanggil ulang `validateBusInputForm` dengan nilai KM terkini. Error lintas hari yang sudah terpenuhi hilang secara otomatis, sedangkan pesan kesalahan pasangan KM yang masih berlaku langsung disegarkan memuat angka KM Awal terkini (misal memperbarui `(292003)` menjadi `(293003)`). Tidak ada pencocokan fragmen/substring teks yang rapuh.
4. **Preservasi Kontrak & Batasan:** Hook `useBusInputForm.ts` kini ramping (~500 baris, berkurang ~220 baris) dan tetap mengurus state React, event keyboard, navigasi fokus, dan pemanggilan `onSave`/`onDismiss` tanpa mengubah urutan eksekusi sedikit pun. Komponen UI Single Focus dan shell modal tidak disentuh pada batch ini (lingkup Batch 3.4 dan 3.5).

Seluruh quality gates terpenuhi (86 berkas / 650 tes lulus, 0 error linter, TypeScript strict & Vite build lulus, knowledge graph terbarui).

---

## 2. Before vs After

| Aspek | Kondisi Sebelum Batch 3.3 | Kondisi Setelah Batch 3.3 |
|---|---|---|
| **Struktur Validasi Submit** | Tertanam langsung di dalam `useBusInputForm.ts:376-530` (~155 baris logika percabangan validasi). | Diekstrak ke fungsi murni `validateBusInputForm(params)` di `src/components/busCard/modal/busInputValidation.ts`. |
| **Struktur Payload Simpan** | Tertanam langsung di dalam `useBusInputForm.ts:537-631` (~95 baris perakitan `Partial<BusData>`). | Diekstrak ke fungsi murni `buildBusInputPayload(params)` dan `computeEffectiveTotalToa` di `src/components/busCard/modal/busInputPayload.ts`. |
| **Penyegaran Error Pasca-Rollover (R112-01)** | `handleApplyRollover` hanya menghapus pesan lintas hari dari array `validationErrors`. Pesan error pasangan KM tetap menyebut KM Awal lama `(292003)`. | `handleApplyRollover` mengevaluasi ulang `validateBusInputForm` dengan KM baru. Pesan error pasangan KM otomatis menyebut KM Awal terkini `(293003)`. |
| **Pembersihan Fragmen Teks** | Kode lama sempat bergantung pada filtering array string eksak/substring. | 100% berbasis evaluasi ulang validator murni (SSOT). Bebas pencocokan fragmen teks. |
| **Tanggung Jawab `useBusInputForm`** | Menangani state React, event keyboard, manipulasi DOM, validasi submit, dan perakitan payload simpan (722 baris). | Fokus murni pada state React, keyboard/focus management, dan delegasi ke fungsi murni (~500 baris). |
| **Pengujian Otomatis** | 84 berkas / 622 tes lulus. Belum ada unit test mandiri untuk modul validasi & payload murni. | **86 berkas / 650 tes lulus** (+28 tes baru pada `busInputValidation.test.ts`, `busInputPayload.test.ts`, dan tes R112-01). |

---

## 3. Case: Skenario Lapangan

### Case 1: Form Campuran Rollover & Error KM Akhir Lebih Kecil dari KM Awal (R112-01)
- **Skenario Lapangan:** Petugas di lapangan memasukkan bus Shift 1 dengan KM Awal `292003` dan KM Akhir `291900` (KM Akhir H-1 adalah `292990`). Petugas menekan tombol Simpan.
- **Sebelum Perbaikan:** Submit ditolak dan memunculkan dua pesan:
  1. `KM Awal Shift 1 (292003) tidak boleh lebih kecil dari Kemarin (292990)...` (lintas hari)
  2. `KM Akhir Shift 1 (291900) tidak boleh lebih kecil dari KM Awal (292003)!` (pasangan KM)
  Petugas menekan tombol saran rollover `"Gunakan 293003"`. Nilai input KM Awal berubah menjadi `293003`. Error lintas hari hilang, tetapi pesan error nomor 2 yang tertinggal di layar masih tertulis:
  `KM Akhir Shift 1 (291900) tidak boleh lebih kecil dari KM Awal (292003)!`
  Petugas membaca acuan angka lama `292003`, bukan `293003`, hingga membingungkan perhitungan jarak tempuh.
- **Setelah Perbaikan:** Saat tombol saran rollover ditekan, `handleApplyRollover` memanggil `validateBusInputForm` dengan `kmAwal1: "293003"` dan `kmAkhir1: "291900"`.
  Pesan di layar seketika diperbarui menjadi:
  `KM Akhir Shift 1 (291900) tidak boleh lebih kecil dari KM Awal (293003)!`
  Petugas melihat angka acuan yang akurat, memperbaiki KM Akhir menjadi `293150`, dan form dapat disimpan dengan sukses.
- **Verifikasi:** Lulus pada `useBusInputForm.test.tsx` ("R112-01: handleApplyRollover menyegarkan angka KM Awal pada pesan error KM pair yang masih berlaku").

### Case 2: Scoped Updates pada Single Focus Mode (Trip, TOA, KM, Keterangan)
- **Skenario Lapangan:** Petugas operasional di lapangan membuka modal bus melalui tap pada kolom "Trip" untuk memperbarui data trip bus `TJ-0123`.
- **Sebelum & Sesudah:** Form Single Focus hanya mengirimkan field `{ tripPergi, tripPulang }`. Field KM Awal/Akhir, TOA Shift 1/Shift 2, dan manual tidak disertakan di dalam objek payload.
- **Verifikasi Kontrak Murni:** Diuji secara mendalam pada `busInputPayload.test.ts`:
  - Kategori `trip`: payload persis `{ tripPergi, tripPulang }`.
  - Kategori `toaShift1`: payload persis `{ toaShift1 }` (dan `manualShift1` jika ditampilkan).
  - Kategori `totalToa`: payload persis `{ totalToa }` (dan `manualShift2` jika ditampilkan).
  - Kategori `kmAwal1`: payload persis `{ kmAwal1 }` (dan `kmAkhir1` hanya jika `showKmAkhir1InSingle` dan valid).
  - Kategori `kmAwal2`: tidak mengirim `kmAwal2` jika `isKmAwal2Locked` bernilai true.
  - Kategori `keterangan`: payload persis `{ keterangan }`.
  - Chip `showKeterangan`: jika dibuka, `keterangan` ikut disertakan pada kategori apa pun tanpa merusak scoped updates.

### Case 3: Mode All dengan Input Spreadsheet Format Indonesia
- **Skenario Lapangan:** Petugas memasukkan angka desimal Indonesia dengan tanda koma (misal TOA Shift 1 `150,5` dan TOA Shift 2 `100,5`) pada Mode All.
- **Hasil:** `computeEffectiveTotalToa` mem-parse nilai dengan `parseIndonesianNumber` dan menghasilkan `totalToa = "251"`. Jika petugas memasukkan format ribuan dengan titik melebihi batas (misal `1.200`), validator mendeteksi nilai `1200 > 999` dan menampilkan pesan kesalahan ramah non-teknis.
- **Verifikasi:** Lulus pada `busInputValidation.test.ts` dan `busInputPayload.test.ts`.

---

## 4. Hasil Quality Gates & Verifikasi

Seluruh quality gates telah dijalankan dan lulus 100%:

1. **Targeted Modal Tests:**
   - Perintah: `pnpm run test src/components/busCard/modal/`
   - Hasil: **5 test files, 73 tests passed, 0 failed** (`refactor-ss-pdo/refact_113/evidence/targeted-tests.txt`).
2. **Standard Test Suite (`pnpm run test`):**
   - Perintah: `pnpm run test`
   - Hasil: **86 test files, 650 tests passed, 0 failed** (`refactor-ss-pdo/refact_113/evidence/standard-tests.txt`).
3. **Full Workspace Tests (`pnpm run test src/`):**
   - Perintah: `pnpm run test src/`
   - Hasil: **86 test files, 650 tests passed, 0 failed** (`refactor-ss-pdo/refact_113/evidence/src-tests.txt`).
4. **Targeted Linter (oxlint):**
   - Perintah: `pnpm dlx oxlint src/components/busCard/modal/`
   - Hasil: **0 errors, 0 warnings `exhaustive-deps`** (`refactor-ss-pdo/refact_113/evidence/targeted-lint.txt`).
5. **TypeScript Strict & Production Build:**
   - Perintah: `pnpm exec tsc -b; pnpm exec vite build --emptyOutDir false`
   - Hasil: **Exit code 0**, 2045 modules transformed, bundle artifacts generated successfully (`refactor-ss-pdo/refact_113/evidence/build.txt`).
6. **Knowledge Graph (Graphify):**
   - Perintah: `graphify update .`
   - Hasil: AST re-extracted (383 files), graph updated (6263 nodes, 10162 edges, 490 communities).
7. **Status Git Repository:**
   - Branch: `devmode`
   - Catatan: Tidak ada perubahan ke branch utama (`main`/`master`), tidak ada commit/push tanpa instruksi (`refactor-ss-pdo/refact_113/evidence/git-status.txt`).

---

## 5. Batasan & Kesiapan Review

- **Isolasi Penuh di Branch `devmode`:** Seluruh pengerjaan berada di branch `devmode`.
- **Integritas Arsip:** Seluruh folder dokumentasi historis (`refact_1` s.d. `refact_112`) dan `dist_old/` tetap utuh tanpa modifikasi.
- **Batasan Batch 3.3:**
  - Komponen UI Single Focus (`BusInputModalSingleFocus.tsx`) dan shell modal (`BusInputModal.tsx`) tidak disentuh atau direfaktor pada batch ini.
  - Sesuai instruksi, implementasi berhenti di status **READY_FOR_REVIEW** untuk menunggu review Codex sebelum Batch 3.4 dibuka.

Pekerjaan Batch 3.3 dinyatakan selesai dan **READY_FOR_REVIEW**.
