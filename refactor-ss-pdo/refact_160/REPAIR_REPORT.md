# Laporan Perbaikan: Standardisasi Nomenklatur Peran Korwil (Refactor 160)

## Ringkasan Implementasi
Telah diselesaikan perbaikan standarisasi sebutan peran untuk 3 personil pengawas wilayah (Ranto Lumban Toruan, Abdul Manan, dan Moamar Z.A. Mahu). Seluruh penyebutan kata **"Korlap"** yang merujuk kepada ketiga personil tersebut di seluruh antarmuka aplikasi (Kartu Rute, Chip Filter Rute, Grafik TOA, Modal Detail Rute, dan Modul Laporan WhatsApp) telah diganti menjadi **"Korwil"** (Koordinator Wilayah).

Peran "Korlap" (Koordinator Lapangan) tetap dipertahankan secara utuh pada ranah tugas aslinya (manajemen akun RBAC pengguna dan input manual kesiapan status armada di lapangan `QuickKorlapFleetModal`).

---

## Rincian Before vs After

| Lokasi Komponen / Token | Sebelum (Before) | Sesudah (After) |
| :--- | :--- | :--- |
| **`text_monitoring.ts` (Dokumentasi Kamus)** | `...18 Rute untuk Korlap / Pimpinan.` | `...18 Rute untuk Korwil / Pimpinan.` |
| **`ROUTE_CARD.KORWIL_PREFIX`** | Tidak ada (`KORLAP_PREFIX: "Korlap:"`) | `KORWIL_PREFIX: "Korwil:"` (dengan alias aman `KORLAP_PREFIX: "Korwil:"`) |
| **Kartu Rute (`MonitoringRouteCardModern.tsx`)** | `Korlap: Ranto Lumban Toruan` | `Korwil: Ranto Lumban Toruan` |
| **Kartu Rute Klasik (`MonitoringRouteCard.tsx`)** | `Korlap: Abdul Manan` | `Korwil: Abdul Manan` |
| **Grafik TOA (`MonitoringToaBarChart.tsx`)** | `• Korlap: Moamar Z.A. Mahu` | `• Korwil: Moamar Z.A. Mahu` |
| **Filter Tab Rute (`MonitoringRoutesTab.tsx`)** | `Korlap: [Semua] [Ranto] [Abdul] [Moamar]` | `Korwil: [Semua] [Ranto] [Abdul] [Moamar]` |
| **Header Modal Detail (`MonitoringRouteDetailModal.tsx`)** | `${name} • Korlap: ${spv}` | `${name} • Korwil: ${spv}` |
| **Kamus Laporan WA (`text_wa_report.ts`)** | `FILTER_ALL: "Semua Korlap"` | `FILTER_ALL: "Semua Korwil"` |

---

## Case: Skenario Lapangan

### Kasus A: Pengawas atau Pimpinan Membuka Tab Rute di Layar HP
- **Skenario:** Pengguna membuka tab *Rute* pada menu Monitoring Wilayah untuk meninjau status operasional rute JAK.60 atau JAK.01.
- **Hasil:** Pada header kartu rute tertulis jelas *"Korwil: Ranto Lumban Toruan"*, bukan lagi *"Korlap: Ranto Lumban Toruan"*. Penamaan ini konsisten dengan tab *"Capaian Korwil"* di navigasi bawah.

### Kasus B: Memfilter Rute Berdasarkan Wilayah Tanggung Jawab
- **Skenario:** Pengguna ingin melihat 6 rute yang berada di bawah naungan Abdul Manan.
- **Hasil:** Barisan filter cepat di atas daftar rute kini berlabel *"Korwil: [Semua] [Ranto] [Abdul] [Moamar]"*. Tidak ada kerancuan antara pengawasan wilayah (Korwil) dengan koordinator lapangan (Korlap).

### Kasus C: Membuka Modal Rincian Operasional Rute
- **Skenario:** Pengguna mengetuk kartu JAK.113 untuk melihat performa ritase dan kilometer armada.
- **Hasil:** Subtitle modal menyajikan identitas resmi: *"JAK.113 • Korwil: Ranto Lumban Toruan"*, memberikan kejelasan hirarki pengawasan yang profesional.

---

## Checklist Verifikasi Quality Gates
- [x] **Vitest Unit Test Suite:** 119 test files passed, 850 unit tests passed (100% lulus tanpa kegagalan).
- [x] **TypeScript Strict Typecheck & Vite Build:** `tsc -b && vite build` lulus 0 error (`built in 1.55s`).
- [x] **Centralized Texts Dictionary:** Seluruh token didefinisikan terpusat di `src/constants/texts/text_monitoring.ts` dan `text_wa_report.ts`, diverifikasi di `texts.test.ts`.
- [x] **Knowledge Graph:** `graphify update .` berhasil diperbarui (6.120 node, 7.588 edge, 590 communities).
- [x] **Branch Safety:** Bekerja secara terisolasi di branch `devmode`.
