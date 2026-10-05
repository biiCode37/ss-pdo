# Audit Bugs & UX Review - Refactor 77

Dokumentasi audit UX untuk penyederhanaan tombol "Load All" menjadi icon-only (`CloudDownload`) berukuran kompak (`36x36px`) agar satu baris utuh berdampingan dengan Date Picker dan tombol Refresh.

---

## 1. Daftar Temuan

### BUG-REFACT77-01: Pemborosan Ruang Horizontal pada Tombol "Load All" dengan Teks
* **Lokasi Kode:**
  * [`src/components/monitoring/MonitoringHeader.tsx`](file:///d:/MINE/SS_PDO/src/components/monitoring/MonitoringHeader.tsx)
  * [`src/components/monitoring/MonitoringHeader.test.tsx`](file:///d:/MINE/SS_PDO/src/components/monitoring/MonitoringHeader.test.tsx)
* **Kategori / Keparahan:** Mobile-First Layout & Space Efficiency / Medium
* **Deskripsi Masalah:**
  Tombol "Load All" sebelumnya memiliki teks panjang "Load All" di samping icon `CloudDownload`, yang membuat lebarnya menjadi sekitar 105px. Pada layar ponsel berukuran ringkas (misal: lebar 320px–360px), kombinasi date picker (178px) + tombol refresh (36px) + tombol load all (105px) mendekati atau melampaui batas lebar layar, sehingga rawan memecah baris (*wrapping*) ke baris kedua.
* **Dampak Pengguna:**
  * Layout header tampak sesak atau bertumpuk vertikal di perangkat seluler berlayar sempit.
  * Ketidakseimbangan estetika antara tombol Refresh berbentuk bujur sangkar (`36x36px`) dan tombol Load All berbentuk kapsul panjang (`36x105px`).
* **Mitigasi & Solusi:**
  1. Hapus teks visual "Load All" dari tubuh tombol dan jadikan tombol sebagai icon-only button berukuran simetris `36x36px` dengan sudut membulat `borderRadius: 12px`, serasi dengan tombol Refresh di sampingnya.
  2. Pertahankan atribut aksesibilitas dan tooltip:
     * `aria-label={TEXT_MONITORING.INGESTION.BUTTON_LABEL}`
     * `title={TEXT_MONITORING.INGESTION.TOOLTIP}`
  3. Tetapkan `flexWrap: "nowrap"` pada kontainer grup tanggal & tombol aksi untuk menjamin ketiganya (*datepicker + refresh + load*) selalu berada dalam satu baris horizontal kompak.
  4. Perbarui unit test pada `MonitoringHeader.test.tsx` dan `AllRouteMonitoringPage.test.tsx`.
