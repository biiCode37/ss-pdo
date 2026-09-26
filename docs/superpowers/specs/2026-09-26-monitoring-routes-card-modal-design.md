# 📋 Spesifikasi Desain: Redesign Kartu Rute & Modal Detail 21 Metrik SS Global (Monitoring Wilayah)

**Tanggal Pembuatan:** 2026-09-26  
**Status:** Disetujui (Approved via Brainstorming)  
**Branch Wajib:** `devmode`  

---

## 1. Latar Belakang & Tujuan

Halaman **Monitoring Wilayah** tab **Rute** (`MonitoringRoutesTab.tsx`) berfungsi sebagai ruang kerja harian bagi Koordinator Wilayah (Korwil), Koordinator Lapangan (Korlap), dan Manajemen untuk memantau performa 18 rute mikrotrans, mengevaluasi capaian, dan melakukan verifikasi laporan harian.

Tujuan perancangan ini adalah:
1. **Penyajian Metrik Prioritas Langsung di Kartu Rute (`MonitoringRouteCardModern.tsx`)**:
   Menampilkan metrik inti operasional harian yang ringkas dan padat tanpa perlu membuka modal:
   - Armada: **Renops** (Rencana Operasi) & **Realops** (Realisasi Operasi).
   - Penumpang: **Total Pelanggan** (TOA + Tiket Manual Shift 1 & 2), rincian **TOA**, dan **Manual**.
   - Efisiensi & Produktivitas: **Kilometer per Bus (KM/Bus)** dan **Persentase Ketercapaian Pelanggan (%)**.
   - Konteks Historis: Komparasi Pelanggan **Kemarin (H-1)** dan **Minggu Lalu (H-7)**.
2. **Modal Dialog Detail Komprehensif 21 Metrik SS Global (`MonitoringRouteDetailModal.tsx`)**:
   Saat kartu rute di-tap, kartu membuka modal dialog berformat *iOS Bottom Sheet* yang menyajikan seluruh 21 metrik operasional SS Global secara terstruktur dalam 3 tab segmen (*Operasional*, *Pelanggan & Shift*, *Produktivitas & Ritase*).
3. **Ergonomi Mobile & Isolasi Interaksi**:
   - Tap kartu rute membuka modal detail.
   - Tombol verifikasi tetap tersedia langsung pada kartu rute dengan `e.stopPropagation()` agar petugas dapat memverifikasi cepat tanpa terganggu pembukaan modal.
   - Tombol navigasi lembar kerja rute individu dipindahkan ke dalam modal detail untuk menghemat ruang vertikal kartu rute.
4. **Kepatuhan Standar Sentral & Single Source of Truth**:
   - Seluruh teks antarmuka wajib merujuk ke kamus sentral `src/constants/texts/text_monitoring.ts`. Dilarang *hardcoded string*.
   - Standar terminologi: 1 Ritase = 1 Putaran Penuh (PP) = 2 Trip. `km_baku` = KM per 1 ritase PP.

---

## 2. Arsitektur Komponen & Aliran Data

### 2.1. Hirarki Komponen

```mermaid
flowchart TD
    Parent[MonitoringRoutesTab.tsx] -->|routes: RegionalRouteItem[]| Card[MonitoringRouteCardModern.tsx]
    Card -->|onCardClick: route| Parent
    Card -->|onVerify: routeId| VerifyAction[Verifikasi Cepat di Kartu]
    Parent -->|selectedRouteForModal !== null| Modal[MonitoringRouteDetailModal.tsx]
    Modal -->|onClose| CloseModal[Set selectedRouteForModal = null]
    Modal -->|onSelectRoute| NavRoute[Navigasi Lembar Kerja Rute]
    Modal -->|onVerifyRoute| VerifyModal[Verifikasi Laporan dari Modal]
```

### 2.2. Antarmuka Komponen (Props Interface)

#### A. `MonitoringRouteCardModernProps`
```typescript
export interface MonitoringRouteCardModernProps {
  route: RegionalRouteItem;
  onCardClick?: (route: RegionalRouteItem) => void;
  onVerify?: (routeId: number, status: "verified") => void;
  isVerifying?: boolean;
}
```

#### B. `MonitoringRouteDetailModalProps`
```typescript
export interface MonitoringRouteDetailModalProps {
  route: RegionalRouteItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectRoute?: (routeCode: string) => void;
  onVerifyRoute?: (routeId: number, status: "verified") => void;
  isVerifying?: boolean;
}
```

---

## 3. Desain UI/UX Kartu Rute (`MonitoringRouteCardModern.tsx`)

Kartu rute dirancang menggunakan format 3 baris terstruktur yang sangat *compact* dan nyaman untuk layar ponsel (360px–390px):

### 3.1. Baris 1: Header & Identitas
- **Kiri**:
  - Badge Kode Rute (`JAK.XX`) dengan latar aksen transparan & border tegas.
  - Nama Operator (misal: "Mikrotrans / Komilet Jaya") & Nama Korlap penanggung jawab.
- **Kanan**:
  - Provenance Badge: `Input App` (emerald) atau `Tarik Sheet` (sky blue).
  - Status Badge: `Verified` (emerald), `Submitted` (sky blue), `Draft` (amber), `Belum Diisi` (zinc).

### 3.2. Baris 2: Core Metrics 3 Kolom
Menggunakan grid 3 kolom berlatar lembut (`rgba(255, 255, 255, 0.03)`):
1. **Kolom Armada**:
   - Angka utama: `Realops / Renops` (contoh: `14 / 15`).
   - Subteks: `S1: X • S2: Y`.
2. **Kolom Pelanggan**:
   - Angka utama: `Total Pelanggan` (contoh: `2.450`).
   - Subteks: `TOA: X • Man: Y`.
3. **Kolom Efisiensi**:
   - Angka utama: `KM/Bus` (contoh: `185,4`).
   - Subteks: `Capaian: XX,X%`.

### 3.3. Baris 3: Secondary Chips & Action
- **Kiri (Chips Historis & Tren)**:
  - Chip H-1 (Kemarin): `H-1: 2.310` (dengan indikator tren panah naik/turun tipis).
  - Chip H-7 (Minggu Lalu): `H-7: 2.150`.
- **Kanan (Aksi Cepat)**:
  - Tombol **Verifikasi** (hijau emerald dengan ikon Check) hanya muncul jika `route.status === 'submitted'`.
  - Event `onClick` pada tombol ini dilengkapi `e.stopPropagation()` agar tidak memicu pembukaan modal detail.
  - Ikon chevron tipis di sudut kartu sebagai petunjuk visual bahwa kartu dapat di-tap (*clickable affordance*).

---

## 4. Desain UI/UX Modal Detail 21 Metrik (`MonitoringRouteDetailModal.tsx`)

### 4.1. Shell Modal & Interaksi
- **Format:** iOS Bottom Sheet Modal yang muncul dari bawah layar dengan kurva pegas `cubic-bezier(0.32, 0.72, 0, 1)`.
- **Drag Handle:** Kapsul abu-abu di bagian atas untuk indikasi *bottom sheet*.
- **Backdrop:** Efek blur gelap (`rgba(0, 0, 0, 0.65)` dengan `backdrop-filter: blur(8px)`).
- **Responsive:** Di layar desktop, bottom sheet menyesuaikan menjadi dialog terpusat (`max-width: 520px`).

### 4.2. Header Modal
- Badge Rute besar, Nama Rute/Lintasan lengkap, Nama Operator, dan Nama Korlap.
- Status Badge laporan rute saat ini.
- Tombol Tutup (X) di sudut kanan atas.

### 4.3. Navigasi Segmented Tabs (3 Tab)
Menggunakan tab segmen bergaya iOS:
1. **Tab 1: Operasional**
   - Rencana Operasi (Renops) & Realisasi Operasi (Realops).
   - Rasio Kesiapan Armada (`Realops / Renops * 100%`).
   - Total KM Tempuh Rute.
   - Rata-rata KM per Bus (`KILOMETER / BUS`).
   - Target Pelanggan per KM (`TARGET PELANGGAN / KM`).
   - Pelanggan per KM Riil (`PELANGGAN / KM`).
   - Ketercapaian Pelanggan per KM (`PERSENTASE PELANGGAN / KM`).
2. **Tab 2: Pelanggan & Shift**
   - Total Pelanggan (Akumulasi TOA + Tiket Manual Shift 1 & 2).
   - Target Pelanggan & Persentase Capaian Target (`PERSENTASE PELANGGAN`).
   - Rincian Shift 1: TOA Shift 1, Tiket Manual Shift 1, Total Shift 1.
   - Rincian Shift 2: TOA Shift 2, Tiket Manual Shift 2, Total Shift 2.
   - Perbandingan Historis: Pelanggan Kemarin (H-1) & Minggu Lalu (H-7) beserta selisih (+/-).
3. **Tab 3: Produktivitas & Ritase**
   - Total Ritase PP (`totalRitasePp = (tripPergi + tripPulang) / 2`).
   - Nilai KM Baku Rute per 1 Ritase PP.
   - Rata-rata Ritase per Bus (`RITASE / BUS`).
   - Rata-rata Pelanggan per Bus (`PELANGGAN / BUS`).
   - Beban Ritase Shift 1 vs Shift 2.

### 4.4. Sticky Footer Action Bar
- Tombol **"Buka Lembar Kerja Rute"**: Membuka lembar kerja Google Sheets / tampilan input bus rute terkait (`onSelectRoute`).
- Tombol **"Verifikasi Rute"**: Muncul jika status `submitted`, memungkinkan verifikasi langsung dari dalam modal.
- Tombol **"Tutup"**: Menutup modal dialog.

---

## 5. Standar Kamus Teks Sentral (`src/constants/texts/text_monitoring.ts`)

Seluruh teks baru wajib didaftarkan pada modul `TEXT_MONITORING`:

```typescript
export const TEXT_MONITORING = {
  // ... token eksisting ...
  ROUTE_CARD: {
    // ... token eksisting ...
    LBL_CORE_FLEET: "Armada",
    LBL_CORE_PASSENGERS: "Pelanggan",
    LBL_CORE_KM: "KM Tempuh",
    RENOPS_PREFIX: "Ren:",
    REALOPS_PREFIX: "Real:",
    PAX_TOTAL_PREFIX: "Total:",
    PAX_TOA_PREFIX: "TOA:",
    PAX_MANUAL_PREFIX: "Man:",
    KM_PER_BUS_PREFIX: "KM/Bus:",
    PCT_PAX_PREFIX: "Cap:",
    PAX_YESTERDAY_PREFIX: "H-1:",
    PAX_LAST_WEEK_PREFIX: "H-7:",
    ARIA_CARD_CLICK: (code: string) => `Buka detail operasional rute ${code}`,
  },
  ROUTE_DETAIL_MODAL: {
    TITLE: (code: string) => `Detail Operasional Rute ${code}`,
    SUBTITLE: (name: string, spv: string) => `${name} • Korlap: ${spv}`,
    TABS: {
      OPERASIONAL: "Operasional",
      SHIFT: "Pelanggan & Shift",
      PRODUKTIVITAS: "Produktivitas & Rit",
    },
    METRICS: {
      RENOPS: "Rencana Operasi (Renops)",
      REALOPS: "Realisasi Operasi (Realops)",
      FLEET_RATIO: "Kesiapan Armada",
      KM_TEMPUH: "Total Jarak Tempuh",
      KM_BUS: "Kilometer per Bus",
      TARGET_PELANGGAN_KM: "Target Pelanggan / KM",
      PELANGGAN_KM: "Pelanggan / KM Riil",
      PERSEN_PELANGGAN_KM: "Capaian Pelanggan / KM",
      TOTAL_PELANGGAN: "Total Pelanggan",
      TARGET_PELANGGAN: "Target Pelanggan",
      PERSEN_PELANGGAN: "Ketercapaian Pelanggan",
      SHIFT_1_HEADER: "Rincian Shift 1 (Pagi)",
      SHIFT_2_HEADER: "Rincian Shift 2 (Siang/Sore)",
      TOA_LABEL: "TOA (Tap on Bus)",
      MANUAL_LABEL: "Tiket Manual",
      TOTAL_SHIFT_LABEL: "Total Shift",
      HISTORICAL_HEADER: "Komparasi Historis",
      PAX_YESTERDAY: "Pelanggan Kemarin (H-1)",
      PAX_LAST_WEEK: "Pelanggan Minggu Lalu (H-7)",
      TOTAL_RITASE_PP: "Total Ritase (PP)",
      KM_BAKU: "KM Baku (per 1 Rit PP)",
      RITASE_BUS: "Ritase per Bus",
      PELANGGAN_BUS: "Pelanggan per Bus",
      UNIT_BUS: "Bus",
      UNIT_KM: "KM",
      UNIT_PAX: "Org",
      UNIT_RIT: "Rit",
    },
    ACTIONS: {
      BTN_OPEN_SHEET: "Buka Lembar Kerja Rute",
      BTN_VERIFY: "Verifikasi Rute",
      BTN_CLOSE: "Tutup",
    },
  },
} as const;
```

---

## 6. Rencana Pengujian (Testing Strategy)

1. **Uji Kamus Teks (`src/constants/texts/texts.test.ts`)**:
   - Memvalidasi seluruh kunci baru pada `TEXT_MONITORING.ROUTE_CARD` dan `TEXT_MONITORING.ROUTE_DETAIL_MODAL` terisi string valid dan fungsi template bekerja dengan benar.
2. **Uji Komponen Kartu Rute (`MonitoringRouteCardModern.test.tsx`)**:
   - Memverifikasi render seluruh nilai prioritas: Renops, Realops, Total Pelanggan, TOA, Manual, KM/Bus, %, Pelanggan H-1, dan Pelanggan H-7.
   - Memverifikasi bahwa klik pada area kartu memicu `onCardClick(route)`.
   - Memverifikasi bahwa klik pada tombol Verifikasi memicu `onVerify(id, 'verified')` dan `e.stopPropagation()` mencegah `onCardClick` terpanggil.
3. **Uji Komponen Modal Detail (`MonitoringRouteDetailModal.test.tsx`)**:
   - Memverifikasi modal tidak me-render elemen saat `isOpen === false`.
   - Memverifikasi render 21 metrik pada ketiga tab segmen (Operasional, Pelanggan & Shift, Produktivitas & Ritase).
   - Memverifikasi pergantian tab saat tab segmen di-tap.
   - Memverifikasi tombol Buka Lembar Kerja memanggil `onSelectRoute(routeCode)`.
   - Memverifikasi tombol Verifikasi di modal memanggil `onVerifyRoute(id, 'verified')`.
   - Memverifikasi tombol Tutup dan klik backdrop memanggil `onClose()`.
4. **Quality Gates Otomatis**:
   - `pnpm vitest run src/` ➔ Lulus 100%.
   - `pnpm run build` ➔ Bebas error TypeScript (`tsc -b`) dan build Vite sukses.
   - `graphify update .` ➔ Update graf pengetahuan.
