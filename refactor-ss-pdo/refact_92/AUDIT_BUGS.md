# Audit Bugs & Temuan Revisi — Batch 2.2 (Refact 92)

Tanggal: 27 September 2026  
Auditor/Pelaksana: Gemini (executor)  
Branch: `devmode`  
Basis Acuan: `refactor-ss-pdo/refact_91/AUDIT_BUGS.md`, `refact_91/REPAIR_REPORT.md`, dan instruksi penutupan R91-01 s.d. R91-03.

---

## Daftar Temuan & Status Audit

| ID Temuan | Komponen / Berkas Terkait | Keparahan | Status Implementasi |
| :--- | :--- | :--- | :--- |
| **R91-01** | `src/components/busCard/modal/fields/ShiftOptionChip.tsx` | **Sedang** | **SELESAI (FIXED)** |
| **R91-02** | `src/components/busCard/modal/fields/BusFormField.test.tsx`, evidence | **Sedang** | **SELESAI (FIXED)** |
| **R91-03** | `BusInputModalShift1.tsx`, `BusInputModalShift2.tsx`, `refact_92/REPAIR_REPORT.md` | **Rendah** | **SELESAI (FIXED)** |
| **R89-01** | `dist_old/assets/`, `graphify-out/` | **Rendah (Tooling Note)** | **TERCATAT SECARA JUJUR (DELEGASI TERPISAH)** |

---

## Rincian Temuan Revisi

### 1. R91-01: Status Chip Aktif Belum Tersedia untuk Teknologi Bantu (Screen Reader)

- **Lokasi Kode:** `src/components/busCard/modal/fields/ShiftOptionChip.tsx:26-30`
- **Keparahan:** Sedang (Aksesibilitas / Semantics)
- **Deskripsi:**
  - Komponen menggunakan elemen native `<button type="button">`, yang secara native sudah dapat menerima fokus dan keyboard trigger.
  - Namun status `isActive` hanya mengubah tampilan gaya (warna dan background), tanpa atribut `aria-pressed={isActive}`.
  - Laporan sebelumnya sempat mengklaim penambahan `role="button"` dan `tabIndex={0}`, padahal kedua atribut tersebut redundan pada elemen `<button>` native dan atribut `aria-pressed` belum ada di kode sumber.
- **Dampak User:** Pengguna pembaca layar (screen reader) di lapangan tidak menerima umpan balik status apakah tombol pilihan Manual TOA atau Catatan sedang aktif atau nonaktif.
- **Mitigasi:**
  - Menambahkan atribut semantik `aria-pressed={isActive}` langsung pada elemen `<button>` native di `ShiftOptionChip.tsx` tanpa menambahkan `role` atau `tabIndex` redundan.
  - Menambahkan pengujian unit di `BusFormField.test.tsx` untuk memastikan `aria-pressed="false"` saat nonaktif, `aria-pressed="true"` saat aktif, serta callback `onToggle` terpanggil dengan benar.

---

### 2. R91-02: Bukti Regresi Interaksi Kedua Shift dan Visual Belum Memadai

- **Lokasi Kode:** `src/components/busCard/modal/fields/BusFormField.test.tsx`, `refact_92/evidence/`
- **Keparahan:** Sedang (Quality Verification & Regression Prevention)
- **Deskripsi:**
  - Tes tombol Enter sebelumnya hanya memastikan prop `onKeyDown` memanggil mock spy, belum membuktikan bahwa form handler yang sebenarnya (`handleInputKeyDown` dari `useBusInputForm.ts`) menjalankan `requestSubmit()` pada elemen form pembungkus.
  - Tes integrasi Shift 2 belum mencakup pengujian aksi chip Manual dan Catatan, serta belum memverifikasi kondisi disabled pada `input-km-akhir-2` saat `isKmAkhir2Locked: true`.
  - Belum ada catatan batas verifikasi visual mobile untuk tema Light dan Dark.
- **Dampak User:** Risiko regresi saat petugas menekan tombol Enter pada keyboard ponsel untuk submit form, status input terkunci tidak terdeteksi, atau penurunan keterbacaan warna pada perangkat mobile.
- **Mitigasi:**
  - Menambahkan pengujian perilaku end-to-end dengan harness `useBusInputForm`: memastikan penekanan tombol Enter pada `BusFormField` memanggil `requestSubmit()` pada `<form>` terdekat.
  - Memperkuat pengujian Shift 2: memeriksa `input-km-akhir-2` disabled dengan placeholder `PLACEHOLDER_KM_LOCKED` saat `isKmAkhir2Locked = true`, serta menguji toggle chip Manual S2 (`setShowManual2`) dan Catatan (`setShowKeterangan`) beserta atribut `aria-pressed`.
  - Memperkuat pengujian Shift 1: menguji toggle chip Manual S1 (`setShowManual1`) dan Catatan (`setShowKeterangan`) beserta atribut `aria-pressed`.
  - Mendokumentasikan secara faktual batas verifikasi visual mobile pada laporan baru (preview server dev offline, analisis berbasis token CSS variable dan kontras token).

---

### 3. R91-03: Laporan Tidak Sesuai Source Aktual dan Diff Memiliki Whitespace Error

- **Lokasi Kode:**
  - `BusInputModalShift1.tsx:400`
  - `BusInputModalShift2.tsx:394`
  - `refact_90/REPAIR_REPORT.md` (arsip lama)
- **Keparahan:** Rendah (Kerapian Diff & Akurasi Dokumentasi)
- **Deskripsi:**
  - Pada laporan lama (`refact_90`), contoh Before menyebut latar `#181C24` (padahal source aktual `devmode` sebelum Batch 2.2 memakai `rgba(0, 0, 0, 0.35)` pada hero dan `rgba(0, 0, 0, 0.25)` pada secondary).
  - Contoh After pada laporan lama mengklaim props `isLocked`, `suffix`, `helperText`, `onBlur` yang sebenarnya tidak ada pada komponen `BusFormField`.
  - Komponen chip menggunakan prop `onToggle` (bukan `onClick`), dan label tidak menggunakan `CHIP_ADD_LABEL`.
  - `git diff --check` mendeteksi blank line baru di baris terakhir (EOF) pada kedua berkas modal shift.
- **Dampak User:** Tidak berdampak langsung pada pengguna runtime, namun membingungkan tim peninjau kode (Codex/Lead Developer) dan mengotori diff repository.
- **Mitigasi:**
  - Menghapus baris kosong ekstra di akhir berkas `BusInputModalShift1.tsx` dan `BusInputModalShift2.tsx`.
  - Menjalankan `git diff --check` hingga exit code 0 bersih dari error whitespace.
  - Pada laporan baru (`refact_92/REPAIR_REPORT.md`), seluruh contoh Before vs After disajikan sesuai source kode aktual tanpa props fiktif, serta memperjelas pemisahan tanggung jawab antara komponen presentational (`BusFormField` meneruskan `onKeyDown`) dan hook domain (`useBusInputForm` mengeksekusi `requestSubmit()`).
