# Spesifikasi Desain: Kamus Teks Antarmuka Terpusat (Centralized UI Text Dictionary)

- **Tanggal:** 2026-09-08
- **Status:** Approved by User
- **Branch:** `devmode`
- **Konvensi Prefix File:** `text_`
- **Lokasi Modul:** `src/constants/texts/`

---

## 1. Latar Belakang & Tujuan

Saat ini seluruh teks yang tampil di hadapan pengguna (label tombol, judul kartu, pesan konfirmasi SweetAlert2, notifikasi toast, badge status, dan pesan error) masih tersebar dan di-hardcode (*inline string literals*) di dalam puluhan berkas komponen JSX dan utilitas.

### Masalah yang Dihadapi:
1. **Risiko Ketidakkonsistenan Istilah:** Istilah operasional Transjakarta (seperti *"Pelanggan"* vs *"Penumpang"*, *"Pramudi"* vs *"Driver"*) berpotensi berbeda antar layar.
2. **Kesulitan Revisi Copywriting:** Jika pimpinan atau operasional meminta perubahan redaksi kalimat pada laporan atau peringatan, developer harus menelusuri puluhan file komponen secara manual.
3. **Penyaringan Pesan Teknis:** Mengumpulkan pesan kesalahan ke satu wadah memastikan tidak ada pesan error teknis database/jaringan mentah yang bocor ke hadapan pengguna operasional lapangan.

### Sasaran (Goals):
1. Mengumpulkan **SELURUH jenis teks aplikasi** ke dalam kamus variabel terpusat berbasis TypeScript murni (`as const`).
2. Menerapkan konvensi prefix wajib `text_` pada setiap nama berkas kamus per modul.
3. Menjamin *Zero-Breakage*: Seluruh pengujian otomatis (**31 test files, 237 tests**) tetap lulus 100% dan *typecheck strict mode* (`tsc -b`) lulus 0 error.

---

## 2. Struktur Modul & Dekomposisi Berkas (`src/constants/texts/`)

Seluruh berkas kamus teks ditempatkan di bawah folder `src/constants/texts/`:

| Nama Berkas | Domain Tanggung Jawab | Objek Ekspor |
| :--- | :--- | :--- |
| `text_common.ts` | Aksi tombol global, status koneksi/sinkronisasi, navigasi tanggal | `TEXT_COMMON` |
| `text_auth.ts` | Teks autentikasi Google, verifikasi izin akun, sesi kedaluwarsa | `TEXT_AUTH` |
| `text_dashboard.ts` | Header PUSM, Route Selector, kartu unit bus, navigasi bawah (BottomNav) | `TEXT_DASHBOARD` |
| `text_pdo_form.ts` | Form input operasional rute PDO (Renops, Realops, shift, headway, macet) | `TEXT_PDO_FORM` |
| `text_monitoring.ts` | Dashboard monitoring 18 rute wilayah utara, kartu KPI, bilah kesiapan, tab Korlap | `TEXT_MONITORING` |
| `text_wa_report.ts` | Modal generator pesan WhatsApp, selektor format 1 & 2, template laporan baku | `TEXT_WA_REPORT` |
| `text_alerts.ts` | Dialog konfirmasi SweetAlert2, toast notifikasi sukses/peringatan/info | `TEXT_ALERTS` |
| `text_errors.ts` | Pesan error ramah pengguna (user-friendly non-technical error catalog) | `TEXT_ERRORS` |
| `index.ts` | *Single entry point barrel export* untuk seluruh kamus teks di atas | `export * from './...'` |

---

## 3. Desain Teknis & Tipe Data TypeScript

### 3.1. Teks Statis (`as const`)
Menggunakan literal objek bersarang yang dibungkus `as const` untuk mencegah mutasi saat runtime dan memberikan autocompletion 100% presisi di IDE:

```typescript
export const TEXT_COMMON = {
  BUTTONS: {
    SAVE: 'Simpan',
    CANCEL: 'Batal',
    CLOSE: 'Tutup',
    RETRY: 'Coba Lagi',
    REFRESH: 'Perbarui Data',
    BACK_TO_ROUTE: 'Operasi Rute',
    COPY_TEXT: 'Salin Teks',
    OPEN_WA: 'Buka WhatsApp',
    VERIFY: 'Verifikasi',
  },
  STATUS: {
    ONLINE: 'Online',
    OFFLINE_BANNER: '⚠️ Koneksi Terputus - Mode Offline Aktif',
    LOADING: 'Memuat data...',
    SAVING: 'Menyimpan data...',
  },
  NAV: {
    PREV_DAY: 'Hari Sebelumnya',
    NEXT_DAY: 'Hari Berikutnya',
  }
} as const;
```

### 3.2. Teks Dinamis (Interpolasi Ber-tipe Ketat)
Teks yang membutuhkan variabel dinamis (angka, tanggal, nama rute) dibuat sebagai fungsi murni ber-parameter eksplisit:

```typescript
export const TEXT_MONITORING = {
  HEADER: {
    TITLE: 'Monitoring Wilayah Utara',
    SUBTITLE: 'Dashboard All Route & Rekapitulasi Harian Transjakarta',
  },
  READINESS: {
    LABEL: 'Status Kelengkapan Laporan PDO Wilayah:',
    SUMMARY: (submitted: number, total: number, pct: number) =>
      `${submitted} / ${total} Rute Siap (${pct}%)`,
  },
  KPI: {
    FLEET_LABEL: 'Armada Wilayah',
    FLEET_BREAKDOWN: (s1: number, s2: number) => `S1: ${s1} | S2: ${s2}`,
    PASSENGER_LABEL: 'Total Pelanggan',
    KM_LABEL: 'Total Jarak Tempuh',
    KM_AVG: (avg: string) => `Rerata / Bus: ${avg} km`,
  },
  BADGES: {
    VERIFIED: 'Verified',
    SUBMITTED: 'Submitted',
    DRAFT: 'Draft',
    EMPTY: 'Belum Diisi',
  },
} as const;
```

---

## 4. Strategi Migrasi Bertahap (Zero-Regression Strategy)

Migrasi dieksekusi dalam urutan logis berpasangan dengan unit test:

1. **Fase 1: Scaffolding & Verifikasi Kamus Fondasi**
   - Buat folder `src/constants/texts/` beserta 8 file `text_*.ts` dan `index.ts`.
   - Buat unit test `src/constants/texts/texts.test.ts` untuk memvalidasi struktur key dan fungsi interpolasi.
2. **Fase 2: Migrasi Monitoring Wilayah & Generator WA**
   - File target: `AllRouteMonitoringPage.tsx`, `WaReportModal.tsx`, `waReportGenerator.ts`.
   - Verifikasi unit test: `AllRouteMonitoringPage.test.tsx`, `WaReportModal.test.tsx`, `waReportGenerator.test.ts`.
3. **Fase 3: Migrasi Form Operasional PDO**
   - File target: `RouteOperationalReportCard.tsx`.
   - Verifikasi unit test: `RouteOperationalReportCard.test.tsx`.
4. **Fase 4: Migrasi Alerts & Error Formatter**
   - File target: `alertUtils.ts`, `errorFormatter.ts`, `QueueModal.tsx`.
   - Verifikasi unit test: `alertUtils.test.ts`.
5. **Fase 5: Migrasi Dashboard Utama, Navigasi, & Auth**
   - File target: `Dashboard.tsx`, `RouteSelectorCard.tsx`, `BottomNav.tsx`, `ProfileMenuSheet.tsx`, `LoginScreen.tsx`.
   - Verifikasi seluruh test suite: `pnpm vitest run src/`.
6. **Fase 6: Quality Gates**
   - `pnpm vitest run src/` (Wajib 100% lulus).
   - `pnpm run build` (Wajib 0 error).
   - `graphify update .` (Graf pengetahuan terbarukan).

---

## 5. Kriteria Keberhasilan (Success Criteria)

1. Tidak ada lagi *hardcoded strings* di komponen antarmuka yang dimigrasikan.
2. Seluruh file kamus menggunakan prefix `text_`.
3. 100% unit test (minimal 237 tests) tetap lulus tanpa ada penurunan fungsionalitas.
4. Build produksi (`tsc -b && vite build`) menghasilkan bundle yang bersih tanpa peningkatan latensi render.
