# Laporan Perbaikan & Refactor — Refactor 143
## Fase 5: Modernisasi Antarmuka Modal Detail Armada (UnitDetailModal)

### Ringkasan Eksekutif
Refactor 143 menuntaskan **Fase 5** dari inisiatif perombakan konsep UI/UX aplikasi SS_PDO. Fokus utama fase ini adalah:
1. **Migrasi Penuh ke `ModalShell` Kanonik**: Menghilangkan duplikasi listener touch gesture DOM manual, portal tersendiri, dan handling Escape kustom pada `UnitDetailModal.tsx` dengan memanfaatkan arsitektur modal kanonik terpadu `ModalShell`.
2. **Glanceable 3-Column Metric Strip (Row 2: Akumulasi Total)**: Mengubah tampilan akumulasi total yang sebelumnya menumpuk 4 baris teks vertikal menjadi strip 3-kolom simetris (`RITASE`, `TOTAL KM`, `PELANGGAN`) yang hemat ruang vertikal hingga 40% dan terbaca seketika (*at-a-glance*).
3. **Symmetrical Shift Split (Row 1)**: Menyederhanakan kartu ringkasan Shift 1 dan Shift 2 dengan visual hierarchy yang tajam, angka hero tebal, dan micro-label yang rapi.
4. **Penyelarasan Desain & Tombol Aksi**: Menyelaraskan tombol dismiss modal dengan ukuran `34px`, border-radius `10px`, background adaptif `var(--input-bg)`, dan border `var(--card-border)`.
5. **Kamus Teks Sentral (`TEXT_UNIT_DETAIL`)**: Seluruh teks judul, tombol, micro-label, dan aria-label antarmuka dipastikan bersumber dari kamus tanpa hardcoded string.
6. **Penambahan Unit Test Otomatis**: Menyediakan pengujian otomatis komprehensif pada `src/components/__tests__/UnitDetailModal.test.tsx` (5/5 lulus 100%).

---

### Implementasi Detail & Perbandingan (Before vs After)

#### 1. Arsitektur Komponen Modal
- **Before:**
  Menggunakan `createPortal` langsung ke `document.body` dengan event listener manual (`handleTouchStart`, `handleTouchMove`, `handleTouchEnd`) yang memanipulasi CSS transform via DOM langsung (`contentRef.current.style.transform = ...`), sehingga rentan flicker dan konflik scroll-locking.
- **After:**
  Mengintegrasikan `ModalShell` kanonik yang sudah memiliki koordinasi stack modal (`modalStackCoordinator`), scroll lock terpadu (`scrollLockCoordinator`), dan navigasi tombol back Android/browser (`useMobileBackHandler`).

#### 2. Layout Akumulasi Total (Row 2)
- **Before:**
  Menumpuk 4 baris besar secara vertikal dengan ikon besar:
  - KM Total (baris 1)
  - Penumpang Total (baris 2)
  - Ritase (baris 3)
  - Tiket Manual (baris 4)
  Menghabiskan ruang vertikal yang signifikan dan memaksa pengguna mobile melakukan scrolling panjang.
- **After:**
  Mengadopsi layout eksekutif **3-Column Metric Strip**:
  - Kolom 1: `RITASE` (angka rasio PP `pergi/pulang` + badge mini capaian target).
  - Kolom 2: `TOTAL KM` (angka terformat + satuan `KM`).
  - Kolom 3: `PELANGGAN` (angka terformat + satuan `Pnp`).
  Tersaji ringkas di bagian tengah modal, memberikan ruang lapang bagi grafik tren harian dan riwayat catatan operasional.

#### 3. Shift 1 & Shift 2 Symmetrical Cards (Row 1)
- **Before:**
  Ikon `Navigation` dan `Users` berukuran 16px bertumpuk dengan teks inline tanpa micro-labels.
- **After:**
  Desain kartu simetris dengan micro-badges tanggal, font angka hero yang kontras, serta pill chip tiket manual yang compact.

---

### Case: Skenario Lapangan

#### Kasus A: Petugas Lapangan Memeriksa Target Ritase Armada di Ponsel
- **Kondisi:** Petugas operasional di pool/terminal membuka kartu detail unit armada untuk memeriksa apakah armada telah memenuhi target ritase rute harian.
- **Hasil Sebelum Refactor:** Petugas harus menggulir layar ke bawah melewati baris KM dan Penumpang untuk menemukan status target ritase.
- **Hasil Sesudah Refactor:** Pada kolom pertama 3-column glanceable strip (`RITASE`), petugas langsung melihat angka ritase `4/4` disertai badge hijau `Target Tercapai` dalam satu pandangan sekilas tanpa perlu scrolling sama sekali.

#### Kasus B: Navigasi Tombol Back Fisik pada Ponsel Android
- **Kondisi:** Pengguna membuka detail armada lalu menekan tombol *hardware back* atau melakukan gestur *swipe back* pada peranti mobile.
- **Hasil Sebelum Refactor:** Listener back navigation berada di komponen induk (`UnitSummaryDashboard`), sehingga dismiss animasi modal sering tidak sinkron dengan status closing state.
- **Hasil Sesudah Refactor:** `ModalShell` menangani `backHandlerId="unit_detail_modal"` secara terintegrasi dengan transisi fluid `cubic-bezier(0.32, 0.72, 0, 1)`, modal menutup mulus tanpa sisa layer backdrop.

---

### Status Verifikasi & Quality Gates

```bash
# 1. Menjalankan unit test khusus UnitDetailModal
pnpm vitest run src/components/__tests__/UnitDetailModal.test.tsx
# Hasil: 1 test file passed, 5 tests passed (100% LULUS)

# 2. Menjalankan seluruh test suite di repositori
pnpm vitest run src/
# Hasil: 108 test files passed, 787 tests passed (100% LULUS)

# 3. Menjalankan build TypeScript & Vite
pnpm run build
# Hasil: tsc -b && vite build selesai tanpa error (0 error)

# 4. Sinkronisasi Knowledge Graph
graphify update .
# Hasil: 5.685 nodes, 7.081 edges, 539 communities terbarukan
```
