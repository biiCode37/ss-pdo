# Audit Temuan Refact 51: Dekomposisi Modal Kesiapan Armada `FleetStatusModal.tsx` (~622 baris)

Dokumen audit ini mencatat analisis arsitektural dan dekomposisi terhadap komponen modal status armada `src/components/fleetStatus/FleetStatusModal.tsx` yang menangani inisialisasi status operasi unit per-shift, pemilihan status kuas (SGO, OFF, T.O EVDAL), quick action massal (SGO Semua), kalkulasi ringkasan real-time renops/realops, dan konfirmasi pembaruan status ke Google Sheets.

---

## 1. Daftar Temuan Masalah & Risiko Arsitektur

### REF51-ARCH-001: God File `src/components/fleetStatus/FleetStatusModal.tsx` (622 baris)

- **Lokasi Kode**: `src/components/fleetStatus/FleetStatusModal.tsx` (622 baris)
- **Tingkat Keparahan**: **HIGH** (Maintainability & Separation of Concerns)
- **Deskripsi Masalah**:
  Komponen modal kesiapan armada memadukan berbagai tanggung jawab dalam satu file besar:
  1. Pengelolaan map status armada unit bus (`Map<number, { s1: string; s2: string }>`) dan sinkronisasi data bus saat props berubah.
  2. Logika mutasi status interaktif saat kartu ditekan (*brush painting interaction*) dan reset instan seluruh armada menjadi SGO.
  3. Kalkulasi agregasi metriks real-time jumlah unit SGO, OFF, dan T.O pada shift aktif menggunakan `cleanShiftNote`.
  4. Eksekusi pengiriman data konfirmasi armada (`onConfirmStatus`), penanganan loading spinner, dan error handling log.
  5. Presentasi visual: handle bar modal fisik, header informasi rute dan target renops, tombol tabs toggle shift adaptif, toolbar kuas status dengan warna semantik, grid kartu bus dengan deteksi status SGO/OFF/TO/BA, summary pills, dan tombol konfirmasi di footer.
- **Dampak User & Pengembang**:
  - Ukuran berkas yang mencapai 622 baris menyulitkan pengembang untuk memelihara alur kerja status armada atau melakukan styling mobile.
  - Percampuran logika state kuas dengan render kartu unit bus rawan menimbulkan bug status tidak tersimpan saat berpindah shift.
- **Mitigasi**:
  Dekomposisi menjadi submodul mandiri di folder `src/components/fleetStatus/`:
  - `types.ts`: Interface `FleetStatusModalProps`, `BrushMode`, dan `StatusMap`.
  - `useFleetStatusData.ts`: Hook untuk isolasi state `unitMap`, logika kuas status per-shift, reset SGO massal, agregasi summary counts, dan eksekusi `handleConfirm`.
  - `FleetStatusHeader.tsx`: Komponen top handle bar dan header informasi rute & target renops.
  - `FleetStatusToolbar.tsx`: Komponen tabs switcher shift dan toolbar pemilih kuas status serta tombol SGO Semua.
  - `FleetStatusGrid.tsx`: Komponen grid kartu armada bus dengan styling adaptif (SGO, OFF, T.O, BA).
  - `FleetStatusFooter.tsx`: Komponen summary counts real-time dan tombol submit konfirmasi status shift.
  - `index.ts`: Barrel export terpusat.
  - `FleetStatusModal.tsx`: Dirampingkan menjadi komponen orchestrator bersih **~136 baris** (penurunan -486 baris kode / 78%) dengan kompatibilitas penuh 100% (*Zero Breaking Change*).
  - Penambahan entri kamus sentral `HEADER_TITLE` dan `TARGET_RENOPS` di `src/constants/texts/text_fleet_status.ts` dan unit test assertion di `src/constants/texts/texts.test.ts`.
