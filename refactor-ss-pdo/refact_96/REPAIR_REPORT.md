# Laporan Perbaikan Refactor — Revisi Batch 2.3 (`refact_96`)

Dokumen ini mendokumentasikan implementasi dan verifikasi teknis perbaikan atas temuan Codex pada `refact_95` (R95-01 sampai R95-04) untuk **Fase 2, Batch 2.3** pada proyek SS_PDO.

---

## 1. Ringkasan Eksekutif

- **Fokus Revisi:**
  1. Menstabilkan subtree portal DOM pada `ReportModalLayout` saat `keepMounted={true}` sehingga tidak terjadi unmount/remount saat transisi `isOpen` (R95-01).
  2. Menyelaraskan urutan lapisan visual (`zIndex`) dengan urutan dismiss LIFO (Escape dan Android Hardware Back) pada modal bertumpuk (R95-02).
  3. Mengimplementasikan Focus Trap (`Tab` / `Shift+Tab`) dan proteksi restorasi fokus agar penutupan modal di bawah tidak mencuri fokus dari modal aktif di atasnya (R95-03).
  4. Mengoreksi narasi dokumentasi teknis, menambahkan atribut `aria-hidden="true"` pada modal tertutup, dan menyatakan batasan visual secara jujur (R95-04).
- **Hasil Quality Gates:**
  - **Vitest Targeted (6 file):** 31 tes lulus 100% (0 gagal) dalam 18.36s.
  - **Vitest Full Suite (81 file):** 573 tes lulus 100% (0 gagal) dalam 50.93s.
  - **Typecheck & Production Build (`tsc -b && vite build`):** Lulus 100% exit code 0.
  - **Targeted Lint (oxlint):** 12 file Batch 2.3 dipindai, 0 errors. File baru/dimodifikasi bebas dari peringatan baru.
  - **Root Lint (oxlint):** 1912 warnings (noise minified di `dist_old/`, tidak ada regresi source).
  - **Graphify Knowledge Graph:** Diperbarui via `graphify update .` dengan exit code 0 (5.920 nodes, 9.828 edges, 444 communities).
  - **Git Diff Format:** Bersih (0 whitespace/formatting errors).
- **Status Akhir:** **`READY_FOR_REVIEW`**

---

## 2. Detail Implementasi & Perbaikan

### A. Stabilisasi Pohon Portal DOM (`ReportModalLayout.tsx`) — Menutup R95-01
- **Masalah Semula:** `ReportModalLayout` menyertakan `disablePortal={isTestEnv || !isOpen}`. Saat modal ditutup, `ModalShell` beralih dari `createPortal(..., document.body)` menjadi render inline di lokasi pemanggil. Peralihan tipe pohon render ini melepaskan (*unmount*) dan memasang ulang (*remount*) seluruh subtree DOM anak, sehingga membatalkan fungsi `keepMounted: true`.
- **Implementasi Perbaikan:**
  - Konfigurasi `disablePortal={isTestEnv || !isOpen}` dihapus dari `ReportModalLayout.tsx`.
  - `ModalShell` secara konsisten mempertahankan portal ke `document.body` baik saat `isOpen: true` maupun saat `isOpen: false`.
  - Saat `isOpen: false` dan `keepMounted: true`, modal disembunyikan menggunakan CSS `display: "none"` dan atribut `aria-hidden="true"`.
  - Subtree DOM tidak pernah berpindah tempat atau dilepas dari pohon React, sehingga input DOM yang belum tersinkron dan state React anak tetap utuh 100%.

### B. Penyelarasan Lapisan Visual Dinamis (`modalStackCoordinator.ts` & `ModalShell.tsx`) — Menutup R95-02
- **Masalah Semula:** `QueueModal` memakai `base zIndex = 100`, sedangkan `ReportModalLayout` memakai `base zIndex = 99999`. Bila Laporan dibuka lebih dahulu lalu Antrean dibuka di atasnya, Antrean terdaftar di stack LIFO teratas tetapi secara visual tenggelam di bawah Laporan. Escape/Back menutup dialog yang tidak tampak oleh pengguna.
- **Implementasi Perbaikan:**
  - `modalStackCoordinator.ts` ditingkatkan untuk mencatat `zIndex` efektif tiap modal dan menyediakan fungsi `getHighestActiveZIndex()`.
  - `ModalShell.tsx` menggunakan `assignedZIndexRef` yang mengunci z-index efektif saat modal dibuka:
    $$\text{computedZIndex} = \max(\text{baseZIndex}, \text{highestActiveZIndex} + 10)$$
  - Saat berdiri sendiri, tampilan dan zIndex bawaan masing-masing modal tetap dipertahankan (`QueueModal: 100`, `ReportModalLayout: 99999`).
  - Saat bertumpuk di urutan manapun, modal yang dibuka paling akhir selalu diangkat menjadi lapisan visual terdepan dan menjadi satu-satunya penerima Escape dan Android Back.

### C. Focus Trap & Proteksi Fokus Bertumpuk (`ModalShell.tsx`) — Menutup R95-03
- **Masalah Semula:** Cleanup effect pada `ModalShell` selalu memulihkan fokus ke elemen luar (`previousActiveElementRef`). Jika Modal A ditutup saat Modal B masih terbuka di atasnya, fokus ditarik keluar ke dashboard. Selain itu, tombol `Tab`/`Shift+Tab` dapat melompat keluar dari modal aktif ke elemen halaman di belakangnya.
- **Implementasi Perbaikan:**
  - **Focus Trap:** Pada event `keydown` di dalam dialog topmost, tombol `Tab` pada elemen focusable terakhir akan memindahkan fokus kembali ke elemen focusable pertama di dalam dialog. Tombol `Shift+Tab` pada elemen pertama akan melompat ke elemen terakhir.
  - **Initial Focus:** Saat modal terbuka, fokus diarahkan ke elemen pertama yang dapat difokuskan, atau kontainer dialog itu sendiri.
  - **Restorasi Fokus Terkoordinasi:** Fungsi `getTopmostModalExcluding(id)` memeriksa apakah masih ada modal lain yang aktif di layar saat modal ditutup. Jika masih ada modal lain (Modal B), cleanup Modal A **tidak memulihkan fokus ke luar**. Fokus tetap berada di dalam Modal B. Pemulihan ke elemen pemicu dashboard hanya dilakukan ketika modal terakhir ditutup (`getTopmostModalExcluding(id) === undefined`).

### D. Koreksi Dokumentasi & Atribut Aksesibilitas — Menutup R95-04
- Menambahkan atribut `aria-hidden={!isOpen ? "true" : undefined}` pada kontainer modal saat tertutup dengan `keepMounted: true`.
- Mengoreksi narasi teknis:
  - Sebelum refactor, `ReportModalLayout` hanya memiliki **satu** listener Back dan **satu** portal.
  - Nama props yang benar di `ModalShell` adalah `ariaLabelledBy` (bukan `titleId`) dan `closeOnBackdropClick` (bukan `dismissOnBackdrop`).
  - Mengklarifikasi bahwa pengujian otomatis dieksekusi via Happy-DOM (mensimulasikan event keyboard, popstate hardware back, dan manipulasi pohon portal).

---

## 3. Matriks Perubahan: Before vs After

| Aspek | Sebelum Revisi (`refact_94` / `refact_95`) | Sesudah Revisi (`refact_96`) |
|---|---|---|
| **Portal `keepMounted`** | Berganti antara portal (`isOpen: true`) dan inline (`isOpen: false`), meremount subtree DOM anak. | Portal tetap stabil di `document.body` sepanjang siklus hidup; input DOM & state anak bertahan. |
| **Atribut Tertutup** | Kontainer `display: none` belum memiliki `aria-hidden`. | Memiliki atribut `aria-hidden="true"` saat tertutup dengan `keepMounted: true`. |
| **Lapisan Visual Bertumpuk** | `QueueModal` (100) tenggelam di bawah `ReportModalLayout` (99999) bila dibuka setelahnya. | z-index dihitung bertingkat secara dinamis ($\max(\text{base}, \text{highest} + 10)$); modal baru selalu terdepan. |
| **Topmost Dismissal** | Escape/Back dapat menutup dialog yang berada di belakang secara visual. | Dialog terdepan secara visual selalu menjadi satu-satunya target Escape & Android Back (tepat 1 callback). |
| **Keyboard Focus Trap** | Pengguna dapat menekan Tab keluar dari modal aktif ke elemen halaman. | Fokus ditahan (*focus trap*) berputar di dalam dialog aktif via `Tab` dan `Shift+Tab`. |
| **Fokus Bertumpuk** | Menutup modal bawah A menarik fokus keluar dari modal atas B. | Fokus tetap dipertahankan di dalam modal B; hanya dipulihkan ke luar saat modal terakhir ditutup. |
| **Nama Props Shell** | Dokumentasi menyebut `titleId` dan `dismissOnBackdrop`. | Dokumentasi diselaraskan dengan kode aktual: `ariaLabelledBy` dan `closeOnBackdropClick`. |

---

## 4. Case: Skenario Lapangan (Field Cases)

### Kasus 1: Draf Laporan — State Form & Input Bertahan pada Portal Stabil (R95-01)
- **Skenario:** Petugas sedang mengisi draf laporan operasional di `ReportModalLayout`. Petugas telah mengetik catatan khusus pada input form dan menekan tombol counter lokal. Petugas menutup panel modal sementara untuk memeriksa kartu ringkasan di dashboard, lalu membukanya kembali.
- **Hasil Pengujian Aktual:**
  - Saat ditutup (`isOpen: false`), pohon portal di `document.body` tidak dilepas, melainkan diatur `display: "none"` dan `aria-hidden="true"`.
  - Saat dibuka kembali (`isOpen: true`), referensi node DOM input tetap identik (`reopenedInput === input`), nilai teks input tetap `"Laporan operasional modifikasi pengawas"`, dan state lokal React anak tetap `1`.
  - Scroll lock dilepas saat panel ditutup dan diakuisisi kembali saat panel dibuka.
- **Bukti Tes:** [ReportModalLayout.test.tsx:62-126](file:///d:/MINE/SS_PDO/src/components/pdoReport/ReportModalLayout.test.tsx) (Lulus 100%).

### Kasus 2: Laporan Lalu Antrean — Lapisan Visual Selaras dengan Escape & Android Back (R95-02)
- **Skenario:** Petugas membuka panel Laporan Operasional (`ReportModalLayout`, `base zIndex = 99999`). Saat panel laporan aktif, petugas membuka dialog Antrean Offline (`QueueModal`, `base zIndex = 100`).
- **Hasil Pengujian Aktual:**
  - `QueueModal` secara dinamis diangkat ke `zIndex = 100009` ($> 99999$), sehingga secara visual tampak berada di depan Laporan.
  - Petugas menekan tombol `Escape` atau tombol fisik `Back` Android:
    - Hanya `QueueModal` yang tertutup (tepat 1 callback).
    - `ReportModalLayout` di belakangnya tetap terbuka dan tidak terganggu.
    - Scroll lock tetap aktif (`lockCount = 1`, `document.body.style.overflow = "hidden"`).
  - Petugas menekan tombol `Escape` atau `Back` kedua:
    - Sekarang `ReportModalLayout` yang tertutup (tepat 1 callback).
    - Scroll lock dipulihkan ke nilai awal (`lockCount = 0`).
  - Skenario sebaliknya (Queue dibuka lebih dulu lalu Report) juga terbukti selaras: Report berada di atas Queue, dan Escape/Back menutup Report lebih dulu.
- **Bukti Tes:** [QueueReportIntegration.test.tsx:105-312](file:///d:/MINE/SS_PDO/src/components/dashboard/QueueReportIntegration.test.tsx) (Lulus 100%).

### Kasus 3: Tutup Modal Bawah Lebih Dulu & Focus Trap (R95-03)
- **Skenario:** Modal A dan Modal B terbuka bersamaan (Modal B aktif di atas Modal A). Modal A ditutup lewat perubahan state induk di latar belakang sementara Modal B tetap aktif. Pengguna menggunakan keyboard untuk berinteraksi dengan Modal B.
- **Hasil Pengujian Aktual:**
  - Saat Modal A melakukan cleanup penutupan, `getTopmostModalExcluding("modal-under-A")` mendeteksi Modal B masih aktif di stack.
  - Fokus keyboard **tidak dicuri keluar ke dashboard**, melainkan tetap berada di elemen input Modal B (`document.activeElement === inputB`).
  - Di dalam Modal B, menekan `Tab` pada tombol terakhir mengembalikan fokus ke input pertama, dan menekan `Shift+Tab` pada input pertama melompat ke tombol terakhir (*focus trap*).
  - Saat Modal B akhirnya ditutup, seluruh modal telah selesai, dan fokus keyboard dikembalikan secara rapi ke tombol pemicu semula di halaman (`outside-trigger`).
- **Bukti Tes:** [ModalShell.test.tsx:353-485](file:///d:/MINE/SS_PDO/src/components/ui/ModalShell.test.tsx) (Lulus 100%).

### Kasus 4: Serah Terima Audit Jujur & Transparan (R95-04)
- **Skenario:** Project owner dan Codex meninjau kepatuhan arsitektur proyek.
- **Kepastian Teknis:**
  - Dokumen tidak lagi mencantumkan klaim listener Back ganda sebelum refactor (diakui jujur masing-masing satu).
  - Nama props yang tercatat adalah `ariaLabelledBy` dan `closeOnBackdropClick`.
  - Status `R80-10` secara terbuka dicatat tetap **PARTIAL** karena modal lain seperti `BusInputModal` dan `UnitDetailModal` belum dimigrasikan ke `scrollLockCoordinator`.
  - Status `R89-01` dicatat tetap **OPEN** untuk menjaga folder `dist_old/`.
  - Verifikasi dinyatakan secara tepat berdasarkan eksekusi unit/integration test lingkungan Node/Happy-DOM dan build Vite/TypeScript tanpa klaim palsu verifikasi manual layar fisik.

---

## 5. Ringkasan Quality Gates

| Gate | Perintah / File Bukti | Status | Hasil |
|---|---|---|---|
| **Vitest Targeted** | `pnpm vitest run <6 test files>` (`refactor-ss-pdo/refact_96/evidence/targeted-tests.txt`) | **PASS** | 6 test files, 31 tests lulus (100%) dalam 18.36s |
| **Vitest Full Suite** | `pnpm run test --dir src` (`refactor-ss-pdo/refact_96/evidence/full-tests.txt`) | **PASS** | 81 test files, 573 tests lulus (100%) dalam 50.93s |
| **Targeted Lint** | `pnpm dlx oxlint <12 files>` (`refactor-ss-pdo/refact_96/evidence/targeted-lint.txt`) | **PASS** | 0 errors. File baru/dimodifikasi bebas dari peringatan baru |
| **Root Lint (R89-01)** | `pnpm dlx oxlint` (`refactor-ss-pdo/refact_96/evidence/root-lint.txt`) | **INFO** | 1912 warnings (noise minified di `dist_old/`, tidak ada regresi source) |
| **Production Build** | `pnpm exec tsc -b; pnpm exec vite build --emptyOutDir false` (`refactor-ss-pdo/refact_96/evidence/build.txt`) | **PASS** | Exit code 0, modul & PWA chunk ter-generate bersih |
| **Graphify AST Update** | `graphify update .` | **PASS** | Exit code 0 (5.920 nodes, 9.828 edges, 444 communities) |
| **Git Diff Format** | `git diff --check` (`refactor-ss-pdo/refact_96/evidence/git-diff-check.txt`) | **PASS** | Bersih (0 whitespace/formatting errors) |

---

## 6. Daftar File yang Berubah & Ditambahkan

### File Baru Ditambahkan:
1. `src/utils/modalStackCoordinator.test.ts` (Unit test LIFO stack, topmost tracking, dynamic zIndex calculation).
2. `src/components/dashboard/QueueReportIntegration.test.tsx` (Test integrasi lengkap QueueModal & ReportModalLayout untuk urutan 1 & 2, Escape, dan Android Back popstate).
3. `refactor-ss-pdo/refact_96/AUDIT_BUGS.md` (Dokumentasi audit temuan R95-01 sampai R95-04, R80-10, R89-01).
4. `refactor-ss-pdo/refact_96/REPAIR_REPORT.md` (Laporan perbaikan dan analisis teknis komprehensif ini).
5. `refactor-ss-pdo/refact_96/evidence/*` (Seluruh artefak bukti verifikasi quality gates).

### File Eksisting Dimodifikasi:
1. `src/utils/modalStackCoordinator.ts` (Menambahkan pelacakan zIndex, `getHighestActiveZIndex`, `getTopmostModalExcluding`, dan `hasOtherActiveModals`).
2. `src/utils/historyNavigation.ts` (Menambahkan `_resetHistoryNavigationForTest` untuk isolasi pengujian popstate).
3. `src/components/ui/ModalShell.tsx` (Derivasi zIndex bertingkat stabil, `aria-hidden` saat tertutup, Focus Trap Tab/Shift+Tab, dan restorasi fokus bertumpuk).
4. `src/components/ui/ModalShell.test.tsx` (Menambahkan pengujian Focus Trap, stacked focus protection, dynamic zIndex elevation, dan atribut `aria-hidden`).
5. `src/components/pdoReport/ReportModalLayout.tsx` (Menghapus `disablePortal={isTestEnv || !isOpen}` agar portal selalu stabil di `document.body`).
6. `src/components/pdoReport/ReportModalLayout.test.tsx` (Menambahkan pengujian transisi produksi buka $\rightarrow$ edit $\rightarrow$ tutup $\rightarrow$ buka kembali membuktikan subtree dan input DOM utuh).
7. `src/components/pdoReport/RouteOperationalReportCard.test.tsx` (Menyesuaikan query tes untuk mendeteksi elemen modal di portal `document.body`).

---

## 7. Status Akhir

**`READY_FOR_REVIEW`** — Seluruh temuan revisi Codex (R95-01, R95-02, R95-03, R95-04) telah diselesaikan dengan bukti pengujian lulus 100%. Fase 2 Batch 2.3 siap untuk ditinjau ulang oleh Codex sebelum melanjutkan ke fase/batch berikutnya.
