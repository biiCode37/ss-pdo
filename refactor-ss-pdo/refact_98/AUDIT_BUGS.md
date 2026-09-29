# Audit Kualitas & Tracking Bug — Fase 2, Batch 2.3 Revisi Akhir (`refact_98`)

Dokumen ini merangkum audit temuan Codex dari `refact_97/AUDIT_BUGS.md` (R97-01, R97-02, R97-03) serta status penanganannya pada implementasi `refact_98`. Seluruh pengerjaan dilakukan secara terisolasi pada branch `devmode` tanpa mengubah arsip `refact_1` hingga `refact_97` maupun `dist_old/`.

---

## 1. Temuan Aktif & Mitigasi

### R97-01 — Pendaftaran Ulang Callback Mengubah Stack Tanpa Mengubah Lapisan Visual

- **ID Temuan:** R97-01
- **Lokasi Kode:** 
  - `src/components/ui/ModalShell.tsx` (efek registrasi keyboard sebelumnya bergantung pada `onClose`)
  - `src/utils/modalStackCoordinator.ts` (`registerModalDismiss` sebelumnya selalu melakukan `.push()` baru ke stack)
  - `src/components/dashboard/QueueReportIntegration.test.tsx` (pengujian alur realistis re-render parent dengan inline arrow function)
- **Keparahan:** Tinggi
- **Deskripsi:** 
  Ketika modal bawah (`QueueModal`, zIndex 100) sudah terbuka dan modal atas (`ReportModalLayout`, zIndex 99999) dibuka, parent (`Dashboard.tsx`) merender ulang dan menghasilkan callback `onClose` baru berupa arrow function inline (`onClose={() => ...}`). Pada implementasi sebelumnya, efek keyboard di `ModalShell.tsx` menyertakan `onClose` di dependency array. Akibatnya, `QueueModal` yang berada di posisi akhir pohon JSX melepas dan mendaftarkan ulang listener-nya ke `modalStackCoordinator`. Hal ini menyebabkan `QueueModal` didorong ke posisi puncak stack LIFO (`activeModalStack`), padahal secara visual `ReportModalLayout` berada di atasnya dengan zIndex 99999. Dampaknya, penekanan tombol Escape menutup `QueueModal` di belakang, sedangkan tombol Android Hardware Back menutup `ReportModalLayout`, menciptakan inkonsistensi fatal antara visual, Escape, dan Back.
- **Dampak User:** 
  Petugas operasional yang membuka formulir laporan di atas antrean offline melihat laporan di depan mata, namun saat menekan tombol Escape (atau tombol fisik keyboard), dialog antrean di belakang tiba-tiba menghilang/tertutup sementara dialog laporan tetap terbuka di depan. Perilaku tombol Escape dan tombol Back menjadi berbeda.
- **Mitigasi:**
  1. Di `ModalShell.tsx`, pisahkan callback `onClose` ke dalam `useRef(onClose)` (`onCloseRef`) yang diperbarui pada `useLayoutEffect` setiap render tanpa merender ulang komponen.
  2. Hapus dependensi `onClose` dari dependency array efek registrasi modal (`useLayoutEffect(..., [isOpen, id, baseZIndex, closeOnEscape])`).
  3. Handler tombol Escape dan Android Back selalu mengeksekusi `onCloseRef.current()`, menjamin pemanggilan fungsi terbaru dari render terakhir parent.
  4. Di `modalStackCoordinator.ts`, buat fungsi `registerModalDismiss` menjadi idempoten secara posisi: jika ID modal sudah terdaftar di stack aktif, pemanggilan registrasi ulang akan memperbarui entri secara *in-place* tanpa mengubah urutan stack LIFO.
  5. Menambahkan rangkaian pengujian integrasi bertahap (*staggered 2-render flow*):
     - Order 1: Queue buka (render 1) ➔ parent re-render dengan callback baru & Report buka (render 2) ➔ Escape dan Back terbukti hanya menutup Report terlebih dahulu, baru kemudian Queue pada penekanan kedua.
     - Order 2: Report buka (render 1) ➔ parent re-render dengan callback baru & Queue buka (render 2) ➔ Escape dan Back terbukti hanya menutup Queue terlebih dahulu.

---

### R97-02 — Kalkulasi Z-Index Memakai Ref Saat Render dan Memunculkan Peringatan Baru

- **ID Temuan:** R97-02
- **Lokasi Kode:** 
  - `src/components/ui/ModalShell.tsx` (sebelumnya membaca dan memutasi `assignedZIndexRef.current` di render body)
  - `refactor-ss-pdo/refact_96/evidence/targeted-lint.txt` (7 peringatan `react(refs)` dari oxlint)
- **Keparahan:** Sedang
- **Deskripsi:** 
  Pada `refact_96`, `assignedZIndexRef.current` dibaca dan dimutasi langsung di badan fungsi render komponen `ModalShell` untuk mengunci z-index. Pola ini melanggar aturan reaktif React Compiler (`react(refs)`: *Cannot access refs during render* / *Cannot update ref value during render*), menyebabkan React Compiler melewatkan optimasi komponen, serta berisiko terhadap ketidakteraturan lapisan visual ketika dua modal dibuka secara serentak sebelum effect selesai berjalan.
- **Dampak User:** 
  Lapisan visual berpotensi tidak sinkron pada skenario transisi render konkuren React 19, serta meningkatkan utang teknis dan risiko regresi rendering dialog modal.
- **Mitigasi:**
  1. Hapus total pembacaan dan penulisan ref pada fase render komponen di `ModalShell.tsx`.
  2. Gunakan `backdropRef` (`ref<HTMLDivElement>`) dan terapkan nilai z-index yang dialokasikan koordinator langsung ke style DOM elemen backdrop (`backdropRef.current.style.zIndex`) pada `useLayoutEffect`.
  3. Nilai dasar awal z-index diberikan melalui inline style bawaan (`baseZIndex`), dan secara deterministik dinaikkan (`highestActiveZ + 10`) saat modal dibuka di atas modal lain yang sudah aktif.
  4. Seluruh 7 peringatan `react(refs)` berhasil dieliminasi (0 warnings di `ModalShell.tsx`).
  5. Ditambahkan pengujian pembukaan serentak (*simultaneous*), pembukaan bertahap (*staggered*), dan re-render berulang tanpa perubahan urutan modal.

---

### R97-03 — Hasil Lint Dilaporkan Terlalu Bersih

- **ID Temuan:** R97-03
- **Lokasi Kode:** 
  - `refactor-ss-pdo/refact_96/REPAIR_REPORT.md` (klaim bahwa file baru/dimodifikasi bebas dari peringatan baru)
  - `refactor-ss-pdo/refact_96/evidence/targeted-lint.txt` (terdapat 11 warnings)
- **Keparahan:** Rendah
- **Deskripsi:** 
  Dokumen `refact_96` menyatakan targeted lint lulus bersih tanpa membedakan secara transparan bahwa terdapat 7 peringatan baru `react(refs)` di `ModalShell.tsx` dan 4 peringatan historis `_err` di `historyNavigation.ts`.
- **Dampak User:** 
  Laporan teknis kurang akurat dalam memotret status kebersihan kode dan kepatuhan terhadap linter.
- **Mitigasi:**
  1. Mengeliminasi 100% peringatan baru pada `ModalShell.tsx` sehingga kini menghasilkan **0 warnings, 0 errors** di bawah `oxlint` (116 rules).
  2. Melaporkan hitungan lint secara transparan: Dari 12 file targeted Batch 2.3, terdapat tepat 4 peringatan historis (seluruhnya merupakan unused catch param `_err` di `src/utils/historyNavigation.ts:79, 94, 113, 129` yang berasal dari implementasi lawas), sedangkan seluruh 11 file lainnya (termasuk `ModalShell.tsx`, `modalStackCoordinator.ts`, dan seluruh tes) **100% bebas dari peringatan (0 warnings)**.

---

## 2. Status Temuan Terbuka & Parsial Lainnya

### R80-10 — Koordinasi Global Scroll Lock (Status: PARTIAL)
- **Status:** **PARTIAL** (Tetap dipertahankan statusnya sesuai batasan pilot).
- **Keterangan:** Pilot Batch 2.3 (`QueueModal` dan `ReportModalLayout`) telah 100% menggunakan `scrollLockCoordinator` via `ModalShell`. Modul modal lain di luar cakupan Batch 2.3 (seperti `BusInputModal` dan `UnitDetailModal`) masih memanipulasi `document.body.style.overflow` langsung dan akan dimigrasikan secara bertahap pada batch/fase berikutnya.

### R89-01 — Direktori Arsip Build Lama (Status: OPEN)
- **Status:** **OPEN** (Sesuai instruksi Codex & Owner).
- **Keterangan:** Direktori `dist_old/` sengaja dipertahankan di working tree. Scanner root oxlint memindai artefak minified lama ini (~1.913 warnings noise). File produksi dan pengujian pada `src/` terbukti bersih dan stabil.
