# Design Specification: Halaman Ringkasan Per Unit (Read-Only Unit Dashboard)

## Goal & Purpose
Menambahkan halaman navigasi baru **"Per Unit"** pada aplikasi SS_PDO untuk memberikan analisis rekapitulasi data armada secara *read-only* per unit/armada (contoh: `JAK.115-01` atau `SAF-001`). 

Halaman ini bertujuan memudahkan petugas operasional & pengawas rute dalam memantau performa 1 unit spesifik selama sebulan penuh tanpa terganggu oleh form penginputan data.

---

## System Architecture & User Flow

### 1. Navigasi Utamanya (`BottomNav.tsx`)
- Menambahkan tab navigasi ke-3: **"Per Unit"** (Icon `Bus` / `Truck`).
- State navigasi utama (`mainTab`): `"input"` | `"analytics"` | `"units"`.

```
BottomNav: [ Input Data ] | [ Analitik Rute ] | [ Per Unit ]
```

---

### 2. Tampilan Halaman Utama "Per Unit" (`UnitSummaryDashboard.tsx`)
- **Header & Search Controls:**
  - Search Input untuk memfilter berdasarkan Nomor Body Unit.
  - Quick Category Filter / Status Indicator (misal: Unit Aktif / Lengkap / Perlu Perhatian).
- **Armada Grid Cards (`UnitCard`):**
  - Kartu ringkas berukuran sedang untuk setiap bus yang ditemukan di sheet aktif.
  - Menampilkan:
    - No. Body Unit (contoh: `SAF-001`)
    - Indikator Status Harian (🟢 Operasional / 🔴 Off / 🟡 Parsial)
    - Total TOA Penumpang Bulan Ini (Shift 1 + Shift 2)
    - Total KM Bulan Ini
    - Jumlah Hari Beroperasi

---

### 3. Tampilan Modal Detail Armada (`UnitDetailModal.tsx`)
Ketika salah satu Kartu Unit di-tap, akan muncul **iOS-Style Expandable Bottom Sheet Modal (90% Height dengan Drag Handle & Backdrop Overlay)**:

- **Section 1: Header & Profile Unit**
  - Nomor Body Armada + Tombol Tutup (X) / Gesture Swipe Down to Dismiss.
  - Ringkasan Hari Beroperasi & Rata-rata Penumpang/Hari.
- **Section 2: Executive Summary KPI Cards (4 Cards Grid)**
  - Total Penumpang TOA Shift 1
  - Total Penumpang TOA Shift 2
  - Akumulasi KM Shift 1
  - Akumulasi KM Shift 2
- **Section 3: Grafik Tren TOA 31 Hari Khusus Unit tersebut**
  - Mini Bar Chart interaktif 31 hari khusus data armada yang dipilih.
  - Membantu pengawas melihat pola keramaian unit tersebut dari tanggal 1 hingga 31.
- **Section 4: Riwayat Catatan / Keterangan Operasional**
  - Timeline histori seluruh catatan/keterangan yang pernah diinput untuk unit tersebut pada sheet bulan berjalan.

---

## Data Layer & Calculation Logic (`unitAnalytics.ts`)

- **Fungsi `extractUnitData(busData: BusData[], targetUnit: string)`:**
  - Memfilter data dari `busData` untuk unit tertentu.
  - Mengkalkulasi total TOA Shift 1, TOA Shift 2, Total TOA, KM Awal & Akhir Shift 1, KM Awal & Akhir Shift 2, serta riwayat catatan.
- **Data Source:** Menumpu sepenuhnya pada state `busData` dari Google Sheets/Supabase cache yang sudah ada (SSOT - Single Source of Truth).
- **Read-Only Guarantee:** Komponen ini murni presentasional dan tidak memiliki tombol simpan atau handler mutasi data.

---

## UI/UX Standards & Aesthetics (iOS Style)

- **Colors:** Modern HSL Dark/Light themes (`var(--surface-color)`, `var(--accent-color)`).
- **Transitions:** iOS Spring Curve `cubic-bezier(0.32, 0.72, 0, 1)` untuk kemunculan Bottom Sheet Modal.
- **Touch Targets:** Minimum 44px touch area untuk kartu & tombol tutup.

---

## Verification Plan

1. **Unit Tests:**
   - Test kalkulasi `extractUnitData` dengan data sampel multi-shift.
   - Test pencarian & filter unit di `UnitSummaryDashboard.test.tsx`.
2. **Build Verification:**
   - `pnpm run build` bebas dari type errors TypeScript.
3. **Manual Verification:**
   - Verifikasi pembukaan Modal 90% Height saat kartu unit di-tap.
   - Verifikasi gesture swipe down & tombol X untuk menutup modal.
