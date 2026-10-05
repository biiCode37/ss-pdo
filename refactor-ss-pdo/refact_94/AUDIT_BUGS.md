# Audit Bugs & Scope Tracking — Batch 2.3 (Pilot ModalShell & ScrollLockCoordinator)

Dokumen ini melacak status audit bug dan mitigasi teknis untuk **Fase 2, Batch 2.3** pada proyek SS_PDO, dengan fokus pada implementasi pilot `scrollLockCoordinator`, `ModalShell`, serta migrasi pilot pada `QueueModal` dan `ReportModalLayout`.

---

## 1. Temuan Utama & Status Batch 2.3

### Temuan R79-03 / R80-03: Duplikasi Logika Modal Shell, Escape, Back Android, dan Aksesibilitas Dialog
- **ID Temuan:** R79-03 / R80-03
- **Lokasi Kode Sebelum Refactor:**
  - `src/components/dashboard/QueueModal.tsx` (listener `keydown` manual untuk Escape, styling modal inline, `document.body.style.overflow` manual tanpa pemulihan aman).
  - `src/components/pdoReport/ReportModalLayout.tsx` (listener Android Back ganda, portal ganda, scroll lock manual, penanganan `keepMounted` ad-hoc).
- **Keparah:** Medium (Duplikasi boilerplate, inkonsistensi perilaku dismiss keyboard dan Android Back, potensi double close).
- **Deskripsi:**
  Setiap modal mengelola sendiri listener tombol Escape, manipulasi `document.body.style.overflow`, pendaftaran Android Back handler (`useMobileBackHandler`), serta struktur portal dan backdrop. Hal ini memicu inkonsistensi aksesibilitas dialog (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`/`aria-label`), hilangnya pemulihan fokus (*focus restoration*), dan risiko double close saat pengguna menekan tombol Escape atau tombol Back fisik pada peranti Android.
- **Dampak User:**
  - Pengguna di lapangan yang menekan tombol Escape atau tombol Back Android dapat memicu penutupan ganda atau menutup modal yang salah saat dua dialog aktif bertumpuk.
  - Pembaca layar (screen reader) dan navigasi keyboard tidak mendeteksi dialog secara semantik sesuai standar WAI-ARIA modal dialog.
  - Setelah modal ditutup, fokus keyboard hilang dari elemen pemicu semula sehingga mengganggu alur navigasi petugas operasional.
- **Mitigasi:**
  1. Dibuat komponen reusable `src/components/ui/ModalShell.tsx` yang secara otomatis mengelola portal React, atribut aksesibilitas WAI-ARIA (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-label`), penutupan via backdrop click yang aman (mencegah salah tutup saat klik/drag konten), pemulihan fokus elemen pemicu (`previouslyFocusedElementRef`), dan pendaftaran Android Back via `useMobileBackHandler`.
  2. Dibuat koordinator LIFO stack minimal `src/utils/modalStackCoordinator.ts` untuk memastikan tombol Escape hanya menutup modal paling atas (*topmost dismissal*).
  3. Dimigrasikan `QueueModal.tsx` dan `ReportModalLayout.tsx` ke `ModalShell`. Seluruh listener Escape dan manipulasi scroll lock manual dihapus dari kedua komponen.
- **Status:** **RESOLVED (PILOT)** untuk `QueueModal` dan `ReportModalLayout`.

---

### Temuan R80-10: Inkonsistensi & Potensi Kebocoran Body Scroll Lock Global
- **ID Temuan:** R80-10
- **Lokasi Kode:**
  - `src/utils/scrollLockCoordinator.ts` (Implementasi baru solusi SSOT).
  - `src/components/busCard/modal/BusInputModal.tsx` (Masih menulis `document.body.style.overflow` langsung).
  - `src/components/busCard/modal/UnitDetailModal.tsx` (Masih menulis `document.body.style.overflow` langsung).
  - Berbagai modal dan drawer lain di luar cakupan pilot Batch 2.3.
- **Keparah:** High (Inkonsistensi global, body scroll dapat terkunci permanen atau terbuka prematur saat modal bertumpuk).
- **Deskripsi:**
  Sebelum Batch 2.3, tidak ada koordinator sentral untuk penguncian scroll `document.body`. Setiap komponen menulis `document.body.style.overflow = "hidden"` saat dibuka dan `document.body.style.overflow = "auto"` / `""` saat ditutup. Jika Modal A dibuka lalu Modal B dibuka, penutupan Modal B akan membuka scroll body meskipun Modal A masih terbuka di layar.
- **Dampak User:**
  Latar belakang halaman dapat ter-scroll secara tidak terkendali saat modal masih terbuka, atau scroll halaman membeku setelah modal ditutup.
- **Mitigasi Batch 2.3:**
  1. Dibuat `src/utils/scrollLockCoordinator.ts` dengan prinsip *reference counting* (`lockCount`), fungsi pelepasan *idempotent* (`release()`), dan pencatatan presisi nilai awal `document.body.style.overflow` sebelum lock pertama diakuisisi.
  2. Nilai awal dipulihkan secara persis hanya ketika lock terakhir dilepas (`lockCount === 0`).
  3. `ModalShell` mengintegrasikan `acquireScrollLock()` secara otomatis saat `isOpen === true`.
- **Status:** **PARTIAL**
  > **Catatan Batas Batch 2.3 (Penting):**
  > Pilot Batch 2.3 membuktikan koordinator berfungsi sempurna pada interaksi `QueueModal` dan `ReportModalLayout` (Order 1 dan Order 2 lolos uji 100%). Namun, modal-modal lain seperti `BusInputModal` dan `UnitDetailModal` masih menulis `body.style.overflow` secara langsung di luar koordinator. Status R80-10 tetap **PARTIAL** hingga seluruh pemanggil modal di aplikasi selesai dimigrasikan ke `ModalShell` atau `scrollLockCoordinator` pada batch-batch berikutnya.

---

### Catatan Tooling R89-01: Folder `dist_old/` Terdeteksi pada Graphify & Oxlint Root
- **ID Catatan:** R89-01
- **Lokasi:** Direktori root `dist_old/`
- **Keparah:** Low (Tooling noise, non-runtime)
- **Deskripsi:**
  Folder `dist_old/` sengaja dipertahankan di working tree sesuai instruksi. Scanner root oxlint memindai artefak build minified lama ini sehingga menghasilkan noise sebanyak ~1.800+ warnings.
- **Dampak User:**
  Nol dampak bagi runtime aplikasi atau pengguna akhir di browser.
- **Mitigasi:**
  1. Verifikasi lint dilakukan secara terarah (*targeted lint*) pada file-file sumber yang disentuh/dibuat pada Batch 2.3 (`oxlint` menghasilkan **0 warnings, 0 errors**).
  2. Hasil oxlint root didokumentasikan secara transparan tanpa mengklaim regresi source.
- **Status:** **OPEN / TRACKED** (Sesuai ketetapan tidak boleh dihapus/dipindahkan pada batch ini).

---

## 2. Matriks Verifikasi Temuan

| ID Temuan | Komponen Target | Status | Bukti Pengujian |
|---|---|---|---|
| **R79-03 / R80-03** | `QueueModal.tsx`, `ReportModalLayout.tsx`, `ModalShell.tsx` | **RESOLVED (PILOT)** | `src/components/ui/ModalShell.test.tsx` (9 tes lulus), `QueueModal.test.tsx` (3 tes lulus), `ReportModalLayout.test.tsx` (5 tes lulus) |
| **R80-10** | `src/utils/scrollLockCoordinator.ts` | **PARTIAL** | `src/utils/scrollLockCoordinator.test.ts` (5 tes lulus: Order 1, Order 2, Idempotency, Initial Overflow) |
| **R89-01** | `dist_old/` | **OPEN / TRACKED** | Bukti `targeted-lint.txt` (0 w/0 e) dan `root-lint.txt` (1912 warnings di root) |
