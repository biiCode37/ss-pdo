# Laporan Perbaikan — Refactor 115 (Fase 3, Batch 3.4: Single Focus UI)

Dokumen ini mendokumentasikan implementasi, hasil verifikasi, tabel komparasi **Before vs After**, serta **Case: Skenario Lapangan** untuk Fase 3 Batch 3.4: Single Focus UI sesuai mandat `refact_100/PHASE_03_BATCH_PLAN.md` dan review Codex `refact_114`.

---

## 1. Ringkasan Eksekutif

Dalam siklus refaktor Batch 3.4 ini, fokus pekerjaan meliputi:
1. **Dekomposisi God-File Single Focus**: Mengurai file monolitik `src/components/busCard/modal/BusInputModalSingleFocus.tsx` yang sebelumnya berukuran 806 baris menjadi modul fitur lokal yang kohesif di bawah `src/components/busCard/modal/singleFocus/` (`SingleFocusToa.tsx`, `SingleFocusKm.tsx`, `SingleFocusNotes.tsx`, dan `singleFocusStyles.ts`), menyisakan berkas orkestrator yang bersih berukuran 62 baris tanpa mengubah alur data atau kontrak `BusInputFormReturn`.
2. **Penyelesaian R114-01 (Kamus Teks Sentral)**: Memigrasikan seluruh literal UI, label chip, aksi salin KM, dan fallback teks `"Kemarin"` ke modul domain `src/constants/texts/text_alerts.ts`, dilengkapi unit test integritas pada `src/constants/texts/texts.test.ts`.
3. **Penyelesaian R114-02 (Dokumentasi Errata)**: Mengklarifikasi bahwa kategori Trip/Ritase tidak berada dalam `SINGLE_COLUMN_META`, dan UI trip secara sah menggunakan Mode All (`BusInputModalTrip.tsx`). Tidak ada cabang trip single focus hipotetis yang ditambahkan.
4. **Preservasi Kontrak & Interaktivitas UI**: Seluruh atribut input (ID, name, type, mode, ref fokus), event handler (Enter-to-Save, Enter-to-Next, rollover click), chip ekspansi progresif, status disable/lock, badge live calculation selisih KM, dan responsivitas tema Light/Dark tetap bekerja 100% identik.
5. **Quality Gates Lengkap**: 100% unit tests lolos (661/661 passed), TypeScript strict check lolos 0 error, build produksi Vite sukses, targeted lint jujur 0 errors (7 existing warnings dicatat transparan), dan knowledge graph `graphify update .` terbarukan.

---

## 2. Before vs After

| Aspek | Sebelum (Before) | Sesudah (After) | Alasan / Manfaat |
| :--- | :--- | :--- | :--- |
| **Modularitas File** | `BusInputModalSingleFocus.tsx` berukuran **806 baris** mencakup seluruh logika render TOA, KM, dan Catatan. | Dipecah menjadi 4 berkas fitur lokal kohesif: `SingleFocusToa.tsx` (178 b), `SingleFocusKm.tsx` (299 b), `SingleFocusNotes.tsx` (95 b), `singleFocusStyles.ts` (30 b). Orkestrator `BusInputModalSingleFocus.tsx` ramping menjadi **62 baris**. | Mengeliminasi antipola "god file", mematuhi batasan modularitas proyek, mempermudah pelacakan bug dan pengujian terisolasi. |
| **Kamus Teks (R114-01)** | Label chip (`"+ Manual S1"`, `"+ KM Akhir"`, `"+ Catatan"`), aksi salin (`"Salin KM Akhir Shift 1"`), dan fallback teks (`"Kemarin"`) di-hardcode dalam komponen UI. | Semua teks dan label dinamis dipusatkan pada `TEXT_ALERTS.BUS_INPUT_MODAL` di `src/constants/texts/text_alerts.ts` dengan fungsi template murni. | Mematuhi Golden Rule Kamus Teks Sentral, mempermudah pelokalan, dan mencegah regresi teks antarmuka. |
| **Integritas Tes Teks** | Belum ada tes untuk token chip, aksi copy KM, dan fallback tanggal kemarin di `texts.test.ts`. | Ditambahkan 1 suite tes baru mencakup seluruh token dan fungsi template dinamis di `src/constants/texts/texts.test.ts` (18/18 passed). | Menjamin teks tidak mengalami modifikasi liar atau regresi tanpa terdeteksi di CI/CD. |
| **Spesifikasi Trip (R114-02)** | Narasi sebelumnya sempat mengesankan ada cabang Single Focus untuk Trip. | Diklarifikasi bahwa Trip tidak ada di `SINGLE_COLUMN_META` dan selalu memakai Mode All (`BusInputModalTrip.tsx`). Tidak ada cabang semu yang dibuat. | Mencegah over-engineering penambahan cabang trip yang tidak diperlukan di lapangan. |
| **Uji Unit Single Focus** | Pengujian Single Focus hanya ada sebagian kecil melalui tes integrasi modal luar. | Dibuat unit test komprehensif mandiri `BusInputModalSingleFocus.test.tsx` (11 tes spesifik mencakup TOA S1, Total TOA, KM S1/S2, Lock, Copy KM, Rollover, dan Notes). | Verifikasi granular terhadap interaksi sub-komponen single focus tanpa overhead render shell modal luar. |

---

## 3. Case: Skenario Lapangan

### Case 1: Pengawas Menginput TOA Shift 1 Cepat (Speed-Run)
- **Skenario**: Pengawas lapangan sedang mendata penumpang sore hari. Dari tabel dashboard, pengawas men-tap kolom TOA Shift 1 bus `TJ-0123`.
- **Perilaku**:
  - Modal Single Focus terbuka menampilkan `SingleFocusToa` dengan input utama `toaS1InputRef` otomatis terfokus dan tersorot.
  - Terdapat chip progressive disclosure `+ Manual S1` (jika data manual kosong) yang dapat di-tap untuk membuka field tiket manual tanpa mengganggu ritme pengetikan.
  - Jika manual sudah terisi, chip berubah menjadi `- Manual S1` dan field manual otomatis terbentang.
  - Penekanan tombol Enter pada keyboard mobile langsung memicu simpan instan (*Enter-to-Save*) berkat preservasi `handleInputKeyDown`.

### Case 2: Petugas Menginput KM Awal & KM Akhir Shift 1 dengan Penguncian Bertingkat
- **Skenario**: Petugas pool pagi memasukkan odometer awal armada. Kolom fokus aktif adalah `kmAwal1`.
- **Perilaku**:
  - `SingleFocusKm` merender input utama KM Awal S1 berukuran besar dengan font mono `text-xl font-bold tracking-wider`.
  - Jika odometer hari sebelumnya (`previousDayKmAkhir2`) terdeteksi melompati angka bulat (misal kemarin `292.990`, input terisi `292.003`), banner saran rollover `293.003` muncul di atas input dengan tombol sentuh yang dapat di-tap langsung untuk mengoreksi angka.
  - KM Akhir Shift 1 berstatus terkunci (*locked*) hingga KM Awal S1 diisi dengan benar. Ketika KM Awal valid diisi, input KM Akhir terbuka secara dinamis dengan prefill 3 digit pertama dari KM Awal.
  - Live badge selisih KM (`kmLiveS1`) otomatis menghitung jarak tempuh saat KM Akhir mulai diketik.

### Case 3: Petugas Shift 2 Memulai Dinas Menggunakan Salin KM Akhir Shift 1
- **Skenario**: Petugas malam hendak menginput KM Awal Shift 2 untuk armada yang telah berdinas pada Shift 1.
- **Perilaku**:
  - `SingleFocusKm` pada fokus `kmAwal2` mendeteksi bahwa `kmAkhir1` sudah tersedia dari shift sebelumnya.
  - Ditampilkan tombol bantuan `[Salin KM Akhir Shift 1]` dengan teks dari kamus sentral `TEXT_ALERTS.BUS_INPUT_MODAL.COPY_KM_AKHIR_S1_ACTION`.
  - Saat tombol di-tap, fungsi `handleCopyKmAkhir1ToAwal2()` dipanggil, menyalin angka kilometer secara presisi dan memindahkan fokus ke field selanjutnya tanpa repot mengetik ulang 6 digit odometer.

### Case 4: Petugas Mencatat Kendala Bus Mogok / Gangguan di Lapangan
- **Skenario**: Armada mengalami pecah ban atau kendala teknis di koridor, petugas menekan kolom Keterangan.
- **Perilaku**:
  - `SingleFocusNotes` merender textarea keterangan dengan placeholder ramah pengguna dari kamus sentral.
  - Petugas dapat langsung mengetik catatan kejadian.
  - Jika dibuka dari fokus lain, chip `+ Catatan` memungkinkan penambahan keterangan tambahan secara fleksibel.

---

## 4. Evaluasi Visual Mobile & Theming (Light / Dark Mode)

- **Kondisi Lingkungan**: Pengujian dilakukan pada lingkungan headless CI/local Node.js tanpa dev server web aktif di port lokal. Evaluasi visual dilakukan melalui verifikasi static class tokens, unit test happy-dom, dan audit kontras warna:
  - **Light Mode**:
    - Kontainer latar belakang: `bg-white`, border `border-slate-200`.
    - Input primer: `bg-white border-2 border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20`.
    - Helper & Subtitle: `text-slate-500`, badge `bg-slate-100 text-slate-700`.
    - Tombol Aksi Salin: `bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100`.
  - **Dark Mode**:
    - Kontainer latar belakang: `dark:bg-slate-800`, border `dark:border-slate-700`.
    - Input primer: `dark:bg-slate-900 dark:border-slate-600 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-400/20`.
    - Helper & Subtitle: `dark:text-slate-400`, badge `dark:bg-slate-700/60 dark:text-slate-300`.
    - Tombol Aksi Salin: `dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 hover:dark:bg-blue-900/60`.
  - **Ergonomi Sentuhan Mobile (Touch Target)**:
    - Seluruh field input memiliki tinggi minimum `min-h-[48px]`, ukuran font `text-lg` hingga `text-xl` untuk mencegah zoom otomatis browser Safari iOS.
    - Chip buttons memiliki padding ergonomis `px-3 py-1.5` dengan rounded pill `rounded-full` yang nyaman di-tap dengan jempol.
    - Container menggunakan `.no-scrollbar` dan margin bawah dinamis untuk mencegah konten terpotong keyboard virtual saat aktif.

---

## 5. Ringkasan File yang Diubah dan Ditambahkan

### File Modifikasi:
1. `src/constants/texts/text_alerts.ts`:
   - Penambahan token `LABEL_PREVIOUS_DAY`, `CHIP_KM_AKHIR_1`, `CHIP_KM_AKHIR_2`, `CHIP_ACTIVE_MANUAL_S1`, `CHIP_ACTIVE_MANUAL_S2`, `CHIP_ACTIVE_KM_AKHIR_1`, `CHIP_ACTIVE_KM_AKHIR_2`, `CHIP_ACTIVE_KETERANGAN`, `COPY_KM_AKHIR_S1_ACTION`, `REF_KM_AWAL_S1`, `REF_KM_AWAL_S2`.
2. `src/constants/texts/texts.test.ts`:
   - Penambahan suite unit test untuk seluruh token baru di atas (18/18 tests passed).
3. `src/components/busCard/modal/BusInputModalSingleFocus.tsx`:
   - Reduksi dari 806 baris menjadi 62 baris sebagai orchestrator bersih menuju sub-komponen single focus.

### File Baru Ditambahkan:
1. `src/components/busCard/modal/singleFocus/singleFocusStyles.ts`:
   - Utility style classes bersama untuk form input, chip buttons, dan hint blocks.
2. `src/components/busCard/modal/singleFocus/SingleFocusToa.tsx`:
   - Komponen fitur lokal untuk TOA Shift 1 dan Total TOA.
3. `src/components/busCard/modal/singleFocus/SingleFocusKm.tsx`:
   - Komponen fitur lokal untuk KM Awal/Akhir Shift 1 dan 2 beserta rollover & live distance.
4. `src/components/busCard/modal/singleFocus/SingleFocusNotes.tsx`:
   - Komponen fitur lokal untuk Catatan operasional bus.
5. `src/components/busCard/modal/BusInputModalSingleFocus.test.tsx`:
   - 11 unit tests komprehensif menguji interaktivitas, penguncian, rollover, dan chip toggle.

---

## 6. Checklist Verifikasi & Quality Gates

| Quality Gate | Perintah / Uji | Target / Kriteria | Hasil Aktual | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Targeted Tests** | `pnpm exec vitest run src/components/busCard/modal/` | 100% passed pada modal input | **7 test files, 102 passed** | **PASS** |
| **Standard Tests** | `pnpm run test` | Seluruh suite tes proyek lolos | **87 test files, 661 passed** (0 fail) | **PASS** |
| **Workspace Tests** | `pnpm run test src/` | Seluruh unit test dalam `src/` lolos | **87 test files, 661 passed** (0 fail) | **PASS** |
| **Targeted Lint** | `pnpm dlx oxlint src/components/busCard/modal/` | 0 error pada modul bus card | **0 error**, 7 existing warnings | **PASS** |
| **TypeScript Strict** | `pnpm exec tsc -b` | 0 error kompilasi TS | **Exit code 0** (0 error) | **PASS** |
| **Production Build** | `pnpm exec vite build --emptyOutDir false` | Bundle client berhasil dikompilasi | **Exit code 0** (built in 1.30s) | **PASS** |
| **Knowledge Graph** | `graphify update .` | Graf pengetahuan AST terbarukan | **6313 nodes, 10239 edges, 495 communities** | **PASS** |
| **Git Safety** | `git status` | Tetap di branch `devmode`, tidak menyentuh `main` | **Branch devmode**, tanpa commit/push | **PASS** |

---

## 7. Status Akhir

Pengerjaan Fase 3 Batch 3.4 telah selesai secara tuntas, rapi, aman, dan siap direview oleh Codex.

**Status: `READY_FOR_REVIEW`**
*(Batch 3.5 menunggu keputusan dan arahan dari Codex)*
