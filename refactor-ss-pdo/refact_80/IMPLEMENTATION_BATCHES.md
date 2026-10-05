# Rencana Paket Implementasi & Urutan Batch — Refact 80

- **Dokumen:** Rencana Eksekusi Bertahap (Implementation Batches)
- **Fase Program:** Rencana Transisi dari Fase 1 ke Fase 2 (dan Fase Lanjutan)
- **Prinsip Utama:** Perubahan kecil terukur, isolasi risiko, verifikasi sebelum klaim, dan pemisahan perbaikan domain aritmatika dari perubahan visual/tata letak.

---

## 1. Peta Dependensi Komponen & Batas Fitur

Struktur direktori eksisting dipertahankan dengan penambahan folder primitive `src/components/ui/` dan sub-komponen lokal di dalam fitur masing-masing:

```
src/
├── components/
│   ├── ui/                         <-- BARU: Primitif UI murni lintas fitur (tanpa dependensi domain)
│   │   ├── Button.tsx              (Batch 2.3)
│   │   ├── ModalShell.tsx          (Batch 2.3)
│   │   └── SegmentedControl.tsx    (Batch 2.4)
│   ├── busCard/                    <-- Fitur kartu bus harian & form input modal
│   │   ├── modal/
│   │   │   ├── fields/             <-- BARU: Komponen input field bersama Shift 1 & 2 (Batch 2.2)
│   │   │   │   ├── BusFormField.tsx
│   │   │   │   └── StatusChoiceChip.tsx
│   │   │   ├── useBusInputForm.ts  (Hotspot Fase 3)
│   │   │   ├── BusInputModalShift1.tsx
│   │   │   ├── BusInputModalShift2.tsx
│   │   │   └── BusInputModalSingleFocus.tsx (Hotspot Fase 3)
│   │   └── BusCard.tsx
│   ├── monitoring/                 <-- Fitur monitoring 18 rute & analitik
│   │   ├── modals/
│   │   │   └── MonitoringRouteDetailModal.tsx (Koreksi Ritase Batch 2.1 & Dekomposisi Fase 4)
│   │   └── tabs/
│   │       ├── MonitoringFleetStatusTab.tsx
│   │       └── MonitoringToaBarChart.tsx
│   └── [fitur lainnya]/...         (routeSelector, pdoReport, fleetStatus, userManagement, dll.)
├── constants/texts/                <-- Kamus teks antarmuka sentral (SSOT copy & label)
├── hooks/                          <-- Hooks logika bersama lintas fitur
├── services/                       <-- Integrasi Google Sheets, Supabase, antrean offline
└── utils/                          <-- Helper murni (numberUtils, dateUtils, alertUtils)
```

### Batas Dependensi (*Architectural Boundary Rules*):
1. **Level 0 (Paling Dasar):** `src/utils/`, `src/constants/texts/`. Tidak boleh mengimpor komponen UI apa pun.
2. **Level 1 (UI Primitives):** `src/components/ui/`. Hanya mengimpor utils dasar (misal helper string/kelas). Dilarang mengimpor service API, model operasional bus (`BusData`), atau komponen fitur.
3. **Level 2 (Fitur & Domain Components):** `src/components/<fitur>/`. Boleh mengimpor primitive UI, hook fitur, helper domain, dan kamus teks. Dilarang mengimpor komponen internal dari fitur lain secara silang (kecuali melalui interface atau facade yang disepakati).
4. **Level 3 (Orchestrator Halaman / Root):** `src/App.tsx`, `Dashboard.tsx`, `AllRouteMonitoringPage.tsx`. Mengorkestrasi aliran data, state global, dan dialog antar-fitur.

---

## 2. Urutan Batch Implementasi Fase 2

Fase 2 dibagi menjadi 3 batch mikro yang terukur. Setiap batch memiliki target pengujian spesifik dan dapat dipulihkan (*rollback*) tanpa mengganggu pekerjaan lain:

---

### Batch 2.1 — Koreksi Domain Aritmatika Ritase & Kamus Label Sentral (Prioritas 1)
- **Tujuan:** Menuntaskan temuan **R79-05 / R80-05** (koreksi pembulatan ritase pada trip ganjil) dan **R79-06 / R80-06** (label validasi sentral) tanpa menyentuh tampilan visual atau layout.
- **File yang Boleh Berubah:**
  1. `src/components/monitoring/modals/MonitoringRouteDetailModal.tsx`
  2. `src/constants/texts/text_alerts.ts`
  3. `src/constants/texts/texts.test.ts`
  4. `src/components/monitoring/modals/MonitoringRouteDetailModal.test.tsx`
- **Alasan & Rincian Perubahan:**
  - Menghapus `Math.round(route.totalTrips / 2)` pada baris 73 `MonitoringRouteDetailModal.tsx` dan menggantinya dengan kalkulasi desimal presisi murni:
    ```ts
    const totalRitasePp = route.totalRitasePp !== undefined
      ? route.totalRitasePp
      : route.totalTrips
      ? Number((route.totalTrips / 2).toFixed(1))
      : 0;
    ```
  - Menambahkan konstanta `LABEL_TOA_S2: 'TOA Shift 2'`, `LABEL_SHIFT_1: 'Shift 1'`, dan `LABEL_SHIFT_2: 'Shift 2'` pada `text_alerts.ts`.
  - Menambahkan unit test di `texts.test.ts` untuk memastikan integritas kamus.
  - Menambahkan test case komprehensif di `MonitoringRouteDetailModal.test.tsx`:
    - Uji 101 trip $\rightarrow$ 50,5 ritase PP.
    - Uji 100 trip $\rightarrow$ 50 ritase PP.
    - Uji 0 trip $\rightarrow$ 0 ritase PP.
    - Uji nilai `totalRitasePp` dari data sheet tetap diprioritaskan jika ada.
- **Risiko:** Sangat Rendah (murni kalkulasi dan kamus teks).
- **Prosedur Pemulihan (Rollback):**
  `git checkout -- src/components/monitoring/modals/MonitoringRouteDetailModal.tsx src/constants/texts/`
- **Kriteria Penerimaan:**
  - Seluruh test di `MonitoringRouteDetailModal.test.tsx` dan `texts.test.ts` lulus 100%.
  - `pnpm run test --dir src` tetap lulus 524+ tests.

---

### Batch 2.2 — Pilot Penggunaan Bersama Field Input Shift 1 & Shift 2 (Prioritas 2)
- **Tujuan:** Menuntaskan duplikasi gaya **R79-02 / R80-02** melalui ekstraksi kontrol input reusable dengan props sempit dan eksplisit.
- **File yang Dibuat / Berubah:**
  1. `src/components/busCard/modal/fields/BusFormField.tsx` *(Baru)*
  2. `src/components/busCard/modal/fields/StatusChoiceChip.tsx` *(Baru)*
  3. `src/components/busCard/modal/fields/BusFormField.test.tsx` *(Baru)*
  4. `src/components/busCard/modal/BusInputModalShift1.tsx`
  5. `src/components/busCard/modal/BusInputModalShift2.tsx`
- **Alasan & Rincian Perubahan:**
  - Mengisolasi objek gaya `heroInputStyle`, `secondaryInputStyle`, dan `getChipStyle` yang sebelumnya diduplikasi di kedua file menjadi komponen field terkontrol.
  - Komponen `BusFormField` menerima props sempit: `id`, `label`, `value`, `onChange`, `variant` (`hero` vs `secondary`), `inputRef`, `placeholder`, `error`, `onKeyDown`, `onFocus`.
  - Komponen `StatusChoiceChip` menangani tombol pill seleksi status (SGO, AP, AC, dll.) dengan transisi warna dan kurva fisik pegas Apple.
  - Mempertahankan aturan bisnis independen tiap shift (Shift 1 menangani relasi KM hari kemarin, Shift 2 menangani relasi KM Shift 1 dan akumulasi Total TOA).
- **Risiko:** Rendah ke Sedang (interaksi keyboard dan fokus input form).
- **Skenario Uji:**
  - Petugas mengetikkan angka TOA pada Shift 1 dan Total TOA pada Shift 2.
  - Navigasi tombol Enter berpindah fokus dengan benar ke field berikutnya.
  - Pengecekan visual pada kedua tema (Light Mode & Dark Mode): kontras teks jelas, border aktif berbayang halus.
- **Prosedur Pemulihan (Rollback):**
  `git checkout -- src/components/busCard/modal/BusInputModalShift1.tsx src/components/busCard/modal/BusInputModalShift2.tsx; rm -rf src/components/busCard/modal/fields/`

---

### Batch 2.3 — Fondasi Kontrak Baku Modal Shell (Prioritas 3)
- **Tujuan:** Menyelesaikan inkonsistensi modal **R79-03 / R80-03** dan kebocoran scroll lock bersarang **R80-10**.
- **File yang Dibuat / Berubah:**
  1. `src/components/ui/ModalShell.tsx` *(Baru)*
  2. `src/components/ui/ModalShell.test.tsx` *(Baru)*
  3. `src/components/dashboard/QueueModal.tsx` *(Migrasi Konsumen Pilot 1)*
  4. `src/components/pdoReport/ReportModalLayout.tsx` *(Migrasi Konsumen Pilot 2)*
- **Alasan & Rincian Perubahan:**
  - Membangun wrapper dialog standar yang mengintegrasikan:
    - Portal ke `document.body`.
    - Stack-aware body scroll lock (menyimpan `prevOverflow` dan memulihkannya saat unmount).
    - Listener keyboard `Escape`.
    - Integrasi `useMobileBackHandler` untuk tombol kembali Android.
    - Aksesibilitas ARIA: `role="dialog"`, `aria-modal="true"`, `aria-label`.
    - Penanganan keyboard viewport seluler (`maxHeight: "90dvh"`).
  - Menguji coba shell baru pada 2 konsumen berisiko rendah-sedang: `QueueModal` dan `ReportModalLayout`.
- **Risiko:** Sedang (pengujian interaksi mobile dan modal bertumpuk).
- **Skenario Uji:**
  - Membuka modal, menekan `Escape` $\rightarrow$ modal tertutup.
  - Membuka modal di ponsel Android, menekan tombol hardware Back $\rightarrow$ modal tertutup tanpa keluar halaman.
  - Membuka modal kedua di atas modal pertama, lalu menutup modal kedua $\rightarrow$ scroll lock modal pertama tetap aktif.

---

## 3. Rencana Fase Lanjutan (Fase 3 s.d. 6)

| Fase | Target Utama | Hotspot yang Ditangani | Kriteria Gerbang Kelulusan |
| :--- | :--- | :--- | :--- |
| **Fase 3** | Form Input Bus & Interaksi Odometer | `useBusInputForm.ts` (970 baris)<br>`BusInputModalSingleFocus.tsx` (805 baris)<br>`BusInputModal.tsx` (358 baris) | Hook dipecah menjadi sub-hooks fokus; 100% skenario odometer (prefill 3-digit, cross-shift, rollover suggestion, offline queue) terverifikasi via unit test. |
| **Fase 4** | Monitoring 18 Rute & Laporan | `MonitoringRouteDetailModal.tsx` (831 baris)<br>`MonitoringFleetStatusTab.tsx` (700 baris)<br>`MonitoringToaBarChart.tsx` | God component detail rute didekomposisi menjadi 3 tab mandiri; metrik agregasi dipisah ke hook murni; visual chart monitoring tetap stabil. |
| **Fase 5** | Fitur Tersisa & Restrukturisasi CSS | `src/index.css` (2.165 baris)<br>Facade re-export lama<br>`Dashboard.tsx`, `UnitDetailModal.tsx` | Inline styles statis dipindahkan ke modul CSS fitur; pemanggilan facade lama dialihkan ke path definitif; urutan cascade CSS aman di 2 tema. |
| **Fase 6** | Verifikasi Menyeluruh & Panduan Pemeliharaan | Seluruh codebase `src/`<br>`graphify-out/` | `vitest` 100% lulus, `pnpm run build` lulus, lint 0 error, `graphify update .` terbarui, dokumen ADR / panduan koding diperbarui. |
