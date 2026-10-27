# Audit Temuan: Koreksi Nomenklatur Peran Korwil vs Korlap (Refactor 160)

## Ringkasan Eksekutif
Berdasarkan tinjauan operasional pada aplikasi SS_PDO, terdapat inkonsistensi penamaan peran/jabatan bagi 3 pengawas wilayah (Ranto Lumban Toruan, Abdul Manan, dan Moamar Z.A. Mahu). Ketiga personil tersebut secara hierarki operasional dan master data adalah **Koordinator Wilayah (Korwil)**. Namun, pada beberapa komponen frontend (khususnya kartu rute, filter pencarian rute, grafik TOA, modal detail rute, serta generator laporan WhatsApp), sistem keliru menyematkan label **"Korlap"** (Koordinator Lapangan) kepada mereka.

---

## Temuan Masalah & Analisis Risiko

### 1. BUG-160-01: Label Prefix Supervisor pada Kartu Rute Keliru Menyebut "Korlap"
- **Lokasi:** 
  - `src/constants/texts/text_monitoring.ts` (`ROUTE_CARD.KORLAP_PREFIX`)
  - `src/components/monitoring/tabs/MonitoringRouteCardModern.tsx` (baris 132)
  - `src/components/monitoring/MonitoringRouteCard.tsx` (baris 224)
- **Keparahan:** Medium (Inkonsistensi Terminologi & Etika Operasional)
- **Deskripsi:**
  Setiap kartu rute menampilkan informasi operator dan nama pengawas rute (`route.supervisorName`) dengan prefix `Korlap:` (contoh: *"Korlap: Ranto Lumban Toruan"*).
- **Dampak User:**
  Pengguna, manajemen, dan pengawas wilayah mendapati jabatan Korwil diturunkan atau disalahartikan sebagai Korlap di layar utama dashboard.
- **Mitigasi:**
  Menambahkan token sentral `TEXT_MONITORING.ROUTE_CARD.KORWIL_PREFIX: "Korwil:"` (dengan alias `KORLAP_PREFIX` diarahkan ke `"Korwil:"` untuk mencegah regresi) dan memperbarui kedua varian kartu rute agar menampilkan prefix resmi *"Korwil:"*.

### 2. BUG-160-02: Chip Filter Supervisor pada Tab Rute Berlabel "Korlap:"
- **Lokasi:**
  - `src/constants/texts/text_monitoring.ts` (`ROUTES_TAB.KORLAP_LABEL`)
  - `src/components/monitoring/tabs/MonitoringRoutesTab.tsx` (baris 375 & 400)
- **Keparahan:** Medium (Kebingungan Navigasi & UX)
- **Deskripsi:**
  Barisan tombol filter cepat berdasarkan 3 nama pengawas (`SUPERVISORS`: Ranto, Abdul, Moamar) diberi label header `Korlap:` di sebelah ikon filter.
- **Dampak User:**
  Pengguna mengira tombol filter tersebut adalah filter Koordinator Lapangan teknis per bus/lapangan, padahal memfilter rute berdasarkan 3 Korwil.
- **Mitigasi:**
  Mengganti label filter menjadi `TEXT_MONITORING.ROUTES_TAB.KORWIL_LABEL: "Korwil:"` dan `KORWIL_ALL: "Semua"`.

### 3. BUG-160-03: Subtitle Modal Detail Rute Keliru Menyebut "Korlap"
- **Lokasi:**
  - `src/constants/texts/text_monitoring.ts` (`ROUTE_DETAIL_MODAL.SUBTITLE`)
  - `src/components/monitoring/modals/MonitoringRouteDetailModal.tsx` (baris 221)
- **Keparahan:** Low (Inkonsistensi Nomenklatur)
- **Deskripsi:**
  Header modal detail rute menampilkan nama rute/operator diikuti `• Korlap: ${spv}` (contoh: *"JAK.01 • Korlap: Ranto Lumban Toruan"*).
- **Dampak User:**
  Saat pimpinan atau pengawas membuka lembar rincian rute, jabatan personil yang tertera di header tetap tertulis *"Korlap"*.
- **Mitigasi:**
  Memperbarui fungsi template `SUBTITLE` pada kamus sentral menjadi `${name} • Korwil: ${spv}`.

### 4. BUG-160-04: Tooltip/Detail Batang Grafik TOA Keliru Menyebut "Korlap"
- **Lokasi:**
  - `src/components/monitoring/tabs/MonitoringToaBarChart.tsx` (baris 339)
- **Keparahan:** Low (Inkonsistensi Visual)
- **Deskripsi:**
  Saat bar rute pada grafik TOA diklik, banner rincian di bawah grafik menampilkan `${selectedRoute.operatorName} • Korlap: ${selectedRoute.supervisorName}`.
- **Dampak User:**
  Visualisasi grafik penumpang TOA tetap menampilkan sebutan "Korlap" untuk personil Korwil.
- **Mitigasi:**
  Mengganti prefix menggunakan `TEXT_MONITORING.ROUTE_CARD.KORWIL_PREFIX`.

### 5. BUG-160-05: Label Filter Supervisor WhatsApp Report Menggunakan "Semua Korlap"
- **Lokasi:**
  - `src/constants/texts/text_wa_report.ts` (`FILTER_ALL`)
  - `src/components/waReport/WaReportFormatTabs.tsx` (komentar & tab lingkup)
- **Keparahan:** Low (Inkonsistensi Modul Laporan)
- **Deskripsi:**
  Tab pembagi laporan WA per tim supervisor (Ranto, Abdul, Moamar) memiliki label rujukan `FILTER_ALL: "Semua Korlap"`.
- **Dampak User:**
  Di modul laporan WhatsApp, pengelompokan 3 pengawas diistilahkan sebagai Korlap.
- **Mitigasi:**
  Mengubah `FILTER_ALL` menjadi `"Semua Korwil"` dan memperbarui penamaan komentar/lingkup terkait.
