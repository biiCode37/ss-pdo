# AUDIT BUGS — Refactor 136

## Ringkasan Audit
- **Tanggal:** 17 Oktober 2026
- **Konteks:** Audit menyeluruh hasil tangkapan layar (screenshot) antarmuka mobile modul *Monitoring Wilayah* (`AllRouteMonitoringPage`), mencakup perbaikan bug visual teks `NaN`, desimal liar 11 digit pada kartu rute, false positive state armada 0 unit, collision layout bottom navigation bar, dan standardisasi format angka ribuan.

---

### Temuan Bug / Cacat UI & UX

#### BUG-136-01: Formatter Tanggal Menghasilkan Teks Cacat `NaN/09/2026` pada Subtitle Grafik
- **Lokasi Kode:**
  - `src/components/monitoring/monitoringUtils.ts` (`formatIndonesianDaySlashDate`)
  - `src/components/monitoring/tabs/MonitoringToaBarChart.tsx`
  - `src/constants/texts/text_monitoring.ts` (`CHART_SUBTITLE`)
- **Tingkat Keparahan:** High (Kredibilitas Aplikasi & Integritas Data)
- **Deskripsi:**
  Saat pengguna mengaktifkan filter mode Bulanan atau Rentang Tanggal, string tanggal yang diteruskan adalah format rentang seperti `"2026-09-01 s.d. 2026-09-30"` atau `"2026-09"`. Fungsi `formatIndonesianDaySlashDate()` memecah string dengan tanda strip (`-`), menyebabkan bagian hari ter-parse menjadi `NaN` dan menghasilkan teks: `"Komparasi total pelanggan pada hari , NaN/09/2026"`.
- **Dampak Pengguna:**
  Pengguna dan stakeholder melihat teks rusak dengan spasi koma menggantung dan teks `NaN`, menurunkan kepercayaan terhadap kualitas sistem.
- **Mitigasi:**
  1. Perbaiki `formatIndonesianDaySlashDate()` agar dapat mendeteksi rentang `" s.d. "` dan format `"YYYY-MM"`.
  2. Tambahkan `formatIndonesianMonthYear()` untuk menyajikan nama bulan natural (misal: `"September 2026"`).
  3. Jadikan `CHART_SUBTITLE` adaptif dengan flag `isRange`.

#### BUG-136-02: Angka Desimal Liar 11 Digit (`192.437027027`), Salah Labeling, dan Pelanggaran Gestalt Proximity
- **Lokasi Kode:**
  - `src/components/monitoring/tabs/MonitoringRouteCardModern.tsx`
  - `src/constants/texts/text_monitoring.ts` (`ROUTE_CARD.LBL_CORE_KM_PER_BUS`, `TOTAL_KM_PREFIX`)
- **Tingkat Keparahan:** High (Keterbacaan Metrik & Ergonomi Informasi)
- **Deskripsi:**
  Pada kartu rute modern kolom ke-3:
  1. Nilai `kmPerBus` dirender mentah tanpa pembatasan desimal sehingga meluap menjadi `192.437027027`.
  2. Label kolom tertulis `KM Tempuh` padahal nilainya adalah rata-rata `KM / Bus`.
  3. Subteks di bawah KM Tempuh tertulis `Cap: 87.8%` yang sebenarnya adalah capaian penumpang, bukan efisiensi KM.
- **Dampak Pengguna:**
  Tampilan kartu berantakan, angka tumpah ke luar batas kolom, dan pengguna salah memahami angka 192.4 sebagai total jarak rute serta 87.8% sebagai capaian KM.
- **Mitigasi:**
  1. Batasi angka desimal operasional menjadi 1 digit desimal standar Indonesia (`formatDecimal(kmPerBus, 1)`).
  2. Ubah label kolom menjadi `KM / Bus`.
  3. Pindahkan persentase capaian target penumpang ke kolom **Pelanggan** tempat aslinya bernaung, dan gunakan subteks kolom KM / Bus untuk menampilkan `Total: XX.XXX km`.

#### BUG-136-03: "False Positive" & Apresiasi Palsu pada State Armada 0 Unit
- **Lokasi Kode:**
  - `src/components/monitoring/tabs/MonitoringFleetStatusTab.tsx`
  - `src/constants/texts/text_monitoring.ts` (`FLEET_TAB.NO_DATA_TITLE`, `NO_DATA_DESC`)
- **Tingkat Keparahan:** Medium - High (Integritas Operasional Lapangan)
- **Deskripsi:**
  Saat data shift armada belum ada atau belum ditarik (`stats.totalFleet === 0`), rasio SGO dihitung $0/0$ dan didefaultkan menjadi `100.0%`. Tab menampilkan kartu perisai hijau besar dengan pesan: *"Luar biasa! Seluruh armada 18 rute berstatus SGO tanpa kendala"*.
- **Dampak Pengguna:**
  Supervisor tertipu mengira seluruh armada beroperasi sempurna tanpa kendala, padahal data laporan belum diinput.
- **Mitigasi:**
  1. Jika `totalFleet === 0`, setel persentase SGO menjadi `0.0%`.
  2. Bedakan kondisi `stats.totalFleet === 0` (tampilkan *Empty State Netral* bertuliskan *"Belum Ada Data Status Armada"*) dengan kondisi armada riil beroperasi 100% SGO.

#### BUG-136-04: Floating Bottom Navigation Menabrak & Menutupi Elemen Terbawah Layar
- **Lokasi Kode:**
  - `src/components/monitoring/AllRouteMonitoringPage.tsx` (`<main>`)
- **Tingkat Keparahan:** Medium (Touch Ergonomics & Accessibility)
- **Deskripsi:**
  Floating Bottom Nav memiliki posisi `fixed` dengan z-index tinggi. Kontainer `<main>` tidak memiliki padding bawah yang cukup sehingga kartu terakhir pada tab Rute, item terbawah pada grafik, dan tombol `Rincian Rute Tim (6)` pada tab Korwil tertutup 70-80% oleh dock navigasi.
- **Dampak Pengguna:**
  Pengguna kesulitan atau tidak dapat men-tap tombol di bagian bawah tanpa tidak sengaja menyentuh tab navigasi.
- **Mitigasi:**
  Tambahkan `paddingBottom: "calc(96px + env(safe-area-inset-bottom, 0px))"` pada elemen `<main>`.

#### BUG-136-05: Inkonsistensi Formatting Angka Ribuan & Satuan Metrik di Tab Korwil
- **Lokasi Kode:**
  - `src/components/monitoring/tabs/MonitoringKorwilTab.tsx`
  - `src/constants/texts/text_monitoring.ts` (`KPI.FLEET_UNIT`, `PASSENGER_UNIT`)
- **Tingkat Keparahan:** Low - Medium (Kerapihan Visual & Standar UI)
- **Deskripsi:**
  Angka armada ditampilkan mentah tanpa titik pemisah ribuan (`16272 bus`, `5160 Bus`), sementara metrik jarak tempuh menggunakan pemisah (`3.172.095 km`). Terdapat pula perbedaan penulisan huruf besar/kecil (`bus` vs `Bus`, `Renops` vs `Ren`).
- **Dampak Pengguna:**
  Tampilan visual terkesan amatir dan tidak seragam antar kartu ringkasan.
- **Mitigasi:**
  1. Bungkus seluruh angka armada dan renops dengan `formatNumber()`.
  2. Standarisasi token kamus sentral `FLEET_UNIT` menjadi `"Bus"` dan `PASSENGER_UNIT` menjadi `"Org"`.

#### BUG-136-06: Cumulative Layout Shift (CLS) & Ketiadaan Tombol Tutup pada Tooltip Grafik TOA
- **Lokasi Kode:**
  - `src/components/monitoring/tabs/MonitoringToaBarChart.tsx`
  - `src/constants/texts/text_monitoring.ts` (`CHART_TOOLTIP_*`)
- **Tingkat Keparahan:** Medium - High (Stabilitas Tata Letak & Ergonomi Sentuh Mobile)
- **Deskripsi:**
  Saat salah satu batang grafik di-tap pada layar ponsel, kotak info tooltip disisipkan langsung di dalam flow normal dokumen di atas daftar batang rute. Hal ini memicu *Cumulative Layout Shift (CLS)* parah di mana seluruh 18 batang grafik terdorong ke bawah seketika, menggeser titik fokus pandangan dan posisi scroll pengguna. Selain itu, tidak tersedia tombol tutup `(X)` atau backdrop dismiss, sehingga pengguna di lapangan terpaksa harus menebak cara menutup info (harus men-tap ulang batang yang sama yang posisinya telah bergeser).
- **Dampak Pengguna:**
  Pengalaman pengguna terasa tersendat/kasar (*jarring*), elemen bergeser tiba-tiba saat disentuh, dan pengguna bingung cara menutup kotak detail tersebut.
- **Mitigasi:**
  1. Ubah tooltip inline menjadi **Floating Bottom Sheet** (anti-CLS) dengan backdrop semi-transparan `rgba(0,0,0,0.65)` dan efek `backdropFilter: blur(4px)`.
  2. Tambahkan tombol close `(X)` yang mudah di-tap serta dukungan klik di luar sheet (backdrop) untuk menutup.
  3. Sajikan data komprehensif dalam kartu 2-kolom: Total Pelanggan + Capaian Target HK serta Rincian per Shift (Shift 1 vs Shift 2).

#### BUG-136-07: Sempitnya Vertikal Toolbar, Chip Status Terpotong di Layar HP, & Hardcoded UI Strings di Tab Rute
- **Lokasi Kode:**
  - `src/components/monitoring/tabs/MonitoringRoutesTab.tsx`
  - `src/constants/texts/text_monitoring.ts` (`ROUTES_TAB`)
- **Tingkat Keparahan:** Medium (Responsivitas Mobile & Kepatuhan Arsitektur Kamus Sentral)
- **Deskripsi:**
  1. Pada viewport mobile sempit (lebar 360-390px), kolom Search dan tombol Bulk Verify memiliki ukuran bantalan terlalu besar (`padding: 9px...`), menyebabkan tombol membungkus ke bawah dan memakan tinggi vertikal secara berlebihan sebelum daftar rute terlihat.
  2. Kontainer horizontal scroll chip status filter tidak memiliki `paddingRight` dan tombol chip tidak memiliki `flexShrink: 0`, sehingga chip `Belum Lengkap (0)` dan `Terverifikasi (2)` terpotong di tepi kanan tanpa indikasi scroll yang baik.
  3. Seluruh teks antarmuka toolbar (placeholder pencarian, label chip filter, dan label Korlap) ditulis sebagai teks mentah (*hardcoded strings*) di file `.tsx`, melanggar aturan kamus sentral `src/constants/texts/`.
- **Dampak Pengguna:**
  Ruang pandang layar ponsel terbuang sia-sia untuk toolbar yang gemuk, status filter rute tidak terlihat utuh, dan berpotensi mengalami inkonsistensi terminologi.
- **Mitigasi:**
  1. Rampingkan tinggi kolom search dan tombol bulk verify (`padding: 8px 14px`, `fontSize: 12px`, `borderRadius: 10px`).
  2. Tambahkan `flexShrink: 0` pada setiap tombol filter dan `padding: "2px 16px 4px 0"` pada kontainer scroll agar chip terakhir bernapas lega.
  3. Migrasikan seluruh teks UI toolbar ke modul kamus sentral `TEXT_MONITORING.ROUTES_TAB`.

#### BUG-136-08: Risiko Desimal Liar & Tabrakan Gesture Bar pada Modal Detail 21 Metrik
- **Lokasi Kode:**
  - `src/components/monitoring/modals/MonitoringRouteDetailModal.tsx`
- **Tingkat Keparahan:** Medium (Presisi Angka & Ergonomi Sentuh Layar Penuh)
- **Deskripsi:**
  1. Nilai `kmPerBus` dan `ritasePerBus` di dalam modal dirender langsung tanpa proteksi desimal (`{kmPerBus}` dan `{ritasePerBus}`), berisiko memicu angka meluap seperti `192.437027027 KM` atau `3.3333333333333335 Rit/Bus` saat data rute dihitung dari akumulasi multi-hari.
  2. Footer sticky modal aksi bawah (`modal-btn-close`, `modal-btn-open-sheet`, `modal-btn-verify`) belum menggunakan `env(safe-area-inset-bottom)` dan `flexWrap: "wrap"`, menyebabkan tombol terbawah berisiko tertabrak gesture bar ponsel.
- **Dampak Pengguna:**
  Tampilan kartu metrik berantakan dan tombol verifikasi di footer modal sulit dijangkau di perangkat mobile modern.
- **Mitigasi:**
  1. Bungkus `kmPerBus` dengan pembulatan 1 desimal rapi (`displayKmPerBus`) dan `ritasePerBus` maksimal 2 desimal (`displayRitasePerBus`) tanpa merusak bilangan bulat maupun presisi desimal teruji.
  2. Tambahkan `padding: "12px 18px calc(12px + env(safe-area-inset-bottom, 0px))"` serta `flexWrap: "wrap"` pada footer sticky modal.

#### BUG-136-09: Hardcoded UI Strings & Ketiadaan Safe Padding Format Tabs di Tab Laporan WA
- **Lokasi Kode:**
  - `src/components/monitoring/tabs/MonitoringWaReportTab.tsx`
  - `src/constants/texts/text_wa_report.ts` (`STUDIO_TITLE`)
- **Tingkat Keparahan:** Low - Medium (Kepatuhan Kamus Sentral & UX Mobile Scroll)
- **Deskripsi:**
  1. Judul tab `Report Studio WhatsApp` ditulis sebagai string mentah hardcoded di file komponen `.tsx`.
  2. Kontainer pemilihan 3 format tab WA tidak memiliki `paddingRight` dan `flexShrink: 0`, sehingga tab ke-3 ("Format 3") menempel di tepi kanan layar saat discroll di mobile.
- **Dampak Pengguna:**
  Kurangnya ruang napas visual pada navigasi tab laporan WhatsApp dan pelanggaran aturan kamus sentral.
- **Mitigasi:**
  1. Daftarkan `STUDIO_TITLE: "Report Studio WhatsApp"` ke `src/constants/texts/text_wa_report.ts`.
  2. Tambahkan `flexShrink: 0`, `padding: "2px 16px 4px 0"`, dan `WebkitOverflowScrolling: "touch"` pada baris format tabs.
