# Laporan Perbaikan Refactor — Batch 2.3 (Pilot ModalShell & ScrollLockCoordinator)

Dokumen ini mendokumentasikan implementasi dan verifikasi teknis untuk **Fase 2, Batch 2.3** pada proyek SS_PDO sesuai rencana `refactor-ss-pdo/refact_82/IMPLEMENTATION_BATCHES.md`.

---

## 1. Ringkasan Eksekutif

- **Fokus Batch:** Implementasi koordinator penguncian body scroll (`scrollLockCoordinator.ts`), komponen shell modal reusable (`ModalShell.tsx`), dan migrasi pilot pada dua konsumen: `QueueModal.tsx` dan `ReportModalLayout.tsx`.
- **Branch:** `devmode` (seluruh modifikasi lokal, `dist_old/`, dan folder arsip `refact_N` dipertahankan utuh tanpa reset/stash/commit/push).
- **Hasil Quality Gates:**
  - **Vitest Full Suite:** 79 file pengujian, 564 tes lulus (100% lulus dalam 49.67s).
  - **Vitest Targeted:** 4 file pengujian baru/terkait, 22 tes lulus (100% lulus dalam 4.01s).
  - **Targeted Lint (oxlint):** 9 file Batch 2.3 dipindai, **0 warnings, 0 errors**.
  - **Typecheck & Production Build (`tsc -b && vite build`):** Lulus 100% dengan exit code 0.
  - **Graphify Knowledge Graph:** Diperbarui via `graphify update .` dengan exit code 0.
  - **Git Diff Check (`git diff --check`):** Bersih (0 whitespace/formatting errors).
- **Status Pilot:** **`READY_FOR_REVIEW`**

---

## 2. Arsitektur & Detail Implementasi

### A. Koordinator Body Scroll Lock (`src/utils/scrollLockCoordinator.ts`)
Menggantikan manipulasi ad-hoc `document.body.style.overflow` dengan koordinator berbasis *reference counting* yang minimal, aman untuk React StrictMode, dan berorientasi *Single Source of Truth (SSOT)*:
- **`acquireScrollLock(): () => void`**:
  - Menyimpan nilai persis `document.body.style.overflow` saat penguncian pertama kali diakuisisi (`lockCount === 0`).
  - Mengatur `document.body.style.overflow = "hidden"`.
  - Mengembalikan fungsi pelepasan (`release()`) yang bersifat **idempotent** (pemanggilan berulang pada instance yang sama tidak akan mengurangi counter lebih dari sekali).
  - Hanya memulihkan nilai awal `overflow` saat penguncian terakhir dilepas (`lockCount === 0`).
  - Dilengkapi proteksi agar counter tidak pernah bernilai negatif.

### B. Koordinator Tumpukan Modal LIFO (`src/utils/modalStackCoordinator.ts`)
Memisahkan logika stack interaksi keyboard modal dari komponen UI agar mematuhi aturan linting *Fast Refresh* (`react/only-export-components`):
- Mendaftarkan ID modal aktif ke dalam array tumpukan LIFO saat modal terbuka.
- Menyediakan utilitas `isTopmostModal(id)` untuk memastikan bahwa event keyboard `Escape` **hanya direspons oleh modal paling atas**.
- Menjaga konsistensi alur dismissal dengan handler Android Back dari `useMobileBackHandler`.

### C. Komponen Shell Modal Reusable (`src/components/ui/ModalShell.tsx`)
Komponen kontainer dialog berbasis portal yang menangani standar aksesibilitas WAI-ARIA dan integrasi interaksi sistem:
- **Portal Rendering:** Merender konten ke dalam `document.body` menggunakan `createPortal`.
- **WAI-ARIA Compliance:**
  - `role="dialog"` dan `aria-modal="true"`.
  - `aria-labelledby` otomatis terhubung bila `titleId` disediakan, dengan fallback `aria-label` terpusat.
- **Topmost Escape & Android Back:**
  - Mendaftarkan modal ke `modalStackCoordinator`. Tombol Escape hanya memicu `onClose` jika modal berstatus paling atas.
  - Mengintegrasikan `useMobileBackHandler` (jika `isOpen === true`) untuk penanganan tombol Back fisik Android secara teratur.
- **Backdrop Dismissal & Content Click Isolation:**
  - Klik pada area latar (backdrop) menutup dialog jika `dismissOnBackdrop !== false` dan callback `onClose` tersedia.
  - Klik atau sentuhan pada area konten dialog dilindungi dengan `stopPropagation()` sehingga interaksi form/isi tidak menutup modal.
- **Focus Management:**
  - Merekam elemen yang aktif sebelum modal terbuka (`document.activeElement`) dan memulihkan fokus (*focus restoration*) ke elemen pemicu tersebut saat modal ditutup.
- **Dukungan `keepMounted: true`:**
  - Untuk modal yang memiliki form dinamis seperti `ReportModalLayout`, modal dapat disembunyikan menggunakan `display: "none"` tanpa merusak lifecycle atau state input anak di dalamnya.
- **Idempotent Scroll Lock Integration:**
  - Mengakuisisi lock secara otomatis saat `isOpen === true` dan melepaskannya saat unmount atau `isOpen === false`.

### D. Migrasi Pilot: `QueueModal.tsx`
- **Sebelum:** Menggunakan `useEffect` manual untuk menangani `keydown` Escape dan manipulasi `document.body.style.overflow = "hidden"`.
- **Sesudah:** Dibungkus menggunakan `<ModalShell id="queue-modal" isOpen={isOpen} onClose={onClose} ...>`. Seluruh listener `useEffect` lama dihapus.

### E. Migrasi Pilot: `ReportModalLayout.tsx`
- **Sebelum:** Mengelola `useMobileBackHandler` secara manual, manipulasi `document.body.style.overflow` langsung, struktur portal terpisah, dan tombol tutup dengan teks hardcoded `"Tutup"`.
- **Sesudah:**
  - Menggunakan `<ModalShell id="report-modal-layout" isOpen={isOpen} onClose={onClose} keepMounted={true} zIndex={99999} ...>`.
  - Menggunakan kamus sentral `TEXT_COMMON.BUTTONS.CLOSE` untuk tombol tutup header.
  - Memastikan callback `onClose` yang bersifat opsional tidak memicu error saat tidak disediakan oleh konsumen.

---

## 3. Matriks Perubahan: Before vs After

| Aspek | Sebelum Refactor (Batch 2.2) | Sesudah Refactor (Batch 2.3) |
|---|---|---|
| **Body Scroll Lock** | Ditulis langsung oleh masing-masing modal (`overflow = "hidden"` / `""`). Berpotensi membocorkan scroll bila modal bertumpuk. | Dikelola sentral oleh `scrollLockCoordinator.ts` berbasis reference counting & idempotent release. |
| **Preservasi Initial Overflow** | Nilai overflow awal ditimpa tanpa dicatat. | Nilai awal dicatat presisi sebelum lock pertama dan dipulihkan setelah lock terakhir dilepas. |
| **Topmost Dismissal (Escape)** | Seluruh modal yang terbuka bereaksi serentak terhadap tombol Escape (potensi double close). | Hanya modal teratas (`isTopmostModal`) yang memproses tombol Escape. |
| **Android Back Handler** | Diinisialisasi manual di beberapa tempat dengan risiko konflik tumpukan. | Terintegrasi otomatis dalam `ModalShell` via `useMobileBackHandler`. |
| **Aksesibilitas Modal** | Atribut `role="dialog"`, `aria-modal`, dan label tersebar tidak seragam. | Terstandarisasi WAI-ARIA di `ModalShell` dengan `titleId` dan `ariaLabel`. |
| **Focus Restoration** | Fokus keyboard hilang setelah modal ditutup. | Fokus dikembalikan secara teratur ke elemen pemicu (`previouslyFocusedElementRef`). |
| **Komponen Pilot** | Boilerplate modal berulang di `QueueModal` dan `ReportModalLayout`. | Bersih, deklaratif, dan memanfaatkan `ModalShell`. |
| **Kamus Teks** | Teks `"Tutup"` hardcoded di `ReportModalLayout.tsx`. | Menggunakan `TEXT_COMMON.BUTTONS.CLOSE` dari `src/constants/texts/`. |

---

## 4. Case: Skenario Lapangan (Field Cases)

### Kasus 1: Modal Bertumpuk Urutan A (A Buka → B Buka → B Tutup → A Tutup)
- **Kondisi:** Pengguna membuka modal laporan `ReportModalLayout` (Modal A), lalu membuka dialog antrean offline `QueueModal` (Modal B) di atasnya.
- **Alur & Hasil:**
  1. Modal A dibuka: `lockCount = 1`, `document.body.style.overflow = "hidden"`.
  2. Modal B dibuka di atas Modal A: `lockCount = 2`, `overflow` tetap `"hidden"`.
  3. Modal B ditutup lebih dulu: `lockCount = 1`, `overflow` **tetap `"hidden"`** (scroll body tidak bocor saat Modal A masih ada di layar).
  4. Modal A ditutup: `lockCount = 0`, `overflow` kembali ke nilai awal.
- **Pengujian:** Diverifikasi pada unit test `scrollLockCoordinator.test.ts` dan `ModalShell.test.tsx` (Lulus 100%).

### Kasus 2: Modal Bertumpuk Urutan B (A Buka → B Buka → A Tutup → B Tetap Terkunci)
- **Kondisi:** Modal A dibuka, Modal B dibuka di atasnya. Melalui interaksi tertentu Modal A ditutup atau di-unmount di latar belakang sementara Modal B tetap aktif.
- **Alur & Hasil:**
  1. Modal A dan B aktif (`lockCount = 2`).
  2. Modal A ditutup/unmount: `lockCount = 1`.
  3. `document.body.style.overflow` **tetap `"hidden"`** karena Modal B masih membutuhkan penguncian layar.
  4. Modal B akhirnya ditutup: `lockCount = 0`, `overflow` dipulihkan ke nilai awal.
- **Pengujian:** Diverifikasi pada unit test `scrollLockCoordinator.test.ts` dan `ModalShell.test.tsx` (Lulus 100%).

### Kasus 3: Topmost Dismissal via Tombol Escape & Android Back
- **Kondisi:** Dua modal sedang aktif bertumpuk di layar. Pengguna menekan tombol Escape keyboard atau tombol Back fisik pada peranti Android.
- **Alur & Hasil:**
  1. Event `keydown` Escape ditangkap oleh kedua listener modal.
  2. `ModalShell` melakukan evaluasi `isTopmostModal(id)`.
  3. Modal di bawah mengabaikan event, sedangkan modal teratas memanggil `onClose`.
  4. Pengguna tidak mengalami double-close atau penutupan modal yang salah.
- **Pengujian:** Diverifikasi pada unit test `ModalShell.test.tsx` (Lulus 100%).

### Kasus 4: Isolasi Klik Konten & Backdrop Dismissal
- **Kondisi:** Pengguna mengklik input, tombol, atau memilih tab di dalam modal, atau mengklik area gelap di luar modal.
- **Alur & Hasil:**
  1. Mengklik atau menyentuh area form dialog memicu `stopPropagation()`, sehingga modal tidak menutup secara tidak sengaja saat pengguna mengisi data laporan.
  2. Mengklik backdrop luar memicu `onClose()` (jika `dismissOnBackdrop !== false`).
  3. Jika `onClose` tidak disediakan oleh pemanggil (seperti pada beberapa mode `ReportModalLayout`), shell dengan aman mengabaikan klik tanpa melempar error `TypeError: onClose is not a function`.
- **Pengujian:** Diverifikasi pada unit test `ModalShell.test.tsx` dan `ReportModalLayout.test.tsx` (Lulus 100%).

### Kasus 5: Integritas State Form dengan `keepMounted: true` pada `ReportModalLayout`
- **Kondisi:** Petugas sedang mengisi laporan PDO di `ReportModalLayout`, lalu menutup modal sementara untuk melihat data dashboard.
- **Alur & Hasil:**
  1. `ModalShell` dengan opsi `keepMounted: true` tidak me-unmount pohon komponen anak dari React DOM.
  2. Kontainer portal disembunyikan menggunakan `style={{ display: "none" }}` dan atribut `aria-hidden="true"`.
  3. Saat modal dibuka kembali, seluruh state isian form (teks laporan, data trip, pilihan shift) tetap utuh tanpa reset.
  4. Scroll lock tetap dilepas saat modal disembunyikan (`isOpen: false`) dan diakuisisi kembali saat modal ditampilkan (`isOpen: true`).
- **Pengujian:** Diverifikasi pada unit test `ReportModalLayout.test.tsx` (Lulus 100%).

### Kasus 6: Pemulihan Fokus Keyboard (*Focus Restoration*)
- **Kondisi:** Petugas membuka modal menggunakan tombol antrean offline atau tombol pelaporan via keyboard (Tab + Enter).
- **Alur & Hasil:**
  1. `ModalShell` mencatat elemen tombol pemicu sebelum modal muncul.
  2. Saat modal ditutup, fokus keyboard dikembalikan secara presisi ke tombol pemicu tersebut.
- **Pengujian:** Diverifikasi pada unit test `ModalShell.test.tsx` (Lulus 100%).

### Kasus 7: Preservasi Initial Overflow Non-Kosong
- **Kondisi:** Aplikasi atau layout halaman induk telah memiliki style `overflow: "scroll"` sebelum modal pertama kali dibuka.
- **Alur & Hasil:**
  1. `scrollLockCoordinator` membaca `document.body.style.overflow` (bernilai `"scroll"`).
  2. Lock diaktifkan: nilai berubah menjadi `"hidden"`.
  3. Saat semua modal ditutup, nilai dipulihkan menjadi `"scroll"` (bukan dihapus menjadi string kosong atau `"auto"`).
- **Pengujian:** Diverifikasi pada unit test `scrollLockCoordinator.test.ts` (Lulus 100%).

---

## 5. Ringkasan Quality Gates

| Gate | Status | Detail / Bukti |
|---|---|---|
| **Vitest Target** | **PASS** | 4 test files, 22 tests lulus (0 fail) dalam 4.01s (`refactor-ss-pdo/refact_94/evidence/targeted-tests.txt`) |
| **Vitest Full Suite** | **PASS** | 79 test files, 564 tests lulus (0 fail) dalam 49.67s (`refactor-ss-pdo/refact_94/evidence/full-tests.txt`) |
| **Targeted Lint (oxlint)** | **PASS** | 9 file sumber & tes Batch 2.3 dipindai: **0 warnings, 0 errors** (`refactor-ss-pdo/refact_94/evidence/targeted-lint.txt`) |
| **Root Lint (oxlint)** | **INFO** | 1912 warnings (mayoritas dari `dist_old/`, tidak ada regresi kode sumber) (`refactor-ss-pdo/refact_94/evidence/root-lint.txt`) |
| **Production Build** | **PASS** | `tsc -b && vite build` exit code 0 (`refactor-ss-pdo/refact_94/evidence/build.txt`) |
| **Graphify AST Update** | **PASS** | `graphify update .` exit code 0 (5.858 nodes, 9.763 edges) |
| **Git Diff Check** | **PASS** | `git diff --check` bersih, 0 whitespace errors (`refactor-ss-pdo/refact_94/evidence/git-diff-check.txt`) |

---

## 6. Daftar File yang Berubah & Ditambahkan

### File Baru Ditambahkan:
1. `src/utils/scrollLockCoordinator.ts` (Modul koordinasi body scroll lock berbasis reference counting & idempotent release).
2. `src/utils/scrollLockCoordinator.test.ts` (Unit test penguncian scroll, idempotensi, preservasi initial overflow, urutan A dan B).
3. `src/utils/modalStackCoordinator.ts` (Modul koordinasi tumpukan modal LIFO untuk penutupan Escape teratas).
4. `src/components/ui/ModalShell.tsx` (Komponen shell modal reusable dengan portal, ARIA dialog, backdrop dismiss, dan focus restoration).
5. `src/components/ui/ModalShell.test.tsx` (Unit test komprehensif untuk ModalShell, interaksi keyboard, dan lifecycle).
6. `src/components/dashboard/QueueModal.test.tsx` (Unit test fungsional dan interaksi penutupan QueueModal).
7. `src/components/pdoReport/ReportModalLayout.test.tsx` (Unit test ReportModalLayout dengan `keepMounted: true` dan optional `onClose`).
8. `refactor-ss-pdo/refact_94/AUDIT_BUGS.md` (Dokumentasi audit temuan R79-03/R80-03, R80-10, R89-01).
9. `refactor-ss-pdo/refact_94/REPAIR_REPORT.md` (Laporan perbaikan dan analisis teknis ini).
10. `refactor-ss-pdo/refact_94/evidence/*` (Seluruh artefak bukti verifikasi gate).

### File Eksisting Dimigrasikan:
1. `src/components/dashboard/QueueModal.tsx` (Dimigrasikan ke `ModalShell`, menghapus listener Escape manual dan scroll lock manual).
2. `src/components/pdoReport/ReportModalLayout.tsx` (Dimigrasikan ke `ModalShell` dengan opsi `keepMounted: true`, mengganti teks tombol tutup dengan kamus sentral `TEXT_COMMON.BUTTONS.CLOSE`).

---

## 7. Catatan Batas Pilot & Verifikasi Visual (Light / Dark Mode)

1. **Batas Status R80-10 (PARTIAL):**
   Meskipun `scrollLockCoordinator` terbukti bekerja secara solid pada dua konsumen pilot (`QueueModal` dan `ReportModalLayout`), modal lain seperti `BusInputModal` dan `UnitDetailModal` masih melakukan mutasi `document.body.style.overflow` langsung. Oleh karena itu, bug R80-10 dinyatakan berstatus **PARTIAL** dan akan dituntaskan secara bertahap seiring migrasi modal lainnya di batch mendatang.
2. **Verifikasi Visual Mobile & Tema (Light / Dark Mode):**
   - Kedua komponen mempertahankan kelas CSS dan CSS Variables tema bawaan (`var(--bg-card)`, `var(--text-primary)`, `var(--border-color)`, `var(--shadow)`).
   - `ReportModalLayout` mempertahankan `z-index: 99999` dan container internal `.no-scrollbar` untuk pengalaman mobile-first yang mulus di ponsel Android/iOS.
   - Karena keterbatasan sesi CLI/headless di mana autentikasi Google Sheets/Supabase aktif diperlukan untuk membuka antarmuka data produksi secara langsung di browser live, verifikasi visual dipastikan melalui integritas CSS tokens yang tidak diubah dan unit test Happy-DOM yang mengonfirmasi struktur DOM dan styling inline/kelas tetap identik dengan perilaku aslinya.

---

## 8. Status Akhir

**`READY_FOR_REVIEW`** — Batch 2.3 telah selesai secara penuh dan siap untuk ditinjau oleh Codex sebelum melangkah ke Batch berikutnya.
