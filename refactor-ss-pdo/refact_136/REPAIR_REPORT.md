# REPAIR REPORT — Refactor 136

## Implementasi Perbaikan
- **Tanggal:** 17 Oktober 2026
- **Branch:** `devmode`

---

### 1. Deskripsi Perbaikan
Melakukan perbaikan komprehensif pada antarmuka *Monitoring Wilayah* berdasarkan hasil audit visual screenshot mobile:
1. **Pemberantasan Bug `NaN` pada Subtitle Grafik:** Memperbarui `formatIndonesianDaySlashDate` agar menangani rentang tanggal periode (`YYYY-MM-DD s.d. YYYY-MM-DD`) dan format bulan (`YYYY-MM`) dengan anggun tanpa menghasilkan `NaN`. Menambahkan dukungan subtitle adaptif (`Komparasi total pelanggan periode September 2026`).
2. **Pembersihan Desimal Liar & Restrukturisasi Kartu Rute:**
   - Membatasi desimal efisiensi armada per bus menjadi 1 digit desimal standar Indonesia (`formatDecimal(kmPerBus, 1)`).
   - Mengubah label kolom ke-3 dari `KM Tempuh` menjadi `KM / Bus`.
   - Mengelompokkan persentase capaian target penumpang `(XX.X%)` langsung di bawah metrik **Pelanggan** (Gestalt proximity).
   - Mengisi subteks kolom `KM / Bus` dengan `Total: XX.XXX km` sebagai konteks jarak tempuh rute yang utuh.
3. **Penyelesaian False Positive Status Armada (0 Unit):**
   - Mengubah default persentase SGO saat `totalFleet === 0` menjadi `0.0%`.
   - Menghadirkan *Empty State Netral* bertema abu-abu (`NO_DATA_TITLE` & `NO_DATA_DESC`) ketika data armada belum tersedia, dan hanya menampilkan apresiasi hijau saat armada memang terbukti 100% SGO dari data riil.
4. **Perlindungan Layout Bottom Dock (Safe Area Padding):**
   - Menambahkan `paddingBottom: "calc(96px + env(safe-area-inset-bottom, 0px))"` pada elemen `<main>` di `AllRouteMonitoringPage.tsx`, menjamin seluruh tombol dan elemen terbawah (seperti tombol dropdown Korwil) tidak tertutup floating dock.
5. **Standardisasi Angka & Satuan Tipografi di Tab Korwil:**
   - Memformat seluruh angka armada dengan `formatNumber()` (`16.272 Bus`, `16.560 Renops`, `5.160 Bus`).
   - Menyeragamkan token kapitalisasi satuan ke kamus sentral `text_monitoring.ts` (`Bus`, `Org`, `km`, `Rit`).

---

### 2. Before vs After

#### A. `src/components/monitoring/monitoringUtils.ts` & Subtitle Grafik
- **Before:**
  ```typescript
  // Input: "2026-09-01 s.d. 2026-09-30"
  const [y, m, d] = dateStr.split("-").map(Number); // d menjadi NaN ("01 s.d. 2026")
  // Hasil render subtitle: "Komparasi total pelanggan pada hari , NaN/09/2026"
  ```
- **After:**
  ```typescript
  // Input: "2026-09-01 s.d. 2026-09-30"
  if (dateStr.includes(" s.d. ")) {
    if (y1 === y2 && m1 === m2 && d1 === 1 && d2 >= 28) {
      return formatIndonesianMonthYear(startStr); // "September 2026"
    }
    // ...
  }
  // Hasil render subtitle: "Komparasi total pelanggan periode September 2026"
  ```

#### B. `src/components/monitoring/tabs/MonitoringRouteCardModern.tsx` (Kolom 2 & 3)
- **Before:**
  ```typescript
  // Kolom 2 Pelanggan:
  {route.todayPassengers.toLocaleString("id-ID")}
  // Subteks: TOA: 134.723 • Man: 1.178
  
  // Kolom 3 KM:
  // Label: "KM Tempuh"
  // Angka: 192.437027027 (11 desimal liar)
  // Subteks: "Cap: 87.8%" (salah tempat, ini persen penumpang!)
  ```
- **After:**
  ```typescript
  // Kolom 2 Pelanggan:
  {route.todayPassengers.toLocaleString("id-ID")} ({paxPct})
  // Subteks: TOA: 134.723 • Man: 1.178

  // Kolom 3 KM / Bus:
  // Label: "KM / Bus"
  // Angka: 192,4 (1 desimal rapi)
  // Subteks: "Total: 106.802 km" (konteks total jarak yang akurat)
  ```

#### C. `src/components/monitoring/tabs/MonitoringFleetStatusTab.tsx` (Empty State)
- **Before:**
  ```typescript
  // Saat totalFleet === 0 (data kosong)
  const sgoPct = "100.0";
  // Menampilkan kartu hijau: "Seluruh Armada Beroperasi Normal (Luar biasa!)"
  ```
- **After:**
  ```typescript
  // Saat totalFleet === 0 (data kosong)
  const sgoPct = "0.0";
  // Menampilkan kartu netral: "Belum Ada Data Status Armada"
  // Pesan hijau hanya tampil saat data terisi dan realops > 0 tanpa kendala
  ```

#### D. `src/components/monitoring/AllRouteMonitoringPage.tsx` (Safe-Area Bottom)
- **Before:**
  ```tsx
  <main style={{ maxWidth: "1200px", margin: "0 auto" }}>
  // Tombol Rincian Rute Tim dan kartu bawah tertutup floating dock
  ```
- **After:**
  ```tsx
  <main style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "calc(96px + env(safe-area-inset-bottom, 0px))" }}>
  // Bebas tabrakan, seluruh tombol dapat ditap dengan nyaman
  ```

#### E. `src/components/monitoring/tabs/MonitoringToaBarChart.tsx` (Anti-CLS Floating Bottom Sheet)
- **Before:**
  ```tsx
  // Kotak tooltip disisipkan di atas list bar di dalam flow dokumen
  {selectedRoute && (
    <div style={{ background: "...", border: "1px solid #3ECF8E", padding: "10px 14px", marginBottom: "14px" }}>
      // Seluruh 18 bar terdorong ke bawah seketika (CLS parah)
      // Tanpa tombol close (X), tanpa backdrop dismiss
    </div>
  )}
  ```
- **After:**
  ```tsx
  // Floating Bottom Sheet dengan backdrop semi-transparan
  {selectedRoute && (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0, 0, 0, 0.65)", backdropFilter: "blur(4px)", zIndex: 9999 }} onClick={() => setSelectedRoute(null)}>
      <div data-testid="toa-chart-tooltip" style={{ animation: "slideUp 0.25s cubic-bezier(0.32, 0.72, 0, 1)", borderTopLeftRadius: "20px", borderTopRightRadius: "20px", ... }}>
        // Header dengan badge kode rute, nama rute, operator/korlap, & tombol close (X)
        // Grid 2-kolom: Total Pelanggan + Capaian HK dan Rincian per Shift
        // 0 Cumulative Layout Shift, bar list di belakang tetap stabil tidak bergeser
      </div>
    </div>
  )}
  ```

#### F. `src/components/monitoring/tabs/MonitoringRoutesTab.tsx` (Toolbar Kompak & Anti-Potong Chips)
- **Before:**
  ```tsx
  // Search box & Bulk Verify button
  <div style={{ flex: "1 1 240px" }}><input placeholder="Cari rute (JAK.XX), lintasan, atau operator..." style={{ padding: "9px 34px 9px 36px" }} /></div>
  <button style={{ padding: "9px 16px" }}>Verifikasi {count} Rute</button>
  // Chips filter tanpa flexShrink: 0 dan tanpa paddingRight pada scroll container
  // Teks "Semua (18)", "Perlu Verifikasi (16)", "Belum Lengkap (0)" hardcoded di file .tsx
  ```
- **After:**
  ```tsx
  // Search box & Bulk Verify ramping proporsional
  <div style={{ flex: "1 1 200px", minWidth: "160px" }}><input placeholder={TEXT_MONITORING.ROUTES_TAB.SEARCH_PLACEHOLDER} style={{ padding: "8px 32px 8px 34px", fontSize: "12.5px" }} /></div>
  <button style={{ padding: "8px 14px", fontSize: "12px", flexShrink: 0 }}>{TEXT_MONITORING.BULK_VERIFY.BUTTON_LABEL(count)}</button>
  // Chips filter: flexShrink: 0, paddingRight: "16px" pada scroll container
  // Seluruh string antarmuka termigrasi ke TEXT_MONITORING.ROUTES_TAB (100% kamus sentral)
  ```

#### G. `src/components/monitoring/modals/MonitoringRouteDetailModal.tsx` (Presisi Desimal & Safe-Area Footer)
- **Before:**
  ```tsx
  // kmPerBus & ritasePerBus dirender mentah
  <div>{kmPerBus} KM</div> // jika ada desimal: 192.437027027 KM
  <div>{ritasePerBus} Rit/Bus</div> // jika floating point: 3.3333333333333335 Rit/Bus
  // Sticky Footer tanpa env(safe-area-inset-bottom) dan tanpa flexWrap
  <div style={{ padding: "12px 18px", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
  ```
- **After:**
  ```tsx
  // kmPerBus & ritasePerBus dibungkus pemformat cerdas
  <div>{displayKmPerBus} KM</div> // bilangan bulat tetap 180, pecahan dibulatkan: 192,4 KM
  <div>{displayRitasePerBus} Rit/Bus</div> // presisi teruji 5.05 tetap utuh, pecahan liar dibatasi: 3.33 Rit/Bus
  // Sticky Footer dengan safe-area inset & flexWrap responsif
  <div style={{ padding: "12px 18px calc(12px + env(safe-area-inset-bottom, 0px))", display: "flex", justifyContent: "flex-end", flexWrap: "wrap", gap: "8px" }}>
  ```

#### H. `src/components/monitoring/tabs/MonitoringWaReportTab.tsx` (Kamus Sentral & Scroll Format Tabs)
- **Before:**
  ```tsx
  <h3>Report Studio WhatsApp</h3> // Hardcoded string
  // Format tabs tanpa paddingRight dan flexShrink: 0
  <div style={{ display: "flex", gap: "8px", overflowX: "auto" }}>
  ```
- **After:**
  ```tsx
  <h3>{TEXT_WA_REPORT.STUDIO_TITLE}</h3> // Menggunakan kamus sentral TEXT_WA_REPORT
  // Format tabs dengan padding kanan & flexShrink: 0
  <div style={{ display: "flex", gap: "8px", overflowX: "auto", padding: "2px 16px 4px 0", WebkitOverflowScrolling: "touch" }}>
  ```

#### I. `src/components/monitoring/MonitoringHeader.tsx` & Capsule Selector (Label Bulan Manusiawi)
- **Before:**
  ```tsx
  // Pada mode bulanan (monthly):
  label: `${startDate} s.d. ${endDate}` // "2026-09-01 s.d. 2026-09-30"
  // Di header mobile label terpotong elipsis: "2026-09-01 s.d. 202..."
  ```
- **After:**
  ```tsx
  // Pada mode bulanan (monthly):
  label: formatIndonesianMonthYear(startDate) // "September 2026"
  // Tampilan header trigger adaptif: formatIndonesianMonthYear(...) -> ringkas, elegan, dan manusiawi tanpa terpotong
  ```

---

### 3. Case: Skenario Lapangan

#### Skenario 1: Rekapitulasi Eksekutif Bulanan (Bulan September 2026)
- **Masalah:** Manajemen operasional membuka dashboard wilayah di awal bulan dan melihat teks grafik tertulis `pada hari , NaN/09/2026` serta efisiensi armada JAK.01 tertulis `192.437027027 KM Tempuh`. Manajemen mengira total jarak tempuh JAK.01 sebulan hanya 192 km dan mencurigai aplikasi mengalami glitch perhitungan.
- **Hasil Setelah Perbaikan:** Judul grafik secara anggun menampilkan *"Komparasi total pelanggan periode September 2026"*, metrik armada tertulis jelas sebagai *"KM / Bus: 192,4"* dengan subteks *"Total: 106.802 km"*, dan capaian target penumpang langsung terbaca jelas di samping jumlah pelanggan.

#### Skenario 2: Pemeriksaan Status Armada di Pagi Hari Sebelum Sinkronisasi
- **Masalah:** Petugas membuka tab *Status Armada* pada pukul 05:00 pagi saat sheet operasional belum diinput. Aplikasi menampilkan apresiasi bahwa 100% armada normal tanpa kendala, menimbulkan rasa aman palsu padahal bus mogok belum tercatat.
- **Hasil Setelah Perbaikan:** Aplikasi dengan jujur dan jelas menginformasikan *"Belum Ada Data Status Armada — Laporan kesiapan armada untuk periode ini belum tersedia atau belum ditarik."*

#### Skenario 3: Peninjauan Grafik Capaian TOA oleh Pimpinan via Ponsel
- **Masalah:** Pimpinan meninjau grafik bar 18 rute di HP. Saat menekan bar "JAK 110A" yang berada di posisi atas, tiba-tiba muncul boks di atas grafik yang mendorong seluruh 18 bar ke bawah secara mendadak. Pimpinan kehilangan posisi scroll dan bingung cara menutup kotak info karena tidak ada tombol close `(X)`.
- **Hasil Setelah Perbaikan:** Saat bar ditekan, grafik tetap tenang di posisinya (0 CLS). Lembar *Floating Bottom Sheet* meluncur mulus dari bawah layar menyajikan ringkasan lengkap: Total Pelanggan, Capaian Target HK, dan Rincian Shift 1 vs Shift 2. Pimpinan dapat menutup info dengan mudah melalui tombol `(X)` atau cukup men-tap area gelap di luar lembar.

#### Skenario 4: Filter Status Rute pada Layar HP Berukuran 360px
- **Masalah:** Petugas di lapangan menggunakan HP entry-level berlayar 360px. Kolom pencarian dan tombol Bulk Verify yang gemuk memakan hampir separuh layar atas. Di bawahnya, chip filter status terpotong di bagian teks "Belum Lengkap (0)", dan chip tidak dapat discroll dengan nyaman karena teks menempel di tepi kanan layar.
- **Hasil Setelah Perbaikan:** Toolbar pencarian menjadi ramping dan proporsional. Seluruh chip filter memiliki `flexShrink: 0` dan kontainer memiliki bantalan napas `paddingRight: 16px`, sehingga chip terakhir ("Terverifikasi") dapat di-scroll dan dibaca dengan sangat lega tanpa terpotong.

#### Skenario 5: Pembacaan Modal 21 Metrik & Pengiriman Laporan WA di Ponsel Berlayar Penuh
- **Masalah:** Petugas men-tap kartu rute untuk melihat rincian operasional. Angka efisiensi KM bus meluap menjadi `192.437027027 KM`, dan tombol "Verifikasi Rute" di footer bawah tertindih oleh *gesture home bar* sistem operasi ponsel.
- **Hasil Setelah Perbaikan:** Modal menampilkan angka efisiensi secara proporsional (`192,4 KM` dan `3.33 Rit/Bus`), sementara footer modal otomatis menyesuaikan diri dengan safe-area ponsel (`calc(12px + env(safe-area-inset-bottom))`), memberikan ruang sentuh ibu jari yang bebas hambatan.

---

### 4. Checklist Verifikasi & Quality Gates
- [x] `pnpm vitest run src/components/monitoring src/constants/texts` ➔ 16/16 file tes lulus, 110/110 tes lulus (100%).
- [x] `pnpm run build` ➔ TypeScript (`tsc -b`) & Vite build lulus 0 error.
- [x] `graphify update .` ➔ Knowledge Graph terbarukan (5.534 nodes, 6.905 edges, 526 communities).
- [x] Branch: `devmode`.
