# AUDIT BUGS: MODAL PORTAL, SCROLL LOCK, & GLOBAL OPERATIONAL REPORT (REFACTOR 24)

Dokumen ini mendokumentasikan temuan audit interaksi modal, *layer stacking context*, *scroll leakage*, serta cakupan aksesibilitas Bottom Sheet Laporan Operasional pada SS_PDO.

---

## DAFTAR TEMUAN AUDIT

| ID Temuan | Komponen / File Terkait | Keparahan | Status |
| :--- | :--- | :--- | :---: |
| **BUG-24-01** | `src/components/RouteOperationalReportCard.tsx`<br>`src/components/routeSelector/RouteSelectorSheet.tsx`<br>`src/index.css` | 🔴 **HIGH** (Bottom Sheet Tertutup Floating BottomNav & Tombol Aksi Terhalang) | Terselesaikan |
| **BUG-24-02** | `src/components/RouteOperationalReportCard.tsx`<br>`src/components/routeSelector/RouteSelectorSheet.tsx` | 🔴 **HIGH** (Background Scroll Leakage Saat Bottom Sheet Terbuka) | Terselesaikan |
| **UI-24-03** | `src/components/Dashboard.tsx` | 🟡 **MEDIUM** (Modal Laporan Operasional Terisolasi Hanya di Tab Input) | Terselesaikan |

---

## RINCIAN TEMUAN

### 🔴 BUG-24-01: Bottom Sheet Tertutup Floating BottomNav & Tombol Aksi Terhalang

- **ID Temuan:** `BUG-24-01`
- **Lokasi Kode:**
  - `src/components/RouteOperationalReportCard.tsx`
  - `src/components/routeSelector/RouteSelectorSheet.tsx`
  - `src/index.css`
- **Keparahan:** **HIGH** (Kerusakan Fungsionalitas Eksekusi Form)
- **Deskripsi Masalah:**
  1. Floating BottomNav (`.bottom-nav-wrapper`) memiliki posisi `fixed` dengan `z-index: 50`.
  2. Saat bottom sheet (`RouteSelectorSheet` atau `RouteOperationalReportCard`) dibuka, konten sheet tidak di-portal ke `document.body` atau terkurung dalam stacking context parent header (`z-index: 40`).
  3. Hal ini mengakibatkan pill BottomNav tetap melayang di atas bagian bawah sheet, menutupi tombol penting seperti "Muat Data" dan "Kirim Laporan Operasional".
- **Dampak ke Pengguna Lapangan (User Impact):**
  Petugas tidak dapat menekan tombol simpan/kirim laporan atau muat rute karena tombol aksi tertutup oleh bar navigasi.
- **Mitigasi:**
  - Pindahkan render modal dan sheet keluar dari stacking context lokal menggunakan `createPortal(content, document.body)` dengan `z-index: 99999`.
  - Berikan safe area padding bawah: `calc(28px + env(safe-area-inset-bottom, 16px))`.
  - Tambahkan transisi CSS reaktif di `src/index.css` di mana `.bottom-nav-wrapper` secara otomatis menghilang (`opacity: 0`, `pointer-events: none`, `transform: translateY(20px)`) saat `body[style*="overflow: hidden"]` aktif.

---

### 🔴 BUG-24-02: Background Scroll Leakage Saat Bottom Sheet Terbuka

- **ID Temuan:** `BUG-24-02`
- **Lokasi Kode:**
  - `src/components/RouteOperationalReportCard.tsx`
  - `src/components/routeSelector/RouteSelectorSheet.tsx`
- **Keparahan:** **HIGH** (Kegagalan Isolasi Interaksi Layar Sentuh Mobile)
- **Deskripsi Masalah:**
  1. Saat modal laporan operasional atau selector rute terbuka, tidak ada mekanisme penguncian scroll pada level root (`document.body`).
  2. Gerakan usap jempol pengguna pada area latar belakang atau tepi drawer tembus (*leak*) menggeser daftar kartu bus dan elemen dashboard di baliknya.
- **Dampak ke Pengguna Lapangan (User Impact):**
  Interaksi menjadi canggung, membingungkan orientasi visual, dan berisiko memicu swipe pergantian tab yang tidak diinginkan di belakang modal.
- **Mitigasi:**
  - Pasang `useEffect` body scroll lock (`document.body.style.overflow = 'hidden'`) yang aktif saat sheet terbuka dan mengembalikan overflow saat sheet tertutup/unmount.
  - Tambahkan isolasi sentuh: `touchAction: 'none'`, `stopPropagation` pada event `onTouchStart` dan `onTouchMove` di overlay, serta `overscrollBehavior: 'contain'` pada drawer.

---

### 🟡 UI-24-03: Modal Laporan Operasional Terisolasi Hanya di Tab Input

- **ID Temuan:** `UI-24-03`
- **Lokasi Kode:**
  - `src/components/Dashboard.tsx`
- **Keparahan:** **MEDIUM** (Inkonsistensi UX Antar Tab)
- **Deskripsi Masalah:**
  1. Komponen `<RouteOperationalReportCard ... />` sebelumnya dirender di dalam kontainer `<div style={{ display: mainTab === "input" ? "block" : "none" }}>`.
  2. Akibatnya, ketika pengguna berada di tab lain (`summary`, `analytics`, atau `units`), pill status laporan di header `[ ⚡ Laporan • ... ▾ ]` tetap terlihat dan dapat diklik, namun modal sheet laporan tidak pernah muncul karena elemen pembungkusnya berstatus `display: none`.
- **Dampak ke Pengguna Lapangan (User Impact):**
  Pengguna merasa tombol/pill laporan di header macet atau rusak saat diklik di halaman Ringkasan, Grafik, maupun Daftar Unit.
- **Mitigasi:**
  - Pindahkan `<RouteOperationalReportCard ... />` ke level root `Dashboard.tsx` di samping `QueueModal`, `AccumulationSheet`, dan `BottomNav`.
  - Dengan demikian, modal laporan dapat dibuka dan diisi dari semua tab dashboard dengan transisi yang seragam.
