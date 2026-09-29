# Audit Bugs & Scope Tracking — Revisi Batch 2.3 (`refact_96`)

Dokumen ini mendokumentasikan pelacakan audit dan mitigasi teknis untuk **Revisi Fase 2, Batch 2.3** pada proyek SS_PDO berdasarkan temuan Codex di `refact_95/AUDIT_BUGS.md` (R95-01 sampai R95-04) serta catatan terbuka R80-10 dan R89-01.

---

## 1. Temuan Revisi Codex & Mitigasi Teknis

### Temuan R95-01: `keepMounted` Tidak Menjaga State DOM Saat Portal Berganti (Volatile Portal Tree)
- **ID Temuan:** R95-01
- **Lokasi Kode Sebelum Revisi:**
  - `src/components/pdoReport/ReportModalLayout.tsx:38` (`disablePortal={isTestEnv || !isOpen}`)
  - `src/components/ui/ModalShell.tsx:226-231` (kondisional `disablePortal` mengubah target render dari `createPortal` ke inline)
  - `src/components/pdoReport/ReportModalLayout.test.tsx` (sebelumnya hanya menguji keadaan awal tertutup dan memakai render inline)
- **Keparah:** Tinggi
- **Deskripsi:**
  Pada implementasi sebelumnya, `ReportModalLayout` menyetel prop `disablePortal={isTestEnv || !isOpen}`. Saat modal dibuka (`isOpen: true`), konten dirender via `createPortal(..., document.body)`. Namun saat modal ditutup (`isOpen: false`), nilai `disablePortal` menjadi `true`, yang menyebabkan `ModalShell` beralih merender pohon DOM secara inline. Pergantian antara portal dan render inline ini melepaskan (*unmount*) dan memasang ulang (*remount*) seluruh subtree DOM. Akibatnya, `keepMounted={true}` gagal mempertahankan input DOM yang belum tersinkron ke state React, fokus, atau state lokal komponen anak.
- **Dampak User:**
  Data isian laporan operasional pengawas yang sedang diketik dapat terhapus atau reset ke nilai awal ketika panel laporan ditutup sementara untuk memeriksa dashboard dan dibuka kembali.
- **Mitigasi di `refact_96`:**
  1. Menghapus konfigurasi volatil `disablePortal={isTestEnv || !isOpen}` dari `ReportModalLayout.tsx`. `ModalShell` kini selalu mempertahankan portal stabil di `document.body` baik saat `isOpen: true` maupun `isOpen: false`.
  2. Saat `isOpen: false` dan `keepMounted: true`, elemen tetap berada di portal `document.body` dengan gaya `display: "none"` dan atribut `aria-hidden="true"`, tanpa berpindah pohon render.
  3. Menambahkan pengujian transisi produksi nyata pada [ReportModalLayout.test.tsx](file:///d:/MINE/SS_PDO/src/components/pdoReport/ReportModalLayout.test.tsx): buka (`isOpen: true`) → ubah nilai input DOM & ubah state React lokal anak → tutup (`isOpen: false`) → buka kembali (`isOpen: true`). Terbukti node DOM identik (referensi sama) dan seluruh nilai input/state anak tetap utuh 100%.
- **Status:** **RESOLVED**

---

### Temuan R95-02: Urutan Dismiss Tidak Sesuai Lapisan Visual Dua Pilot
- **ID Temuan:** R95-02
- **Lokasi Kode Sebelum Revisi:**
  - `src/components/dashboard/QueueModal.tsx:35` (`zIndex={100}`)
  - `src/components/pdoReport/ReportModalLayout.tsx:37` (`zIndex={99999}`)
  - `src/utils/modalStackCoordinator.ts` & `src/components/ui/ModalShell.tsx` (urutan LIFO tidak sinkron dengan z-index visual)
- **Keparah:** Sedang
- **Deskripsi:**
  `QueueModal` memiliki `base zIndex = 100`, sedangkan `ReportModalLayout` memiliki `base zIndex = 99999`. Bila laporan dibuka terlebih dahulu lalu antrean dibuka di atasnya, antrean terdaftar di stack LIFO paling atas, tetapi secara visual tenggelam di bawah laporan (`100 < 99999`). Akibatnya, tombol `Escape` atau `Android Back` menutup antrean yang tidak terlihat oleh mata pengguna di layar.
- **Dampak User:**
  Tombol Escape atau tombol Back Android tampak tidak merespons dialog terdepan yang sedang dilihat pengguna, atau menutup modal di latar belakang secara membingungkan.
- **Mitigasi di `refact_96`:**
  1. Memperbarui `modalStackCoordinator.ts` untuk mencatat `zIndex` efektif tiap modal aktif dan menyediakan `getHighestActiveZIndex()`.
  2. Di `ModalShell.tsx`, saat modal dibuka (`isOpen: true`), `assignedZIndexRef` secara dinamis menghitung:
     $$\text{computedZIndex} = \max(\text{baseZIndex}, \text{highestActiveZIndex} + 10)$$
     Begitu modal terbuka, nilai ini dikunci agar stabil selama siklus buka dan selalu berada di atas lapisan modal di bawahnya.
  3. Saat berdiri sendiri:
     - `QueueModal`: `zIndex = 100` (tetap sesuai baseline).
     - `ReportModalLayout`: `zIndex = 99999` (tetap sesuai baseline).
  4. Saat bertumpuk:
     - Queue buka $\rightarrow$ Report buka: Report di atas Queue ($99999 > 100$). Escape/Back menutup Report lebih dulu.
     - Report buka $\rightarrow$ Queue buka: Queue diangkat ke atas Report ($100009 > 99999$). Escape/Back menutup Queue lebih dulu.
  5. Menambahkan suite pengujian integrasi dua arah [QueueReportIntegration.test.tsx](file:///d:/MINE/SS_PDO/src/components/dashboard/QueueReportIntegration.test.tsx) yang memverifikasi kedua urutan buka, lapisan zIndex visual, penutupan tepat 1 callback per Escape, dan hardware Back Android (popstate).
- **Status:** **RESOLVED**

---

### Temuan R95-03: Fokus Modal Bertumpuk Belum Dijaga (Focus Trap & Restoration Conflict)
- **ID Temuan:** R95-03
- **Lokasi Kode Sebelum Revisi:**
  - `src/components/ui/ModalShell.tsx:113-142` (cleanup effect selalu memulihkan fokus ke elemen luar tanpa memeriksa modal lain yang masih aktif)
  - `src/components/ui/ModalShell.test.tsx` (belum ada uji focus trap Tab/Shift+Tab dan uji tutup modal bawah A)
- **Keparah:** Sedang
- **Deskripsi:**
  Jika modal A dibuka lalu modal B dibuka di atasnya, saat modal A ditutup lewat perubahan state induk sementara modal B tetap aktif, cleanup modal A menarik fokus keluar ke elemen pemicu di dashboard. Selain itu, belum ada pengendalian tombol `Tab` / `Shift+Tab` untuk mengunci fokus (*focus trap*) di dalam dialog modal yang sedang aktif.
- **Dampak User:**
  Pengguna keyboard dan pembaca layar (screen reader) dapat kehilangan konteks kerja dan fokus melompat ke kontrol di belakang dialog aktif.
- **Mitigasi di `refact_96`:**
  1. Menambahkan **Focus Trap** di `ModalShell.tsx`: saat dialog berstatus *topmost*, event `Tab` pada elemen focusable terakhir akan memindahkan fokus ke elemen focusable pertama di dalam dialog. Event `Shift+Tab` pada elemen pertama akan memindahkan fokus ke elemen terakhir di dalam dialog.
  2. Menambahkan `getTopmostModalExcluding(id)` pada `modalStackCoordinator.ts`. Saat cleanup fokus berjalan pada modal yang sedang ditutup, modal memeriksa apakah masih ada modal lain yang aktif. Jika masih ada modal lain di layar, fokus **TIDAK DIKEMBALIKAN KE LUAR**, melainkan dijaga tetap berada di dalam modal yang masih aktif.
  3. Fokus hanya dipulihkan ke elemen pemicu semula (`previousActiveElementRef.current`) ketika modal terakhir ditutup secara bersih.
  4. Menambahkan unit test di [ModalShell.test.tsx](file:///d:/MINE/SS_PDO/src/components/ui/ModalShell.test.tsx) untuk memverifikasi focus trap `Tab`/`Shift+Tab`, initial focus, dan skenario penutupan modal bawah A tanpa mengganggu fokus pada modal B.
- **Status:** **RESOLVED**

---

### Temuan R95-04: Koreksi Narasi Laporan & Batas Verifikasi Aktual
- **ID Temuan:** R95-04
- **Lokasi:** Laporan dokumentasi `refact_94`
- **Keparah:** Rendah (Ketepatan dokumentasi teknis)
- **Deskripsi:**
  Beberapa narasi pada `refact_94` melampaui verifikasi aktual:
  - Menyebut `ReportModalLayout` sebelumnya memiliki listener Back dan portal ganda, padahal kode asli masing-masing hanya satu.
  - Menyebut `aria-hidden="true"` pada modal tertutup, padahal atribut tersebut belum dipasang pada `ModalShell` di `refact_94`.
  - Menyebut nama props `titleId` dan `dismissOnBackdrop`, padahal nama prop sebenarnya adalah `ariaLabelledBy` dan `closeOnBackdropClick`.
  - Mengklaim kepatuhan WAI-ARIA dan pengujian perangkat nyata tanpa verifikasi fokus dan browser nyata.
- **Mitigasi di `refact_96`:**
  1. Menambahkan atribut `aria-hidden={!isOpen ? "true" : undefined}` pada kontainer `ModalShell` ketika tertutup dengan `keepMounted: true`.
  2. Mengoreksi seluruh penamaan props dan sejarah arsitektur pada [REPAIR_REPORT.md](file:///d:/MINE/SS_PDO/refactor-ss-pdo/refact_96/REPAIR_REPORT.md): `ReportModalLayout` sebelum refactor memiliki satu handler Back dan satu portal; props yang benar adalah `ariaLabelledBy` dan `closeOnBackdropClick`.
  3. Mendokumentasikan secara transparan bahwa verifikasi dilakukan melalui unit/integration tests Happy-DOM otomatis yang mengeksekusi alur DOM, event popstate, dan keyboard. Batasan visual live perangkat dicatat secara jujur tanpa klaim palsu.
- **Status:** **RESOLVED**

---

## 2. Catatan Terbuka yang Tidak Berubah

### R80-10: Inkonsistensi & Potensi Kebocoran Body Scroll Lock Global
- **Status:** **PARTIAL**
- **Catatan:** Dua konsumen pilot (`QueueModal` dan `ReportModalLayout`) telah sepenuhnya dimigrasikan ke `scrollLockCoordinator.ts` dan terbukti aman pada berbagai urutan buka-tutup. Namun, komponen lain (`BusInputModal`, `UnitDetailModal`, dan dialog lain) masih memanipulasi `document.body.style.overflow` secara langsung. Status R80-10 tetap **PARTIAL** sampai seluruh modal relevan dimigrasikan pada batch berikutnya.

### R89-01: Folder `dist_old/` Terdeteksi pada Graphify & Oxlint Root
- **Status:** **OPEN / TRACKED**
- **Catatan:** Direktori `dist_old/` sengaja dipertahankan di working tree sesuai instruksi. Scanner root oxlint memindai artefak minified lama ini (~1.900+ warnings). File yang disentuh pada Batch 2.3 terbukti bersih (**0 warnings, 0 errors** pada targeted lint). Status R89-01 tetap **OPEN** dan tidak diubah dalam batch ini.

---

## 3. Matriks Verifikasi Temuan `refact_96`

| ID Temuan | Komponen / Modul | Status | Bukti Pengujian |
|---|---|---|---|
| **R95-01** | `ReportModalLayout.tsx`, `ModalShell.tsx` | **RESOLVED** | `ReportModalLayout.test.tsx` (uji transisi produksi buka $\rightarrow$ edit $\rightarrow$ tutup $\rightarrow$ buka kembali; input & state anak utuh) |
| **R95-02** | `ModalShell.tsx`, `modalStackCoordinator.ts`, `QueueReportIntegration.test.tsx` | **RESOLVED** | `QueueReportIntegration.test.tsx` (uji urutan 1 & 2, visual zIndex stacking, Escape & Android Back popstate) |
| **R95-03** | `ModalShell.tsx`, `modalStackCoordinator.ts` | **RESOLVED** | `ModalShell.test.tsx` (uji focus trap Tab/Shift+Tab, initial focus, dan tutup modal bawah A tanpa mencuri fokus B) |
| **R95-04** | `REPAIR_REPORT.md`, `ModalShell.tsx` | **RESOLVED** | Penambahan `aria-hidden`, koreksi nama props `ariaLabelledBy` & `closeOnBackdropClick`, koreksi narasi historis |
| **R80-10** | `scrollLockCoordinator.ts` | **PARTIAL** | `scrollLockCoordinator.test.ts` (Order 1, Order 2, Initial overflow preservation) |
| **R89-01** | `dist_old/` | **OPEN / TRACKED** | `targeted-lint.txt` (0 w/0 e pada file batch) dan `root-lint.txt` |
