# Rencana Paket Implementasi & Urutan Batch — Refact 82

- **Dokumen:** Rencana Eksekusi Bertahap (Implementation Batches — Revisi Hasil Review Codex)
- **Fase Program:** Rencana Transisi dari Fase 1 ke Fase 2 (dan Roadmap Lanjutan)
- **Prinsip Utama:** Perubahan mikro terukur, isolasi risiko, pemulihan aman tanpa operasi destruktif, dan pemisahan perbaikan domain aritmatika dari perubahan visual/tata letak.

---

## 1. Peta Dependensi Komponen & Batas Fitur

Struktur direktori eksisting dipertahankan dengan penambahan sub-komponen lokal terisolasi pada fitur terkait dan penambahan utilitas UI murni:

```
src/
├── components/
│   ├── ui/                         <-- Primitif UI murni lintas fitur (tanpa dependensi domain)
│   │   ├── ModalShell.tsx          (Batch 2.3)
│   │   └── ModalShell.test.tsx     (Batch 2.3)
│   ├── busCard/                    <-- Fitur kartu bus harian & form input modal
│   │   ├── modal/
│   │   │   ├── fields/             <-- Komponen input field bersama Shift 1 & 2 (Batch 2.2)
│   │   │   │   ├── BusFormField.tsx
│   │   │   │   ├── ShiftOptionChip.tsx
│   │   │   │   └── BusFormField.test.tsx
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
└── utils/                          <-- Helper murni (numberUtils, dateUtils, scrollLockCoordinator)
```

---

## 2. Urutan Batch Implementasi Fase 2

Fase 2 dibagi menjadi 3 batch mikro yang terisolasi. Setiap batch memiliki target pengujian spesifik dan prosedur pemulihan aman yang **tidak menggunakan perintah destruktif massal**:

---

### Batch 2.1 — Koreksi Domain Aritmatika Ritase & Kamus Label Sentral (Prioritas 1)
- **Tujuan:** Menuntaskan temuan **R79-05 / R80-05** (koreksi pembulatan ritase pada trip ganjil) dan **R79-06 / R80-06** (label validasi sentral) tanpa menyentuh tampilan visual atau layout.
- **File yang Boleh Berubah:**
  1. `src/components/monitoring/modals/MonitoringRouteDetailModal.tsx`
  2. `src/constants/texts/text_alerts.ts`
  3. `src/constants/texts/texts.test.ts`
  4. `src/components/monitoring/modals/MonitoringRouteDetailModal.test.tsx`
- **Rincian Perubahan:**
  - Menghapus `Math.round` pada baris 73 `MonitoringRouteDetailModal.tsx` dan menerapkan formula pembagian murni tanpa pembulatan tambahan:
    ```ts
    const totalRitasePp = route.totalRitasePp !== undefined
      ? route.totalRitasePp
      : route.totalTrips
      ? route.totalTrips / 2
      : 0;
    ```
  - Memisahkan data angka domain murni dari pemformatan tampilan visual pada JSX.
  - Menambahkan konstanta `LABEL_TOA_S2: 'TOA Shift 2'`, `LABEL_SHIFT_1: 'Shift 1'`, dan `LABEL_SHIFT_2: 'Shift 2'` pada `text_alerts.ts`.
  - Menambahkan test case komprehensif di `MonitoringRouteDetailModal.test.tsx` dan `texts.test.ts`:
    - Uji trip ganjil: `101` trip $\rightarrow$ `50.5` ritase PP.
    - Uji trip genap: `100` trip $\rightarrow$ `50` ritase PP.
    - Uji trip nol: `0` trip $\rightarrow$ `0` ritase PP.
    - Uji prioritas sumber: jika `route.totalRitasePp` ada (misal `52`), nilai tersebut mutlak digunakan terlepas dari `totalTrips`.
- **Risiko:** Sangat Rendah (aritmatika murni dan pendaftaran teks kamus).
- **Prosedur Pemulihan Aman (Safe Rollback Protocol):**
  1. Sebelum batch dimulai: Catat `git status --short` dan simpan patch snapshot working tree lokal.
  2. Jika diperlukan pemulihan:
     - Bandingkan diff file target terhadap snapshot awal.
     - Pulihkan hanya perubahan hunk spesifik pada 4 file tersebut dengan patch selektif.
     - Pastikan tidak ada modifikasi di luar 4 file tersebut yang tersentuh.
     - Dilarang keras menjalankan checkout massal atau stash tanpa verifikasi.
- **Kriteria Penerimaan:**
  - Seluruh test di `MonitoringRouteDetailModal.test.tsx` dan `texts.test.ts` lulus 100%.
  - `pnpm run test --dir src` tetap lulus 524+ tests.

---

### Batch 2.2 — Pilot Penggunaan Bersama Field Input Shift 1 & Shift 2 (Prioritas 2)
- **Tujuan:** Mengeliminasi duplikasi gaya **R79-02 / R80-02** melalui ekstraksi kontrol input reusable dengan props sempit dan eksplisit.
- **File yang Dibuat / Berubah:**
  1. `src/components/busCard/modal/fields/BusFormField.tsx` *(Baru)*
  2. `src/components/busCard/modal/fields/ShiftOptionChip.tsx` *(Baru)*
  3. `src/components/busCard/modal/fields/BusFormField.test.tsx` *(Baru)*
  4. `src/components/busCard/modal/BusInputModalShift1.tsx`
  5. `src/components/busCard/modal/BusInputModalShift2.tsx`
- **Rincian Perubahan:**
  - Mengisolasi objek gaya `heroInputStyle` dan `secondaryInputStyle` menjadi komponen `BusFormField`.
  - Mengisolasi tombol toggle `Manual` dan `Keterangan/Catatan` menjadi komponen `ShiftOptionChip` yang menghilangkan duplikasi `getChipStyle(isActive)`.
  - Membatasi cakupan pilot hanya pada kontrol yang sungguh-sungguh dipakai di Shift 1 dan Shift 2. Status armada (SGO/AP/AC) ditunda dan dikelola terpisah di fitur `fleetStatus`.
  - Menjaga independensi aturan bisnis tiap shift (Shift 1 mengelola KM kemarin, Shift 2 mengelola KM Shift 1 dan akumulasi Total TOA).
- **Risiko:** Rendah ke Sedang (interaksi fokus dan keyboard form).
- **Skenario Uji:**
  - Input angka pada field hero (TOA S1 dan Total TOA S2) dan field secondary (KM Awal/Akhir).
  - Navigasi tombol Enter berpindah fokus antar-field dengan benar.
  - Verifikasi visual di Light Mode dan Dark Mode dengan token CSS resmi (`--bg-color`, `--card-bg`, dll.).
- **Prosedur Pemulihan Aman (Safe Rollback Protocol):**
  1. Sebelum batch dimulai: Catat status working tree.
  2. Jika diperlukan pemulihan:
     - Pulihkan file `BusInputModalShift1.tsx` dan `BusInputModalShift2.tsx` ke kondisi sebelum batch dengan membandingkan diff parsial.
     - Hapus hanya file baru yang dibuat pada batch ini secara spesifik satu per satu menggunakan path definitif (`Remove-Item src/components/busCard/modal/fields/BusFormField.tsx -Force`), tanpa menggunakan perintah hapus direktori rekursif luas seperti `rm -rf`.
     - Verifikasi ulang status working tree.

---

### Batch 2.3 — Fondasi Dialog Baku & Coordinated Scroll Lock (Prioritas 3)
- **Tujuan:** Menyelesaikan inkonsistensi modal **R79-03 / R80-03** dan potensi kebocoran scroll lock **R80-10**.
- **File yang Dibuat / Berubah:**
  1. `src/utils/scrollLockCoordinator.ts` *(Baru — Utilitas reference counter scroll lock)*
  2. `src/utils/scrollLockCoordinator.test.ts` *(Baru)*
  3. `src/components/ui/ModalShell.tsx` *(Baru)*
  4. `src/components/ui/ModalShell.test.tsx` *(Baru)*
  5. `src/components/dashboard/QueueModal.tsx` *(Migrasi Konsumen Pilot 1)*
  6. `src/components/pdoReport/ReportModalLayout.tsx` *(Migrasi Konsumen Pilot 2)*
- **Rincian Perubahan:**
  - Membangun utilitas `acquireBodyScrollLock` berbasis reference counter (`activeModalCount`) terpusat yang aman terhadap urutan penutupan modal apa pun.
  - Membangun wrapper dialog `ModalShell` standar yang mengintegrasikan portal `document.body`, listener `Escape`, dukungan tombol Back Android (`useMobileBackHandler`), dan ARIA accessibility.
  - Menerapkan shell pada 2 konsumen nyata: `QueueModal` dan `ReportModalLayout`.
- **Risiko:** Sedang (pengujian interaksi modal di perangkat sentuh).
- **Skenario Uji Wajib:**
  - Uji Urutan Tutup 1: Modal A buka $\rightarrow$ Modal B buka $\rightarrow$ Modal B tutup $\rightarrow$ Modal A tutup.
  - Uji Urutan Tutup 2: Modal A buka $\rightarrow$ Modal B buka $\rightarrow$ Modal A tutup lebih dulu $\rightarrow$ Modal B masih aktif.
  - Uji hardware back Android dan tombol `Escape`.
- **Prosedur Pemulihan Aman:**
  - Revert hunk yang dimodifikasi pada `QueueModal.tsx` dan `ReportModalLayout.tsx`.
  - Hapus file baru secara eksplisit satu per satu tanpa perintah rekursif.

---

## 3. Rencana Roadmap Lanjutan (Fase 3 s.d. 6)

| Fase | Target Utama | Hotspot yang Ditangani | Kriteria Gerbang Kelulusan |
| :--- | :--- | :--- | :--- |
| **Fase 3** | Form Input Bus & Interaksi Odometer | `useBusInputForm.ts` (970 baris)<br>`BusInputModalSingleFocus.tsx` (805 baris)<br>`BusInputModal.tsx` (358 baris) | Hook dipecah menjadi sub-hooks fokus; 100% skenario odometer (prefill 3-digit, cross-shift, rollover suggestion, offline queue) terverifikasi via unit test. |
| **Fase 4** | Monitoring 18 Rute & Laporan | `MonitoringRouteDetailModal.tsx` (831 baris)<br>`MonitoringFleetStatusTab.tsx` (700 baris)<br>`MonitoringToaBarChart.tsx` | God component detail rute didekomposisi menjadi 3 tab mandiri; metrik agregasi dipisah ke hook murni; visual chart monitoring tetap stabil. |
| **Fase 5** | Fitur Tersisa & Restrukturisasi CSS | `src/index.css` (2.166 baris)<br>Facade re-export lama<br>`Dashboard.tsx`, `UnitDetailModal.tsx` | Inline styles statis dipindahkan ke modul CSS fitur; pemanggilan facade lama dialihkan ke path definitif; urutan cascade CSS aman di 2 tema. |
| **Fase 6** | Verifikasi Menyeluruh & Panduan Pemeliharaan | Seluruh codebase `src/`<br>`graphify-out/` | `vitest` 100% lulus, `pnpm run build` lulus, lint 0 error, `graphify update .` terbarui, dokumen ADR / panduan koding diperbarui. |
