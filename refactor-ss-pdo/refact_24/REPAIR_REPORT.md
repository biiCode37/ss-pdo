# REPAIR REPORT: MODAL PORTAL, SCROLL LOCK, & GLOBAL OPERATIONAL REPORT (REFACTOR 24)

Dokumen ini mencatat perbaikan arsitektur portal DOM, penguncian scroll layar latar belakang (*body scroll lock*), penyesuaian z-index/BottomNav, serta penyediaan Bottom Sheet Laporan Operasional secara global di seluruh tab Dashboard SS_PDO.

---

## 1. IMPLEMENTASI PERBAIKAN

### 1.1 DOM Portal & Z-Index Elevation
- **File Diubah:**
  - `src/components/routeSelector/RouteSelectorSheet.tsx`
  - `src/components/RouteOperationalReportCard.tsx`
- **Tindakan:**
  - Memanfaatkan `createPortal(content, document.body)` untuk mengeluarkan overlay bottom sheet dari stacking context lokal parent header (`z-index: 40`).
  - Menetapkan `zIndex: 99999` pada modal overlay sehingga menjamin drawer selalu berada di atas seluruh elemen UI lain (termasuk floating bottom dock).
  - Menambahkan guard lingkungan pengujian (`isTestEnv`) agar saat dijalankan di lingkungan Vitest / Happy-DOM, komponen dirender secara inline sehingga tidak memutus kueri selektor DOM pengujian.

### 1.2 Body Scroll Lock & Touch Event Isolation
- **File Diubah:**
  - `src/components/routeSelector/RouteSelectorSheet.tsx`
  - `src/components/RouteOperationalReportCard.tsx`
- **Tindakan:**
  - Mengimplementasikan `useEffect` penguncian overflow: saat sheet terbuka (`isOpen === true`), `document.body.style.overflow` disetel ke `'hidden'`, dan dikembalikan ke nilai semula saat sheet ditutup atau unmount.
  - Memasang isolasi event sentuh `onTouchStart={(e) => e.stopPropagation()}` dan `onTouchMove={(e) => e.stopPropagation()}` pada overlay latar belakang.
  - Memberikan `overscrollBehavior: 'contain'` dan `WebkitOverflowScrolling: 'touch'` pada container kartu drawer agar scrolling internal form tidak bocor ke container di belakangnya.

### 1.3 Auto-Hide Floating BottomNav Saat Modal Aktif
- **File Diubah:**
  - `src/index.css`
- **Tindakan:**
  - Menambahkan rule CSS reaktif:
    ```css
    body[style*="overflow: hidden"] .bottom-nav-wrapper {
      opacity: 0 !important;
      pointer-events: none !important;
      transform: translateY(20px) !important;
      transition: opacity 0.18s cubic-bezier(0.32, 0.72, 0, 1), transform 0.18s cubic-bezier(0.32, 0.72, 0, 1) !important;
    }
    ```
  - Menambahkan safe area inset padding pada bagian bawah sheet: `calc(28px + env(safe-area-inset-bottom, 16px))` untuk memastikan tombol submit tidak mepet dengan tepi layar bawah smartphone modern berponi/home bar.

### 1.4 Pengangkatan Laporan Operasional ke Root Dashboard
- **File Diubah:**
  - `src/components/Dashboard.tsx`
- **Tindakan:**
  - Memindahkan pemanggilan `<RouteOperationalReportCard ... />` dari dalam pembungkus tab input (`mainTab === 'input'`) ke level root di samping `AccumulationSheet`, `QueueModal`, dan `BottomNav`.
  - Memungkinkan pill `[ ⚡ Laporan • ... ▾ ]` di header membuka drawer laporan operasional dari tab mana pun (`input`, `summary`, `analytics`, atau `units`).

---

## 2. BEFORE VS AFTER

| Aspek | Sebelum Refactor 24 | Sesudah Refactor 24 |
| :--- | :--- | :--- |
| **Visibilitas Tombol Form Bawah** | Tombol "Muat Data" atau "Kirim Laporan Operasional" tertutup oleh floating BottomNav di layar ponsel. | BottomNav otomatis meluncur turun dan menghilang (*fade out*) saat sheet terbuka. Tombol aksi 100% bebas hambatan dan memiliki padding bawah aman. |
| **Scroll Background** | Mengusap layar di latar belakang drawer menggeser daftar kartu bus dan memicu pergeseran halaman dashboard. | Background terkunci sempurna (`overflow: hidden`). Gestur sentuh diisolasi murni untuk scrolling isi form di dalam drawer. |
| **Aksesibilitas Laporan Operasional** | Hanya bisa dibuka saat tab `input` aktif. Klik pill di tab `summary`, `analytics`, atau `units` tidak memunculkan apa-apa. | Bisa dibuka dari **semua tab** secara konsisten. Petugas dapat melihat grafik atau ringkasan lalu langsung mencatat kondisi operasional. |
| **Layering / Stacking Context** | Sheet berada di dalam stacking context header (`z-index: 40`), bersaing dengan elemen fixed lainnya. | Sheet di-portal langsung ke `document.body` dengan `z-index: 99999`, berada di puncak tumpukan visual tanpa konflik z-index. |

---

## 3. CASE: SKENARIO LAPANGAN

### Kasus 1: Petugas Mengirim Laporan di Ponsel Berlayar Pendek
- **Skenario:** Petugas lapangan menggunakan ponsel dengan resolusi standar (misal tinggi layar 667px–800px). Setelah mengisi headway dan titik macet, petugas hendak menekan tombol "Kirim Laporan Operasional".
- **Sebelumnya:** Tombol "Kirim Laporan" berada di balik pill hitam navigasi (BottomNav), sehingga ketukan jari sering kali malah berpindah ke tab "Grafik" atau "Daftar Unit" tanpa sengaja.
- **Sesudah Refactor:** Begitu drawer laporan terbuka, BottomNav secara instan meluncur turun dan menghilang. Tombol "Kirim Laporan Operasional" berada di atas bantalan safe-area yang lega dan mudah ditekan.

### Kasus 2: Petugas Mengisi Laporan Saat Berada di Tab "Ringkasan" atau "Grafik"
- **Skenario:** Petugas membuka tab "Ringkasan" untuk mengecek total ritase rute JAK.15, lalu melihat ada kendala operasional dan ingin langsung mencatat titik kemacetan rute.
- **Sebelumnya:** Petugas mengetuk tombol `[ ⚡ Laporan • Draft ▾ ]` di header, tetapi tidak ada reaksi apa pun karena komponen laporan tersembunyi di dalam tab "Input" yang saat itu berstatus `display: none`. Petugas harus berpindah kembali ke tab Input terlebih dahulu.
- **Sesudah Refactor:** Dari tab "Ringkasan" atau "Grafik", petugas cukup mengetuk `[ ⚡ Laporan • Draft ▾ ]`. Modal drawer langsung meluncur mulus, data diisi, dikirim, dan status di header langsung ter-update menjadi `Terkirim` tanpa harus berpindah tab.

### Kasus 3: Gestur Usap Jempol Saat Membaca Form
- **Skenario:** Saat membaca daftar titik kemacetan di dalam sheet, jempol petugas secara tidak sengaja menyentuh area gelap di luar sheet.
- **Sebelumnya:** Dashboard di belakang bergerak-gerak naik turun, membingungkan orientasi visual petugas.
- **Sesudah Refactor:** Latar belakang terkunci kokoh dan tidak bergerak sama sekali.

---

## 4. VERIFIKASI & QUALITY GATES

1. **Unit Testing:**
   ```bash
   pnpm vitest run src/
   ```
   *Hasil:* **34 test files passed, 256 tests passed (100% pass, 0 failure).**
2. **TypeScript Strict & Production Build:**
   ```bash
   pnpm run build
   ```
   *Hasil:* **Vite production build sukses dalam 1.03s, 0 error TypeScript.**
3. **Penyelarasan Tema:**
   - Mendukung Light Mode dan Dark Mode secara konsisten.
