# Laporan Audit UI/UX & Panduan Teknis Refactor Sistem Warna — SS-PDO / PUSM

**Tanggal:** 31 Oktober 2026 (WIB)  
**Repositori:** https://github.com/biiCode37/ss-pdo  
**Basis audit:** branch `devmode`, commit `158590fc9b2f60546d9cae65d6aae0884d660ffa` (30 Oktober 2026, 19:38:14 WIB).  
**Jenis pekerjaan:** audit kode dan rancangan refactor; kode aplikasi belum diubah, tidak ada commit/push/deploy.  
**Target:** aplikasi operasional internal dan monitoring armada dengan arah visual PT Transjakarta; tim solo, biaya tooling tambahan Rp0.

> **Keputusan utama:** pertahankan React + TypeScript + CSS custom properties. Perbaiki terlebih dahulu token yang hilang dan pasangan kontras yang gagal; selanjutnya pisahkan brand biru, aksi, status, dan grafik. Mengganti semua hijau menjadi biru secara global akan menimbulkan regresi.

## Cara membaca dan batas pembuktian

Laporan memisahkan **fakta kode**, **hasil perhitungan kontras**, **risiko yang memerlukan render**, dan **rekomendasi desain**. Inventaris menyapu seluruh 399 file `.ts/.tsx/.css` di `src` (277 produksi, 122 test), ditambah pemeriksaan `index.html`, `vite.config.ts`, aset publik, serta pencarian warna di `scripts/` dan `supabase/`. Dokumentasi historis, `graphify-out`, dependensi, lockfile, build output, dan contoh spreadsheet tidak dihitung sebagai sumber UI aktif.

Audit ini komprehensif pada inventaris sumber, tetapi **bukan sertifikasi WCAG seluruh aplikasi**. Rasio dihitung dari nilai sRGB pada kode, termasuk komposit alpha untuk pasangan terpilih. Belum dilakukan penjelajahan seluruh layar terautentikasi, keadaan data, posisi gradient, dan perangkat nyata. Percobaan render lokal terhalang ketersediaan Chromium/unduhan browser; tidak ada screenshot runtime yang diklaim sebagai bukti. Aset `app-logo.png`, `pwa-192x192.png`, dan `pwa-512x512.png` diperiksa visual; ketiganya menampilkan identitas hijau/neon yang sama. Perubahan cascade, backdrop, opacity induk, dan state interaksi tetap harus diuji setelah implementasi.

Angka baris dan tautan menunjuk commit di atas, bukan branch yang terus bergerak. Lampiran inventaris menampilkan lokasi setiap literal yang cocok dengan aturan scan, termasuk fallback; **kemunculan literal bukan otomatis bug**.

## 1. Ringkasan eksekutif audit warna

**Kondisi saat ini: fondasi parsial sudah ada, penerapan lintas fitur belum konsisten. Light Mode mempunyai masalah keterbacaan yang lebih berat daripada Dark Mode.**

| Aspek | Penilaian / 5 | Bukti dan makna |
|---|---:|---|
| Konsistensi sistem | 2 | Variabel dipakai luas, tetapi 119 file produksi tetap memuat literal; terdapat beberapa kosakata token yang tidak terhubung. |
| Sentralisasi arsitektur | 2 | `src/index.css` memiliki 34 deklarasi root, termasuk 1 easing; palette primitive terpisah dan pasangan `on-color` belum ada. |
| Keterbacaan Light | 1 | Modal dengan teks/latar `#171717` mencapai 1:1; CTA, status, dan KPI juga gagal pada pasangan yang dihitung. |
| Keterbacaan Dark | 3 | Teks dasar cukup baik; teks putih di tombol hijau dan ujung grafik transparan tetap bermasalah. |
| Kesesuaian arah brand | 1 | Identitas utama hijau/neon, logo raster hijau, favicon ungu; belum mengarah ke biru korporat yang diminta. |
| Kemudahan pemeliharaan | 2 | Inline style, HTML template modal, CSS `!important`, SVG, dan object status menyimpan keputusan warna terpisah. |

Skor ini **rubrik penilaian profesional**, bukan persentase kepatuhan WCAG: 0=tidak ada; 1=masalah inti; 2=parsial/sering menyimpang; 3=cukup dengan gap; 4=terpusat dan teruji; 5=terpusat, diawasi otomatis, dan dibuktikan lintas state. Tidak dibuat skor numerik “keprofesionalan” seolah ukuran ilmiah.

**Prioritas:** P0 pembacaan modal dan token tanpa definisi; P1 kontras tombol/status/input/grafik; P2 konsolidasi brand, role, surface, dan efek; P3 penguatan tooling dan aset nonkritis. P0/P1 di sini adalah prioritas UI, bukan label kerentanan keamanan.

## 2. Evaluasi arsitektur & konsistensi file warna

### 2.1 Apa yang sudah baik

- [`src/index.css:3`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/index.css#L3) mendefinisikan background, surface, teks, status, shift, dan KPI; override Light dimulai pada baris 54.
- Token `--shift1-action-text`, `--warning-text`, `--danger-text`, `--info-text` menunjukkan upaya memisahkan foreground yang lebih terbaca.
- `swalBase.ts` memiliki base class terpusat. Mekanisme tema memakai atribut `data-theme` pada `html`, sesuai kebutuhan portal modal di `body`.
- Bootstrap tema berjalan sebelum React (`index.html:17`); `useDashboardUiState.ts:57–80` menyimpan pilihan. Role badge dan login-info sheet mempunyai override Light yang harus dipertahankan sampai migrasi selesai.
- Teks utama dan sekunder pada surface dasar relatif baik. Audit tidak merekomendasikan menggelapkan semua teks atau menghilangkan seluruh warna.

### 2.2 Ukuran fragmentasi yang dapat direproduksi

| Metrik scan produksi `src` | Nilai | Catatan |
|---|---:|---|
| File sumber produksi | 277 | `.ts`, `.tsx`, `.css`; file `.test.*` dikeluarkan dari metrik produksi. |
| File dengan literal yang cocok | 119 | 43,0% dari 277; termasuk `transparent`, `currentColor`, fallback, komentar dan string template. |
| Kemunculan literal | 2.435 | Belum deduplikasi, bukan 2.435 cacat. |
| Nilai sintaks berbeda | 361 | Setelah lowercase; variasi spasi RGBA belum dinormalisasi menjadi warna optik yang sama. |
| Literal pada `src/index.css` | 340 | Banyak berada di aturan komponen, bukan deklarasi palette. |
| Literal di luar `src/index.css` | 2.095 | Termasuk 133 kemunculan `#3ecf8e` di seluruh produksi. |

Regex dasar: `#[0-9a-fA-F]{3,8}`, `rgb/rgba/hsl/hsla/oklch/color-mix(...)`, serta keyword `white/black/transparent/currentColor`. Ini inventaris leksikal, bukan parser CSS/TS lengkap; RGB object Google Sheets dan warna di data URI diperiksa terpisah. Nilai dinamis, warna bawaan browser, logo raster, dan default library tidak dapat dihitung sebagai literal hex dengan regex ini.

### 2.3 Akar masalah

1. **Token berperan ganda:** `--accent-color` untuk label, fill tombol, grafik, status konflik, hingga success-like highlight. Satu nilai tidak dapat sekaligus menjamin foreground di permukaan terang dan background untuk teks putih.
2. **Namespace liar:** `--card-bg`, `--bg-card`, `--bg-primary`, `--color-bg-elevated` beredar bersamaan. Fallback menyembunyikan token yang hilang dan menyisipkan dark-only surface pada Light.
3. **Pemisahan primitive/semantic belum ada:** komponen langsung menentukan emerald, sky, violet, amber, red, dan gradasinya. Tidak ada kontrak `text-on-action`/`status-foreground` yang diuji.
4. **Patch bertingkat:** role badge menyimpan warna di TSX lalu dilawan `!important` di CSS. Select Swal mempunyai beberapa deklarasi berulang, sehingga pembacaan satu blok saja dapat keliru.
5. **Theme ownership tersebar:** background shell, modal, chart, PWA, dan HTML template tidak berada dalam satu kontrak.

### 2.4 Token dipakai tetapi tidak ditemukan deklarasinya

Daftar berikut dipastikan melalui pencarian deklarasi CSS/TS dan penulisan `style.setProperty`. `--sticky-header-height` sengaja **tidak** dianggap hilang karena ditulis secara dinamis oleh `useDashboardData.ts:114`.

| Token tak terdefinisi | Jumlah pemakaian | Lokasi awal |
|---|---:|---|
| `--accent-bg` | 1 | [`src/components/dashboard/DashboardHeader.tsx:157`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/dashboard/DashboardHeader.tsx#L157) |
| `--accent-border` | 1 | [`src/components/dashboard/DashboardHeader.tsx:158`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/dashboard/DashboardHeader.tsx#L158) |
| `--bg-card` | 7 | [`src/components/dashboard/QueueModal.tsx:42`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/dashboard/QueueModal.tsx#L42), [`src/components/login/LegalModals.tsx:42`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/login/LegalModals.tsx#L42) |
| `--bg-glass` | 1 | [`src/components/pageManagement/PageManagementPage.tsx:72`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/pageManagement/PageManagementPage.tsx#L72) |
| `--bg-primary` | 4 | [`src/components/Skeletons.tsx:228`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/Skeletons.tsx#L228), [`src/components/Skeletons.tsx:333`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/Skeletons.tsx#L333) |
| `--bg-secondary` | 16 | [`src/components/monitoring/tabs/MonitoringRouteCardModern.tsx:208`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/monitoring/tabs/MonitoringRouteCardModern.tsx#L208), [`src/components/pageManagement/PageDisabledState.tsx:73`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/pageManagement/PageDisabledState.tsx#L73) |
| `--border-color` | 50 | [`src/components/busCard/modal/BusInputModalNotes.tsx:76`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/busCard/modal/BusInputModalNotes.tsx#L76), [`src/components/busCard/modal/BusInputModalNotes.tsx:224`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/busCard/modal/BusInputModalNotes.tsx#L224) |
| `--color-bg-elevated` | 4 | [`src/components/fleetStatus/QuickKorlapFleetModal.tsx:233`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/fleetStatus/QuickKorlapFleetModal.tsx#L233), [`src/components/pdoReport/A2ReportModal.tsx:343`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/pdoReport/A2ReportModal.tsx#L343) |
| `--color-border` | 20 | [`src/components/fleetStatus/QuickKorlapFleetModal.tsx:237`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/fleetStatus/QuickKorlapFleetModal.tsx#L237), [`src/components/fleetStatus/QuickKorlapFleetModal.tsx:247`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/fleetStatus/QuickKorlapFleetModal.tsx#L247) |
| `--color-primary` | 3 | [`src/components/busCard/modal/BusInputModalSingleFocus.tsx:44`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/busCard/modal/BusInputModalSingleFocus.tsx#L44), [`src/components/profileMenu/UserProfileHeader.tsx:107`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/profileMenu/UserProfileHeader.tsx#L107) |
| `--color-primary-bg` | 1 | [`src/components/profileMenu/UserProfileHeader.tsx:106`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/profileMenu/UserProfileHeader.tsx#L106) |
| `--color-text-main` | 3 | [`src/components/fleetStatus/QuickKorlapFleetModal.tsx:234`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/fleetStatus/QuickKorlapFleetModal.tsx#L234), [`src/components/pdoReport/A2ReportModal.tsx:344`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/pdoReport/A2ReportModal.tsx#L344) |
| `--color-text-muted` | 18 | [`src/components/fleetStatus/QuickKorlapFleetModal.tsx:261`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/fleetStatus/QuickKorlapFleetModal.tsx#L261), [`src/components/fleetStatus/QuickKorlapFleetModal.tsx:273`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/fleetStatus/QuickKorlapFleetModal.tsx#L273) |
| `--info-color` | 2 | [`src/components/pdoReport/ReportStatusBadge.tsx:36`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/pdoReport/ReportStatusBadge.tsx#L36), [`src/components/routeSelector/UnifiedRouteControlBar.tsx:146`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/routeSelector/UnifiedRouteControlBar.tsx#L146) |
| `--input-border` | 2 | [`src/components/routeSelector/AddRouteModal.tsx:253`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/routeSelector/AddRouteModal.tsx#L253), [`src/components/routeSelector/AddRouteModal.tsx:267`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/routeSelector/AddRouteModal.tsx#L267) |
| `--primary-color` | 3 | [`src/components/routeSelector/AddRouteModal.tsx:185`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/routeSelector/AddRouteModal.tsx#L185), [`src/components/routeSelector/AddRouteModal.tsx:203`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/routeSelector/AddRouteModal.tsx#L203) |
| `--shadow` | 1 | [`src/components/dashboard/QueueModal.tsx:50`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/dashboard/QueueModal.tsx#L50) |
| `--text-main` | 1 | [`src/components/profileMenu/UserProfileHeader.tsx:143`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/profileMenu/UserProfileHeader.tsx#L143) |
| `--warning-bg` | 1 | [`src/components/dashboard/DashboardContentTabs.tsx:103`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/dashboard/DashboardContentTabs.tsx#L103) |
| `--warning-border` | 1 | [`src/components/dashboard/DashboardContentTabs.tsx:104`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/dashboard/DashboardContentTabs.tsx#L104) |

`var(--bg-card)` tanpa fallback pada QueueModal menyebabkan deklarasi background menjadi tidak valid pada computed-value time; ModalShell tidak menyediakan background default. Ini risiko transparansi panel terhadap scrim dan konten di belakangnya. Sebaliknya `var(--color-bg-elevated,#1e293b)` + `var(--color-text-main,#f8fafc)` pada A2 tetap terbaca, tetapi tidak mengikuti Light. Jangan menyamakan dua kategori ini.

### 2.5 Modul penyumbang literal terbanyak

| File | Literal | Fokus refactor |
|---|---:|---|
| [`src/index.css`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/index.css) | 340 | Token global, cascade dan fokus |
| [`src/components/monitoring/modals/KorwilRouteDetailBottomSheet.tsx`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/monitoring/modals/KorwilRouteDetailBottomSheet.tsx) | 115 | Surface, foreground, badge, status dan state interaksi |
| [`src/components/monitoring/modals/MonitoringRouteDetailModal.tsx`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/monitoring/modals/MonitoringRouteDetailModal.tsx) | 99 | Surface, foreground, badge, status dan state interaksi |
| [`src/components/monitoring/tabs/MonitoringFleetStatusTab.tsx`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/monitoring/tabs/MonitoringFleetStatusTab.tsx) | 94 | Surface, foreground, badge, status dan state interaksi |
| [`src/components/UnitDetailModal.tsx`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/UnitDetailModal.tsx) | 84 | Surface, foreground, badge, status dan state interaksi |
| [`src/components/pdoReport/A2ReportModal.tsx`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/pdoReport/A2ReportModal.tsx) | 77 | Surface, foreground, badge, status dan state interaksi |
| [`src/components/monitoring/tabs/MonitoringKorwilTab.tsx`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/monitoring/tabs/MonitoringKorwilTab.tsx) | 73 | Surface, foreground, badge, status dan state interaksi |
| [`src/components/waReport/WaReportFormatTabs.tsx`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/waReport/WaReportFormatTabs.tsx) | 53 | Surface, foreground, badge, status dan state interaksi |
| [`src/components/monitoring/MonitoringRouteCard.tsx`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/monitoring/MonitoringRouteCard.tsx) | 46 | Surface, foreground, badge, status dan state interaksi |
| [`src/components/monitoring/MonthlySyncModal.tsx`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/monitoring/MonthlySyncModal.tsx) | 46 | Surface, foreground, badge, status dan state interaksi |
| [`src/components/busCard/modal/BusInputModalShift1.tsx`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/busCard/modal/BusInputModalShift1.tsx) | 44 | Surface, foreground, badge, status dan state interaksi |
| [`src/components/busCard/modal/notes/KeteranganPresetBar.tsx`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/busCard/modal/notes/KeteranganPresetBar.tsx) | 44 | Surface, foreground, badge, status dan state interaksi |
| [`src/components/monitoring/MonitoringPeriodSelector.tsx`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/monitoring/MonitoringPeriodSelector.tsx) | 44 | Surface, foreground, badge, status dan state interaksi |
| [`src/components/busCard/modal/BusInputModalShift2.tsx`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/busCard/modal/BusInputModalShift2.tsx) | 43 | Surface, foreground, badge, status dan state interaksi |
| [`src/components/monitoring/MonitoringMonthPickerModal.tsx`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/monitoring/MonitoringMonthPickerModal.tsx) | 42 | Surface, foreground, badge, status dan state interaksi |

## 3. Temuan masalah warna & dampak UX

### 3.1 Ambang yang dipakai

- WCAG 2.2 **1.4.3 (AA):** teks normal minimal 4,5:1; teks besar minimal 3:1. Besar berarti ≥24 CSS px reguler atau ≥18,67 CSS px tebal. Teks 18px tebal tetap diperlakukan sebagai teks normal.
- **1.4.6 (AAA):** 7:1 untuk teks normal; 4,5:1 untuk teks besar. Memenuhi satu pasangan AAA tidak membuat seluruh produk bersertifikasi AAA.
- **1.4.11 (AA):** visual yang diperlukan untuk mengidentifikasi kontrol/state dan bagian grafik yang diperlukan untuk memahami isi minimal 3:1 terhadap warna bersebelahan. Tidak setiap divider dekoratif wajib 3:1.
- **1.4.1:** warna tidak boleh menjadi satu-satunya pembeda informasi. Label angka, nama shift, kode status dan ikon tetap diperlukan.
- Disabled/inactive controls memiliki pengecualian kontras WCAG terkait; tetap diupayakan terbaca. Placeholder bukan disabled text.
- Fokus: dukung 2.4.7 (AA), 2.4.11 (AA: tidak sepenuhnya tertutup), dan jadikan 2.4.13 (AAA: Focus Appearance) sasaran tambahan. Jangan menyebut ketiganya sebagai kriteria AA yang sama.

### 3.2 Tabel temuan terprioritas

**Evidensi:** K=terlihat pada kode; H=rasio dihitung; R=masih memerlukan render/state nyata. Keparahan menggabungkan dampak tugas operasional, luas penggunaan, dan keterbacaan; efek dekoratif tidak dinilai sebagai pelanggaran WCAG tanpa bukti.

| ID / prioritas | Lokasi utama | Warna saat ini | Tema | Masalah & dampak | Perbaikan |
|---|---|---|---|---|---|
| **CLR-01** — P0 / tinggi | [`src/components/login/LegalModals.tsx:42`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/login/LegalModals.tsx#L42) | `#171717 latar + --text-primary=#171717` | Light | K/H: token --bg-card hilang; teks utama 1,00:1. Berlaku juga AddRouteModal:100, RouteSelectorSheet:116, ReportModalLayout:52. Pengguna tidak bisa membaca isi utama. | surface-raised + text-primary; hilangkan fallback dark |
| **CLR-02** — P0 / tinggi | [`src/components/pageManagement/PageManagementPage.tsx:61`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/pageManagement/PageManagementPage.tsx#L61) | `#0f172a + #171717` | Light | K/H: --bg-primary hilang. Teks yang langsung berada di shell hanya 1,004:1. UserManagementPage:254 dan Skeletons:228/333 memakai pola sama. Tidak semua kartu anak otomatis gagal karena punya background sendiri. | surface-canvas; audit setiap child background |
| **CLR-03** — P0 / tinggi | [`src/components/dashboard/QueueModal.tsx:42`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/dashboard/QueueModal.tsx#L42) | `var(--bg-card), --border-color, --shadow` | Keduanya | K/R: ketiga token tidak terdefinisi; panel dapat transparan. Kontras final tergantung scrim/konten belakang, tidak boleh diberi rasio tunggal. | surface-raised, border-subtle, shadow-elevated |
| **CLR-04** — P1 / tinggi | [`src/index.css:267`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/index.css#L267) | `#fff / #3ecf8e; #fff / #24b47e` | Keduanya | K/H: .btn = 2,00:1 Dark, 2,66:1 Light. .category-pill.active:578 sama. Kegagalan pada aksi utama, bukan masalah preferensi warna. | action-primary-bg + action-primary-fg |
| **CLR-05** — P1 / tinggi | [`src/index.css:715`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/index.css#L715) | `#fff / gradient #24b47e → #10b981` | Light | K/H: endpoint 2,66 dan 2,54:1 pada nav; .pdo-swal-confirm-btn:1643 2,66:1. Nav Dark menggunakan teks #061a10 yang jauh lebih baik, jangan dicap gagal karena sama-sama hijau. | selection tokens untuk nav; action tokens untuk Swal |
| **CLR-06** — P1 / tinggi | [`src/components/busCard/modal/BusInputModalFooter.tsx:71`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/busCard/modal/BusInputModalFooter.tsx#L71) | `#fff / #0284c7 → #0ea5e9` | Keduanya | K/H: endpoint 4,09→2,77:1; tombol Simpan kecil gagal. AccumulationFooter:95 menggunakan gradient yang sama. Gradien harus dinilai sepanjang area teks, bukan rerata warna. | solid action-primary-bg; explicit hover/pressed |
| **CLR-07** — P1 / tinggi | [`src/components/waReport/WaReportPreview.tsx:81`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/waReport/WaReportPreview.tsx#L81) | `#fff / #25d366` | Keduanya | K/H: CTA WhatsApp aktif 1,98:1. Tombol copied:54–56 memakai accent + putih, juga gagal. Identitas merek eksternal tidak mewajibkan tombol dengan teks rendah kontras. | button action; logo vendor sebagai pengecualian aset; atau teks gelap teruji |
| **CLR-08** — P1 / tinggi | [`src/index.css:179`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/index.css#L179) | `#fff / #f75555` | Keduanya | K/H: offline-banner 3,29:1 untuk 14px. DashboardStatusBanners:91–120 memakai pasangan dua arah yang sama; .error-text:551 hanya 3,29:1 pada putih. Light tidak override --danger-color. | error-fg/bg untuk banner; danger-fg/bg untuk aksi destruktif |
| **CLR-09** — P1 / tinggi | [`src/index.css:404`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/index.css#L404) | `#3ecf8e / rgba(16,185,129,.1); #f59e0b / rgba(245,158,11,.1)` | Light | K/H: .status-updated 1,82:1; .status-pending 1,99:1 pada putih. --success-color tidak dioverride Light. UnitCard:34/55 dan ReportStatusBadge:18/53 mengulang masalah status. | status success/warning foreground & container |
| **CLR-10** — P1 / tinggi | [`src/components/monitoring/monitoringUtils.ts:182`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/monitoring/monitoringUtils.ts#L182) | `OFF #f43f5e, TO #f59e0b, SO #a855f7, BA #fb923c, KEUR #38bdf8, TEKNIS #c084fc, OKB #60a5fa, RENOP #34d399, generic #fbbf24` | Light | K/H: foreground terang pada tint 15% putih menghasilkan 1,54–3,29:1 untuk teks kecil. Menjalar melalui badgeColor/badgeBg ke FleetStatusTab dan dua modal detail rute. | domain status → token semantik, pertahankan code/label |
| **CLR-11** — P1 / tinggi | [`src/components/KPICard.tsx:95`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/KPICard.tsx#L95) | `#38bdf8; #a78bfa / surface putih` | Light | K/H: 2,14 dan 2,72:1; .kpi-metric-value 18px belum teks besar. ShiftComparisonCard:61/139 memakai violet sama. MonitoringRouteCard:115/342 serta label sky lainnya ikut terdampak. | angka utama text-primary; label shift memakai shift-*-fg |
| **CLR-12** — P1 / tinggi | [`src/components/busCard/modal/BusInputModalShift2.tsx:116`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/busCard/modal/BusInputModalShift2.tsx#L116) | `#f87171 / red tint; #c084fc / purple tint` | Light | K/H/R: foreground dark-theme di panel input. SingleFocusKmShift1:123 dan SingleFocusKmShift2:149/169 memakai merah terang. Pesan invalid berisiko terlewat saat input odometer. | error-fg/error-bg; shift-2-fg/bg; verifikasi tint bertumpuk |
| **CLR-13** — P1 / tinggi | [`src/components/dailyToaTrend/ToaBarChart.tsx:68`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/dailyToaTrend/ToaBarChart.tsx#L68) | `#059669 @25%; #7f1d1d @30%; label #60a5fa` | Keduanya | K/H/R: ujung bawah hijau 1,36:1 terhadap putih; merah gelap 1,12:1 terhadap #171717. Label tanggal #60a5fa / putih 2,54:1. Grafik regional:170 masih gradient hijau fixed. | bar opaque chart tokens; outline/pattern/label; nilai tabel alternatif |
| **CLR-14** — P1 / tinggi | [`src/index.css:1761`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/index.css#L1761) | `--text-secondary dengan opacity .7` | Keduanya | K/H: placeholder Swal input sekitar 2,68:1 Light pada #f8fafc; 3,14:1 Dark pada komposit input. Teks sekunder dasar sendiri lulus; pengurangan opacity yang merusaknya. | text-muted opacity:1; ukur input computed background |
| **CLR-15** — P1 / sedang | [`src/index.css:319`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/index.css#L319) | `outline:none; focus border --accent-color` | Light terutama | K/H/R: accent Light 2,66:1 terhadap putih; card-border 8% hanya 1,20:1. Fokus tidak punya kontrak global. #swal-btn-switch-dropdown:2127 juga mematikan outline/shadow. | ring solid 2px offset 2px + border-control; uji keyboard dan sticky overlap |
| **CLR-16** — P2 / sedang | [`src/components/pdoReport/A2ReportModal.tsx:343`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/pdoReport/A2ReportModal.tsx#L343) | `#1e293b / #f8fafc fallback` | Light | K/H: pasangan 13,98:1, jadi bukan gagal teks. Namun modal tetap gelap saat tema Light. QuickKorlapFleetModal:233 dan namespace --color-* memperluas cabang tema terpisah. | surface-raised + text-primary; token yang sama dengan modal lain |
| **CLR-17** — P2 / sedang | [`src/components/userManagement/RoleBadge.tsx:35`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/userManagement/RoleBadge.tsx#L35) | `Superadmin amber/violet; Admin sky; Korwil indigo; Korlap orange` | Keduanya | K: header memakai Superadmin red, Admin purple, Korwil amber, Korlap blue (CSS:2209–2237). Makna role berubah antar lokasi. Light role badge sudah dioverride CSS:2178, tidak otomatis gagal dari inline hex. | satu role map, default neutral; icon + label; jangan pakai warna error untuk jabatan |
| **CLR-18** — P2 / sedang | [`src/index.css:43`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/index.css#L43) | `gradient putih→hijau; glow hijau; shadow .85` | Keduanya | K/R: title, nav, Satset, dan chart sama-sama menarik perhatian. Pada dashboard operasional hal ini menyaingi peringatan penting. “Norak” bukan metrik; masalahnya banyak aksen dan efek berkompetisi. | satu primary blue, surface netral, glow dihapus, shadow ringan |
| **CLR-19** — P2 / sedang | [`src/components/waReport/WaReportFormatTabs.tsx:79`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/waReport/WaReportFormatTabs.tsx#L79) | `#38bdf8 / tint sky; violet/amber fixed` | Light | K/H/R: selected tab teks sky gagal terhadap putih/tint; penggunaan banyak warna untuk opsi format biasa tidak membawa makna operasional. MonitoringPeriodSelector dan MonthPicker juga memiliki inline state color. | selected fg/bg + border-control + aria-selected |
| **CLR-20** — P2 / sedang | [`src/components/monitoring/tabs/MonitoringMacroKpiGrid.tsx:168`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/monitoring/tabs/MonitoringMacroKpiGrid.tsx#L168) | `#10b981; sky/amber/violet dekorasi` | Light | K/H/R: subtext kecil hijau kurang kontras; ikon KPI berwarna untuk tiap kategori memperbesar beban visual. Leaderboard:255/290 memakai amber/green yang sama. | nilai/label netral; warna hanya perubahan/status dengan ikon & label |
| **CLR-21** — P2 / sedang | [`src/components/login/LoginInfoAboutSection.tsx:51`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/login/LoginInfoAboutSection.tsx#L51) | `#3ecf8e / Light login-info sheet putih` | Light | K/H: teks hijau 2,00:1; LoginInfoComparisonSection:83/134 dan permissions juga hardcode hijau. Override surface login-info-sheet sudah benar, tetapi foreground belum mengikuti. | link atau success-fg sesuai makna; title teks solid |
| **CLR-22** — P2 / sedang | [`index.html:11`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/index.html#L11) | `#0b0f19/#f8fafc; PWA #0f172a; body #0c0c0c/#fff` | Keduanya | K: meta theme-color mengikuti OS, sedangkan UI dapat dipilih manual. color-scheme tidak disetel CSS. Browser chrome/native controls dapat tidak selaras tema aktual. | sinkronkan meta dari resolved surface; color-scheme sesuai html data-theme |
| **CLR-23** — P2 / sedang | [`public/favicon.svg:1`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/public/favicon.svg#L1) | `#863bff; app-logo raster hijau neon` | Keduanya | K/visual aset: favicon ungu tidak konsisten dengan logo login hijau maupun arah biru. PNG tidak berubah melalui CSS variables. icons.svg mengandung warna fixed, referensi runtime tidak ditemukan dalam src. | rencanakan aset biru datar terpisah; jangan recolor logo resmi/vendor via filter |
| **CLR-24** — P2 / sedang | [`src/utils/sheetColorUtils.ts:27`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/utils/sheetColorUtils.ts#L27) | `RGB fractional: sky, red, yellow, green` | Ekspor Sheets | K: status warna eksternal berbeda dari UI (OFF kuning di Sheets, merah di beberapa UI). Ini kontrak domain/data, bukan alasan untuk global replace hex. | pisahkan palette export; dokumentasikan mapping; jangan ubah payload/formula sebagai bagian refactor UI |
| **CLR-25** — P2 / sedang | [`src/constants/texts/text_alerts.ts:49`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/constants/texts/text_alerts.ts#L49) | `rgba(62,207,142,.08/.2)` | Keduanya | K: styling berada di kamus teks; HTML modal juga memuat primitive warna. Refactor komponen TSX saja tidak menutup sumber warna. | class/token pada template; pertahankan escaping/sanitasi dan fungsi kamus |
| **CLR-26** — P2 / sedang | [`src/index.css:2280`](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/index.css#L2280) | `opacity:.82 pada .bus-card-non-sgo` | Keduanya | K/R: opacity seluruh kartu menurunkan kontras teks dan badge, bukan sekadar dekorasi; teks sekunder dengan margin kelulusan kecil bisa gagal. | surface/status-off token; hindari opacity induk untuk informasi aktif |

### 3.3 Perhitungan kontras terpilih

Foreground (FG) dan background (BG) dinyatakan eksplisit. Untuk tint alpha, contoh ini mengasumsikan base putih atau #171717; ini skenario kode dasar, bukan pengukuran piksel semua layar. Komposit dihitung sebelum luminance, tanpa pembulatan sampai keputusan lulus/gagal. Hex komposit ditampilkan dibulatkan untuk keterbacaan; angka rasio memakai kanal pecahan asli. Rasio tampilan dibulatkan dua desimal, tetapi batas tidak dibulatkan naik.

| Pasangan / keadaan | Tema | FG | BG efektif | Rasio | AA teks normal |
|---|---|---|---|---:|---|
| Tombol .btn | Dark | `#FFFFFF` | `#3ECF8E` | 2.00:1 | Gagal |
| Tombol .btn / Swal | Light | `#FFFFFF` | `#24B47E` | 2.66:1 | Gagal |
| Nav aktif endpoint | Light | `#FFFFFF` | `#10B981` | 2.54:1 | Gagal |
| Banner error | Keduanya | `#FFFFFF` | `#F75555` | 3.29:1 | Gagal |
| Modal bg-card fallback | Light | `#171717` | `#171717` | 1.00:1 | Gagal |
| Halaman bg-primary fallback | Light | `#171717` | `#0F172A` | 1.00:1 | Gagal |
| Angka KPI sky | Light | `#38BDF8` | `#FFFFFF` | 2.14:1 | Gagal |
| Angka KPI violet | Light | `#A78BFA` | `#FFFFFF` | 2.72:1 | Gagal |
| Tanggal chart terpilih | Light | `#60A5FA` | `#FFFFFF` | 2.54:1 | Gagal |
| Simpan gradient awal | Keduanya | `#FFFFFF` | `#0284C7` | 4.10:1 | Gagal |
| Simpan gradient akhir | Keduanya | `#FFFFFF` | `#0EA5E9` | 2.77:1 | Gagal |
| Teks sekunder | Light | `#6B7280` | `#FFFFFF` | 4.83:1 | Lulus |
| Teks sekunder | Dark | `#8B8B8B` | `#171717` | 5.26:1 | Lulus |
| Shift 1 teks | Light | `#0284C7` | `#FFFFFF` | 4.10:1 | Gagal |
| Modal A2 fallback | Keduanya | `#F8FAFC` | `#1E293B` | 13.98:1 | Lulus |
| WhatsApp aktif | Keduanya | `#FFFFFF` | `#25D366` | 1.98:1 | Gagal |
| Badge sukses | Light | `#3ECF8E` | `#E7F8F2` | 1.82:1 | Gagal |
| Badge pending | Light | `#F59E0B` | `#FEF5E7` | 1.99:1 | Gagal |
| Badge infer TO | Light | `#F59E0B` | `#FEF0DA` | 1.92:1 | Gagal |
| Badge infer KEUR | Light | `#38BDF8` | `#E1F5FE` | 1.91:1 | Gagal |
| Badge infer TEKNIS | Light | `#C084FC` | `#F6EDFF` | 2.32:1 | Gagal |
| Badge infer RENOP | Light | `#34D399` | `#E1F8F0` | 1.73:1 | Gagal |
| Badge infer OFF | Light | `#F43F5E` | `#FDE2E7` | 3.01:1 | Gagal |
| Badge infer SO | Light | `#A855F7` | `#F2E6FE` | 3.29:1 | Gagal |
| Badge infer BA | Light | `#FB923C` | `#FEEFE2` | 2.01:1 | Gagal |
| Badge infer OKB | Light | `#60A5FA` | `#E7F2FE` | 2.24:1 | Gagal |
| Badge infer generic | Light | `#FBBF24` | `#FEF5DE` | 1.54:1 | Gagal |
| Placeholder Swal | Light | `#959BA5` | `#F8FAFC` | 2.67:1 | Gagal |
| Placeholder Swal | Dark | `#6A6A6A` | `#1C1C1C` | 3.14:1 | Gagal |

Untuk bar grafik dan batas kontrol, gunakan 3:1 jika visual tersebut diperlukan; jangan memakai kolom AA teks di atas untuk menghakimi dekorasi. `--text-secondary` Light #6B7280/putih = 4,83:1 dan Dark #8B8B8B/#171717 = 5,26:1: keduanya tidak perlu ditandai gagal tanpa memeriksa opacity/background tambahan.

**Pengecualian penting yang sudah ditelusuri:** `LoginInfoModal` memakai `.login-info-sheet`, yang mendapatkan surface putih `!important` pada Light; masalah latar gelap CLR-01 tidak berlaku pada panel ini. RoleBadge mendapat override Light, sedangkan label role pada header memiliki jalur CSS berbeda. Toast Swal juga menggunakan surface/text token terdefinisi.

## 4. Analisis tone & kesesuaian brand PT Transjakarta

### 4.1 Status kode brand

Situs resmi [Transjakarta](https://www.transjakarta.co.id/) dan [stylesheet kustom](https://www.transjakarta.co.id/aset/kustom.css) berhasil dibaca pada audit ini. CSS situs menggunakan `#06367C` untuk `#atas` (baris 87), `#0846A1` untuk `#bawah` (91), juga `#164EA1`/`#174DA1` di bagian lain. **Ini bukti implementasi web resmi, bukan bukti satu kode master brand dalam corporate identity manual.**

Rekomendasi aplikasi: **primary #0846A1**, secondary navy **#06367C**, Light tint **#EFF6FF**, Dark action **#93C5FD** dengan on-color **#0B1F3A**. Tidak ada klaim bahwa #93C5FD merupakan warna resmi logo. Jika pedoman identitas resmi tersedia kemudian, ganti primitive brand dan hitung ulang semua pasangan; jangan menyebarkan hex baru ke komponen.

### 4.2 Mengapa palet sekarang kurang tepat untuk brief

- Dominasi hijau `#3ECF8E`/`#24B47E` berasosiasi dengan keberhasilan di UI yang sama. Ketika tombol navigasi, capaian, konflik data, dan judul sama-sama hijau, hierarki pesan menjadi kabur.
- Sky, violet, orange, emerald, red, dan amber digunakan sekaligus untuk fitur, jabatan, shift, status, dan dekorasi. Jumlah hue bukan kesalahan sendiri; masalahnya pemetaan tidak stabil dan foreground tidak beradaptasi ke Light.
- Glow berwarna dan raster neon lebih ekspresif daripada kebutuhan operator memindai angka berjam-jam. Rekomendasi mengurangi glow didasarkan pada kompetisi perhatian, bukan klaim ilmiah bahwa warna tertentu “merusak mata”. Kenyamanan tetap dipengaruhi luminance layar, ukuran teks, glare, dan pencahayaan.
- Warna biru tidak otomatis menjadikan antarmuka profesional atau aksesibel. Kredibilitas datang dari hirarki, keterbacaan, kejelasan state, konsistensi mapping, dan kesesuaian aset.

### 4.3 Tolok ukur desain global yang diterapkan secara proporsional

Material Design 3 dan Apple HIG dipakai sebagai **acuan konseptual** tentang semantic role, surface, pasangan foreground/background, dan appearance, bukan sebagai kewajiban menyalin seluruh komponen platform. Halaman MD3 pada akses ini berupa shell JavaScript sehingga rincian konten terbarunya tidak dapat diverifikasi penuh. Apple HIG berhasil dibaca melalui [versi Markdown resmi](https://developer.apple.com/design/human-interface-guidelines/color.md): konsistensi makna warna, varian appearance, dan pengujian lintas pencahayaan mendukung arah refactor ini. Tidak ada klaim “tersertifikasi MD3/HIG”. DTCG 2025.10 dipakai sebagai arah pertukaran token bila kelak perlu JSON lintas tool; CSS variables sekarang lebih sederhana untuk solo dev.

**60–30–10 adalah heuristik komposisi, bukan standar WCAG, MD3, atau syarat corporate compliance.** Sasaran awal: sekitar 60% canvas/netral, 30% surface dan struktur, ≤10% aksen brand+status. Jangan menghitung frekuensi literal sebagai persentase luas layar. Ukur distribusi dari screenshot representatif setelah implementasi; pada tabel armada padat, surface netral dapat jauh di atas 90% dan tetap baik. Peringatan operasional tidak boleh disembunyikan demi mencapai angka 10%.

Dark Mode: canvas navy hampir hitam, lapisan surface sedikit lebih terang, teks off-white, aksen biru terang hanya pada area kecil, warna status berupa foreground pada container gelap. Tidak memakai gradient transparan/glow sebagai pembawa nilai. Background #000 murni tidak dilarang, tetapi dipilih #0B1220 agar lapisan panel lebih mudah dibedakan.

## 5. Rekomendasi sistem warna baru

### 5.1 Primitive/base palette — HEX, RGB, HSL

Seluruh nilai di bawah adalah sRGB. HSL hanya representasi alternatif, bukan jaminan kontras; angka HSL dibulatkan satu desimal. Implementasi menyimpan HEX sebagai sumber tunggal. Role bisnis tidak ditaruh pada nama primitive.

| Primitive | HEX | RGB | HSL |
|---|---|---|---|
| `--p-white` | `#FFFFFF` | `rgb(255, 255, 255)` | `hsl(0.0 0.0% 100.0%)` |
| `--p-blue-50` | `#EFF6FF` | `rgb(239, 246, 255)` | `hsl(213.8 100.0% 96.9%)` |
| `--p-blue-100` | `#DBEAFE` | `rgb(219, 234, 254)` | `hsl(214.3 94.6% 92.7%)` |
| `--p-blue-200` | `#BFDBFE` | `rgb(191, 219, 254)` | `hsl(213.3 96.9% 87.3%)` |
| `--p-blue-300` | `#93C5FD` | `rgb(147, 197, 253)` | `hsl(211.7 96.4% 78.4%)` |
| `--p-blue-400` | `#60A5FA` | `rgb(96, 165, 250)` | `hsl(213.1 93.9% 67.8%)` |
| `--p-blue-700` | `#0846A1` | `rgb(8, 70, 161)` | `hsl(215.7 90.5% 33.1%)` |
| `--p-blue-800` | `#06367C` | `rgb(6, 54, 124)` | `hsl(215.6 90.8% 25.5%)` |
| `--p-blue-950` | `#0B1F3A` | `rgb(11, 31, 58)` | `hsl(214.5 68.1% 13.5%)` |
| `--p-slate-50` | `#F8FAFC` | `rgb(248, 250, 252)` | `hsl(210.0 40.0% 98.0%)` |
| `--p-slate-100` | `#F1F5F9` | `rgb(241, 245, 249)` | `hsl(210.0 40.0% 96.1%)` |
| `--p-slate-200` | `#E2E8F0` | `rgb(226, 232, 240)` | `hsl(214.3 31.8% 91.4%)` |
| `--p-slate-300` | `#CBD5E1` | `rgb(203, 213, 225)` | `hsl(212.7 26.8% 83.9%)` |
| `--p-slate-400` | `#94A3B8` | `rgb(148, 163, 184)` | `hsl(215.0 20.2% 65.1%)` |
| `--p-slate-500` | `#64748B` | `rgb(100, 116, 139)` | `hsl(215.4 16.3% 46.9%)` |
| `--p-slate-600` | `#475569` | `rgb(71, 85, 105)` | `hsl(215.3 19.3% 34.5%)` |
| `--p-slate-700` | `#334155` | `rgb(51, 65, 85)` | `hsl(215.3 25.0% 26.7%)` |
| `--p-slate-900` | `#0F172A` | `rgb(15, 23, 42)` | `hsl(222.2 47.4% 11.2%)` |
| `--p-ink-950` | `#0B1220` | `rgb(11, 18, 32)` | `hsl(220.0 48.8% 8.4%)` |
| `--p-ink-900` | `#111C2E` | `rgb(17, 28, 46)` | `hsl(217.2 46.0% 12.4%)` |
| `--p-ink-850` | `#18263C` | `rgb(24, 38, 60)` | `hsl(216.7 42.9% 16.5%)` |
| `--p-ink-800` | `#22324A` | `rgb(34, 50, 74)` | `hsl(216.0 37.0% 21.2%)` |
| `--p-muted-light` | `#52627A` | `rgb(82, 98, 122)` | `hsl(216.0 19.6% 40.0%)` |
| `--p-muted-dark` | `#9AAAC0` | `rgb(154, 170, 192)` | `hsl(214.7 23.2% 67.8%)` |
| `--p-secondary-dark` | `#B6C2D3` | `rgb(182, 194, 211)` | `hsl(215.2 24.8% 77.1%)` |
| `--p-green-100` | `#DCFCE7` | `rgb(220, 252, 231)` | `hsl(140.6 84.2% 92.5%)` |
| `--p-green-300` | `#86EFAC` | `rgb(134, 239, 172)` | `hsl(141.7 76.6% 73.1%)` |
| `--p-green-800` | `#166534` | `rgb(22, 101, 52)` | `hsl(142.8 64.2% 24.1%)` |
| `--p-green-950` | `#103327` | `rgb(16, 51, 39)` | `hsl(159.4 52.2% 13.1%)` |
| `--p-amber-100` | `#FEF3C7` | `rgb(254, 243, 199)` | `hsl(48.0 96.5% 88.8%)` |
| `--p-amber-300` | `#FCD34D` | `rgb(252, 211, 77)` | `hsl(45.9 96.7% 64.5%)` |
| `--p-amber-800` | `#92400E` | `rgb(146, 64, 14)` | `hsl(22.7 82.5% 31.4%)` |
| `--p-amber-950` | `#3B2A12` | `rgb(59, 42, 18)` | `hsl(35.1 53.2% 15.1%)` |
| `--p-red-100` | `#FEE2E2` | `rgb(254, 226, 226)` | `hsl(0.0 93.3% 94.1%)` |
| `--p-red-300` | `#FCA5A5` | `rgb(252, 165, 165)` | `hsl(0.0 93.5% 81.8%)` |
| `--p-red-700` | `#B91C1C` | `rgb(185, 28, 28)` | `hsl(0.0 73.7% 41.8%)` |
| `--p-red-800` | `#991B1B` | `rgb(153, 27, 27)` | `hsl(0.0 70.0% 35.3%)` |
| `--p-red-950` | `#401D26` | `rgb(64, 29, 38)` | `hsl(344.6 37.6% 18.2%)` |
| `--p-info-800` | `#1E40AF` | `rgb(30, 64, 175)` | `hsl(225.9 70.7% 40.2%)` |
| `--p-info-950` | `#152D4A` | `rgb(21, 45, 74)` | `hsl(212.8 55.8% 18.6%)` |
| `--p-violet-100` | `#EDE9FE` | `rgb(237, 233, 254)` | `hsl(251.4 91.3% 95.5%)` |
| `--p-violet-300` | `#C4B5FD` | `rgb(196, 181, 253)` | `hsl(252.5 94.7% 85.1%)` |
| `--p-violet-700` | `#6D28D9` | `rgb(109, 40, 217)` | `hsl(263.4 70.0% 50.4%)` |
| `--p-violet-950` | `#2B2046` | `rgb(43, 32, 70)` | `hsl(257.4 37.3% 20.0%)` |

### 5.2 Semantic tokens — Light/Dark

Prefix semua role adalah `--color-`. Surface dan border tidak mempunyai rasio intrinsik; kontraknya ada di tabel pasangan setelah ini. Border-subtle hanya dekoratif/divider; input aktif gunakan border-control. Opaque containers dipilih untuk menghindari kontras yang berubah akibat backdrop modal.

| Semantic token | Light | Dark |
|---|---|---|
| `--color-surface-canvas` | `#F8FAFC` | `#0B1220` |
| `--color-surface-default` | `#FFFFFF` | `#111C2E` |
| `--color-surface-subtle` | `#F1F5F9` | `#18263C` |
| `--color-surface-raised` | `#FFFFFF` | `#22324A` |
| `--color-text-primary` | `#0F172A` | `#E2E8F0` |
| `--color-text-secondary` | `#475569` | `#B6C2D3` |
| `--color-text-muted` | `#52627A` | `#9AAAC0` |
| `--color-border-subtle` | `#CBD5E1` | `#334155` |
| `--color-border-control` | `#64748B` | `#94A3B8` |
| `--color-action-primary-bg` | `#0846A1` | `#93C5FD` |
| `--color-action-primary-fg` | `#FFFFFF` | `#0B1F3A` |
| `--color-action-primary-hover` | `#06367C` | `#BFDBFE` |
| `--color-action-primary-pressed` | `#0B1F3A` | `#60A5FA` |
| `--color-action-secondary-bg` | `#EFF6FF` | `#152D4A` |
| `--color-action-secondary-fg` | `#06367C` | `#93C5FD` |
| `--color-link` | `#0846A1` | `#93C5FD` |
| `--color-focus-ring` | `#0846A1` | `#93C5FD` |
| `--color-selection-bg` | `#DBEAFE` | `#152D4A` |
| `--color-selection-fg` | `#06367C` | `#93C5FD` |
| `--color-success-bg` | `#DCFCE7` | `#103327` |
| `--color-success-fg` | `#166534` | `#86EFAC` |
| `--color-warning-bg` | `#FEF3C7` | `#3B2A12` |
| `--color-warning-fg` | `#92400E` | `#FCD34D` |
| `--color-error-bg` | `#FEE2E2` | `#401D26` |
| `--color-error-fg` | `#B91C1C` | `#FCA5A5` |
| `--color-info-bg` | `#DBEAFE` | `#152D4A` |
| `--color-info-fg` | `#1E40AF` | `#93C5FD` |
| `--color-danger-bg` | `#B91C1C` | `#FCA5A5` |
| `--color-danger-fg` | `#FFFFFF` | `#401D26` |
| `--color-danger-hover` | `#991B1B` | `#FEE2E2` |
| `--color-disabled-bg` | `#E2E8F0` | `#334155` |
| `--color-disabled-fg` | `#475569` | `#CBD5E1` |
| `--color-chart-1` | `#0846A1` | `#93C5FD` |
| `--color-chart-2` | `#6D28D9` | `#C4B5FD` |
| `--color-chart-total` | `#475569` | `#B6C2D3` |
| `--color-shift-1-bg` | `#EFF6FF` | `#152D4A` |
| `--color-shift-1-fg` | `#06367C` | `#93C5FD` |
| `--color-shift-2-bg` | `#EDE9FE` | `#2B2046` |
| `--color-shift-2-fg` | `#6D28D9` | `#C4B5FD` |
| `--color-role-bg` | `#F1F5F9` | `#18263C` |
| `--color-role-fg` | `#475569` | `#B6C2D3` |
| `--color-status-off-bg` | `#F1F5F9` | `#18263C` |
| `--color-status-off-fg` | `#475569` | `#B6C2D3` |

`--color-overlay` = `rgb(0 0 0 / 0.56)` untuk scrim, bukan panel teks. Shadow netral Light `rgb(15 23 42 / .12)`, Dark `rgb(0 0 0 / .32)`. Shadow tidak dipakai sebagai satu-satunya batas kontrol. Disabled memiliki pasangan tersendiri; gunakan atribut `disabled`/`aria-disabled` yang sesuai, bukan warna saja.

### 5.3 Kontrak rasio untuk pasangan yang direkomendasikan

Tabel ini merupakan hasil hitung otomatis dari primitive dan mapping di atas. Semua teks wajib AA normal; target teks utama/sekunder yang mencapai ≥7 dicatat AAA pasangan. Kontrak surface ditulis untuk setiap surface agar perubahan elevation tidak luput.

| Tema | FG token / HEX | BG token / HEX | Rasio | Ambang & hasil |
|---|---|---|---:|---|
| Light | `text-primary` `#0F172A` | `surface-canvas` `#F8FAFC` | 17.06:1 | ≥4.5:1 lulus • AAA normal |
| Light | `text-primary` `#0F172A` | `surface-default` `#FFFFFF` | 17.85:1 | ≥4.5:1 lulus • AAA normal |
| Light | `text-primary` `#0F172A` | `surface-subtle` `#F1F5F9` | 16.30:1 | ≥4.5:1 lulus • AAA normal |
| Light | `text-primary` `#0F172A` | `surface-raised` `#FFFFFF` | 17.85:1 | ≥4.5:1 lulus • AAA normal |
| Light | `text-secondary` `#475569` | `surface-canvas` `#F8FAFC` | 7.24:1 | ≥4.5:1 lulus • AAA normal |
| Light | `text-secondary` `#475569` | `surface-default` `#FFFFFF` | 7.58:1 | ≥4.5:1 lulus • AAA normal |
| Light | `text-secondary` `#475569` | `surface-subtle` `#F1F5F9` | 6.92:1 | ≥4.5:1 lulus |
| Light | `text-secondary` `#475569` | `surface-raised` `#FFFFFF` | 7.58:1 | ≥4.5:1 lulus • AAA normal |
| Light | `text-muted` `#52627A` | `surface-canvas` `#F8FAFC` | 5.93:1 | ≥4.5:1 lulus |
| Light | `text-muted` `#52627A` | `surface-default` `#FFFFFF` | 6.20:1 | ≥4.5:1 lulus |
| Light | `text-muted` `#52627A` | `surface-subtle` `#F1F5F9` | 5.66:1 | ≥4.5:1 lulus |
| Light | `text-muted` `#52627A` | `surface-raised` `#FFFFFF` | 6.20:1 | ≥4.5:1 lulus |
| Light | `link` `#0846A1` | `surface-canvas` `#F8FAFC` | 8.36:1 | ≥4.5:1 lulus • AAA normal |
| Light | `link` `#0846A1` | `surface-default` `#FFFFFF` | 8.75:1 | ≥4.5:1 lulus • AAA normal |
| Light | `link` `#0846A1` | `surface-subtle` `#F1F5F9` | 7.98:1 | ≥4.5:1 lulus • AAA normal |
| Light | `link` `#0846A1` | `surface-raised` `#FFFFFF` | 8.75:1 | ≥4.5:1 lulus • AAA normal |
| Light | `action-primary-fg` `#FFFFFF` | `action-primary-bg` `#0846A1` | 8.75:1 | ≥4.5:1 lulus • AAA normal |
| Light | `action-primary-fg` `#FFFFFF` | `action-primary-hover` `#06367C` | 11.50:1 | ≥4.5:1 lulus • AAA normal |
| Light | `action-primary-fg` `#FFFFFF` | `action-primary-pressed` `#0B1F3A` | 16.52:1 | ≥4.5:1 lulus • AAA normal |
| Light | `action-secondary-fg` `#06367C` | `action-secondary-bg` `#EFF6FF` | 10.56:1 | ≥4.5:1 lulus • AAA normal |
| Light | `selection-fg` `#06367C` | `selection-bg` `#DBEAFE` | 9.42:1 | ≥4.5:1 lulus • AAA normal |
| Light | `success-fg` `#166534` | `success-bg` `#DCFCE7` | 6.49:1 | ≥4.5:1 lulus |
| Light | `warning-fg` `#92400E` | `warning-bg` `#FEF3C7` | 6.37:1 | ≥4.5:1 lulus |
| Light | `error-fg` `#B91C1C` | `error-bg` `#FEE2E2` | 5.30:1 | ≥4.5:1 lulus |
| Light | `info-fg` `#1E40AF` | `info-bg` `#DBEAFE` | 7.15:1 | ≥4.5:1 lulus • AAA normal |
| Light | `danger-fg` `#FFFFFF` | `danger-bg` `#B91C1C` | 6.47:1 | ≥4.5:1 lulus |
| Light | `danger-fg` `#FFFFFF` | `danger-hover` `#991B1B` | 8.31:1 | ≥4.5:1 lulus • AAA normal |
| Light | `shift-1-fg` `#06367C` | `shift-1-bg` `#EFF6FF` | 10.56:1 | ≥4.5:1 lulus • AAA normal |
| Light | `shift-2-fg` `#6D28D9` | `shift-2-bg` `#EDE9FE` | 5.98:1 | ≥4.5:1 lulus |
| Light | `role-fg` `#475569` | `role-bg` `#F1F5F9` | 6.92:1 | ≥4.5:1 lulus |
| Light | `status-off-fg` `#475569` | `status-off-bg` `#F1F5F9` | 6.92:1 | ≥4.5:1 lulus |
| Light | `disabled-fg` `#475569` | `disabled-bg` `#E2E8F0` | 6.15:1 | ≥4.5:1 lulus |
| Light | `border-control` `#64748B` | `surface-canvas` `#F8FAFC` | 4.55:1 | ≥3:1 lulus |
| Light | `border-control` `#64748B` | `surface-default` `#FFFFFF` | 4.76:1 | ≥3:1 lulus |
| Light | `border-control` `#64748B` | `surface-subtle` `#F1F5F9` | 4.34:1 | ≥3:1 lulus |
| Light | `border-control` `#64748B` | `surface-raised` `#FFFFFF` | 4.76:1 | ≥3:1 lulus |
| Light | `focus-ring` `#0846A1` | `surface-canvas` `#F8FAFC` | 8.36:1 | ≥3:1 lulus |
| Light | `focus-ring` `#0846A1` | `surface-default` `#FFFFFF` | 8.75:1 | ≥3:1 lulus |
| Light | `focus-ring` `#0846A1` | `surface-subtle` `#F1F5F9` | 7.98:1 | ≥3:1 lulus |
| Light | `focus-ring` `#0846A1` | `surface-raised` `#FFFFFF` | 8.75:1 | ≥3:1 lulus |
| Light | `chart-1` `#0846A1` | `surface-canvas` `#F8FAFC` | 8.36:1 | ≥3:1 lulus |
| Light | `chart-1` `#0846A1` | `surface-default` `#FFFFFF` | 8.75:1 | ≥3:1 lulus |
| Light | `chart-1` `#0846A1` | `surface-subtle` `#F1F5F9` | 7.98:1 | ≥3:1 lulus |
| Light | `chart-1` `#0846A1` | `surface-raised` `#FFFFFF` | 8.75:1 | ≥3:1 lulus |
| Light | `chart-2` `#6D28D9` | `surface-canvas` `#F8FAFC` | 6.79:1 | ≥3:1 lulus |
| Light | `chart-2` `#6D28D9` | `surface-default` `#FFFFFF` | 7.10:1 | ≥3:1 lulus |
| Light | `chart-2` `#6D28D9` | `surface-subtle` `#F1F5F9` | 6.49:1 | ≥3:1 lulus |
| Light | `chart-2` `#6D28D9` | `surface-raised` `#FFFFFF` | 7.10:1 | ≥3:1 lulus |
| Light | `chart-total` `#475569` | `surface-canvas` `#F8FAFC` | 7.24:1 | ≥3:1 lulus |
| Light | `chart-total` `#475569` | `surface-default` `#FFFFFF` | 7.58:1 | ≥3:1 lulus |
| Light | `chart-total` `#475569` | `surface-subtle` `#F1F5F9` | 6.92:1 | ≥3:1 lulus |
| Light | `chart-total` `#475569` | `surface-raised` `#FFFFFF` | 7.58:1 | ≥3:1 lulus |
| Dark | `text-primary` `#E2E8F0` | `surface-canvas` `#0B1220` | 15.19:1 | ≥4.5:1 lulus • AAA normal |
| Dark | `text-primary` `#E2E8F0` | `surface-default` `#111C2E` | 13.86:1 | ≥4.5:1 lulus • AAA normal |
| Dark | `text-primary` `#E2E8F0` | `surface-subtle` `#18263C` | 12.33:1 | ≥4.5:1 lulus • AAA normal |
| Dark | `text-primary` `#E2E8F0` | `surface-raised` `#22324A` | 10.49:1 | ≥4.5:1 lulus • AAA normal |
| Dark | `text-secondary` `#B6C2D3` | `surface-canvas` `#0B1220` | 10.38:1 | ≥4.5:1 lulus • AAA normal |
| Dark | `text-secondary` `#B6C2D3` | `surface-default` `#111C2E` | 9.47:1 | ≥4.5:1 lulus • AAA normal |
| Dark | `text-secondary` `#B6C2D3` | `surface-subtle` `#18263C` | 8.43:1 | ≥4.5:1 lulus • AAA normal |
| Dark | `text-secondary` `#B6C2D3` | `surface-raised` `#22324A` | 7.18:1 | ≥4.5:1 lulus • AAA normal |
| Dark | `text-muted` `#9AAAC0` | `surface-canvas` `#0B1220` | 7.92:1 | ≥4.5:1 lulus • AAA normal |
| Dark | `text-muted` `#9AAAC0` | `surface-default` `#111C2E` | 7.23:1 | ≥4.5:1 lulus • AAA normal |
| Dark | `text-muted` `#9AAAC0` | `surface-subtle` `#18263C` | 6.43:1 | ≥4.5:1 lulus |
| Dark | `text-muted` `#9AAAC0` | `surface-raised` `#22324A` | 5.47:1 | ≥4.5:1 lulus |
| Dark | `link` `#93C5FD` | `surface-canvas` `#0B1220` | 10.38:1 | ≥4.5:1 lulus • AAA normal |
| Dark | `link` `#93C5FD` | `surface-default` `#111C2E` | 9.47:1 | ≥4.5:1 lulus • AAA normal |
| Dark | `link` `#93C5FD` | `surface-subtle` `#18263C` | 8.43:1 | ≥4.5:1 lulus • AAA normal |
| Dark | `link` `#93C5FD` | `surface-raised` `#22324A` | 7.17:1 | ≥4.5:1 lulus • AAA normal |
| Dark | `action-primary-fg` `#0B1F3A` | `action-primary-bg` `#93C5FD` | 9.16:1 | ≥4.5:1 lulus • AAA normal |
| Dark | `action-primary-fg` `#0B1F3A` | `action-primary-hover` `#BFDBFE` | 11.62:1 | ≥4.5:1 lulus • AAA normal |
| Dark | `action-primary-fg` `#0B1F3A` | `action-primary-pressed` `#60A5FA` | 6.50:1 | ≥4.5:1 lulus |
| Dark | `action-secondary-fg` `#93C5FD` | `action-secondary-bg` `#152D4A` | 7.73:1 | ≥4.5:1 lulus • AAA normal |
| Dark | `selection-fg` `#93C5FD` | `selection-bg` `#152D4A` | 7.73:1 | ≥4.5:1 lulus • AAA normal |
| Dark | `success-fg` `#86EFAC` | `success-bg` `#103327` | 9.81:1 | ≥4.5:1 lulus • AAA normal |
| Dark | `warning-fg` `#FCD34D` | `warning-bg` `#3B2A12` | 9.54:1 | ≥4.5:1 lulus • AAA normal |
| Dark | `error-fg` `#FCA5A5` | `error-bg` `#401D26` | 7.78:1 | ≥4.5:1 lulus • AAA normal |
| Dark | `info-fg` `#93C5FD` | `info-bg` `#152D4A` | 7.73:1 | ≥4.5:1 lulus • AAA normal |
| Dark | `danger-fg` `#401D26` | `danger-bg` `#FCA5A5` | 7.78:1 | ≥4.5:1 lulus • AAA normal |
| Dark | `danger-fg` `#401D26` | `danger-hover` `#FEE2E2` | 12.09:1 | ≥4.5:1 lulus • AAA normal |
| Dark | `shift-1-fg` `#93C5FD` | `shift-1-bg` `#152D4A` | 7.73:1 | ≥4.5:1 lulus • AAA normal |
| Dark | `shift-2-fg` `#C4B5FD` | `shift-2-bg` `#2B2046` | 8.14:1 | ≥4.5:1 lulus • AAA normal |
| Dark | `role-fg` `#B6C2D3` | `role-bg` `#18263C` | 8.43:1 | ≥4.5:1 lulus • AAA normal |
| Dark | `status-off-fg` `#B6C2D3` | `status-off-bg` `#18263C` | 8.43:1 | ≥4.5:1 lulus • AAA normal |
| Dark | `disabled-fg` `#CBD5E1` | `disabled-bg` `#334155` | 6.97:1 | ≥4.5:1 lulus |
| Dark | `border-control` `#94A3B8` | `surface-canvas` `#0B1220` | 7.30:1 | ≥3:1 lulus |
| Dark | `border-control` `#94A3B8` | `surface-default` `#111C2E` | 6.66:1 | ≥3:1 lulus |
| Dark | `border-control` `#94A3B8` | `surface-subtle` `#18263C` | 5.93:1 | ≥3:1 lulus |
| Dark | `border-control` `#94A3B8` | `surface-raised` `#22324A` | 5.05:1 | ≥3:1 lulus |
| Dark | `focus-ring` `#93C5FD` | `surface-canvas` `#0B1220` | 10.38:1 | ≥3:1 lulus |
| Dark | `focus-ring` `#93C5FD` | `surface-default` `#111C2E` | 9.47:1 | ≥3:1 lulus |
| Dark | `focus-ring` `#93C5FD` | `surface-subtle` `#18263C` | 8.43:1 | ≥3:1 lulus |
| Dark | `focus-ring` `#93C5FD` | `surface-raised` `#22324A` | 7.17:1 | ≥3:1 lulus |
| Dark | `chart-1` `#93C5FD` | `surface-canvas` `#0B1220` | 10.38:1 | ≥3:1 lulus |
| Dark | `chart-1` `#93C5FD` | `surface-default` `#111C2E` | 9.47:1 | ≥3:1 lulus |
| Dark | `chart-1` `#93C5FD` | `surface-subtle` `#18263C` | 8.43:1 | ≥3:1 lulus |
| Dark | `chart-1` `#93C5FD` | `surface-raised` `#22324A` | 7.17:1 | ≥3:1 lulus |
| Dark | `chart-2` `#C4B5FD` | `surface-canvas` `#0B1220` | 10.14:1 | ≥3:1 lulus |
| Dark | `chart-2` `#C4B5FD` | `surface-default` `#111C2E` | 9.25:1 | ≥3:1 lulus |
| Dark | `chart-2` `#C4B5FD` | `surface-subtle` `#18263C` | 8.23:1 | ≥3:1 lulus |
| Dark | `chart-2` `#C4B5FD` | `surface-raised` `#22324A` | 7.01:1 | ≥3:1 lulus |
| Dark | `chart-total` `#B6C2D3` | `surface-canvas` `#0B1220` | 10.38:1 | ≥3:1 lulus |
| Dark | `chart-total` `#B6C2D3` | `surface-default` `#111C2E` | 9.47:1 | ≥3:1 lulus |
| Dark | `chart-total` `#B6C2D3` | `surface-subtle` `#18263C` | 8.43:1 | ≥3:1 lulus |
| Dark | `chart-total` `#B6C2D3` | `surface-raised` `#22324A` | 7.18:1 | ≥3:1 lulus |

Keterbatasan kontrak: teks primer jangan ditempatkan di fill tombol tanpa on-color; foreground status hanya dijamin pada container pasangannya. Warna chart berbeda belum otomatis berbeda ≥3:1 satu sama lain: jika area bersentuhan, gunakan pemisah surface, pola, atau label langsung. Ring fokus dengan offset dikelilingi surface netral; jangan membiarkannya bersentuhan langsung dengan fill yang sama.

### 5.4 Mapping domain yang disarankan

| Makna | Token | Aturan |
|---|---|---|
| Aksi utama simpan/sinkronisasi | action-primary | Biru; satu CTA dominan per kelompok tugas. |
| Aksi destruktif/hapus/paksa timpa | danger | Label eksplisit, konfirmasi tetap mengikuti kebutuhan data. |
| Berhasil tersimpan/target tercapai | success | Ikon centang + teks; tidak untuk semua angka positif. |
| Antrean/konflik/belum lengkap | warning | Ikon/jumlah/label; konflik tidak memakai warna brand untuk menyamarkan risiko. |
| Gagal/invalid | error | Pesan tekstual dan kaitkan input via aria-describedby. |
| Informasi netral/sinkronisasi berjalan | info | Tidak dipakai untuk “berhasil”. |
| Shift 1 / Shift 2 | shift-1 / shift-2 | Biru/violet, label S1/S2 tetap tampil; tidak berarti aman/bahaya. |
| Total penumpang/KM/ritase | text-primary atau chart-total | Nilai total bukan otomatis success. |
| Jabatan/peran | role | Neutral badge + ikon + nama; bila warna peran dipertahankan, satu mapping untuk header/badge. |
| OFF/libur | status-off | Usulan netral bila berarti tidak dijadwalkan; jangan mengubah arti bisnis. OFF tak terencana dapat membutuhkan warning sesuai definisi operasi. |
| TO, SO, BA, KEUR, TEKNIS, RENOP | domain code → severity yang terdokumentasi | Pertahankan kode; jangan menebak tingkat risiko dari nama. Gunakan warning/error/info setelah validasi aturan bisnis, bukan random hue. |
| WhatsApp / Google / logo resmi | external brand asset | Logo asli tetap; label tombol memakai pasangan aksesibel. |

## 6. Panduan solusi refactor kode

### 6.1 Struktur yang sesuai stack dan budget

```text
src/styles/tokens/primitives.css
src/styles/tokens/semantic.css
src/styles/tokens/legacy.css         # jembatan sementara, ada tenggat hapus
src/styles/components/actions.css
src/styles/components/status.css
src/styles/components/forms.css
src/styles/components/charts.css
src/styles/tokens/color-contract.test.ts
src/constants/domainStatus.ts       # code/severity; tanpa HEX
```

Tidak perlu Tailwind, MUI, framework token berbayar, atau generator tambahan. Class bernama `text-emerald-700` pada RoleBadge bukan bukti Tailwind terpasang; package.json tidak memuat Tailwind. Komponen tetap React + style/class biasa. Bila Figma/native app diperlukan kemudian, buat DTCG `$type: "color"` dan nilai sRGB secara terstruktur, lalu generate CSS; jangan memelihara palette CSS dan JSON manual sekaligus.

### 6.2 File primitive siap pakai

Simpan sebagai `src/styles/tokens/primitives.css`:

```css
/* Primitive palette: satu-satunya sumber literal warna UI. */
:root {
  --p-white: #FFFFFF;
  --p-blue-50: #EFF6FF;
  --p-blue-100: #DBEAFE;
  --p-blue-200: #BFDBFE;
  --p-blue-300: #93C5FD;
  --p-blue-400: #60A5FA;
  --p-blue-700: #0846A1;
  --p-blue-800: #06367C;
  --p-blue-950: #0B1F3A;
  --p-slate-50: #F8FAFC;
  --p-slate-100: #F1F5F9;
  --p-slate-200: #E2E8F0;
  --p-slate-300: #CBD5E1;
  --p-slate-400: #94A3B8;
  --p-slate-500: #64748B;
  --p-slate-600: #475569;
  --p-slate-700: #334155;
  --p-slate-900: #0F172A;
  --p-ink-950: #0B1220;
  --p-ink-900: #111C2E;
  --p-ink-850: #18263C;
  --p-ink-800: #22324A;
  --p-muted-light: #52627A;
  --p-muted-dark: #9AAAC0;
  --p-secondary-dark: #B6C2D3;
  --p-green-100: #DCFCE7;
  --p-green-300: #86EFAC;
  --p-green-800: #166534;
  --p-green-950: #103327;
  --p-amber-100: #FEF3C7;
  --p-amber-300: #FCD34D;
  --p-amber-800: #92400E;
  --p-amber-950: #3B2A12;
  --p-red-100: #FEE2E2;
  --p-red-300: #FCA5A5;
  --p-red-700: #B91C1C;
  --p-red-800: #991B1B;
  --p-red-950: #401D26;
  --p-info-800: #1E40AF;
  --p-info-950: #152D4A;
  --p-violet-100: #EDE9FE;
  --p-violet-300: #C4B5FD;
  --p-violet-700: #6D28D9;
  --p-violet-950: #2B2046;
  --p-overlay: rgb(0 0 0 / 0.56);
  --p-shadow-light: rgb(15 23 42 / 0.12);
  --p-shadow-dark: rgb(0 0 0 / 0.32);
}
```

### 6.3 File semantic siap pakai

Simpan sebagai `src/styles/tokens/semantic.css`. Root fallback Light; pilihan bootstrap yang valid tetap mengalahkannya. Jangan menyisipkan blok ini lalu berharap seluruh komponen lama otomatis bermigrasi.

```css
:root, :root[data-theme="light"] {
  color-scheme: light;
  --color-surface-canvas: var(--p-slate-50);
  --color-surface-default: var(--p-white);
  --color-surface-subtle: var(--p-slate-100);
  --color-surface-raised: var(--p-white);
  --color-text-primary: var(--p-slate-900);
  --color-text-secondary: var(--p-slate-600);
  --color-text-muted: var(--p-muted-light);
  --color-border-subtle: var(--p-slate-300);
  --color-border-control: var(--p-slate-500);
  --color-action-primary-bg: var(--p-blue-700);
  --color-action-primary-fg: var(--p-white);
  --color-action-primary-hover: var(--p-blue-800);
  --color-action-primary-pressed: var(--p-blue-950);
  --color-action-secondary-bg: var(--p-blue-50);
  --color-action-secondary-fg: var(--p-blue-800);
  --color-link: var(--p-blue-700);
  --color-focus-ring: var(--p-blue-700);
  --color-selection-bg: var(--p-blue-100);
  --color-selection-fg: var(--p-blue-800);
  --color-success-bg: var(--p-green-100);
  --color-success-fg: var(--p-green-800);
  --color-warning-bg: var(--p-amber-100);
  --color-warning-fg: var(--p-amber-800);
  --color-error-bg: var(--p-red-100);
  --color-error-fg: var(--p-red-700);
  --color-info-bg: var(--p-blue-100);
  --color-info-fg: var(--p-info-800);
  --color-danger-bg: var(--p-red-700);
  --color-danger-fg: var(--p-white);
  --color-danger-hover: var(--p-red-800);
  --color-disabled-bg: var(--p-slate-200);
  --color-disabled-fg: var(--p-slate-600);
  --color-chart-1: var(--p-blue-700);
  --color-chart-2: var(--p-violet-700);
  --color-chart-total: var(--p-slate-600);
  --color-shift-1-bg: var(--p-blue-50);
  --color-shift-1-fg: var(--p-blue-800);
  --color-shift-2-bg: var(--p-violet-100);
  --color-shift-2-fg: var(--p-violet-700);
  --color-role-bg: var(--p-slate-100);
  --color-role-fg: var(--p-slate-600);
  --color-status-off-bg: var(--p-slate-100);
  --color-status-off-fg: var(--p-slate-600);
  --color-overlay: var(--p-overlay);
  --color-shadow: var(--p-shadow-light);
}

:root[data-theme="dark"] {
  color-scheme: dark;
  --color-surface-canvas: var(--p-ink-950);
  --color-surface-default: var(--p-ink-900);
  --color-surface-subtle: var(--p-ink-850);
  --color-surface-raised: var(--p-ink-800);
  --color-text-primary: var(--p-slate-200);
  --color-text-secondary: var(--p-secondary-dark);
  --color-text-muted: var(--p-muted-dark);
  --color-border-subtle: var(--p-slate-700);
  --color-border-control: var(--p-slate-400);
  --color-action-primary-bg: var(--p-blue-300);
  --color-action-primary-fg: var(--p-blue-950);
  --color-action-primary-hover: var(--p-blue-200);
  --color-action-primary-pressed: var(--p-blue-400);
  --color-action-secondary-bg: var(--p-info-950);
  --color-action-secondary-fg: var(--p-blue-300);
  --color-link: var(--p-blue-300);
  --color-focus-ring: var(--p-blue-300);
  --color-selection-bg: var(--p-info-950);
  --color-selection-fg: var(--p-blue-300);
  --color-success-bg: var(--p-green-950);
  --color-success-fg: var(--p-green-300);
  --color-warning-bg: var(--p-amber-950);
  --color-warning-fg: var(--p-amber-300);
  --color-error-bg: var(--p-red-950);
  --color-error-fg: var(--p-red-300);
  --color-info-bg: var(--p-info-950);
  --color-info-fg: var(--p-blue-300);
  --color-danger-bg: var(--p-red-300);
  --color-danger-fg: var(--p-red-950);
  --color-danger-hover: var(--p-red-100);
  --color-disabled-bg: var(--p-slate-700);
  --color-disabled-fg: var(--p-slate-300);
  --color-chart-1: var(--p-blue-300);
  --color-chart-2: var(--p-violet-300);
  --color-chart-total: var(--p-secondary-dark);
  --color-shift-1-bg: var(--p-info-950);
  --color-shift-1-fg: var(--p-blue-300);
  --color-shift-2-bg: var(--p-violet-950);
  --color-shift-2-fg: var(--p-violet-300);
  --color-role-bg: var(--p-ink-850);
  --color-role-fg: var(--p-secondary-dark);
  --color-status-off-bg: var(--p-ink-850);
  --color-status-off-fg: var(--p-secondary-dark);
  --color-overlay: var(--p-overlay);
  --color-shadow: var(--p-shadow-dark);
}
```

### 6.4 Integrasi import dan jembatan migrasi

Tambahkan import berikut **di awal** `src/index.css`, setelah import font dan sebelum selector apa pun. CSS `@import` yang ditempatkan setelah aturan biasa dapat diabaikan browser.

```css
@import "./styles/tokens/primitives.css";
@import "./styles/tokens/semantic.css";
@import "./styles/tokens/legacy.css";
```

`legacy.css` hanya jembatan untuk namespace surface yang hilang dan text alias. Hapus deklarasi lama yang bertabrakan dari `:root` dan `[data-theme="light"]` pada commit migrasi yang sama; jika tidak, deklarasi lama yang dimuat belakangan dapat mengalahkan alias.

```css
:root, :root[data-theme="light"], :root[data-theme="dark"] {
  --bg-color: var(--color-surface-canvas);
  --surface-color: var(--color-surface-default);
  --card-bg: var(--color-surface-default);
  --bg-card: var(--color-surface-raised);
  --bg-primary: var(--color-surface-canvas);
  --bg-secondary: var(--color-surface-subtle);
  --bg-glass: var(--color-surface-raised);
  --color-bg-elevated: var(--color-surface-raised);
  --text-primary: var(--color-text-primary);
  --text-secondary: var(--color-text-secondary);
  --text-main: var(--color-text-primary);
  --color-text-main: var(--color-text-primary);
  --card-border: var(--color-border-subtle);
  --border-color: var(--color-border-subtle);
  --color-border: var(--color-border-subtle);
  --input-bg: var(--color-surface-subtle);
  --input-border: var(--color-border-control);
  --shadow: 0 12px 32px var(--color-shadow);
}
```

Nama lama `--color-text-muted` kebetulan identik dengan token baru; semantic.css sudah mendefinisikannya, sehingga tidak dibuat alias self-reference.

`--accent-color`, `--success-color`, `--danger-color`, `--warning-color` **tidak** dijembatani secara global karena dipakai untuk foreground dan fill sekaligus. Migrasikan pasangan pada setiap callsite dahulu. Variabel tersisa seperti `--color-primary`, `--primary-color`, `--accent-bg`, `--accent-border`, `--info-color`, `--warning-bg`, `--warning-border` harus diganti berdasarkan properti/makna masing-masing; jangan sekadar menambah fallback baru. Jembatan di atas adalah fase awal, bukan kondisi akhir.

Untuk input/form yang dapat diedit, gunakan border-control secara eksplisit. Card divider yang tipis tetap boleh border-subtle. Hapus jembatan ketika pencarian konsumennya mencapai nol.

### 6.5 Before → After: tombol Simpan dan CTA

Sumber: `src/components/busCard/modal/BusInputModalFooter.tsx:68–72`. Sebelum:

```tsx
background: isDisabled
  ? "rgba(100, 116, 139, 0.25)"
  : "linear-gradient(135deg, #0284c7, #0ea5e9)",
color: isDisabled ? "#64748b" : "#ffffff",
```

Sesudah: pindahkan keputusan warna ke class. Pertahankan label dari `src/constants/texts/`, callback, state, padding, dan logika validasi yang ada. Contoh di bawah memakai prop konseptual `label`/`onSave` agar tidak menebak nama konstanta proyek; agent harus memasang ekspresi label dan handler asli komponen, bukan membuat string UI baru.

```tsx
<button
  type="button"
  className="ui-button ui-button--primary"
  disabled={isDisabled}
  onClick={onSave}
>
  {label}
</button>
```

`src/styles/components/actions.css` (siap pakai):

```css
.ui-button {
  border: 1px solid transparent;
  border-radius: 12px;
  padding: 12px 18px;
  min-height: 44px;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}
.ui-button--primary {
  background: var(--color-action-primary-bg);
  color: var(--color-action-primary-fg);
}
.ui-button--primary:hover:not(:disabled) {
  background: var(--color-action-primary-hover);
}
.ui-button--primary:active:not(:disabled) {
  background: var(--color-action-primary-pressed);
}
.ui-button--danger {
  background: var(--color-danger-bg);
  color: var(--color-danger-fg);
}
.ui-button--danger:hover:not(:disabled) {
  background: var(--color-danger-hover);
}
.ui-button--secondary {
  background: var(--color-action-secondary-bg);
  color: var(--color-action-secondary-fg);
  border-color: var(--color-border-control);
}
.ui-button:disabled {
  background: var(--color-disabled-bg);
  color: var(--color-disabled-fg);
  cursor: not-allowed;
  opacity: 1;
}
/* Pertahankan indikator keyboard untuk setiap kontrol yang dapat difokuskan. */
:where(button, a[href], input, select, textarea, [tabindex]):focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}
@media (forced-colors: active) {
  .ui-button { border-color: ButtonText; }
  :where(button, a[href], input, select, textarea, [tabindex]):focus-visible {
    outline-color: Highlight;
  }
}
```

Hapus `filter:brightness(...)` pada CTA yang dimigrasi; filter dapat mengubah foreground dan background sekaligus. Hapus aturan `outline:none !important` yang menimpa fokus baru. Jika ring terpotong overflow/di belakang sticky header, perbaiki clipping/scroll-margin, bukan sekadar memperbesar kontras. Minimum 44px adalah sasaran ergonomi proyek; bukan klaim bahwa semua WCAG 2.2 AA mensyaratkan 44px.

**Kasus lapangan CLR-04–07:** petugas menyimpan angka di bawah cahaya siang atau membagikan laporan WhatsApp pada malam hari. Label tetap terbaca ketika tombol normal, hover, pressed, dan ketika pilihan tema berbeda dari OS.

### 6.6 Before → After: modal yang tidak mengikuti tema

Sumber: `src/components/pdoReport/ReportModalLayout.tsx:52–55`.

```tsx
// Before
backgroundColor: "var(--bg-card, #171717)",
border: "1px solid var(--border-color)",
boxShadow: "0 -10px 40px rgba(0, 0, 0, 0.5)",

// After — ganti hanya tiga properti visual tersebut
backgroundColor: "var(--color-surface-raised)",
color: "var(--color-text-primary)",
border: "1px solid var(--color-border-subtle)",
boxShadow: "0 -10px 40px var(--color-shadow)",
```

Gunakan opaque surface pada modal teks. Scrim terpisah memakai `--color-overlay`. Atribut tema tetap pada `document.documentElement`, sehingga portal di body mewarisi token. Ubah juga QueueModal, LegalModals, AddRouteModal, RouteSelectorSheet, A2ReportModal, QuickKorlapFleetModal dan shell admin; mengganti `.glass` saja tidak mengatasi inline background yang menang di cascade.

**Kasus lapangan CLR-01–03,16:** supervisor membuka laporan/antrean pada Light dan mengganti tema saat modal terbuka. Isi panel dan border harus berubah bersama tanpa panel transparan atau teks gelap di atas gelap.

### 6.7 Before → After: status operasional tanpa merusak parser bisnis

Sumber: cabang TO pada `src/components/monitoring/monitoringUtils.ts:inferStatusCode`.

```ts
// Before
return {
  code: isEvdal ? "TO EVDAL" : "T.O",
  color: "#F59E0B",
  bg: "rgba(245, 158, 11, 0.15)",
};

// After — tetap bentuk API lama; tidak mengubah urutan regex/domain
return {
  code: isEvdal ? "TO EVDAL" : "T.O",
  color: "var(--color-warning-fg)",
  bg: "var(--color-warning-bg)",
};
```

Consumer `style={{color: u.badgeColor, background: u.badgeBg}}` dapat tetap berjalan karena nilai CSS variable berupa string yang di-resolve browser. Setelah semua consumer dimigrasi, bentuk ideal adalah `{code, severity}` dan renderer yang memilih token. Jangan mengirim `var(...)` ke Google Sheets API; adapter Sheets membutuhkan object RGB numerik dan kontrak terpisah.

Untuk badge status umum:

```css
.ui-status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: 6px;
  padding: 3px 8px;
  font-weight: 600;
}
.ui-status[data-tone="success"] {
  color: var(--color-success-fg);
  background: var(--color-success-bg);
}
.ui-status[data-tone="warning"] {
  color: var(--color-warning-fg);
  background: var(--color-warning-bg);
}
.ui-status[data-tone="error"] {
  color: var(--color-error-fg);
  background: var(--color-error-bg);
}
.ui-status[data-tone="info"] {
  color: var(--color-info-fg);
  background: var(--color-info-bg);
}
```

**Kasus lapangan CLR-08–12,20,24:** operator membedakan antrean sinkronisasi, error validasi, dan kendaraan OFF dengan kode/ikon/teks. Pergantian tema tidak mengubah makna domain, normalisasi ritase, atau warna export Sheets. Severity TO/SO/BA dll mengikuti kebijakan operasional yang sudah ada; audit warna tidak berwenang mengubah alur bisnisnya.

### 6.8 Before → After: grafik SVG dan selected state

Sumber: `src/components/dailyToaTrend/ToaBarChart.tsx:55–96`, 183–205, 344 dst.

```tsx
// Before
<stop offset="100%" stopColor="#059669" stopOpacity="0.25" />

// After untuk rect bar: gunakan token opaque, tetap label angka/tanggal
<rect
  x={bar.x}
  y={bar.y}
  width={barWidth}
  height={bar.barHeight}
  fill="var(--color-chart-1)"
  stroke={bar.isSelected ? "var(--color-text-primary)" : "none"}
  strokeWidth={bar.isSelected ? 2 : 0}
/>
```

Ini contoh perubahan visual pada `rect` yang sudah ada, bukan pengganti penuh komponen. Pertahankan handler, key, akses keyboard, label, dan struktur. Jika grafik memang mengkodekan tren naik/turun, pilih foreground `success-fg`/`warning-fg`/`error-fg` **setelah diuji terhadap surface chart**, gunakan pola/ikon serta label tren, bukan semata hijau-merah. Kontrak tabel menjamin chart-1/2/total pada surface; token status dijamin pada container status, jadi jangan memperluas jaminannya tanpa pengujian.

Legend dan bar harus memakai mapping yang sama. Tooltip memakai surface-raised + text-primary, dan selected date memakai link. Grid dekoratif boleh border-subtle; bila garis acuan threshold menentukan keputusan operasi, perlakukan sebagai informasi bermakna dengan kontras 3:1 dan label. Tetap tampilkan nilai aktual dalam teks atau tabel, terutama ketika bar sempit atau color vision deficiency membuat hue sulit dibedakan.

**Kasus lapangan CLR-13,19:** supervisor melihat penurunan TOA di kedua tema; tinggi bar, angka, ikon tren dan selected outline tetap dapat dipahami dalam grayscale.

### 6.9 Form, placeholder dan SweetAlert

```css
.ui-input {
  background: var(--color-surface-default);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-control);
  accent-color: var(--color-action-primary-bg);
}
.ui-input::placeholder {
  color: var(--color-text-muted);
  opacity: 1;
}
.ui-input[aria-invalid="true"] {
  border-color: var(--color-error-fg);
}
```

Untuk SweetAlert, pertahankan `buttonsStyling:false` dan ganti class mapping:

```ts
customClass: {
  container: "pdo-swal-container",
  popup: "pdo-swal-popup",
  confirmButton: "ui-button ui-button--primary",
  cancelButton: "ui-button ui-button--secondary",
},
buttonsStyling: false,
```

Aksi destruktif menggunakan `ui-button--danger` secara eksplisit, tidak menumpuk class primary dan danger tanpa kontrak cascade. Sesuaikan `.pdo-swal-popup`, toast, validation-message, icon dan template input dengan semantic token. SweetAlert menyusun ikon sukses/error dari beberapa node dan pseudo-element; periksa line/ring/icon border dan jangan menganggap mengubah properti `color` saja cukup. Hapus aturan lama `pdo-swal-confirm-btn` hanya setelah semua pemakainya dipindahkan.

Template `src/utils/modals/**` dapat memakai `class="ui-input"` atau `color:var(--color-error-fg)`; escaping HTML yang ada harus dipertahankan. Kamus `text_alerts.ts` idealnya hanya menyimpan teks; jika masih berisi markup, styling harus berupa class/token. Tidak perlu memindahkan seluruh arsitektur modal untuk menyelesaikan audit warna.

**Kasus lapangan CLR-14–15,25:** petugas memperbaiki input invalid memakai keyboard; placeholder, error text, dan ring tetap terlihat pada kedua tema, termasuk modal SweetAlert.

### 6.10 Role, brand, shell dan aset

- CLR-17: buat satu mapping role di layer presentasi; render header dan badge dengan role-fg/bg yang sama. `Crown`, `Shield`, `Compass`, `Radio`, nama role dan ukuran tetap; hindari warna merah yang memberi kesan fault pada superadmin. Jika butuh 5 warna role, buat token role spesifik dan uji semua pasangannya; tidak perlu untuk tahap pertama.
- CLR-18/21/23: title gunakan text-primary dengan ikon brand biru; pindahkan efek hijau pada LoginHeroCard, ProfileUserCard, BottomNav dan chart. Logo PUSM sekarang berisi detail neon yang kurang terbaca pada ukuran favicon; siapkan simbol datar biru + nama, favicon, dan PWA icon yang konsisten. Penggantian aset adalah pekerjaan berikutnya, bukan hasil audit ini. Jangan menganggap warna logo exempt berarti seluruh teks UI dalam kartu logo exempt.
- CLR-22: set `color-scheme` seperti semantic.css. Validasi nilai `PDO_THEME` hanya `light` atau `dark`; bila preferensi “system” ditambahkan, persist pilihan mode dan resolve lewat matchMedia. Untuk manual override, meta browser harus mengikuti **tema UI aktual**, bukan hanya media OS.
- CLR-26: non-SGO gunakan container netral/status-off, pertahankan kontras teks penuh; opacity global hanya untuk elemen dekoratif yang tidak membawa informasi.

Sesudah stylesheet tersedia dan sesudah toggle tema, panggil util berikut. Jangan bergantung pada hasil computedStyle saat CSS belum termuat di bootstrap head.

```ts
export function syncThemeChrome(): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const theme = root.dataset.theme === "dark" ? "dark" : "light";
  root.style.colorScheme = theme;
  const color = getComputedStyle(root)
    .getPropertyValue("--color-surface-canvas").trim();
  if (!color) return;
  // Ganti dua meta media lama dengan SATU meta id ini di index.html.
  const meta = document.querySelector<HTMLMetaElement>("#app-theme-color");
  if (meta) meta.content = color;
}
```

HTML: `<meta id="app-theme-color" name="theme-color" content="#F8FAFC" />`. Nilai initial metadata ini pengecualian yang terdokumentasi, bukan duplikasi bebas. Manifest PWA `background_color`/`theme_color` bersifat statis; pilih startup canvas yang konsisten dan dokumentasikan batas platform. Jangan mengklaim mengganti meta runtime otomatis mengubah seluruh splash screen terinstal.

**Kasus lapangan CLR-17–18,21–23,26:** petugas memakai Light sementara Android Dark; shell/browser chrome mengikuti pilihan UI, badge role stabil, armada non-SGO tetap terbaca, dan ikon PWA selaras branding.

### 6.11 Urutan implementasi untuk solo developer

| Tahap | Pekerjaan | Syarat selesai |
|---|---|---|
| 0 — baseline | Branch devmode, inventaris, screenshot per tema/state, tetapkan pengecualian aset/export | Tidak ada perubahan domain, payload, atau formula Sheets. |
| 1 — blocker | Token surface hilang, modal dan shell, P0 CLR-01–03 | Tidak ada var unresolved, panel opaque, teks modal ≥4,5:1 pada kedua tema. |
| 2 — tindakan/input | CTA, Swal, offline/error, placeholder, ring dan input border | Pasangan normal/hover/pressed diuji; keyboard fokus terlihat dan tidak tertutup. |
| 3 — operasi/data | Badge, KPI, seluruh tab monitoring, grafik, legend, WA report | Severity/code tetap; warna bukan pembeda tunggal; matrix kedua tema lulus. |
| 4 — konsolidasi | Role, brand assets, shadow, glow, theme metadata, template HTML | Satu mapping per makna; tidak ada dark-only fallback yang tak disengaja. |
| 5 — hapus utang | Hapus alias lama dan override tak terpakai; ratchet CI | Literal UI hanya pada primitive/allowlist; semua kontrak dan gate disepakati lulus. |

Estimasi perencanaan: 5–9 hari kerja fokus untuk solo developer, sangat bergantung pada luas visual QA dan perbaikan test baseline. Ini bukan janji waktu otomatis. Pecah menjadi commit per tahap agar rollback tidak mengembalikan refactor yang sudah valid.

**Larangan migrasi:** jangan global replace `#3ECF8E`; jangan ubah `sheetColorUtils`/payload API untuk mengejar warna UI; jangan menghapus test yang gagal; jangan mengubah SQL/RLS/auth, kalkulasi KM/TOA/ritase, atau kamus teks kecuali ada kebutuhan langsung dan test yang relevan. Ikuti AGENTS.md, termasuk dokumentasi refact_N dan branch devmode. Tidak ada kebutuhan instalasi framework berbayar.

### 6.12 Acceptance criteria dan verifikasi

- [ ] Seluruh token yang digunakan mempunyai definisi; fallback warna literal bukan penyembunyi undefined var.
- [ ] Literal UI aktif berada di primitive, atau allowlist spesifik dengan alasan (logo vendor, metadata statis, adapter Sheets). `transparent`, `currentColor`, system colors dan URL SVG `#id` tidak diblokir sembarangan.
- [ ] Text normal ≥4,5:1, teks besar ≥3:1, elemen bermakna nonteks ≥3:1 terhadap adjacent colors. Target AAA per pasangan yang dinyatakan ≥7:1 dipertahankan.
- [ ] Semua pasangan state normal/hover/active/selected/focus/error/loading/disabled dan tiap surface diuji. Disabled diperlakukan sesuai pengecualian, tetapi masih dibaca bila diperlukan.
- [ ] Tidak ada panel transparan tanpa sengaja, hardcoded dark modal pada Light, atau white-on-pastel CTA.
- [ ] Semua status mempunyai teks/kode/ikon; shift/chart mempunyai label dan nilai. Simulasi protanopia/deuteranopia/tritanopia/grayscale dipakai sebagai pemeriksaan tambahan.
- [ ] Uji 360px, 390px, 768px dan desktop; zoom 200%; Light/Dark; Android terang/redup; pilih tema berlawanan OS; buka modal portal; switch tema saat modal terbuka; initial load dan stored preference invalid.
- [ ] Fokus keyboard terlihat, ring tidak terpotong/tertutup header atau bottom dock. Cek forced-colors secara khusus.
- [ ] Snapshot sebelum/sesudah mencakup login/info/legal, dashboard/KPI/bus card, semua input shift/error, route selector, queue, Swal/toast, profile/role, user/page admin, A2/armada, monthly sync, monitoring routes/korwil/fleet/leaderboard, chart-tooltip dan WA report. Ambil data sintetis, hindari identitas/kredensial pribadi.
- [ ] Build dan test baseline lulus sesuai kebijakan proyek sebelum merge. Scanner dan kontrak warna baru ikut CI; kegagalan baseline tercatat, bukan disembunyikan.

**Alat gratis:** unit test Vitest yang sudah tersedia, skrip inventory Python, browser DevTools untuk computed style, axe-core untuk halaman runtime, dan pemeriksaan manual gradient/alpha/fokus. axe tidak membuktikan semua masalah warna/diagram; jangan menggantikan penilaian manual dengannya.

## 7. Catatan verifikasi audit ini

| Pemeriksaan | Hasil aktual | Implikasi |
|---|---|---|
| Checkout sumber | devmode `158590fc9b2f60546d9cae65d6aae0884d660ffa` | Audit bukan salinan repo lama. |
| Install lockfile | Berhasil `pnpm install --frozen-lockfile` | Lockfile tidak diubah. |
| Production build | `pnpm run build` berhasil | Ada warning bundle >500kB; di luar fokus warna. |
| Suite awal | `pnpm vitest run src/`: 120 file lulus, 2 file gagal; 963 test lulus, 3 gagal dari 966 | Belum 100% hijau. |
| Timeout monitoring | Satu test AllRouteMonitoringPage timeout pada suite penuh; ulang file terpisah: 11/11 lulus | Sensitif waktu/resource; bukan bukti suite penuh kemudian lulus. |
| Dua test auth | `auth.test.ts` mengembalikan `API Credentials missing`, tidak memenuhi ekspektasi tes | Tidak menambahkan kredensial produksi. Test konfigurasi perlu ditangani terpisah. |
| `graphify update .` | Tidak dapat dijalankan: executable tidak tersedia | Gate AGENTS.md belum terpenuhi; tidak mengklaim audit sebagai perubahan siap merge. |
| Kontrak palette baru | 104 pasangan dihitung dan diuji Vitest: **104/104 lulus**; ambang 4,5 atau 3 sesuai peran | Hanya menjamin pasangan yang didaftarkan, bukan rendering keseluruhan. |
| Runtime screenshot | Belum terlaksana; browser tidak tersedia dan unduhan gagal | Tidak mengklaim audit visual semua layar atau kelulusan WCAG produk. |
| Mutasi aplikasi | Tidak ada perubahan file src, index.html, vite config, lockfile atau remote | Output adalah audit dan contoh refactor; contoh belum diaplikasikan. |

Dokumentasi lokal mengikuti `refactor-ss-pdo/refact_174/AUDIT_BUGS.md` dan `REPAIR_REPORT.md`. REPAIR_REPORT menandai status **rencana/belum diterapkan**, bukan laporan perbaikan yang seolah sudah selesai. Deliverable pengguna ini berdiri sendiri sehingga tidak memerlukan checkout untuk dibaca.

## 8. Referensi & cara reproduksi

### 8.1 Referensi primer

1. [WCAG 2.2 — Contrast Minimum, 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) — teks, ambang, ukuran teks besar, pengecualian.
2. [WCAG 2.2 — Non-text Contrast, 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) — kontrol, state, dan objek grafis yang diperlukan.
3. [WCAG 2.2 — Use of Color, 1.4.1](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html) — jangan mengandalkan warna saja.
4. [WCAG 2.2 — Focus Appearance, 2.4.13](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html) — sasaran tambahan AAA, bukan AA.
5. [DTCG Format Module 2025.10](https://www.designtokens.org/tr/2025.10/format/) — format pertukaran token dan alias; bukan kewajiban tool untuk proyek ini.
6. [Material Design 3 — Color Roles](https://m3.material.io/styles/color/roles) dan [Apple HIG — Color, Markdown resmi](https://developer.apple.com/design/human-interface-guidelines/color.md) — HIG berhasil dibaca; MD3 menjadi acuan konseptual karena konten halaman JS belum terambil penuh.
7. [Situs resmi Transjakarta](https://www.transjakarta.co.id/) dan [kustom.css](https://www.transjakarta.co.id/aset/kustom.css) — bukti warna implementasi web saat audit, bukan brand manual resmi.

Sumber 1–5, Apple HIG pada nomor 6, dan sumber 7 berhasil diambil sebagai dokumen pada audit. Semua standar kontras dinyatakan pada scope pasangan; kesimpulan estetika merupakan rekomendasi audit, tidak diatribusikan sebagai hukum wajib dari pedoman tersebut.

### 8.2 Rumus kontras dan alpha

```python
def luminance(rgb):
    channels = [x / 255 for x in rgb]
    linear = [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4
              for x in channels]
    return sum(x * w for x, w in zip(linear, (0.2126, 0.7152, 0.0722)))

def contrast(fg, bg):
    lo, hi = sorted((luminance(fg), luminance(bg)))
    return (hi + 0.05) / (lo + 0.05)

def composite(fg, bg, alpha):
    return tuple(alpha * f + (1 - alpha) * b for f, b in zip(fg, bg))
```

Alpha bertingkat: kompositkan background ke surface dahulu, lalu foreground/opacity ke hasilnya. Jika surface ikut transparan, telusuri hingga backdrop opak; untuk gradient, cek titik terburuk di area glyph/objek. Blur dan gambar membutuhkan sampel rendering; angka satu endpoint hanya bukti endpoint, bukan minimum global.

### 8.3 Scan ulang inventaris leksikal

Jalankan dari root repo; tidak memerlukan dependency tambahan. Default menghasilkan JSON ke stdout, simpan bila dibutuhkan. Pencarian lanjutan wajib untuk `red/green/blue`, `%23` pada data URI, `color(display-p3 ...)`, object style dinamis, `opacity`, serta image assets; jumlah yang didapat bukan jumlah pelanggaran.

```python
from pathlib import Path
import re, json
pattern = re.compile(
    r'#[0-9a-fA-F]{3,8}\b|(?:rgba?|hsla?|oklch|color-mix)\([^)]*\)'
    r'|\b(?:white|black|transparent|currentColor)\b'
)
rows = []
for path in sorted(Path('src').rglob('*')):
    if path.suffix not in ('.ts', '.tsx', '.css') or '.test.' in path.name:
        continue
    for line_no, line in enumerate(path.read_text().splitlines(), 1):
        for match in pattern.finditer(line):
            rows.append({'file': str(path), 'line': line_no, 'value': match.group()})
print(json.dumps(rows, indent=2))
```

Gunakan hasil sebagai baseline/ratchet: PR baru tidak boleh menambah literal di luar allowlist tanpa alasan. Jangan menetapkan CI “zero literal” pada hari pertama ketika 2.435 occurrence lama masih ada; migrasikan modul, kurangi baseline, lalu tolak kenaikan. Target akhir nol primitive inline untuk styling UI aktif, bukan nol warna dalam seluruh repo.

### 8.4 Unit test kontrak warna siap pakai

Simpan file berikut sebagai `src/styles/tokens/color-contract.test.ts` bersama dua file CSS di bagian 6.2–6.3. Jalankan `pnpm vitest run src/styles/tokens/color-contract.test.ts`. Test membaca nilai dari CSS aktual, sehingga perubahan palette benar-benar diuji; bukan membandingkan snapshot hex yang di-hardcode ulang. Parser sengaja dibatasi pada dua blok tema dan alias sederhana yang diberikan. Jika format token diperluas, gunakan parser CSS yang sesuai atau perbarui parser dengan test. Disabled memakai ambang produk sukarela 4,5:1, bukan kewajiban WCAG untuk kontrol inactive.

```ts
import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';

// Letakkan bersama primitives.css dan semantic.css di src/styles/tokens/.
const declarations = (text: string): Record<string, string> =>
  Object.fromEntries([...text.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)]
    .map((m) => [m[1], m[2].trim()]));
const primitives = declarations(readFileSync(new URL('./primitives.css', import.meta.url), 'utf8'));
const semantic = readFileSync(new URL('./semantic.css', import.meta.url), 'utf8');
const bodies = [...semantic.matchAll(/\{([^{}]*)\}/g)].map(m => m[1]);
if (bodies.length !== 2) throw new Error('Kontrak mengharapkan dua blok tema eksplisit');
const resolve = (name: string, values: Record<string,string>, seen = new Set<string>()): string => {
  if (seen.has(name)) throw new Error(`Siklus token ${name}`);
  seen.add(name);
  const value = values[name];
  if (!value) throw new Error(`Token hilang ${name}`);
  const alias = /^var\((--[\w-]+)\)$/.exec(value);
  return alias ? resolve(alias[1], values, seen) : value;
};
const luminance = (hex: string): number => {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) throw new Error(`Kontrak ini hanya menerima HEX opaque: ${hex}`);
  const channels = [1,3,5].map(i => parseInt(hex.slice(i,i+2),16)/255)
    .map(x => x <= 0.04045 ? x/12.92 : ((x+0.055)/1.055)**2.4);
  return channels[0]*0.2126 + channels[1]*0.7152 + channels[2]*0.0722;
};
const ratio = (fg: string, bg: string): number => {
  const [lo,hi] = [luminance(fg),luminance(bg)].sort((a,b)=>a-b);
  return (hi+0.05)/(lo+0.05);
};
const surfaces = ['surface-canvas','surface-default','surface-subtle','surface-raised'];
const contracts: [string,string,number][] = [];
for (const fg of ['text-primary','text-secondary','text-muted','link'])
  for (const bg of surfaces) contracts.push([fg,bg,4.5]);
for (const [fg,bg] of [
  ['action-primary-fg','action-primary-bg'], ['action-primary-fg','action-primary-hover'],
  ['action-primary-fg','action-primary-pressed'], ['action-secondary-fg','action-secondary-bg'],
  ['selection-fg','selection-bg'], ['success-fg','success-bg'], ['warning-fg','warning-bg'],
  ['error-fg','error-bg'], ['info-fg','info-bg'], ['danger-fg','danger-bg'],
  ['danger-fg','danger-hover'], ['shift-1-fg','shift-1-bg'], ['shift-2-fg','shift-2-bg'],
  ['role-fg','role-bg'], ['status-off-fg','status-off-bg'], ['disabled-fg','disabled-bg']
]) contracts.push([fg,bg,4.5]);
for (const fg of ['border-control','focus-ring','chart-1','chart-2','chart-total'])
  for (const bg of surfaces) contracts.push([fg,bg,3]);
for (const [index,theme] of ['light','dark'].entries()) {
  const values = {...primitives,...declarations(bodies[index])};
  for (const [fg,bg,minimum] of contracts) {
    test(`${theme} ${fg} on ${bg} >= ${minimum}`,()=>{
      const actual=ratio(resolve(`--color-${fg}`,values),resolve(`--color-${bg}`,values));
      expect(actual).toBeGreaterThanOrEqual(minimum);
    });
  }
}
```

Test tersebut sudah dijalankan pada salinan contoh di folder dokumentasi: 104/104 lulus. Ini tidak mengubah sumber UI atau menghapus kegagalan baseline autentikasi.

## Lampiran A — Inventaris lengkap file produksi

Semua 277 file produksi `.ts/.tsx/.css` dipindai. Kolom literal menghitung semua match regex (termasuk fallback/keyword/komentar); kolom `var()` menghitung konsumsi CSS custom property. Nol literal tidak berarti nol warna runtime: file dapat merender class dari stylesheet, menerima warna sebagai prop, atau merupakan re-export/wrapper. Test 122 file dipindai terpisah dan dikeluarkan dari statistik UI.

| File | Literal | Pemakaian var() |
|---|---:|---:|
| `src/App.tsx` | 0 | 0 |
| `src/components/AccumulationSheet.tsx` | 0 | 0 |
| `src/components/AllRouteMonitoringPage.tsx` | 0 | 0 |
| `src/components/AnalyticsDashboard.tsx` | 0 | 0 |
| `src/components/BottomNav.tsx` | 0 | 0 |
| `src/components/BusCard.tsx` | 0 | 0 |
| `src/components/BusList.tsx` | 0 | 0 |
| `src/components/CompletionStatusCard.tsx` | 6 | 7 |
| `src/components/DailyToaTrendCard.tsx` | 0 | 0 |
| `src/components/Dashboard.tsx` | 0 | 0 |
| `src/components/FormattedNoteText.tsx` | 2 | 3 |
| `src/components/KPICard.tsx` | 6 | 6 |
| `src/components/LoginScreen.tsx` | 0 | 0 |
| `src/components/ProfileMenuSheet.tsx` | 0 | 0 |
| `src/components/QueueModal.tsx` | 0 | 0 |
| `src/components/RoleBadge.tsx` | 0 | 0 |
| `src/components/RouteOperationalReportCard.tsx` | 0 | 0 |
| `src/components/RouteSelectorCard.tsx` | 0 | 0 |
| `src/components/ShiftComparisonCard.tsx` | 8 | 6 |
| `src/components/Skeletons.tsx` | 11 | 11 |
| `src/components/SwipeableContainer.tsx` | 0 | 0 |
| `src/components/UnitCard.tsx` | 18 | 12 |
| `src/components/UnitDetailModal.tsx` | 84 | 68 |
| `src/components/UnitSummaryDashboard.tsx` | 0 | 1 |
| `src/components/UserManagementPage.tsx` | 0 | 0 |
| `src/components/UserProfileHeader.tsx` | 0 | 0 |
| `src/components/WaReportModal.tsx` | 0 | 0 |
| `src/components/accumulation/AccumulationFooter.tsx` | 13 | 5 |
| `src/components/accumulation/AccumulationHeader.tsx` | 11 | 8 |
| `src/components/accumulation/AccumulationPeriodSelector.tsx` | 10 | 10 |
| `src/components/accumulation/AccumulationSheet.tsx` | 4 | 2 |
| `src/components/accumulation/index.ts` | 0 | 0 |
| `src/components/accumulation/types.ts` | 0 | 0 |
| `src/components/accumulation/useAccumulationGesture.ts` | 2 | 0 |
| `src/components/accumulation/useAccumulationRange.ts` | 0 | 0 |
| `src/components/busCard/BusCard.tsx` | 1 | 5 |
| `src/components/busCard/BusCardSummary.tsx` | 12 | 11 |
| `src/components/busCard/BusInputModal.tsx` | 13 | 4 |
| `src/components/busCard/busCardStyles.ts` | 0 | 0 |
| `src/components/busCard/index.ts` | 0 | 0 |
| `src/components/busCard/modal/BusInputModalFooter.tsx` | 11 | 5 |
| `src/components/busCard/modal/BusInputModalHeader.tsx` | 22 | 13 |
| `src/components/busCard/modal/BusInputModalNotes.tsx` | 28 | 22 |
| `src/components/busCard/modal/BusInputModalShift1.tsx` | 44 | 13 |
| `src/components/busCard/modal/BusInputModalShift2.tsx` | 43 | 10 |
| `src/components/busCard/modal/BusInputModalSingleFocus.tsx` | 3 | 1 |
| `src/components/busCard/modal/BusInputModalTabs.tsx` | 9 | 5 |
| `src/components/busCard/modal/BusInputModalTrip.tsx` | 5 | 3 |
| `src/components/busCard/modal/busInputPayload.ts` | 0 | 0 |
| `src/components/busCard/modal/busInputValidation.ts` | 0 | 0 |
| `src/components/busCard/modal/fields/BusFormField.tsx` | 8 | 5 |
| `src/components/busCard/modal/fields/ShiftOptionChip.tsx` | 6 | 4 |
| `src/components/busCard/modal/notes/KeteranganPresetBar.tsx` | 44 | 20 |
| `src/components/busCard/modal/singleFocus/SingleFocusKm.tsx` | 0 | 0 |
| `src/components/busCard/modal/singleFocus/SingleFocusKmRolloverBanner.tsx` | 6 | 7 |
| `src/components/busCard/modal/singleFocus/SingleFocusKmShift1.tsx` | 29 | 9 |
| `src/components/busCard/modal/singleFocus/SingleFocusKmShift2.tsx` | 33 | 8 |
| `src/components/busCard/modal/singleFocus/SingleFocusNotes.tsx` | 5 | 5 |
| `src/components/busCard/modal/singleFocus/SingleFocusToa.tsx` | 0 | 0 |
| `src/components/busCard/modal/singleFocus/SingleFocusTrip.tsx` | 5 | 3 |
| `src/components/busCard/modal/singleFocus/singleFocusStyles.ts` | 23 | 22 |
| `src/components/busCard/modal/useBusInputForm.ts` | 0 | 0 |
| `src/components/busCard/modal/useBusModalOdometer.ts` | 0 | 0 |
| `src/components/busCard/types.ts` | 0 | 0 |
| `src/components/busCard/useBusCardModal.ts` | 0 | 0 |
| `src/components/busCard/useBusCardSave.ts` | 0 | 0 |
| `src/components/busList/BusList.tsx` | 0 | 0 |
| `src/components/busList/BusListAccumulationBanner.tsx` | 7 | 3 |
| `src/components/busList/BusListControlBar.tsx` | 9 | 20 |
| `src/components/busList/BusListHeader.tsx` | 0 | 0 |
| `src/components/busList/BusListProgressBar.tsx` | 1 | 6 |
| `src/components/busList/busListUtils.ts` | 0 | 0 |
| `src/components/busList/index.ts` | 0 | 0 |
| `src/components/busList/useBulkOperations.ts` | 0 | 0 |
| `src/components/dailyToaTrend/DailyToaTrendCard.tsx` | 0 | 0 |
| `src/components/dailyToaTrend/ToaBarChart.tsx` | 25 | 5 |
| `src/components/dailyToaTrend/ToaExecutiveStats.tsx` | 0 | 18 |
| `src/components/dailyToaTrend/ToaTrendErrorState.tsx` | 3 | 1 |
| `src/components/dailyToaTrend/ToaTrendHeader.tsx` | 0 | 2 |
| `src/components/dailyToaTrend/ToaTrendLegend.tsx` | 3 | 4 |
| `src/components/dailyToaTrend/index.ts` | 0 | 0 |
| `src/components/dailyToaTrend/types.ts` | 0 | 0 |
| `src/components/dailyToaTrend/useMonthlyTrendData.ts` | 0 | 0 |
| `src/components/dailyToaTrend/useTrendMetrics.ts` | 0 | 0 |
| `src/components/dashboard/DashboardContentTabs.tsx` | 3 | 4 |
| `src/components/dashboard/DashboardHeader.tsx` | 12 | 10 |
| `src/components/dashboard/DashboardModals.tsx` | 0 | 0 |
| `src/components/dashboard/DashboardStatusBanners.tsx` | 12 | 7 |
| `src/components/dashboard/QueueModal.tsx` | 1 | 11 |
| `src/components/dashboard/index.ts` | 0 | 0 |
| `src/components/dashboard/useDashboardData.ts` | 0 | 0 |
| `src/components/dashboard/useDashboardFleet.ts` | 0 | 0 |
| `src/components/dashboard/useDashboardSyncHandlers.ts` | 0 | 0 |
| `src/components/dashboard/useDashboardUiState.ts` | 0 | 0 |
| `src/components/dashboard/usePullToRefresh.ts` | 0 | 0 |
| `src/components/fleetStatus/QuickKorlapFleetModal.tsx` | 41 | 26 |
| `src/components/fleetStatus/index.ts` | 0 | 0 |
| `src/components/login/LegalModals.tsx` | 7 | 19 |
| `src/components/login/LoginFeatureCards.tsx` | 3 | 4 |
| `src/components/login/LoginFooter.tsx` | 4 | 5 |
| `src/components/login/LoginHeroCard.tsx` | 12 | 8 |
| `src/components/login/LoginInfoAboutSection.tsx` | 9 | 5 |
| `src/components/login/LoginInfoComparisonSection.tsx` | 16 | 15 |
| `src/components/login/LoginInfoHeader.tsx` | 4 | 5 |
| `src/components/login/LoginInfoModal.tsx` | 3 | 2 |
| `src/components/login/LoginInfoPermissionsSection.tsx` | 4 | 8 |
| `src/components/login/LoginScreen.tsx` | 0 | 0 |
| `src/components/login/index.ts` | 0 | 0 |
| `src/components/monitoring/AllRouteMonitoringPage.tsx` | 2 | 2 |
| `src/components/monitoring/IngestionProgressModal.tsx` | 39 | 15 |
| `src/components/monitoring/MonitoringBottomNav.tsx` | 0 | 0 |
| `src/components/monitoring/MonitoringHeader.tsx` | 25 | 17 |
| `src/components/monitoring/MonitoringKpiCards.tsx` | 18 | 26 |
| `src/components/monitoring/MonitoringMonthPickerModal.tsx` | 42 | 30 |
| `src/components/monitoring/MonitoringPeriodSelector.tsx` | 44 | 26 |
| `src/components/monitoring/MonitoringReadinessBanner.tsx` | 14 | 11 |
| `src/components/monitoring/MonitoringRouteCard.tsx` | 46 | 25 |
| `src/components/monitoring/MonitoringStates.tsx` | 10 | 7 |
| `src/components/monitoring/MonitoringSupervisorTabs.tsx` | 7 | 5 |
| `src/components/monitoring/MonthlySyncModal.tsx` | 46 | 31 |
| `src/components/monitoring/index.ts` | 0 | 0 |
| `src/components/monitoring/modals/KorwilRouteDetailBottomSheet.tsx` | 115 | 91 |
| `src/components/monitoring/modals/MonitoringRouteDetailModal.tsx` | 99 | 100 |
| `src/components/monitoring/monitoringUtils.ts` | 22 | 0 |
| `src/components/monitoring/tabs/MonitoringDashboardTab.tsx` | 9 | 4 |
| `src/components/monitoring/tabs/MonitoringFleetStatusTab.tsx` | 94 | 70 |
| `src/components/monitoring/tabs/MonitoringKorwilTab.tsx` | 73 | 58 |
| `src/components/monitoring/tabs/MonitoringLeaderboard.tsx` | 22 | 8 |
| `src/components/monitoring/tabs/MonitoringMacroKpiGrid.tsx` | 11 | 6 |
| `src/components/monitoring/tabs/MonitoringRouteCardModern.tsx` | 41 | 27 |
| `src/components/monitoring/tabs/MonitoringRoutesTab.tsx` | 34 | 30 |
| `src/components/monitoring/tabs/MonitoringShiftSplitBar.tsx` | 13 | 7 |
| `src/components/monitoring/tabs/MonitoringToaBarChart.tsx` | 33 | 34 |
| `src/components/monitoring/tabs/MonitoringWaReportTab.tsx` | 41 | 35 |
| `src/components/pageManagement/PageDisabledState.tsx` | 5 | 5 |
| `src/components/pageManagement/PageManagementPage.tsx` | 40 | 20 |
| `src/components/pageManagement/SuperadminMaintenanceBanner.tsx` | 7 | 0 |
| `src/components/pageManagement/index.ts` | 0 | 0 |
| `src/components/pdoReport/A2ReportModal.tsx` | 77 | 24 |
| `src/components/pdoReport/ReportAccordionHeader.tsx` | 4 | 6 |
| `src/components/pdoReport/ReportArmadaSection.tsx` | 6 | 11 |
| `src/components/pdoReport/ReportHeadwaySection.tsx` | 1 | 4 |
| `src/components/pdoReport/ReportIssuesSection.tsx` | 0 | 1 |
| `src/components/pdoReport/ReportModalLayout.tsx` | 6 | 8 |
| `src/components/pdoReport/ReportStatusBadge.tsx` | 9 | 3 |
| `src/components/pdoReport/ReportTrafficJamsSection.tsx` | 9 | 10 |
| `src/components/pdoReport/RouteOperationalReportCard.tsx` | 1 | 1 |
| `src/components/pdoReport/index.ts` | 0 | 0 |
| `src/components/profileMenu/ProfileAdminSection.tsx` | 8 | 15 |
| `src/components/profileMenu/ProfileFeaturesSection.tsx` | 13 | 24 |
| `src/components/profileMenu/ProfileMenuFooter.tsx` | 3 | 2 |
| `src/components/profileMenu/ProfileMenuSheet.tsx` | 2 | 2 |
| `src/components/profileMenu/ProfileUserCard.tsx` | 7 | 4 |
| `src/components/profileMenu/UserProfileHeader.tsx` | 8 | 6 |
| `src/components/profileMenu/index.ts` | 0 | 0 |
| `src/components/profileMenu/types.ts` | 0 | 0 |
| `src/components/profileMenu/useProfileData.ts` | 0 | 0 |
| `src/components/profileMenu/useSheetGesture.ts` | 2 | 0 |
| `src/components/routeSelector/AddRouteModal.tsx` | 23 | 26 |
| `src/components/routeSelector/BulkRouteSection.tsx` | 15 | 21 |
| `src/components/routeSelector/RouteSelectorCard.tsx` | 0 | 0 |
| `src/components/routeSelector/RouteSelectorSheet.tsx` | 11 | 16 |
| `src/components/routeSelector/UnifiedRouteControlBar.tsx` | 19 | 9 |
| `src/components/routeSelector/dateUtils.ts` | 0 | 0 |
| `src/components/routeSelector/index.ts` | 0 | 0 |
| `src/components/routeSelector/types.ts` | 0 | 0 |
| `src/components/routeSelector/useAddRouteForm.ts` | 0 | 0 |
| `src/components/routeSelector/useBulkRouteForm.ts` | 0 | 0 |
| `src/components/routeSelector/useRouteCascade.ts` | 0 | 0 |
| `src/components/ui/ModalShell.tsx` | 1 | 0 |
| `src/components/userManagement/RoleBadge.tsx` | 19 | 0 |
| `src/components/userManagement/UserCardAvatar.tsx` | 4 | 1 |
| `src/components/userManagement/UserCardItem.tsx` | 26 | 13 |
| `src/components/userManagement/UserManagementFilters.tsx` | 14 | 7 |
| `src/components/userManagement/UserManagementHeader.tsx` | 14 | 8 |
| `src/components/userManagement/UserManagementPage.tsx` | 2 | 2 |
| `src/components/userManagement/UserManagementStates.tsx` | 7 | 7 |
| `src/components/userManagement/index.ts` | 0 | 0 |
| `src/components/userManagement/userManagementModals.ts` | 1 | 5 |
| `src/components/waReport/WaReportFormatTabs.tsx` | 53 | 19 |
| `src/components/waReport/WaReportHeader.tsx` | 6 | 3 |
| `src/components/waReport/WaReportModal.tsx` | 4 | 2 |
| `src/components/waReport/WaReportPreview.tsx` | 11 | 7 |
| `src/components/waReport/index.ts` | 0 | 0 |
| `src/components/waReport/types.ts` | 0 | 0 |
| `src/components/waReport/useWaReportData.ts` | 0 | 0 |
| `src/constants/operators.ts` | 0 | 0 |
| `src/constants/routeRecords.ts` | 0 | 0 |
| `src/constants/texts/index.ts` | 0 | 0 |
| `src/constants/texts/text_alerts.ts` | 2 | 3 |
| `src/constants/texts/text_auth.ts` | 0 | 0 |
| `src/constants/texts/text_common.ts` | 0 | 0 |
| `src/constants/texts/text_dashboard.ts` | 0 | 0 |
| `src/constants/texts/text_errors.ts` | 0 | 0 |
| `src/constants/texts/text_fleet_status.ts` | 0 | 0 |
| `src/constants/texts/text_monitoring.ts` | 0 | 0 |
| `src/constants/texts/text_page_management.ts` | 0 | 0 |
| `src/constants/texts/text_pdo_form.ts` | 0 | 0 |
| `src/constants/texts/text_unit_detail.ts` | 0 | 0 |
| `src/constants/texts/text_user_management.ts` | 0 | 3 |
| `src/constants/texts/text_wa_report.ts` | 0 | 0 |
| `src/context/PageAccessContext.tsx` | 0 | 0 |
| `src/hooks/useMobileBackHandler.ts` | 0 | 0 |
| `src/hooks/useOfflineSync.ts` | 0 | 0 |
| `src/hooks/usePreviousDayOdometer.ts` | 0 | 0 |
| `src/hooks/useUserActivityTracking.ts` | 0 | 0 |
| `src/hooks/useVisualViewport.ts` | 0 | 0 |
| `src/index.css` | 340 | 160 |
| `src/main.tsx` | 0 | 0 |
| `src/services/allRouteMonitoringService.ts` | 0 | 0 |
| `src/services/appSettingsService.ts` | 0 | 0 |
| `src/services/dailyRouteReportService.ts` | 0 | 0 |
| `src/services/fleetResolutionService.ts` | 0 | 0 |
| `src/services/fleetStatusService.ts` | 0 | 0 |
| `src/services/googleSheets/analytics.ts` | 0 | 0 |
| `src/services/googleSheets/auth.ts` | 0 | 0 |
| `src/services/googleSheets/authGis.ts` | 0 | 0 |
| `src/services/googleSheets/authSession.ts` | 0 | 0 |
| `src/services/googleSheets/core.ts` | 0 | 0 |
| `src/services/googleSheets/globalReportReader.ts` | 0 | 0 |
| `src/services/googleSheets/index.ts` | 0 | 0 |
| `src/services/googleSheets/mutations.ts` | 0 | 0 |
| `src/services/googleSheets/transport.ts` | 0 | 0 |
| `src/services/googleSheets/types.ts` | 0 | 0 |
| `src/services/googleSheets.ts` | 0 | 0 |
| `src/services/monthlyMasterIngestionService.ts` | 0 | 0 |
| `src/services/pageManagementService.ts` | 0 | 0 |
| `src/services/realtimeSyncService.ts` | 0 | 0 |
| `src/services/regionalIngestionService.ts` | 0 | 0 |
| `src/services/routeService.ts` | 0 | 0 |
| `src/services/routes/audit.ts` | 0 | 0 |
| `src/services/routes/index.ts` | 0 | 0 |
| `src/services/routes/routes.ts` | 0 | 0 |
| `src/services/routes/sync.ts` | 0 | 0 |
| `src/services/routes/types.ts` | 0 | 0 |
| `src/services/routes/users.ts` | 0 | 0 |
| `src/services/supabase.ts` | 0 | 0 |
| `src/types/pageManagement.ts` | 0 | 0 |
| `src/types/supabase.ts` | 0 | 0 |
| `src/utils/alertUtils.ts` | 0 | 0 |
| `src/utils/analytics.ts` | 0 | 0 |
| `src/utils/auditLogContext.ts` | 0 | 0 |
| `src/utils/bulkRouteInspector.ts` | 0 | 0 |
| `src/utils/bulkRouteParser.ts` | 0 | 0 |
| `src/utils/cacheUtils.ts` | 0 | 0 |
| `src/utils/conflictMerge.ts` | 0 | 0 |
| `src/utils/errorClassifier.ts` | 0 | 0 |
| `src/utils/errorFormatter.ts` | 0 | 0 |
| `src/utils/historyNavigation.ts` | 0 | 0 |
| `src/utils/holidayUtils.ts` | 0 | 0 |
| `src/utils/keteranganUtils.ts` | 0 | 0 |
| `src/utils/modalStackCoordinator.ts` | 0 | 0 |
| `src/utils/modals/bulkModals.ts` | 7 | 16 |
| `src/utils/modals/busInput/busModalEventListeners.ts` | 3 | 3 |
| `src/utils/modals/busInput/busModalHandlers.ts` | 0 | 0 |
| `src/utils/modals/busInput/busModalKeterangan.ts` | 0 | 4 |
| `src/utils/modals/busInput/busModalOdometer.ts` | 0 | 0 |
| `src/utils/modals/busInput/busModalPreConfirm.ts` | 0 | 0 |
| `src/utils/modals/busInput/busModalTemplate.ts` | 1 | 2 |
| `src/utils/modals/busInput/busModalTemplateFull.ts` | 11 | 17 |
| `src/utils/modals/busInput/busModalTemplateKeterangan.ts` | 0 | 6 |
| `src/utils/modals/busInput/busModalTemplateSpecific.ts` | 18 | 24 |
| `src/utils/modals/busInput/busModalTypes.ts` | 0 | 0 |
| `src/utils/modals/busInput/busModalValidation.ts` | 0 | 0 |
| `src/utils/modals/busInput/odometerRegistry.ts` | 0 | 0 |
| `src/utils/modals/busInputModal.ts` | 0 | 0 |
| `src/utils/modals/regionalSyncModal.ts` | 11 | 9 |
| `src/utils/numberUtils.ts` | 0 | 0 |
| `src/utils/roleStorage.ts` | 0 | 0 |
| `src/utils/routeSorting.ts` | 0 | 0 |
| `src/utils/routeValidation.ts` | 0 | 0 |
| `src/utils/scrollLockCoordinator.ts` | 0 | 0 |
| `src/utils/sheetColorUtils.ts` | 0 | 0 |
| `src/utils/sheetIdentity.ts` | 0 | 0 |
| `src/utils/swalBase.ts` | 0 | 0 |
| `src/utils/unitAnalytics.ts` | 0 | 0 |
| `src/utils/waReportGenerator.ts` | 0 | 0 |

## Lampiran B — Duplikasi literal dan lokasi rinci

### B.1 Literal teratas

Case HEX dinormalisasi lowercase; spasi RGBA belum dinormalisasi. Pengulangan fallback tetap dihitung untuk transparansi; bukan semua kemunculan nilai tampil di layar.

| Nilai | Kemunculan | File berbeda |
|---|---:|---:|
| `#3ecf8e` | 133 | 37 |
| `rgba(255, 255, 255, 0.08)` | 99 | 42 |
| `#38bdf8` | 87 | 38 |
| `#f59e0b` | 86 | 39 |
| `#ededed` | 83 | 25 |
| `#94a3b8` | 83 | 24 |
| `transparent` | 82 | 23 |
| `#10b981` | 73 | 26 |
| `rgba(255, 255, 255, 0.05)` | 65 | 28 |
| `rgba(255, 255, 255, 0.03)` | 65 | 22 |
| `rgba(255, 255, 255, 0.06)` | 47 | 17 |
| `#ef4444` | 43 | 17 |
| `#888` | 43 | 4 |
| `rgba(255, 255, 255, 0.1)` | 35 | 23 |
| `#ffffff` | 35 | 22 |
| `rgba(255, 255, 255, 0.04)` | 35 | 19 |
| `rgba(255, 255, 255, 0.12)` | 34 | 23 |
| `#8b8b8b` | 28 | 13 |
| `rgba(255, 255, 255, 0.15)` | 26 | 13 |
| `rgba(245, 158, 11, 0.12)` | 25 | 19 |
| `#f8fafc` | 24 | 12 |
| `rgba(239, 68, 68, 0.12)` | 24 | 13 |
| `#c084fc` | 22 | 11 |
| `#f87171` | 22 | 8 |
| `rgba(56, 189, 248, 0.25)` | 21 | 15 |

### B.2 Semua literal per file, dengan nomor baris

Setiap lokasi hasil scan tercakup di bawah. Baris yang sama dapat muncul dua kali bila literal yang sama dipakai dua kali pada baris tersebut. Ini daftar kandidat untuk migrasi dan audit ulang; penentuan kegagalan kontras hanya pada pasangan yang diketahui seperti bagian 3. Setiap file dapat dibuka melalui tautan commit tetap.

<details>
<summary>src/components/CompletionStatusCard.tsx — 6 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/CompletionStatusCard.tsx)

| Literal | Baris |
|---|---|
| `rgba(62, 207, 142, 0.12)` | 51 |
| `rgba(62, 207, 142, 0.25)` | 52 |
| `#061a10` | 116 |
| `#3ECF8E` | 118 |
| `#24B47E` | 118 |
| `rgba(62, 207, 142, 0.35)` | 126 |

</details>

<details>
<summary>src/components/FormattedNoteText.tsx — 2 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/FormattedNoteText.tsx)

| Literal | Baris |
|---|---|
| `#38bdf8` | 157 |
| `rgba(56, 189, 248, 0.7)` | 158 |

</details>

<details>
<summary>src/components/KPICard.tsx — 6 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/KPICard.tsx)

| Literal | Baris |
|---|---|
| `rgba(62, 207, 142, 0.12)` | 40 |
| `rgba(62, 207, 142, 0.25)` | 41 |
| `#38bdf8` | 90, 95 |
| `#a78bfa` | 106, 111 |

</details>

<details>
<summary>src/components/ShiftComparisonCard.tsx — 8 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/ShiftComparisonCard.tsx)

| Literal | Baris |
|---|---|
| `rgba(62, 207, 142, 0.12)` | 42 |
| `rgba(62, 207, 142, 0.25)` | 43 |
| `#a78bfa` | 61, 139 |
| `rgba(249, 115, 22, 0.12)` | 102 |
| `rgba(249, 115, 22, 0.25)` | 103 |
| `rgba(167, 139, 250, 0.12)` | 156 |
| `rgba(167, 139, 250, 0.25)` | 157 |

</details>

<details>
<summary>src/components/Skeletons.tsx — 11 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/Skeletons.tsx)

| Literal | Baris |
|---|---|
| `#0f172a` | 228, 333 |
| `#f8fafc` | 229, 334 |
| `rgba(15, 23, 42, 0.92)` | 240, 344 |
| `rgba(255, 255, 255, 0.08)` | 243, 347 |
| `rgba(255,255,255,0.08)` | 304, 414 |
| `rgba(255,255,255,0.05)` | 429 |

</details>

<details>
<summary>src/components/UnitCard.tsx — 18 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/UnitCard.tsx)

| Literal | Baris |
|---|---|
| `rgba(34, 197, 94, 0.12)` | 34 |
| `#22c55e` | 35 |
| `rgba(34, 197, 94, 0.25)` | 36 |
| `rgba(245, 158, 11, 0.12)` | 54, 74, 94 |
| `#f59e0b` | 55, 75, 95, 220 |
| `rgba(245, 158, 11, 0.25)` | 56, 76, 96 |
| `rgba(255, 255, 255, 0.05)` | 115 |
| `#10b981` | 222 |
| `#f97316` | 224, 291 |
| `rgba(245, 158, 11, 0.04)` | 286 |

</details>

<details>
<summary>src/components/UnitDetailModal.tsx — 84 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/UnitDetailModal.tsx)

| Literal | Baris |
|---|---|
| `rgba(0, 0, 0, 0.65)` | 91 |
| `#171717` | 109 |
| `rgba(255, 255, 255, 0.1)` | 110, 380 |
| `rgba(0, 0, 0, 0.5)` | 112 |
| `rgba(255, 255, 255, 0.2)` | 139 |
| `rgba(255, 255, 255, 0.08)` | 151, 284, 363, 541, 565 |
| `rgba(56, 189, 248, 0.2)` | 160 |
| `rgba(14, 165, 233, 0.1)` | 160 |
| `#38bdf8` | 161, 231, 245, 257, 258, 390, 404, 440, 489, 579 |
| `rgba(56, 189, 248, 0.3)` | 162 |
| `#ededed` | 178, 268, 347, 441, 573 |
| `#94a3b8` | 184, 200, 261, 267, 271, 280, 340, 346, 350, 359, 432, 481, 492, 515, 526, 537, 616 |
| `rgba(255, 255, 255, 0.05)` | 198 |
| `rgba(255, 255, 255, 0.12)` | 199 |
| `rgba(2, 132, 199, 0.08)` | 220 |
| `rgba(2, 132, 199, 0.2)` | 221 |
| `rgba(2, 132, 199, 0.15)` | 244 |
| `rgba(2, 132, 199, 0.3)` | 246 |
| `rgba(0, 0, 0, 0.2)` | 281, 360, 538 |
| `rgba(126, 34, 206, 0.08)` | 299 |
| `rgba(126, 34, 206, 0.2)` | 300 |
| `#c084fc` | 310, 324, 336, 337, 523 |
| `rgba(126, 34, 206, 0.15)` | 323 |
| `rgba(126, 34, 206, 0.3)` | 325 |
| `rgba(255, 255, 255, 0.03)` | 379 |
| `rgba(56, 189, 248, 0.12)` | 403 |
| `rgba(56, 189, 248, 0.25)` | 405 |
| `rgba(0, 0, 0, 0.15)` | 420, 469, 503 |
| `rgba(255, 255, 255, 0.06)` | 421, 470, 504 |
| `rgba(16, 185, 129, 0.15)` | 452 |
| `rgba(245, 158, 11, 0.15)` | 452 |
| `#10b981` | 453 |
| `#f59e0b` | 453, 593, 598, 603 |
| `rgba(16, 185, 129, 0.3)` | 454 |
| `rgba(245, 158, 11, 0.3)` | 454 |
| `#1e293b` | 564 |
| `rgba(245, 158, 11, 0.1)` | 595 |

</details>

<details>
<summary>src/components/accumulation/AccumulationFooter.tsx — 13 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/accumulation/AccumulationFooter.tsx)

| Literal | Baris |
|---|---|
| `rgba(56, 189, 248, 0.1)` | 42 |
| `rgba(56, 189, 248, 0.25)` | 43 |
| `#38bdf8` | 47 |
| `rgba(239, 68, 68, 0.12)` | 72 |
| `rgba(239, 68, 68, 0.35)` | 73 |
| `#ef4444` | 77 |
| `#0284c7` | 95 |
| `#0ea5e9` | 95 |
| `#ffffff` | 96 |
| `rgba(14, 165, 233, 0.35)` | 100 |
| `rgba(255, 255, 255, 0.12)` | 123 |
| `rgba(255, 255, 255, 0.05)` | 124 |
| `#94a3b8` | 125 |

</details>

<details>
<summary>src/components/accumulation/AccumulationHeader.tsx — 11 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/accumulation/AccumulationHeader.tsx)

| Literal | Baris |
|---|---|
| `rgba(255, 255, 255, 0.2)` | 28 |
| `rgba(255, 255, 255, 0.08)` | 40 |
| `rgba(56, 189, 248, 0.2)` | 50 |
| `rgba(14, 165, 233, 0.1)` | 50 |
| `#38bdf8` | 51 |
| `rgba(56, 189, 248, 0.3)` | 52 |
| `#ededed` | 68 |
| `#94a3b8` | 77, 96 |
| `rgba(255, 255, 255, 0.05)` | 94 |
| `rgba(255, 255, 255, 0.12)` | 95 |

</details>

<details>
<summary>src/components/accumulation/AccumulationPeriodSelector.tsx — 10 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/accumulation/AccumulationPeriodSelector.tsx)

| Literal | Baris |
|---|---|
| `rgba(0, 0, 0, 0.25)` | 70 |
| `rgba(255, 255, 255, 0.12)` | 71 |
| `#ededed` | 72 |
| `#94a3b8` | 81 |
| `rgba(255, 255, 255, 0.03)` | 93, 170 |
| `rgba(255, 255, 255, 0.08)` | 94, 171 |
| `#38bdf8` | 104 |
| `#c084fc` | 181 |

</details>

<details>
<summary>src/components/accumulation/AccumulationSheet.tsx — 4 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/accumulation/AccumulationSheet.tsx)

| Literal | Baris |
|---|---|
| `rgba(0, 0, 0, 0.65)` | 95 |
| `#171717` | 113 |
| `rgba(255, 255, 255, 0.1)` | 114 |
| `rgba(0, 0, 0, 0.5)` | 116 |

</details>

<details>
<summary>src/components/accumulation/useAccumulationGesture.ts — 2 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/accumulation/useAccumulationGesture.ts)

| Literal | Baris |
|---|---|
| `rgba(0, 0, 0, ${opacity})` | 41 |
| `rgba(0, 0, 0, 0.65)` | 76 |

</details>

<details>
<summary>src/components/busCard/BusCard.tsx — 1 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/busCard/BusCard.tsx)

| Literal | Baris |
|---|---|
| `rgba(245, 158, 11, 0.04)` | 160 |

</details>

<details>
<summary>src/components/busCard/BusCardSummary.tsx — 12 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/busCard/BusCardSummary.tsx)

| Literal | Baris |
|---|---|
| `rgba(245, 158, 11, 0.12)` | 91 |
| `rgba(16, 185, 129, 0.12)` | 93 |
| `rgba(239, 68, 68, 0.12)` | 94, 149 |
| `#f59e0b` | 96, 199 |
| `#10b981` | 98, 201 |
| `rgba(245, 158, 11, 0.3)` | 102 |
| `rgba(16, 185, 129, 0.25)` | 104 |
| `rgba(239, 68, 68, 0.25)` | 105, 151 |

</details>

<details>
<summary>src/components/busCard/BusInputModal.tsx — 13 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/busCard/BusInputModal.tsx)

| Literal | Baris |
|---|---|
| `rgba(0, 0, 0, 0.65)` | 119 |
| `#171717` | 141 |
| `rgba(255, 255, 255, 0.1)` | 142 |
| `rgba(0, 0, 0, 0.5)` | 144 |
| `rgba(239, 68, 68, 0.15)` | 186 |
| `rgba(56, 189, 248, 0.1)` | 187 |
| `rgba(239, 68, 68, 0.35)` | 190 |
| `rgba(56, 189, 248, 0.3)` | 191 |
| `#f87171` | 192 |
| `#f59e0b` | 229 |
| `#000` | 230 |
| `#cbd5e1` | 256 |
| `#38bdf8` | 266 |

</details>

<details>
<summary>src/components/busCard/modal/BusInputModalFooter.tsx — 11 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/busCard/modal/BusInputModalFooter.tsx)

| Literal | Baris |
|---|---|
| `rgba(255, 255, 255, 0.08)` | 25 |
| `#171717` | 28 |
| `rgba(255, 255, 255, 0.12)` | 40 |
| `rgba(255, 255, 255, 0.05)` | 41 |
| `#94a3b8` | 42 |
| `rgba(100, 116, 139, 0.25)` | 70 |
| `#0284c7` | 71 |
| `#0ea5e9` | 71 |
| `#64748b` | 72 |
| `#ffffff` | 72 |
| `rgba(14, 165, 233, 0.35)` | 78 |

</details>

<details>
<summary>src/components/busCard/modal/BusInputModalHeader.tsx — 22 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/busCard/modal/BusInputModalHeader.tsx)

| Literal | Baris |
|---|---|
| `rgba(255, 255, 255, 0.08)` | 34 |
| `rgba(56, 189, 248, 0.2)` | 43 |
| `rgba(14, 165, 233, 0.1)` | 43 |
| `#38bdf8` | 44, 89 |
| `rgba(56, 189, 248, 0.3)` | 45 |
| `#ededed` | 60 |
| `rgba(56, 189, 248, 0.35)` | 83 |
| `rgba(255, 255, 255, 0.12)` | 84, 116, 141 |
| `rgba(56, 189, 248, 0.15)` | 86 |
| `rgba(255, 255, 255, 0.05)` | 87, 119, 140 |
| `#94a3b8` | 90, 120, 142 |
| `rgba(245, 158, 11, 0.5)` | 115 |
| `rgba(245, 158, 11, 0.15)` | 118 |
| `#f59e0b` | 120, 129 |

</details>

<details>
<summary>src/components/busCard/modal/BusInputModalNotes.tsx — 28 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/busCard/modal/BusInputModalNotes.tsx)

| Literal | Baris |
|---|---|
| `rgba(255, 255, 255, 0.05)` | 75 |
| `rgba(255, 255, 255, 0.1)` | 76 |
| `rgba(56, 189, 248, 0.3)` | 92 |
| `transparent` | 93, 97, 134, 138 |
| `#1e293b` | 96, 137 |
| `#38bdf8` | 100, 115, 181, 264 |
| `#94a3b8` | 101, 142, 171, 252 |
| `rgba(168, 85, 247, 0.3)` | 133 |
| `#c084fc` | 141, 156 |
| `rgba(255, 255, 255, 0.03)` | 192 |
| `rgba(255, 255, 255, 0.08)` | 193, 242 |
| `rgba(255, 255, 255, 0.12)` | 224 |
| `rgba(0, 0, 0, 0.25)` | 225 |
| `#ededed` | 226 |
| `rgba(255, 255, 255, 0.02)` | 241 |
| `#64748b` | 265 |

</details>

<details>
<summary>src/components/busCard/modal/BusInputModalShift1.tsx — 44 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/busCard/modal/BusInputModalShift1.tsx)

| Literal | Baris |
|---|---|
| `rgba(239, 68, 68, 0.12)` | 112, 268 |
| `rgba(245, 158, 11, 0.12)` | 114, 312 |
| `rgba(56, 189, 248, 0.08)` | 115 |
| `rgba(239, 68, 68, 0.3)` | 118 |
| `rgba(245, 158, 11, 0.3)` | 120 |
| `rgba(56, 189, 248, 0.2)` | 121 |
| `#94a3b8` | 138, 198 |
| `#ededed` | 141, 445 |
| `rgba(245, 158, 11, 0.15)` | 150 |
| `#f59e0b` | 151, 216, 231, 322, 348 |
| `rgba(56, 189, 248, 0.12)` | 167 |
| `rgba(56, 189, 248, 0.25)` | 168 |
| `#38bdf8` | 170, 217, 297 |
| `rgba(255, 255, 255, 0.08)` | 194, 250, 396, 422 |
| `rgba(239, 68, 68, 0.2)` | 208 |
| `rgba(245, 158, 11, 0.2)` | 210 |
| `rgba(56, 189, 248, 0.15)` | 211 |
| `#f87171` | 214, 231, 271 |
| `rgba(239, 68, 68, 0.1)` | 239 |
| `rgba(245, 158, 11, 0.1)` | 240 |
| `rgba(239, 68, 68, 0.35)` | 269 |
| `#cbd5e1` | 287, 332 |
| `rgba(245, 158, 11, 0.35)` | 313 |
| `#000` | 349 |
| `rgba(255, 255, 255, 0.03)` | 395, 421 |
| `rgba(255, 255, 255, 0.12)` | 443 |
| `rgba(0, 0, 0, 0.25)` | 444 |

</details>

<details>
<summary>src/components/busCard/modal/BusInputModalShift2.tsx — 43 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/busCard/modal/BusInputModalShift2.tsx)

| Literal | Baris |
|---|---|
| `rgba(239, 68, 68, 0.12)` | 107, 136, 308 |
| `rgba(192, 132, 252, 0.1)` | 108 |
| `rgba(239, 68, 68, 0.3)` | 111, 142 |
| `rgba(192, 132, 252, 0.25)` | 112 |
| `#f87171` | 116, 248, 265, 311 |
| `#c084fc` | 116, 204, 251 |
| `rgba(245, 158, 11, 0.12)` | 138 |
| `rgba(192, 132, 252, 0.08)` | 139 |
| `rgba(245, 158, 11, 0.3)` | 144 |
| `rgba(192, 132, 252, 0.2)` | 145 |
| `#94a3b8` | 164, 232 |
| `#ededed` | 167, 404 |
| `rgba(56, 189, 248, 0.15)` | 178 |
| `rgba(56, 189, 248, 0.3)` | 179 |
| `#38bdf8` | 180 |
| `rgba(192, 132, 252, 0.15)` | 201, 245 |
| `rgba(192, 132, 252, 0.3)` | 202 |
| `rgba(255, 255, 255, 0.08)` | 228, 284, 355, 381 |
| `rgba(239, 68, 68, 0.2)` | 242 |
| `rgba(245, 158, 11, 0.2)` | 244 |
| `#f59e0b` | 250, 265 |
| `rgba(239, 68, 68, 0.1)` | 273 |
| `rgba(245, 158, 11, 0.1)` | 274 |
| `rgba(239, 68, 68, 0.35)` | 309 |
| `rgba(255, 255, 255, 0.03)` | 354, 380 |
| `rgba(255, 255, 255, 0.12)` | 402 |
| `rgba(0, 0, 0, 0.25)` | 403 |

</details>

<details>
<summary>src/components/busCard/modal/BusInputModalSingleFocus.tsx — 3 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/busCard/modal/BusInputModalSingleFocus.tsx)

| Literal | Baris |
|---|---|
| `rgba(56, 189, 248, 0.12)` | 42 |
| `rgba(56, 189, 248, 0.3)` | 43 |
| `#38bdf8` | 44 |

</details>

<details>
<summary>src/components/busCard/modal/BusInputModalTabs.tsx — 9 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/busCard/modal/BusInputModalTabs.tsx)

| Literal | Baris |
|---|---|
| `rgba(255, 255, 255, 0.04)` | 46 |
| `rgba(255, 255, 255, 0.08)` | 47 |
| `#1e293b` | 72 |
| `transparent` | 73, 79 |
| `#38bdf8` | 75 |
| `#94a3b8` | 76 |
| `rgba(56, 189, 248, 0.25)` | 78 |
| `rgba(0, 0, 0, 0.2)` | 81 |

</details>

<details>
<summary>src/components/busCard/modal/BusInputModalTrip.tsx — 5 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/busCard/modal/BusInputModalTrip.tsx)

| Literal | Baris |
|---|---|
| `rgba(56, 189, 248, 0.08)` | 75 |
| `rgba(56, 189, 248, 0.2)` | 76 |
| `#94a3b8` | 82, 89 |
| `#38bdf8` | 86 |

</details>

<details>
<summary>src/components/busCard/modal/fields/BusFormField.tsx — 8 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/busCard/modal/fields/BusFormField.tsx)

| Literal | Baris |
|---|---|
| `rgba(239, 68, 68, 0.8)` | 60 |
| `rgba(255, 255, 255, 0.12)` | 62, 63 |
| `rgba(255, 255, 255, 0.03)` | 65 |
| `rgba(239, 68, 68, 0.08)` | 67 |
| `rgba(0, 0, 0, 0.25)` | 68 |
| `#ededed` | 69 |
| `#8b8b8b` | 82 |

</details>

<details>
<summary>src/components/busCard/modal/fields/ShiftOptionChip.tsx — 6 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/busCard/modal/fields/ShiftOptionChip.tsx)

| Literal | Baris |
|---|---|
| `#38bdf8` | 39, 45 |
| `rgba(255, 255, 255, 0.1)` | 40 |
| `rgba(56, 189, 248, 0.15)` | 42 |
| `rgba(255, 255, 255, 0.04)` | 43 |
| `#8b8b8b` | 46 |

</details>

<details>
<summary>src/components/busCard/modal/notes/KeteranganPresetBar.tsx — 44 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/busCard/modal/notes/KeteranganPresetBar.tsx)

| Literal | Baris |
|---|---|
| `#94a3b8` | 91, 241, 296 |
| `#38bdf8` | 113, 119, 289, 295 |
| `rgba(255, 255, 255, 0.15)` | 114, 139, 162, 186, 211, 290 |
| `rgba(56, 189, 248, 0.2)` | 116 |
| `rgba(255, 255, 255, 0.05)` | 117, 142, 165, 189, 214, 293 |
| `#f8fafc` | 120, 143, 166, 190, 215 |
| `#eab308` | 138, 143 |
| `rgba(234, 179, 8, 0.2)` | 141 |
| `#ef4444` | 161, 166 |
| `rgba(239, 68, 68, 0.2)` | 164 |
| `#10b981` | 185, 190, 210, 215 |
| `rgba(16, 185, 129, 0.2)` | 188, 213 |
| `rgba(255, 255, 255, 0.12)` | 236 |
| `rgba(255, 255, 255, 0.08)` | 238, 268 |
| `rgba(255, 255, 255, 0.03)` | 239, 267 |
| `rgba(255, 255, 255, 0.2)` | 242 |
| `rgba(56, 189, 248, 0.25)` | 292 |

</details>

<details>
<summary>src/components/busCard/modal/singleFocus/SingleFocusKmRolloverBanner.tsx — 6 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/busCard/modal/singleFocus/SingleFocusKmRolloverBanner.tsx)

| Literal | Baris |
|---|---|
| `rgba(245, 158, 11, 0.12)` | 23 |
| `rgba(245, 158, 11, 0.35)` | 24 |
| `#9a3412` | 33 |
| `#ededed` | 46 |
| `#f59e0b` | 65 |
| `#000` | 66 |

</details>

<details>
<summary>src/components/busCard/modal/singleFocus/SingleFocusKmShift1.tsx — 29 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/busCard/modal/singleFocus/SingleFocusKmShift1.tsx)

| Literal | Baris |
|---|---|
| `#0369a1` | 79, 272, 388 |
| `rgba(2, 132, 199, 0.08)` | 80 |
| `rgba(239, 68, 68, 0.12)` | 120, 234, 350 |
| `rgba(239, 68, 68, 0.35)` | 121, 235, 351 |
| `#f87171` | 123, 238, 354 |
| `#cbd5e1` | 139 |
| `#38bdf8` | 149 |
| `#ef4444` | 220, 333 |
| `rgba(239, 68, 68, 0.08)` | 222, 338 |
| `rgba(245, 158, 11, 0.12)` | 254, 370 |
| `rgba(245, 158, 11, 0.35)` | 255, 371 |
| `#f59e0b` | 258, 374 |
| `#6b7280` | 301 |
| `rgba(0, 0, 0, 0.04)` | 302, 336 |
| `rgba(0, 0, 0, 0.08)` | 305 |

</details>

<details>
<summary>src/components/busCard/modal/singleFocus/SingleFocusKmShift2.tsx — 33 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/busCard/modal/singleFocus/SingleFocusKmShift2.tsx)

| Literal | Baris |
|---|---|
| `#ef4444` | 123, 266, 379 |
| `rgba(0, 0, 0, 0.04)` | 126, 348, 382 |
| `rgba(239, 68, 68, 0.08)` | 128, 268, 384 |
| `rgba(239, 68, 68, 0.12)` | 146, 166, 280, 396 |
| `rgba(239, 68, 68, 0.35)` | 147, 167, 281, 397 |
| `#f87171` | 149, 169, 284, 400 |
| `#cbd5e1` | 185 |
| `#c084fc` | 195 |
| `rgba(245, 158, 11, 0.12)` | 300, 416 |
| `rgba(245, 158, 11, 0.35)` | 301, 417 |
| `#f59e0b` | 304, 420 |
| `#7e22ce` | 318, 434 |
| `#6b7280` | 347 |
| `rgba(0, 0, 0, 0.08)` | 351 |

</details>

<details>
<summary>src/components/busCard/modal/singleFocus/SingleFocusNotes.tsx — 5 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/busCard/modal/singleFocus/SingleFocusNotes.tsx)

| Literal | Baris |
|---|---|
| `rgba(0, 0, 0, 0.1)` | 57 |
| `#6b7280` | 71 |
| `rgba(0, 0, 0, 0.12)` | 91 |
| `rgba(243, 244, 246, 0.9)` | 92 |
| `#171717` | 93 |

</details>

<details>
<summary>src/components/busCard/modal/singleFocus/SingleFocusTrip.tsx — 5 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/busCard/modal/singleFocus/SingleFocusTrip.tsx)

| Literal | Baris |
|---|---|
| `rgba(56, 189, 248, 0.08)` | 128 |
| `rgba(56, 189, 248, 0.25)` | 129 |
| `#94a3b8` | 138, 158 |
| `#38bdf8` | 149 |

</details>

<details>
<summary>src/components/busCard/modal/singleFocus/singleFocusStyles.ts — 23 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/busCard/modal/singleFocus/singleFocusStyles.ts)

| Literal | Baris |
|---|---|
| `#38bdf8` | 7, 31, 94 |
| `rgba(0, 0, 0, 0.25)` | 8, 46 |
| `#ededed` | 9, 47, 57, 84 |
| `#0284c7` | 25 |
| `rgba(255, 255, 255, 0.12)` | 26, 43 |
| `rgba(2, 132, 199, 0.15)` | 28, 92 |
| `rgba(255, 255, 255, 0.04)` | 29 |
| `#94a3b8` | 32, 64 |
| `rgba(255, 255, 255, 0.03)` | 45 |
| `rgba(126, 34, 206, 0.12)` | 75 |
| `rgba(2, 132, 199, 0.12)` | 76 |
| `rgba(126, 34, 206, 0.25)` | 78 |
| `rgba(2, 132, 199, 0.25)` | 79 |
| `rgba(2, 132, 199, 0.3)` | 93 |

</details>

<details>
<summary>src/components/busList/BusListAccumulationBanner.tsx — 7 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/busList/BusListAccumulationBanner.tsx)

| Literal | Baris |
|---|---|
| `rgba(245, 158, 11, 0.12)` | 34 |
| `rgba(245, 158, 11, 0.35)` | 35 |
| `#f59e0b` | 36, 58, 72 |
| `rgba(245, 158, 11, 0.18)` | 70 |
| `rgba(245, 158, 11, 0.45)` | 71 |

</details>

<details>
<summary>src/components/busList/BusListControlBar.tsx — 9 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/busList/BusListControlBar.tsx)

| Literal | Baris |
|---|---|
| `#1e293b` | 133 |
| `#f8fafc` | 134 |
| `rgba(16, 185, 129, 0.15)` | 185 |
| `rgba(16, 185, 129, 0.4)` | 188 |
| `#10b981` | 191 |
| `rgba(56, 189, 248, 0.08)` | 219 |
| `rgba(56, 189, 248, 0.25)` | 221 |
| `#38bdf8` | 239 |
| `#f59e0b` | 249 |

</details>

<details>
<summary>src/components/busList/BusListProgressBar.tsx — 1 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/busList/BusListProgressBar.tsx)

| Literal | Baris |
|---|---|
| `rgba(255, 255, 255, 0.08)` | 63 |

</details>

<details>
<summary>src/components/dailyToaTrend/ToaBarChart.tsx — 25 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/dailyToaTrend/ToaBarChart.tsx)

| Literal | Baris |
|---|---|
| `#60a5fa` | 55, 252, 293 |
| `#3b82f6` | 56 |
| `#1d4ed8` | 57, 251, 256 |
| `#4ade80` | 68, 195 |
| `#22c55e` | 69 |
| `#059669` | 70 |
| `#fb923c` | 81 |
| `#ef4444` | 82 |
| `#b91c1c` | 83 |
| `#f43f5e` | 94 |
| `#dc2626` | 95 |
| `#7f1d1d` | 96 |
| `#38bdf8` | 111 |
| `rgba(255, 255, 255, 0.1)` | 123, 132 |
| `rgba(255, 255, 255, 0.15)` | 141 |
| `rgba(34,197,94,0.5)` | 196 |
| `#fb7185` | 217 |
| `rgba(244,63,94,0.5)` | 218 |
| `#ffffff` | 262 |

</details>

<details>
<summary>src/components/dailyToaTrend/ToaTrendErrorState.tsx — 3 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/dailyToaTrend/ToaTrendErrorState.tsx)

| Literal | Baris |
|---|---|
| `rgba(245, 158, 11, 0.08)` | 28 |
| `rgba(245, 158, 11, 0.25)` | 29 |
| `#d97706` | 30 |

</details>

<details>
<summary>src/components/dailyToaTrend/ToaTrendLegend.tsx — 3 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/dailyToaTrend/ToaTrendLegend.tsx)

| Literal | Baris |
|---|---|
| `#4ade80` | 23 |
| `#fb923c` | 34 |
| `#f43f5e` | 45 |

</details>

<details>
<summary>src/components/dashboard/DashboardContentTabs.tsx — 3 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/dashboard/DashboardContentTabs.tsx)

| Literal | Baris |
|---|---|
| `rgba(245, 158, 11, 0.1)` | 103 |
| `#f59e0b` | 104 |
| `#d97706` | 112 |

</details>

<details>
<summary>src/components/dashboard/DashboardHeader.tsx — 12 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/dashboard/DashboardHeader.tsx)

| Literal | Baris |
|---|---|
| `rgba(0, 0, 0, 0.12)` | 96 |
| `rgba(255, 255, 255, 0.06)` | 130 |
| `rgba(255, 255, 255, 0.12)` | 131 |
| `#a0aec0` | 132 |
| `rgba(62, 207, 142, 0.12)` | 157 |
| `rgba(62, 207, 142, 0.32)` | 158 |
| `#3ECF8E` | 159, 170 |
| `rgba(247, 85, 85, 0.12)` | 188 |
| `rgba(245, 158, 11, 0.12)` | 189 |
| `rgba(247, 85, 85, 0.25)` | 196 |
| `rgba(245, 158, 11, 0.25)` | 197 |

</details>

<details>
<summary>src/components/dashboard/DashboardStatusBanners.tsx — 12 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/dashboard/DashboardStatusBanners.tsx)

| Literal | Baris |
|---|---|
| `#ef4444` | 91, 120, 182, 190, 198 |
| `#ffffff` | 92, 119 |
| `rgba(239, 68, 68, 0.25)` | 100 |
| `rgba(234, 179, 8, 0.12)` | 160 |
| `rgba(234, 179, 8, 0.4)` | 161 |
| `rgba(239, 68, 68, 0.1)` | 181 |
| `white` | 199 |

</details>

<details>
<summary>src/components/dashboard/QueueModal.tsx — 1 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/dashboard/QueueModal.tsx)

| Literal | Baris |
|---|---|
| `rgba(0,0,0,0.5)` | 37 |

</details>

<details>
<summary>src/components/fleetStatus/QuickKorlapFleetModal.tsx — 41 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/fleetStatus/QuickKorlapFleetModal.tsx)

| Literal | Baris |
|---|---|
| `rgba(0, 0, 0, 0.65)` | 224 |
| `#1e293b` | 233 |
| `#f8fafc` | 234 |
| `rgba(0, 0, 0, 0.3)` | 236 |
| `#334155` | 237, 247, 314, 332, 373, 405, 438, 463 |
| `#94a3b8` | 261, 273, 299, 316, 334, 358, 390, 423, 451, 478 |
| `transparent` | 271, 477 |
| `#3ECF8E` | 314, 316, 332, 334, 495 |
| `rgba(62, 207, 142, 0.15)` | 315, 333 |
| `rgba(0, 0, 0, 0.15)` | 315, 333 |
| `rgba(0, 0, 0, 0.2)` | 374, 406, 439 |
| `#fff` | 375, 407, 440 |
| `#475569` | 476 |
| `#000` | 496 |

</details>

<details>
<summary>src/components/login/LegalModals.tsx — 7 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/login/LegalModals.tsx)

| Literal | Baris |
|---|---|
| `rgba(0, 0, 0, 0.75)` | 21 |
| `#171717` | 42 |
| `rgba(0, 0, 0, 0.5)` | 44 |
| `#3ECF8E` | 130, 211, 224 |
| `rgba(255, 255, 255, 0.03)` | 194 |

</details>

<details>
<summary>src/components/login/LoginFeatureCards.tsx — 3 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/login/LoginFeatureCards.tsx)

| Literal | Baris |
|---|---|
| `rgba(255, 255, 255, 0.08)` | 65 |
| `#3ECF8E` | 73 |
| `rgba(62, 207, 142, 0.12)` | 82 |

</details>

<details>
<summary>src/components/login/LoginFooter.tsx — 4 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/login/LoginFooter.tsx)

| Literal | Baris |
|---|---|
| `rgba(255, 255, 255, 0.08)` | 24 |
| `#3ECF8E` | 43, 65, 87 |

</details>

<details>
<summary>src/components/login/LoginHeroCard.tsx — 12 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/login/LoginHeroCard.tsx)

| Literal | Baris |
|---|---|
| `rgba(62, 207, 142, 0.22)` | 41 |
| `rgba(62, 207, 142, 0)` | 41 |
| `rgba(62, 207, 142, 0.28)` | 55 |
| `transparent` | 68 |
| `rgba(62, 207, 142, 0.12)` | 94 |
| `rgba(62, 207, 142, 0.3)` | 95 |
| `#3ECF8E` | 96, 207 |
| `rgba(239, 68, 68, 0.12)` | 128 |
| `rgba(239, 68, 68, 0.3)` | 129 |
| `rgba(255, 255, 255, 0.04)` | 198 |
| `rgba(255, 255, 255, 0.1)` | 199 |

</details>

<details>
<summary>src/components/login/LoginInfoAboutSection.tsx — 9 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/login/LoginInfoAboutSection.tsx)

| Literal | Baris |
|---|---|
| `rgba(255, 255, 255, 0.02)` | 39, 65, 91 |
| `#3ECF8E` | 47, 51, 73, 77, 99, 103 |

</details>

<details>
<summary>src/components/login/LoginInfoComparisonSection.tsx — 16 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/login/LoginInfoComparisonSection.tsx)

| Literal | Baris |
|---|---|
| `#3ECF8E` | 15, 81, 83, 132, 134, 183, 185 |
| `rgba(255, 255, 255, 0.02)` | 43, 94, 145 |
| `#ef4444` | 67, 69, 118, 120, 169, 171 |

</details>

<details>
<summary>src/components/login/LoginInfoHeader.tsx — 4 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/login/LoginInfoHeader.tsx)

| Literal | Baris |
|---|---|
| `rgba(255, 255, 255, 0.2)` | 16 |
| `rgba(62, 207, 142, 0.15)` | 38 |
| `#3ECF8E` | 39 |
| `rgba(255, 255, 255, 0.05)` | 58 |

</details>

<details>
<summary>src/components/login/LoginInfoModal.tsx — 3 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/login/LoginInfoModal.tsx)

| Literal | Baris |
|---|---|
| `rgba(0, 0, 0, 0.75)` | 27 |
| `#171717` | 50 |
| `rgba(0, 0, 0, 0.5)` | 52 |

</details>

<details>
<summary>src/components/login/LoginInfoPermissionsSection.tsx — 4 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/login/LoginInfoPermissionsSection.tsx)

| Literal | Baris |
|---|---|
| `#3ECF8E` | 23, 53, 92 |
| `rgba(0, 0, 0, 0.3)` | 78 |

</details>

<details>
<summary>src/components/monitoring/AllRouteMonitoringPage.tsx — 2 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/monitoring/AllRouteMonitoringPage.tsx)

| Literal | Baris |
|---|---|
| `#0c0c0c` | 494 |
| `#ededed` | 495 |

</details>

<details>
<summary>src/components/monitoring/IngestionProgressModal.tsx — 39 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/monitoring/IngestionProgressModal.tsx)

| Literal | Baris |
|---|---|
| `rgba(0, 0, 0, 0.65)` | 50 |
| `#161616` | 60 |
| `rgba(255, 255, 255, 0.12)` | 61 |
| `rgba(0, 0, 0, 0.4)` | 64 |
| `rgba(16, 185, 129, 0.25)` | 83 |
| `transparent` | 83, 84 |
| `rgba(62, 207, 142, 0.25)` | 84, 306 |
| `rgba(16, 185, 129, 0.15)` | 97 |
| `rgba(62, 207, 142, 0.12)` | 98 |
| `rgba(16, 185, 129, 0.4)` | 100, 273 |
| `rgba(62, 207, 142, 0.3)` | 101 |
| `rgba(16, 185, 129, 0.3)` | 108 |
| `rgba(62, 207, 142, 0.2)` | 109 |
| `#10b981` | 117, 236, 237, 268, 269 |
| `#3ECF8E` | 125, 149, 161, 245, 269, 303, 333 |
| `#ededed` | 175 |
| `#8b8b8b` | 184, 211 |
| `rgba(255, 255, 255, 0.08)` | 257, 285 |
| `#34d399` | 268 |
| `rgba(62, 207, 142, 0.4)` | 274 |
| `rgba(255, 255, 255, 0.04)` | 284 |
| `#9a9a9a` | 289 |
| `rgba(62, 207, 142, 0.15)` | 302 |
| `#000` | 334 |

</details>

<details>
<summary>src/components/monitoring/MonitoringHeader.tsx — 25 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/monitoring/MonitoringHeader.tsx)

| Literal | Baris |
|---|---|
| `rgba(23, 23, 23, 0.95)` | 106 |
| `rgba(255, 255, 255, 0.08)` | 109 |
| `rgba(0, 0, 0, 0.15)` | 111, 481 |
| `#ededed` | 143, 233, 258, 299, 354, 379, 421 |
| `#8b8b8b` | 152, 321 |
| `rgba(255, 255, 255, 0.05)` | 220, 419 |
| `rgba(255, 255, 255, 0.1)` | 221, 420 |
| `transparent` | 231, 256, 352, 377 |
| `#3ECF8E` | 309, 477 |
| `rgba(62, 207, 142, 0.14)` | 475 |
| `rgba(62, 207, 142, 0.3)` | 476 |

</details>

<details>
<summary>src/components/monitoring/MonitoringKpiCards.tsx — 18 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/monitoring/MonitoringKpiCards.tsx)

| Literal | Baris |
|---|---|
| `rgba(23, 23, 23, 0.85)` | 26, 95, 170, 230 |
| `rgba(255, 255, 255, 0.08)` | 27, 96, 171, 231 |
| `#8b8b8b` | 41, 110, 185, 245 |
| `#ededed` | 51 |
| `#3ECF8E` | 77, 121 |
| `#38bdf8` | 193, 262 |
| `#c084fc` | 282 |

</details>

<details>
<summary>src/components/monitoring/MonitoringMonthPickerModal.tsx — 42 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/monitoring/MonitoringMonthPickerModal.tsx)

| Literal | Baris |
|---|---|
| `rgba(0, 0, 0, 0.68)` | 127 |
| `#1a1a1a` | 137 |
| `rgba(255, 255, 255, 0.12)` | 138, 283, 307, 325 |
| `rgba(0, 0, 0, 0.5)` | 141 |
| `#ededed` | 161, 210, 230, 244, 373 |
| `#3ECF8E` | 167, 290, 362, 365, 372, 419 |
| `transparent` | 175, 208, 242, 402 |
| `#888` | 177, 267 |
| `rgba(255, 255, 255, 0.05)` | 196 |
| `rgba(255, 255, 255, 0.08)` | 197, 363 |
| `rgba(62, 207, 142, 0.16)` | 286 |
| `rgba(255, 255, 255, 0.04)` | 287, 308, 326 |
| `#aaa` | 291, 309, 327 |
| `rgba(62, 207, 142, 0.12)` | 367 |
| `rgba(255, 255, 255, 0.03)` | 368 |
| `#062817` | 370, 420 |
| `rgba(62, 207, 142, 0.3)` | 382, 427 |
| `rgba(255, 255, 255, 0.15)` | 401 |
| `#a3a3a3` | 403 |

</details>

<details>
<summary>src/components/monitoring/MonitoringPeriodSelector.tsx — 44 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/monitoring/MonitoringPeriodSelector.tsx)

| Literal | Baris |
|---|---|
| `rgba(255, 255, 255, 0.06)` | 97 |
| `rgba(255, 255, 255, 0.1)` | 100 |
| `#3ECF8E` | 127, 168, 209, 250, 319, 425 |
| `transparent` | 128, 169, 210, 251, 326, 408 |
| `#062817` | 131, 172, 213, 254, 426 |
| `#a3a3a3` | 132, 173, 214, 255, 348, 377, 409 |
| `rgba(62, 207, 142, 0.3)` | 136, 177, 218, 259, 433 |
| `rgba(0, 0, 0, 0.65)` | 281 |
| `#1a1a1a` | 291 |
| `rgba(255, 255, 255, 0.12)` | 292 |
| `rgba(0, 0, 0, 0.4)` | 295 |
| `#ededed` | 313, 364, 393 |
| `#888` | 328 |
| `rgba(255, 255, 255, 0.15)` | 362, 391, 407 |
| `rgba(255, 255, 255, 0.05)` | 363, 392 |

</details>

<details>
<summary>src/components/monitoring/MonitoringReadinessBanner.tsx — 14 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/monitoring/MonitoringReadinessBanner.tsx)

| Literal | Baris |
|---|---|
| `rgba(23, 23, 23, 0.85)` | 32 |
| `rgba(255, 255, 255, 0.08)` | 33 |
| `rgba(0, 0, 0, 0.1)` | 39 |
| `#8b8b8b` | 53, 77, 122 |
| `#ededed` | 63 |
| `rgba(255, 255, 255, 0.06)` | 99 |
| `#3ECF8E` | 107 |
| `#00C573` | 107 |
| `#10b981` | 138 |
| `#3b82f6` | 158 |
| `#f59e0b` | 178 |
| `#64748b` | 196 |

</details>

<details>
<summary>src/components/monitoring/MonitoringRouteCard.tsx — 46 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/monitoring/MonitoringRouteCard.tsx)

| Literal | Baris |
|---|---|
| `rgba(23, 23, 23, 0.85)` | 26 |
| `rgba(255, 255, 255, 0.08)` | 27, 194, 396 |
| `rgba(0, 0, 0, 0.1)` | 34 |
| `rgba(62, 207, 142, 0.12)` | 58 |
| `#3ECF8E` | 59, 304, 438 |
| `rgba(62, 207, 142, 0.25)` | 60 |
| `#8b8b8b` | 71, 193, 223, 254, 291, 329, 397, 421 |
| `rgba(16, 185, 129, 0.12)` | 96, 135 |
| `#10b981` | 97, 136 |
| `rgba(16, 185, 129, 0.25)` | 98, 137 |
| `rgba(56, 189, 248, 0.12)` | 114 |
| `#38bdf8` | 115, 342 |
| `rgba(56, 189, 248, 0.25)` | 116 |
| `rgba(59, 130, 246, 0.12)` | 154 |
| `#3b82f6` | 155 |
| `rgba(59, 130, 246, 0.25)` | 156 |
| `rgba(245, 158, 11, 0.12)` | 173 |
| `#f59e0b` | 174, 380 |
| `rgba(245, 158, 11, 0.25)` | 175 |
| `rgba(255, 255, 255, 0.05)` | 192, 395 |
| `#ededed` | 210, 227, 267 |
| `rgba(255, 255, 255, 0.03)` | 244 |
| `rgba(255, 255, 255, 0.06)` | 245, 417 |
| `rgba(245, 158, 11, 0.1)` | 378 |
| `rgba(245, 158, 11, 0.2)` | 379 |
| `#ffffff` | 439 |

</details>

<details>
<summary>src/components/monitoring/MonitoringStates.tsx — 10 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/monitoring/MonitoringStates.tsx)

| Literal | Baris |
|---|---|
| `rgba(255, 255, 255, 0.04)` | 23, 40, 59 |
| `rgba(239, 68, 68, 0.1)` | 75 |
| `rgba(239, 68, 68, 0.25)` | 76 |
| `#ef4444` | 86, 93, 115 |
| `#8b8b8b` | 101 |
| `#ffffff` | 116 |

</details>

<details>
<summary>src/components/monitoring/MonitoringSupervisorTabs.tsx — 7 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/monitoring/MonitoringSupervisorTabs.tsx)

| Literal | Baris |
|---|---|
| `#3ECF8E` | 42, 45 |
| `rgba(255, 255, 255, 0.08)` | 43 |
| `rgba(23, 23, 23, 0.85)` | 46 |
| `#ffffff` | 47 |
| `#8b8b8b` | 47 |
| `rgba(62, 207, 142, 0.25)` | 51 |

</details>

<details>
<summary>src/components/monitoring/MonthlySyncModal.tsx — 46 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/monitoring/MonthlySyncModal.tsx)

| Literal | Baris |
|---|---|
| `rgba(0, 0, 0, 0.65)` | 184 |
| `#1e1e1e` | 194 |
| `rgba(255, 255, 255, 0.1)` | 195, 400, 483 |
| `rgba(0, 0, 0, 0.4)` | 198 |
| `transparent` | 213, 517 |
| `#a3a3a3` | 215, 261, 332, 368, 406, 423, 519 |
| `rgba(62, 207, 142, 0.15)` | 236, 402 |
| `#3ECF8E` | 240, 287, 399, 405, 474, 491, 538 |
| `#ededed` | 252, 352, 443, 469 |
| `rgba(239, 68, 68, 0.12)` | 280, 310 |
| `rgba(255, 255, 255, 0.04)` | 281, 403 |
| `rgba(239, 68, 68, 0.3)` | 283, 311 |
| `rgba(255, 255, 255, 0.08)` | 284, 459 |
| `#ef4444` | 287, 312 |
| `rgba(255, 255, 255, 0.05)` | 350, 441 |
| `rgba(255, 255, 255, 0.12)` | 351, 442, 518 |
| `rgba(255, 255, 255, 0.03)` | 458 |
| `#000000` | 540 |
| `rgba(62, 207, 142, 0.25)` | 546 |

</details>

<details>
<summary>src/components/monitoring/modals/KorwilRouteDetailBottomSheet.tsx — 115 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/monitoring/modals/KorwilRouteDetailBottomSheet.tsx)

| Literal | Baris |
|---|---|
| `rgba(0, 0, 0, 0.65)` | 147 |
| `#18181b` | 167, 707 |
| `#ffffff` | 168 |
| `rgba(255, 255, 255, 0.1)` | 171, 256, 500, 526, 754 |
| `rgba(0, 0, 0, 0.45)` | 172 |
| `rgba(255, 255, 255, 0.25)` | 194 |
| `rgba(255, 255, 255, 0.08)` | 203, 356, 466, 582, 643, 706 |
| `rgba(62, 207, 142, 0.15)` | 218 |
| `#3ECF8E` | 219, 322, 362, 472, 502, 528, 551, 588, 649, 661, 725 |
| `rgba(62, 207, 142, 0.3)` | 220 |
| `#ededed` | 230, 324, 363, 373, 382, 413, 473, 489, 494, 498, 515, 520, 524, 589, 600, 611, 621, 632, 650, 671, 694 |
| `#888` | 239, 263, 370, 379, 388, 419, 447, 492, 496, 518, 522, 548, 557, 597, 608, 618, 629, 658, 668, 691, 753 |
| `rgba(255, 255, 255, 0.06)` | 255, 450 |
| `rgba(16, 185, 129, 0.12)` | 287, 337 |
| `rgba(62, 207, 142, 0.05)` | 287 |
| `rgba(16, 185, 129, 0.25)` | 288, 340 |
| `#10B981` | 298, 305, 336, 391, 567, 673 |
| `rgba(255, 255, 255, 0.03)` | 355, 369, 378, 387, 407, 465, 483, 509, 581, 596, 607, 617, 628, 642, 657, 667, 683 |
| `#F59E0B` | 391, 567, 673 |
| `rgba(255, 255, 255, 0.05)` | 408, 484, 510 |
| `rgba(62, 207, 142, 0.08)` | 536 |
| `rgba(62, 207, 142, 0.2)` | 537 |
| `rgba(16, 185, 129, 0.15)` | 566 |
| `rgba(245, 158, 11, 0.15)` | 566 |
| `#0a0a0a` | 726 |
| `rgba(62, 207, 142, 0.25)` | 735 |
| `transparent` | 752 |

</details>

<details>
<summary>src/components/monitoring/modals/MonitoringRouteDetailModal.tsx — 99 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/monitoring/modals/MonitoringRouteDetailModal.tsx)

| Literal | Baris |
|---|---|
| `rgba(0, 0, 0, 0.65)` | 132 |
| `#18181b` | 154, 1030 |
| `#ffffff` | 155, 1089 |
| `rgba(255, 255, 255, 0.1)` | 158, 1043 |
| `rgba(0, 0, 0, 0.45)` | 159 |
| `rgba(255, 255, 255, 0.2)` | 182 |
| `rgba(255, 255, 255, 0.08)` | 191, 1024, 1063 |
| `rgba(62, 207, 142, 0.15)` | 206 |
| `#3ECF8E` | 207, 479, 816, 830, 863, 897 |
| `rgba(62, 207, 142, 0.3)` | 208 |
| `rgba(16, 185, 129, 0.12)` | 252, 632 |
| `#10b981` | 253 |
| `rgba(16, 185, 129, 0.25)` | 254, 635 |
| `rgba(56, 189, 248, 0.12)` | 271 |
| `#38bdf8` | 272 |
| `rgba(56, 189, 248, 0.25)` | 273 |
| `rgba(245, 158, 11, 0.12)` | 290, 613 |
| `#f59e0b` | 291 |
| `rgba(245, 158, 11, 0.25)` | 292, 616 |
| `rgba(161, 161, 170, 0.12)` | 309 |
| `#a1a1aa` | 310 |
| `rgba(161, 161, 170, 0.25)` | 311 |
| `transparent` | 324, 364, 389, 414, 1041 |
| `rgba(255, 255, 255, 0.02)` | 345, 773, 849, 855, 883, 889 |
| `rgba(255, 255, 255, 0.05)` | 346, 664 |
| `rgba(255, 255, 255, 0.15)` | 363, 388, 413, 1065 |
| `rgba(255, 255, 255, 0.06)` | 369, 394, 419, 457, 473, 494, 531, 547, 566, 731, 806, 842, 876, 910, 949, 965, 989, 1005 |
| `rgba(255, 255, 255, 0.03)` | 454, 470, 491, 528, 544, 563, 663, 803, 839, 873, 907, 946, 962, 986, 1002 |
| `#F59E0B` | 586, 612 |
| `#10B981` | 588, 631, 753, 1088 |
| `rgba(16, 185, 129, 0.06)` | 749 |
| `rgba(16, 185, 129, 0.15)` | 750 |
| `rgba(255, 255, 255, 0.04)` | 774, 861, 895 |
| `#059669` | 1088 |
| `rgba(16, 185, 129, 0.3)` | 1095 |

</details>

<details>
<summary>src/components/monitoring/monitoringUtils.ts — 22 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/monitoring/monitoringUtils.ts)

| Literal | Baris |
|---|---|
| `#F43F5E` | 170 |
| `rgba(244, 63, 94, 0.15)` | 171 |
| `#F59E0B` | 184 |
| `rgba(245, 158, 11, 0.15)` | 185 |
| `#A855F7` | 193 |
| `rgba(168, 85, 247, 0.15)` | 194 |
| `#FB923C` | 203 |
| `rgba(251, 146, 60, 0.15)` | 204 |
| `#38BDF8` | 212 |
| `rgba(56, 189, 248, 0.15)` | 213 |
| `#C084FC` | 221 |
| `rgba(192, 132, 252, 0.15)` | 222 |
| `#60A5FA` | 230 |
| `rgba(96, 165, 250, 0.15)` | 231 |
| `#34D399` | 239 |
| `rgba(52, 211, 153, 0.15)` | 240 |
| `#FBBF24` | 248, 259, 267 |
| `rgba(251, 191, 36, 0.15)` | 249, 260, 268 |

</details>

<details>
<summary>src/components/monitoring/tabs/MonitoringDashboardTab.tsx — 9 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/monitoring/tabs/MonitoringDashboardTab.tsx)

| Literal | Baris |
|---|---|
| `#10B981` | 52, 81, 109, 110 |
| `#F59E0B` | 54 |
| `#3ECF8E` | 81, 110 |
| `rgba(255, 255, 255, 0.06)` | 99 |
| `#059669` | 109 |

</details>

<details>
<summary>src/components/monitoring/tabs/MonitoringFleetStatusTab.tsx — 94 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/monitoring/tabs/MonitoringFleetStatusTab.tsx)

| Literal | Baris |
|---|---|
| `rgba(23, 23, 23, 0.75)` | 449, 1038, 1292, 1380 |
| `rgba(255, 255, 255, 0.08)` | 451, 677, 698, 719, 753, 873, 1040 |
| `#3ECF8E` | 465, 674, 695, 716, 1074 |
| `rgba(255, 255, 255, 0.05)` | 483, 505, 593, 675, 696, 717, 1203, 1411 |
| `rgba(255, 255, 255, 0.06)` | 486, 889, 1188, 1270, 1382, 1438 |
| `rgba(255, 255, 255, 0.03)` | 504, 589, 872, 1201 |
| `rgba(16, 185, 129, 0.06)` | 537 |
| `rgba(16, 185, 129, 0.2)` | 538, 1294, 1363 |
| `#10B981` | 554, 559, 565, 947, 1308, 1323, 1362 |
| `rgba(245, 158, 11, 0.06)` | 588 |
| `rgba(245, 158, 11, 0.25)` | 592, 816, 1154 |
| `#F59E0B` | 609, 615, 622, 815, 993, 1150, 1158 |
| `#000` | 676, 697, 718 |
| `rgba(255, 255, 255, 0.15)` | 747 |
| `transparent` | 748, 772, 793, 814, 835, 856, 1016 |
| `rgba(251, 146, 60, 0.2)` | 771 |
| `#FB923C` | 773 |
| `rgba(251, 146, 60, 0.25)` | 774 |
| `rgba(56, 189, 248, 0.2)` | 792 |
| `#38BDF8` | 794 |
| `rgba(56, 189, 248, 0.25)` | 795, 1129 |
| `rgba(245, 158, 11, 0.2)` | 813 |
| `rgba(244, 63, 94, 0.2)` | 834 |
| `#F43F5E` | 836 |
| `rgba(244, 63, 94, 0.25)` | 837 |
| `rgba(168, 85, 247, 0.2)` | 855 |
| `#A855F7` | 857 |
| `rgba(168, 85, 247, 0.25)` | 858 |
| `#8b8b8b` | 893 |
| `rgba(16, 185, 129, 0.05)` | 925 |
| `rgba(16, 185, 129, 0.25)` | 926, 1327 |
| `rgba(16, 185, 129, 0.15)` | 943 |
| `rgba(62, 207, 142, 0.12)` | 1073 |
| `rgba(62, 207, 142, 0.25)` | 1075 |
| `rgba(56, 189, 248, 0.12)` | 1130 |
| `#38bdf8` | 1131 |
| `rgba(245, 158, 11, 0.12)` | 1151 |
| `rgba(16, 185, 129, 0.12)` | 1324 |
| `rgba(16, 185, 129, 0.08)` | 1361 |
| `rgba(255, 255, 255, 0.04)` | 1436 |

</details>

<details>
<summary>src/components/monitoring/tabs/MonitoringKorwilTab.tsx — 73 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/monitoring/tabs/MonitoringKorwilTab.tsx)

| Literal | Baris |
|---|---|
| `#1e1e1e` | 127, 290 |
| `rgba(255, 255, 255, 0.1)` | 128 |
| `rgba(0, 0, 0, 0.15)` | 133 |
| `#3ECF8E` | 143, 160, 175, 243, 319, 425, 521 |
| `#10B981` | 143, 278 |
| `#059669` | 143 |
| `#ededed` | 153, 203, 223, 263, 330, 387, 406, 441, 461, 530, 542 |
| `#888` | 163, 200, 206, 220, 226, 240, 246, 260, 266, 340, 384, 389, 403, 408, 422, 438, 443, 545, 550 |
| `rgba(62, 207, 142, 0.12)` | 174, 314, 520 |
| `rgba(62, 207, 142, 0.3)` | 176 |
| `rgba(255, 255, 255, 0.04)` | 194, 214, 234, 254 |
| `rgba(255, 255, 255, 0.06)` | 197, 217, 237, 257 |
| `#F59E0B` | 278 |
| `#EF4444` | 278 |
| `rgba(16, 185, 129, 0.12)` | 280 |
| `rgba(245, 158, 11, 0.12)` | 282 |
| `rgba(239, 68, 68, 0.12)` | 283 |
| `rgba(255, 255, 255, 0.08)` | 291 |
| `rgba(0, 0, 0, 0.1)` | 294 |
| `rgba(62, 207, 142, 0.25)` | 315 |
| `rgba(255, 255, 255, 0.03)` | 379, 398, 417, 433, 460 |
| `rgba(255, 255, 255, 0.15)` | 459 |
| `transparent` | 460 |
| `rgba(255, 255, 255, 0.02)` | 504 |
| `rgba(255, 255, 255, 0.05)` | 505 |

</details>

<details>
<summary>src/components/monitoring/tabs/MonitoringLeaderboard.tsx — 22 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/monitoring/tabs/MonitoringLeaderboard.tsx)

| Literal | Baris |
|---|---|
| `#F59E0B` | 29, 250, 255 |
| `#94A3B8` | 29 |
| `#B45309` | 29 |
| `rgba(239, 68, 68, 0.15)` | 35, 46 |
| `#EF4444` | 37, 51, 320, 325 |
| `#000` | 37 |
| `rgba(239, 68, 68, 0.04)` | 40 |
| `rgba(16, 185, 129, 0.04)` | 42 |
| `rgba(255, 255, 255, 0.03)` | 43 |
| `rgba(16, 185, 129, 0.15)` | 48 |
| `rgba(255, 255, 255, 0.06)` | 49 |
| `#10B981` | 51, 285, 290 |
| `rgba(239, 68, 68, 0.12)` | 52 |
| `rgba(16, 185, 129, 0.12)` | 52 |

</details>

<details>
<summary>src/components/monitoring/tabs/MonitoringMacroKpiGrid.tsx — 11 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/monitoring/tabs/MonitoringMacroKpiGrid.tsx)

| Literal | Baris |
|---|---|
| `#3ECF8E` | 37 |
| `rgba(62, 207, 142, 0.08)` | 38 |
| `#38BDF8` | 48 |
| `rgba(56, 189, 248, 0.08)` | 49 |
| `#F59E0B` | 59 |
| `rgba(245, 158, 11, 0.08)` | 60 |
| `#A855F7` | 70 |
| `rgba(168, 85, 247, 0.08)` | 71 |
| `rgba(23, 23, 23, 0.7)` | 91 |
| `rgba(255, 255, 255, 0.08)` | 93 |
| `#10B981` | 168 |

</details>

<details>
<summary>src/components/monitoring/tabs/MonitoringRouteCardModern.tsx — 41 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/monitoring/tabs/MonitoringRouteCardModern.tsx)

| Literal | Baris |
|---|---|
| `rgba(23, 23, 23, 0.75)` | 71 |
| `rgba(56, 189, 248, 0.35)` | 74 |
| `rgba(255, 255, 255, 0.08)` | 75 |
| `rgba(0, 0, 0, 0.1)` | 80 |
| `rgba(62, 207, 142, 0.12)` | 104 |
| `#3ECF8E` | 105, 366, 379 |
| `rgba(62, 207, 142, 0.3)` | 106 |
| `rgba(16, 185, 129, 0.12)` | 158, 233 |
| `#10b981` | 159, 234 |
| `rgba(16, 185, 129, 0.25)` | 160, 235 |
| `rgba(56, 189, 248, 0.12)` | 176, 253 |
| `#38bdf8` | 177, 209, 254 |
| `rgba(56, 189, 248, 0.25)` | 178, 207, 255 |
| `rgba(255, 255, 255, 0.05)` | 208, 312 |
| `rgba(255, 255, 255, 0.15)` | 210 |
| `rgba(245, 158, 11, 0.12)` | 273 |
| `#f59e0b` | 274 |
| `rgba(245, 158, 11, 0.25)` | 275 |
| `rgba(161, 161, 170, 0.12)` | 293 |
| `#a1a1aa` | 294 |
| `rgba(161, 161, 170, 0.25)` | 295 |
| `rgba(255, 255, 255, 0.03)` | 311 |
| `rgba(255, 255, 255, 0.04)` | 450, 465 |
| `rgba(255, 255, 255, 0.07)` | 451, 466 |
| `#10B981` | 492 |
| `#059669` | 492 |
| `#ffffff` | 493 |
| `rgba(16, 185, 129, 0.3)` | 499 |

</details>

<details>
<summary>src/components/monitoring/tabs/MonitoringRoutesTab.tsx — 34 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/monitoring/tabs/MonitoringRoutesTab.tsx)

| Literal | Baris |
|---|---|
| `rgba(23, 23, 23, 0.75)` | 175 |
| `rgba(255, 255, 255, 0.1)` | 176 |
| `transparent` | 189, 395, 422 |
| `#10B981` | 216 |
| `#059669` | 216 |
| `#ffffff` | 217 |
| `rgba(16, 185, 129, 0.3)` | 223 |
| `#3ECF8E` | 260 |
| `rgba(255, 255, 255, 0.05)` | 261, 283, 311, 339 |
| `#000` | 262 |
| `rgba(255, 255, 255, 0.08)` | 263, 291, 319, 347, 400, 427 |
| `rgba(56, 189, 248, 0.2)` | 282 |
| `#38bdf8` | 286 |
| `rgba(56, 189, 248, 0.4)` | 290 |
| `rgba(245, 158, 11, 0.2)` | 310 |
| `#f59e0b` | 314 |
| `rgba(245, 158, 11, 0.4)` | 318 |
| `rgba(16, 185, 129, 0.2)` | 338 |
| `#10b981` | 342 |
| `rgba(16, 185, 129, 0.4)` | 346 |
| `rgba(255, 255, 255, 0.15)` | 394, 421 |
| `rgba(23, 23, 23, 0.5)` | 446 |
| `rgba(255, 255, 255, 0.06)` | 448 |

</details>

<details>
<summary>src/components/monitoring/tabs/MonitoringShiftSplitBar.tsx — 13 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/monitoring/tabs/MonitoringShiftSplitBar.tsx)

| Literal | Baris |
|---|---|
| `rgba(255, 255, 255, 0.05)` | 38 |
| `#F59E0B` | 45, 86, 91 |
| `#D97706` | 45 |
| `#6366F1` | 53 |
| `#4F46E5` | 53 |
| `rgba(245, 158, 11, 0.06)` | 71 |
| `rgba(245, 158, 11, 0.18)` | 72 |
| `rgba(99, 102, 241, 0.06)` | 137 |
| `rgba(99, 102, 241, 0.18)` | 138 |
| `#818CF8` | 152, 157 |

</details>

<details>
<summary>src/components/monitoring/tabs/MonitoringToaBarChart.tsx — 33 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/monitoring/tabs/MonitoringToaBarChart.tsx)

| Literal | Baris |
|---|---|
| `rgba(62, 207, 142, 0.1)` | 121 |
| `transparent` | 122, 125, 174 |
| `#3ECF8E` | 124, 142, 171, 194, 224, 275, 312, 529 |
| `rgba(255, 255, 255, 0.08)` | 158, 350, 382, 433, 527 |
| `#10B981` | 171, 173, 415 |
| `rgba(62, 207, 142, 0.85)` | 173 |
| `rgba(62, 207, 142, 0.5)` | 176 |
| `rgba(0, 0, 0, 0.65)` | 259 |
| `#1a1a1a` | 274 |
| `rgba(255, 255, 255, 0.12)` | 276, 277 |
| `rgba(0, 0, 0, 0.6)` | 283 |
| `rgba(62, 207, 142, 0.12)` | 313 |
| `rgba(255, 255, 255, 0.1)` | 351 |
| `rgba(255, 255, 255, 0.04)` | 379, 430, 528 |
| `#F59E0B` | 416 |

</details>

<details>
<summary>src/components/monitoring/tabs/MonitoringWaReportTab.tsx — 41 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/monitoring/tabs/MonitoringWaReportTab.tsx)

| Literal | Baris |
|---|---|
| `rgba(23, 23, 23, 0.75)` | 229 |
| `rgba(255, 255, 255, 0.08)` | 231, 288, 314, 340, 380, 407, 548, 594 |
| `#3ECF8E` | 246, 285, 311, 337, 508 |
| `rgba(255, 255, 255, 0.04)` | 286, 312, 338 |
| `#000` | 287, 313, 339 |
| `rgba(245, 158, 11, 0.2)` | 374 |
| `rgba(255, 255, 255, 0.05)` | 375, 402 |
| `#F59E0B` | 376, 438 |
| `rgba(245, 158, 11, 0.35)` | 379 |
| `rgba(99, 102, 241, 0.2)` | 401 |
| `#818CF8` | 403 |
| `rgba(99, 102, 241, 0.35)` | 406 |
| `rgba(245, 158, 11, 0.08)` | 423 |
| `rgba(245, 158, 11, 0.25)` | 424 |
| `rgba(23, 23, 23, 0.8)` | 479 |
| `rgba(255, 255, 255, 0.1)` | 480 |
| `rgba(62, 207, 142, 0.15)` | 507 |
| `rgba(62, 207, 142, 0.3)` | 509 |
| `rgba(255, 255, 255, 0.12)` | 550 |
| `#25D366` | 573 |
| `#128C7E` | 573 |
| `#ffffff` | 574 |
| `rgba(37, 211, 102, 0.35)` | 579 |
| `rgba(23, 23, 23, 0.9)` | 592 |

</details>

<details>
<summary>src/components/pageManagement/PageDisabledState.tsx — 5 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/pageManagement/PageDisabledState.tsx)

| Literal | Baris |
|---|---|
| `rgba(245, 158, 11, 0.12)` | 28 |
| `rgba(245, 158, 11, 0.25)` | 29 |
| `#f59e0b` | 33 |
| `#1e293b` | 73 |
| `rgba(255, 255, 255, 0.1)` | 74 |

</details>

<details>
<summary>src/components/pageManagement/PageManagementPage.tsx — 40 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/pageManagement/PageManagementPage.tsx)

| Literal | Baris |
|---|---|
| `#0f172a` | 61 |
| `#f8fafc` | 62 |
| `rgba(15, 23, 42, 0.88)` | 72 |
| `rgba(255, 255, 255, 0.08)` | 75, 187, 217, 324 |
| `rgba(255, 255, 255, 0.06)` | 102 |
| `rgba(255, 255, 255, 0.1)` | 103 |
| `rgba(245, 158, 11, 0.14)` | 133 |
| `rgba(245, 158, 11, 0.3)` | 134 |
| `#fbbf24` | 135, 388 |
| `#3b82f6` | 186, 231 |
| `#2563eb` | 189 |
| `rgba(255, 255, 255, 0.04)` | 190 |
| `#ffffff` | 191, 298, 455 |
| `#94a3b8` | 191, 257, 408 |
| `rgba(255, 255, 255, 0.03)` | 216, 321 |
| `rgba(59, 130, 246, 0.12)` | 227 |
| `rgba(100, 116, 139, 0.2)` | 256 |
| `#10b981` | 283, 348, 388, 431 |
| `rgba(245, 158, 11, 0.04)` | 322 |
| `rgba(245, 158, 11, 0.2)` | 325 |
| `rgba(16, 185, 129, 0.12)` | 343 |
| `rgba(245, 158, 11, 0.12)` | 344 |
| `#f59e0b` | 348 |
| `rgba(16, 185, 129, 0.16)` | 386 |
| `rgba(245, 158, 11, 0.16)` | 387 |
| `#475569` | 431 |
| `rgba(0, 0, 0, 0.2)` | 456 |

</details>

<details>
<summary>src/components/pageManagement/SuperadminMaintenanceBanner.tsx — 7 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/pageManagement/SuperadminMaintenanceBanner.tsx)

| Literal | Baris |
|---|---|
| `#78350f` | 16 |
| `#fef3c7` | 17 |
| `#b45309` | 18, 51 |
| `rgba(0, 0, 0, 0.15)` | 25 |
| `#fbbf24` | 29 |
| `#ffffff` | 52 |

</details>

<details>
<summary>src/components/pdoReport/A2ReportModal.tsx — 77 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/pdoReport/A2ReportModal.tsx)

| Literal | Baris |
|---|---|
| `rgba(0, 0, 0, 0.65)` | 329 |
| `#1e293b` | 343, 744, 753, 757, 762, 830 |
| `#f8fafc` | 344, 745, 757, 762 |
| `rgba(0, 0, 0, 0.4)` | 346 |
| `#334155` | 347, 356, 480, 513, 531, 672, 829 |
| `#94a3b8` | 371, 383, 465, 498, 534, 637, 745, 753, 848 |
| `transparent` | 381, 648, 847 |
| `#2563eb` | 421, 441, 867 |
| `rgba(255, 255, 255, 0.08)` | 421, 441 |
| `#fff` | 422, 442, 482, 515, 609, 693, 788, 868 |
| `rgba(0, 0, 0, 0.2)` | 481, 514, 692, 787 |
| `rgba(255, 255, 255, 0.05)` | 530 |
| `rgba(16, 185, 129, 0.12)` | 548 |
| `rgba(16, 185, 129, 0.3)` | 549 |
| `#6ee7b7` | 552 |
| `#34d399` | 558 |
| `rgba(59, 130, 246, 0.1)` | 566 |
| `rgba(59, 130, 246, 0.25)` | 567 |
| `#93c5fd` | 570 |
| `rgba(239, 68, 68, 0.12)` | 587 |
| `rgba(239, 68, 68, 0.35)` | 588 |
| `#fca5a5` | 591 |
| `#ef4444` | 599 |
| `rgba(239, 68, 68, 0.25)` | 607 |
| `rgba(239, 68, 68, 0.5)` | 608 |
| `#64748b` | 650 |
| `#38bdf8` | 650, 708, 768 |
| `rgba(255, 255, 255, 0.04)` | 669 |
| `#475569` | 691, 743, 786, 846 |
| `rgba(56, 189, 248, 0.15)` | 706 |
| `rgba(56, 189, 248, 0.3)` | 707 |
| `#0f172a` | 768 |
| `rgba(239, 68, 68, 0.15)` | 801 |
| `rgba(239, 68, 68, 0.3)` | 802 |
| `#f87171` | 803 |

</details>

<details>
<summary>src/components/pdoReport/ReportAccordionHeader.tsx — 4 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/pdoReport/ReportAccordionHeader.tsx)

| Literal | Baris |
|---|---|
| `rgba(255, 255, 255, 0.08)` | 30 |
| `rgba(62, 207, 142, 0.12)` | 44 |
| `#3ECF8E` | 45 |
| `rgba(255, 255, 255, 0.04)` | 88 |

</details>

<details>
<summary>src/components/pdoReport/ReportArmadaSection.tsx — 6 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/pdoReport/ReportArmadaSection.tsx)

| Literal | Baris |
|---|---|
| `rgba(255, 255, 255, 0.03)` | 59, 156 |
| `rgba(255, 255, 255, 0.06)` | 62, 159 |
| `#38bdf8` | 78 |
| `#a855f7` | 175 |

</details>

<details>
<summary>src/components/pdoReport/ReportHeadwaySection.tsx — 1 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/pdoReport/ReportHeadwaySection.tsx)

| Literal | Baris |
|---|---|
| `#3ECF8E` | 28 |

</details>

<details>
<summary>src/components/pdoReport/ReportModalLayout.tsx — 6 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/pdoReport/ReportModalLayout.tsx)

| Literal | Baris |
|---|---|
| `rgba(0, 0, 0, 0.65)` | 33 |
| `#171717` | 52 |
| `rgba(0, 0, 0, 0.5)` | 55 |
| `rgba(255, 255, 255, 0.08)` | 89 |
| `rgba(62, 207, 142, 0.12)` | 98 |
| `#3ECF8E` | 99 |

</details>

<details>
<summary>src/components/pdoReport/ReportStatusBadge.tsx — 9 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/pdoReport/ReportStatusBadge.tsx)

| Literal | Baris |
|---|---|
| `rgba(16, 185, 129, 0.14)` | 17 |
| `#10b981` | 18 |
| `rgba(16, 185, 129, 0.3)` | 21 |
| `rgba(14, 165, 233, 0.14)` | 35 |
| `#38bdf8` | 36 |
| `rgba(14, 165, 233, 0.3)` | 39 |
| `rgba(245, 158, 11, 0.14)` | 52 |
| `#f59e0b` | 53 |
| `rgba(245, 158, 11, 0.3)` | 56 |

</details>

<details>
<summary>src/components/pdoReport/ReportTrafficJamsSection.tsx — 9 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/pdoReport/ReportTrafficJamsSection.tsx)

| Literal | Baris |
|---|---|
| `#f59e0b` | 34, 74, 92 |
| `rgba(245, 158, 11, 0.18)` | 71 |
| `rgba(255, 255, 255, 0.04)` | 72 |
| `rgba(245, 158, 11, 0.45)` | 77 |
| `rgba(255, 255, 255, 0.08)` | 78 |
| `rgba(255, 255, 255, 0.06)` | 129 |
| `rgba(255, 255, 255, 0.1)` | 130 |

</details>

<details>
<summary>src/components/pdoReport/RouteOperationalReportCard.tsx — 1 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/pdoReport/RouteOperationalReportCard.tsx)

| Literal | Baris |
|---|---|
| `rgba(255, 255, 255, 0.08)` | 225 |

</details>

<details>
<summary>src/components/profileMenu/ProfileAdminSection.tsx — 8 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/profileMenu/ProfileAdminSection.tsx)

| Literal | Baris |
|---|---|
| `rgba(255,255,255,0.03)` | 51, 92, 131 |
| `#3b82f6` | 60 |
| `#f59e0b` | 101, 163 |
| `rgba(245, 158, 11, 0.15)` | 162 |
| `rgba(245, 158, 11, 0.3)` | 164 |

</details>

<details>
<summary>src/components/profileMenu/ProfileFeaturesSection.tsx — 13 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/profileMenu/ProfileFeaturesSection.tsx)

| Literal | Baris |
|---|---|
| `rgba(255,255,255,0.03)` | 119, 180, 206, 243 |
| `rgba(234, 179, 8, 0.15)` | 139 |
| `#eab308` | 140 |
| `rgba(234, 179, 8, 0.3)` | 141 |
| `#f59e0b` | 253, 287, 303 |
| `rgba(245, 158, 11, 0.08)` | 285 |
| `rgba(245, 158, 11, 0.2)` | 286 |
| `#000` | 304 |

</details>

<details>
<summary>src/components/profileMenu/ProfileMenuFooter.tsx — 3 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/profileMenu/ProfileMenuFooter.tsx)

| Literal | Baris |
|---|---|
| `rgba(247, 85, 85, 0.08)` | 53 |
| `rgba(247, 85, 85, 0.2)` | 54 |
| `#f75555` | 55 |

</details>

<details>
<summary>src/components/profileMenu/ProfileMenuSheet.tsx — 2 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/profileMenu/ProfileMenuSheet.tsx)

| Literal | Baris |
|---|---|
| `rgba(0, 0, 0, 0.65)` | 109 |
| `rgba(0, 0, 0, 0.5)` | 145 |

</details>

<details>
<summary>src/components/profileMenu/ProfileUserCard.tsx — 7 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/profileMenu/ProfileUserCard.tsx)

| Literal | Baris |
|---|---|
| `rgba(62, 207, 142, 0.06)` | 48 |
| `rgba(62, 207, 142, 0.18)` | 50 |
| `rgba(62, 207, 142, 0.3)` | 74, 89 |
| `#3ECF8E` | 83 |
| `#24B47E` | 83 |
| `#061a10` | 87 |

</details>

<details>
<summary>src/components/profileMenu/UserProfileHeader.tsx — 8 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/profileMenu/UserProfileHeader.tsx)

| Literal | Baris |
|---|---|
| `transparent` | 83 |
| `rgba(255, 255, 255, 0.05)` | 84 |
| `rgba(255, 255, 255, 0.1)` | 85 |
| `rgba(0, 0, 0, 0.1)` | 86 |
| `rgba(59, 130, 246, 0.15)` | 106 |
| `#3b82f6` | 107, 109 |
| `rgba(0, 0, 0, 0.2)` | 110 |

</details>

<details>
<summary>src/components/profileMenu/useSheetGesture.ts — 2 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/profileMenu/useSheetGesture.ts)

| Literal | Baris |
|---|---|
| `rgba(0, 0, 0, ${opacity})` | 41 |
| `rgba(0, 0, 0, 0.65)` | 76 |

</details>

<details>
<summary>src/components/routeSelector/AddRouteModal.tsx — 23 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/routeSelector/AddRouteModal.tsx)

| Literal | Baris |
|---|---|
| `rgba(0, 0, 0, 0.75)` | 79 |
| `#171717` | 100 |
| `rgba(0, 0, 0, 0.5)` | 102 |
| `rgba(62, 207, 142, 0.12)` | 124 |
| `#3ECF8E` | 125, 263 |
| `rgba(255, 255, 255, 0.05)` | 148, 168, 254 |
| `#10b981` | 185, 203, 406 |
| `transparent` | 185, 203, 283 |
| `#ffffff` | 186, 204 |
| `rgba(255, 255, 255, 0.15)` | 253, 267 |
| `rgba(62, 207, 142, 0.15)` | 262 |
| `#f59e0b` | 384 |
| `rgba(245, 158, 11, 0.12)` | 385 |
| `rgba(245, 158, 11, 0.35)` | 386 |

</details>

<details>
<summary>src/components/routeSelector/BulkRouteSection.tsx — 15 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/routeSelector/BulkRouteSection.tsx)

| Literal | Baris |
|---|---|
| `#27272a` | 141 |
| `#10b981` | 167, 237, 280, 332, 354 |
| `rgba(255, 255, 255, 0.03)` | 218 |
| `#f59e0b` | 239, 294 |
| `rgba(16, 185, 129, 0.15)` | 279 |
| `rgba(245, 158, 11, 0.15)` | 293 |
| `rgba(239, 68, 68, 0.15)` | 308 |
| `#ef4444` | 309 |
| `#18181b` | 325 |
| `#ffffff` | 355 |

</details>

<details>
<summary>src/components/routeSelector/RouteSelectorSheet.tsx — 11 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/routeSelector/RouteSelectorSheet.tsx)

| Literal | Baris |
|---|---|
| `rgba(0, 0, 0, 0.65)` | 90 |
| `#171717` | 116 |
| `rgba(0, 0, 0, 0.5)` | 119 |
| `rgba(255, 255, 255, 0.08)` | 149 |
| `rgba(234, 179, 8, 0.12)` | 218 |
| `rgba(234, 179, 8, 0.35)` | 219 |
| `#eab308` | 220, 242 |
| `rgba(234, 179, 8, 0.2)` | 239 |
| `rgba(234, 179, 8, 0.4)` | 240 |
| `rgba(234, 179, 8, 0.1)` | 347 |

</details>

<details>
<summary>src/components/routeSelector/UnifiedRouteControlBar.tsx — 19 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/routeSelector/UnifiedRouteControlBar.tsx)

| Literal | Baris |
|---|---|
| `rgba(255, 255, 255, 0.08)` | 43 |
| `rgba(23, 23, 23, 0.75)` | 44 |
| `transparent` | 60 |
| `#3ECF8E` | 68 |
| `rgba(234, 179, 8, 0.12)` | 104 |
| `rgba(234, 179, 8, 0.35)` | 105 |
| `#eab308` | 107 |
| `rgba(245, 158, 11, 0.1)` | 126 |
| `rgba(245, 158, 11, 0.25)` | 127 |
| `#f59e0b` | 128 |
| `rgba(239, 68, 68, 0.12)` | 133 |
| `rgba(239, 68, 68, 0.35)` | 134 |
| `#ef4444` | 135 |
| `rgba(16, 185, 129, 0.1)` | 139 |
| `rgba(16, 185, 129, 0.25)` | 140 |
| `#10b981` | 141 |
| `rgba(14, 165, 233, 0.1)` | 144 |
| `rgba(14, 165, 233, 0.25)` | 145 |
| `#38bdf8` | 146 |

</details>

<details>
<summary>src/components/ui/ModalShell.tsx — 1 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/ui/ModalShell.tsx)

| Literal | Baris |
|---|---|
| `rgba(0, 0, 0, 0.65)` | 300 |

</details>

<details>
<summary>src/components/userManagement/RoleBadge.tsx — 19 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/userManagement/RoleBadge.tsx)

| Literal | Baris |
|---|---|
| `rgba(16, 185, 129, 0.14)` | 27, 83 |
| `rgba(16, 185, 129, 0.38)` | 28, 84 |
| `#34d399` | 29, 85 |
| `rgba(245, 158, 11, 0.18)` | 39 |
| `rgba(168, 85, 247, 0.18)` | 39 |
| `rgba(245, 158, 11, 0.48)` | 40 |
| `#fbbf24` | 41 |
| `rgba(14, 165, 233, 0.14)` | 50 |
| `rgba(14, 165, 233, 0.42)` | 51 |
| `#38bdf8` | 52 |
| `rgba(99, 102, 241, 0.14)` | 61 |
| `rgba(99, 102, 241, 0.42)` | 62 |
| `#818cf8` | 63 |
| `rgba(249, 115, 22, 0.14)` | 72 |
| `rgba(249, 115, 22, 0.42)` | 73 |
| `#fb923c` | 74 |

</details>

<details>
<summary>src/components/userManagement/UserCardAvatar.tsx — 4 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/userManagement/UserCardAvatar.tsx)

| Literal | Baris |
|---|---|
| `rgba(255, 255, 255, 0.15)` | 31 |
| `rgba(59, 130, 246, 0.12)` | 49 |
| `rgba(59, 130, 246, 0.25)` | 50 |
| `#60a5fa` | 51 |

</details>

<details>
<summary>src/components/userManagement/UserCardItem.tsx — 26 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/userManagement/UserCardItem.tsx)

| Literal | Baris |
|---|---|
| `rgba(30, 41, 59, 0.7)` | 29 |
| `rgba(59, 130, 246, 0.4)` | 32 |
| `rgba(255,255,255,0.08)` | 33 |
| `rgba(59, 130, 246, 0.1)` | 40 |
| `#f8fafc` | 77, 271 |
| `rgba(59, 130, 246, 0.2)` | 92 |
| `#60a5fa` | 93 |
| `#94a3b8` | 104, 132, 248 |
| `rgba(255, 255, 255, 0.03)` | 129 |
| `rgba(255, 255, 255, 0.05)` | 130, 149, 184, 270 |
| `#64748b` | 147 |
| `transparent` | 198 |
| `#10b981` | 218 |
| `rgba(255, 255, 255, 0.16)` | 218 |
| `rgba(16, 185, 129, 0.4)` | 220 |
| `rgba(255, 255, 255, 0.15)` | 221 |
| `#ffffff` | 236 |
| `rgba(0, 0, 0, 0.25)` | 237 |
| `#34d399` | 248 |
| `rgba(255, 255, 255, 0.12)` | 269 |

</details>

<details>
<summary>src/components/userManagement/UserManagementFilters.tsx — 14 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/userManagement/UserManagementFilters.tsx)

| Literal | Baris |
|---|---|
| `#94a3b8` | 101, 151, 169 |
| `rgba(255,255,255,0.12)` | 113 |
| `rgba(30, 41, 59, 0.6)` | 114 |
| `#f8fafc` | 115 |
| `#3b82f6` | 146 |
| `rgba(255,255,255,0.08)` | 147, 168 |
| `rgba(59, 130, 246, 0.15)` | 149 |
| `rgba(255,255,255,0.03)` | 150 |
| `#60a5fa` | 151 |
| `rgba(59, 130, 246, 0.3)` | 167 |
| `#ffffff` | 169 |

</details>

<details>
<summary>src/components/userManagement/UserManagementHeader.tsx — 14 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/userManagement/UserManagementHeader.tsx)

| Literal | Baris |
|---|---|
| `rgba(15, 23, 42, 0.92)` | 28 |
| `rgba(255, 255, 255, 0.08)` | 31 |
| `rgba(255,255,255,0.15)` | 64 |
| `rgba(255,255,255,0.05)` | 65 |
| `#f8fafc` | 66, 85 |
| `#94a3b8` | 105, 133 |
| `rgba(255,255,255,0.12)` | 131 |
| `rgba(255,255,255,0.04)` | 132 |
| `#3b82f6` | 156 |
| `#1d4ed8` | 156 |
| `#ffffff` | 157 |
| `rgba(59, 130, 246, 0.3)` | 162 |

</details>

<details>
<summary>src/components/userManagement/UserManagementPage.tsx — 2 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/userManagement/UserManagementPage.tsx)

| Literal | Baris |
|---|---|
| `#0f172a` | 254 |
| `#f8fafc` | 255 |

</details>

<details>
<summary>src/components/userManagement/UserManagementStates.tsx — 7 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/userManagement/UserManagementStates.tsx)

| Literal | Baris |
|---|---|
| `rgba(255,255,255,0.08)` | 25 |
| `rgba(255,255,255,0.05)` | 71 |
| `rgba(30, 41, 59, 0.4)` | 95 |
| `rgba(255,255,255,0.12)` | 97 |
| `#64748b` | 106 |
| `#f8fafc` | 112 |
| `#94a3b8` | 121 |

</details>

<details>
<summary>src/components/userManagement/userManagementModals.ts — 1 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/userManagement/userManagementModals.ts)

| Literal | Baris |
|---|---|
| `#ef4444` | 46 |

</details>

<details>
<summary>src/components/waReport/WaReportFormatTabs.tsx — 53 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/waReport/WaReportFormatTabs.tsx)

| Literal | Baris |
|---|---|
| `rgba(245, 158, 11, 0.12)` | 39 |
| `rgba(245, 158, 11, 0.3)` | 40 |
| `#d97706` | 48 |
| `rgba(255, 255, 255, 0.05)` | 64, 163, 237 |
| `rgba(255, 255, 255, 0.08)` | 65, 164 |
| `rgba(56, 189, 248, 0.5)` | 77, 105, 133 |
| `transparent` | 77, 78, 105, 106, 133, 134, 176, 177, 197, 198 |
| `rgba(56, 189, 248, 0.15)` | 78, 106, 134 |
| `#38bdf8` | 79, 107, 135, 176, 178 |
| `#94a3b8` | 79, 107, 135, 178, 199, 238, 270 |
| `rgba(0,0,0,0.2)` | 80, 108, 136 |
| `rgba(56, 189, 248, 0.18)` | 177 |
| `#c084fc` | 197, 199 |
| `rgba(192, 132, 252, 0.18)` | 198 |
| `#2563eb` | 236, 237 |
| `rgba(255, 255, 255, 0.12)` | 236 |
| `#ffffff` | 238 |
| `rgba(239, 68, 68, 0.1)` | 256 |
| `rgba(239, 68, 68, 0.3)` | 257 |
| `#f87171` | 266, 296 |
| `rgba(239, 68, 68, 0.2)` | 294 |
| `rgba(239, 68, 68, 0.4)` | 295 |

</details>

<details>
<summary>src/components/waReport/WaReportHeader.tsx — 6 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/waReport/WaReportHeader.tsx)

| Literal | Baris |
|---|---|
| `rgba(37, 211, 102, 0.12)` | 24 |
| `#25D366` | 25 |
| `#ededed` | 39 |
| `#8b8b8b` | 47 |
| `transparent` | 58 |
| `#64748b` | 61 |

</details>

<details>
<summary>src/components/waReport/WaReportModal.tsx — 4 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/waReport/WaReportModal.tsx)

| Literal | Baris |
|---|---|
| `rgba(0, 0, 0, 0.6)` | 46 |
| `#171717` | 62 |
| `rgba(255, 255, 255, 0.1)` | 63 |
| `rgba(0, 0, 0, 0.35)` | 70 |

</details>

<details>
<summary>src/components/waReport/WaReportPreview.tsx — 11 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/components/waReport/WaReportPreview.tsx)

| Literal | Baris |
|---|---|
| `#0b0f19` | 26 |
| `#e2e8f0` | 27 |
| `rgba(255, 255, 255, 0.1)` | 37 |
| `#10b981` | 54 |
| `rgba(255, 255, 255, 0.06)` | 55 |
| `#ffffff` | 56, 82 |
| `#ededed` | 56 |
| `rgba(255, 255, 255, 0.12)` | 57 |
| `#25D366` | 81 |
| `rgba(37, 211, 102, 0.35)` | 92 |

</details>

<details>
<summary>src/constants/texts/text_alerts.ts — 2 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/constants/texts/text_alerts.ts)

| Literal | Baris |
|---|---|
| `rgba(62, 207, 142, 0.08)` | 49 |
| `rgba(62, 207, 142, 0.2)` | 49 |

</details>

<details>
<summary>src/index.css — 340 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/index.css)

| Literal | Baris |
|---|---|
| `#0c0c0c` | 4 |
| `#171717` | 5, 57, 94, 2121 |
| `#ededed` | 6, 2115 |
| `#8b8b8b` | 7 |
| `#3ECF8E` | 8, 13, 46, 49, 381, 707 |
| `rgba(23, 23, 23, 0.85)` | 9 |
| `rgba(255, 255, 255, 0.08)` | 10, 2355 |
| `rgba(30, 30, 30, 0.7)` | 11 |
| `#f75555` | 12 |
| `#f59e0b` | 14, 34, 378, 410, 415, 766, 1689, 2276, 2313 |
| `#fb923c` | 15, 924, 2089 |
| `#38bdf8` | 18, 19, 1293, 1300, 1307, 1314, 1958, 1974, 2006, 2008, 2155 |
| `rgba(56, 189, 248, 0.12)` | 20, 1956, 2000 |
| `rgba(56, 189, 248, 0.25)` | 21 |
| `#c084fc` | 23, 2218 |
| `rgba(192, 132, 252, 0.12)` | 24 |
| `rgba(192, 132, 252, 0.25)` | 25 |
| `#4ade80` | 27 |
| `rgba(74, 222, 128, 0.12)` | 28 |
| `rgba(74, 222, 128, 0.25)` | 29 |
| `#fdba74` | 31 |
| `rgba(249, 115, 22, 0.12)` | 32, 414, 2087, 2197 |
| `#0f172a` | 33, 82, 694, 1732, 1746, 1752, 1944 |
| `#fb7185` | 37 |
| `rgba(244, 63, 94, 0.12)` | 38 |
| `#60a5fa` | 40, 2232 |
| `rgba(96, 165, 250, 0.12)` | 41 |
| `#ffffff` | 45, 55, 717, 1644, 1751, 2120, 2254, 2260 |
| `#24B47E` | 47, 59, 96, 98, 716, 1170 |
| `#f8f9fa` | 56 |
| `#6b7280` | 58 |
| `rgba(255, 255, 255, 0.95)` | 60 |
| `rgba(0, 0, 0, 0.08)` | 61, 2174, 2256 |
| `rgba(243, 244, 246, 0.9)` | 62 |
| `#d97706` | 63, 2228, 2319 |
| `#ea580c` | 64 |
| `#0284c7` | 67 |
| `#0369a1` | 68, 2187 |
| `rgba(2, 132, 199, 0.08)` | 69 |
| `rgba(2, 132, 199, 0.2)` | 70 |
| `#7e22ce` | 72 |
| `rgba(126, 34, 206, 0.08)` | 73 |
| `rgba(126, 34, 206, 0.2)` | 74 |
| `#15803d` | 76, 95, 1160, 1166 |
| `rgba(21, 128, 61, 0.08)` | 77 |
| `rgba(21, 128, 61, 0.2)` | 78 |
| `#c2410c` | 80, 2199 |
| `rgba(234, 88, 12, 0.1)` | 81 |
| `#9a3412` | 83 |
| `#be123c` | 86 |
| `rgba(190, 18, 60, 0.1)` | 87 |
| `#1d4ed8` | 89 |
| `rgba(29, 78, 216, 0.1)` | 90 |
| `white` | 179, 569, 742, 1218, 1934 |
| `rgba(0, 0, 0, 0.1)` | 189, 2261 |
| `rgba(0, 0, 0, 0.12)` | 205 |
| `rgba(0, 0, 0, 0.05)` | 223, 663, 2255 |
| `transparent` | 236, 291, 367, 677, 684, 801, 819, 1264, 1526, 1657, 1924, 1925, 2033, 2110, 2125 |
| `#fff` | 268, 579, 1246, 2027 |
| `currentColor` | 325 |
| `rgba(0, 0, 0, 0.15)` | 372, 1322, 2262 |
| `#ef4444` | 375, 1695, 1852, 2022, 2026, 2028, 2301 |
| `rgba(16, 185, 129, 0.1)` | 405 |
| `rgba(245, 158, 11, 0.1)` | 409, 2318 |
| `rgba(245, 158, 11, 0.25)` | 416 |
| `rgba(255, 255, 255, 0.02)` | 437, 2281 |
| `rgba(0, 0, 0, 0.015)` | 442 |
| `rgba(255, 255, 255, 0.06)` | 465 |
| `rgba(0, 0, 0, 0.04)` | 469 |
| `rgba(255, 255, 255, 0.1)` | 574, 1984, 2157 |
| `rgba(62, 207, 142, 0.3)` | 581, 855, 1146 |
| `rgba(26, 28, 34, 0.94)` | 637 |
| `rgba(255, 255, 255, 0.22)` | 640 |
| `rgba(0, 0, 0, 0.85)` | 645 |
| `rgba(0, 0, 0, 0.6)` | 646 |
| `rgba(0, 0, 0, 0.4)` | 647, 1420 |
| `rgba(255, 255, 255, 0.2)` | 648 |
| `rgba(255, 255, 255, 0.96)` | 656 |
| `rgba(15, 23, 42, 0.22)` | 659 |
| `rgba(15, 23, 42, 0.24)` | 661 |
| `rgba(15, 23, 42, 0.14)` | 662 |
| `rgba(255, 255, 255, 1)` | 664 |
| `rgba(255, 255, 255, 0.75)` | 679 |
| `#475569` | 689 |
| `#00C573` | 707 |
| `#061a10` | 708, 1631 |
| `rgba(62, 207, 142, 0.4)` | 711 |
| `rgba(255, 255, 255, 0.35)` | 712 |
| `#10b981` | 716, 1701, 2163, 2168 |
| `rgba(36, 180, 126, 0.35)` | 719 |
| `rgba(255, 255, 255, 0.25)` | 720 |
| `#000000` | 767 |
| `rgba(245, 158, 11, 0.5)` | 777 |
| `#f97316` | 924 |
| `#818cf8` | 929, 2102 |
| `#a78bfa` | 929 |
| `rgba(239, 68, 68, 0.15)` | 1032, 2300 |
| `rgba(239, 68, 68, 0.3)` | 1034, 1044, 1653, 1853, 2050, 2302, 2308 |
| `rgba(0, 0, 0, 0.18)` | 1067 |
| `rgba(30, 41, 59, 0.85)` | 1074 |
| `rgba(56, 189, 248, 0.35)` | 1075, 1094, 1216, 1302, 1303 |
| `rgba(56, 189, 248, 0.2)` | 1076, 1317 |
| `rgba(255, 255, 255, 0.92)` | 1098 |
| `rgba(37, 99, 235, 0.35)` | 1099 |
| `rgba(37, 99, 235, 0.15)` | 1100 |
| `rgba(37, 99, 235, 0.25)` | 1105 |
| `rgba(62, 207, 142, 0.15)` | 1144 |
| `rgba(36, 180, 126, 0.12)` | 1159 |
| `rgba(36, 180, 126, 0.25)` | 1161 |
| `rgba(56, 189, 248, 0.16)` | 1210 |
| `rgba(56, 189, 248, 0.1)` | 1219 |
| `rgba(37, 99, 235, 0.12)` | 1224 |
| `rgba(37, 99, 235, 0.3)` | 1225 |
| `rgba(37, 99, 235, 0.08)` | 1226 |
| `rgba(56, 189, 248, 0.7)` | 1288 |
| `rgba(56, 189, 248, 0.3)` | 1289, 1316, 1957, 2002 |
| `rgba(56, 189, 248, 0.5)` | 1295, 1309 |
| `rgba(56, 189, 248, 0.45)` | 1296, 1310 |
| `rgba(148, 163, 184, 0.12)` | 1354, 2074 |
| `rgba(203, 213, 225, 0.45)` | 1359 |
| `rgba(255, 255, 255, 0)` | 1371, 1374, 1383, 1386 |
| `rgba(255, 255, 255, 0.12)` | 1372, 2146 |
| `rgba(255, 255, 255, 0.28)` | 1373 |
| `rgba(255, 255, 255, 0.45)` | 1384 |
| `rgba(255, 255, 255, 0.8)` | 1385 |
| `rgba(0, 0, 0, 0.65)` | 1521 |
| `rgba(0, 0, 0, 0.5)` | 1600 |
| `rgba(62, 207, 142, 0.35)` | 1640 |
| `rgba(255, 255, 255, 0.05)` | 1670, 1720, 1877, 1983, 2147 |
| `rgba(245, 158, 11, 0.45)` | 1688 |
| `rgba(245, 158, 11, 0.08)` | 1690 |
| `rgba(239, 68, 68, 0.45)` | 1694 |
| `rgba(239, 68, 68, 0.08)` | 1696, 2014 |
| `rgba(16, 185, 129, 0.45)` | 1700 |
| `rgba(16, 185, 129, 0.08)` | 1702 |
| `rgba(59, 130, 246, 0.45)` | 1706 |
| `#3b82f6` | 1707 |
| `rgba(59, 130, 246, 0.08)` | 1708 |
| `rgba(255, 255, 255, 0.15)` | 1719, 2034 |
| `#f8fafc` | 1721, 1730, 1747 |
| `#cbd5e1` | 1731 |
| `#3ecf8e` | 1757 |
| `rgba(62, 207, 142, 0.2)` | 1758 |
| `#64748b` | 1762 |
| `rgba(0, 0, 0, 0.35)` | 1772 |
| `rgba(239, 68, 68, 0.12)` | 1851, 2060 |
| `rgba(62, 207, 142, 0.25)` | 1864 |
| `rgba(62, 207, 142, 0.12)` | 1893 |
| `rgba(255, 255, 255, 0.04)` | 1916, 1940 |
| `rgba(0, 0, 0, 0.25)` | 1947 |
| `rgba(56, 189, 248, 0.22)` | 1973 |
| `#000` | 2007 |
| `rgba(56, 189, 248, 0.4)` | 2010 |
| `rgba(239, 68, 68, 0.25)` | 2015 |
| `#f87171` | 2016, 2049, 2062, 2211 |
| `rgba(239, 68, 68, 0.18)` | 2020 |
| `#fca5a5` | 2021 |
| `rgba(239, 68, 68, 0.5)` | 2029 |
| `rgba(239, 68, 68, 0.1)` | 2048, 2306 |
| `rgba(239, 68, 68, 0.35)` | 2061 |
| `rgba(148, 163, 184, 0.3)` | 2075 |
| `#94a3b8` | 2076 |
| `rgba(249, 115, 22, 0.35)` | 2088, 2198 |
| `rgba(99, 102, 241, 0.12)` | 2100, 2191 |
| `rgba(99, 102, 241, 0.35)` | 2101, 2192 |
| `#1e1e1e` | 2114 |
| `rgba(16, 185, 129, 0.18)` | 2161 |
| `rgba(16, 185, 129, 0.5)` | 2162 |
| `rgba(16, 185, 129, 0.3)` | 2164 |
| `rgba(16, 185, 129, 0.7)` | 2169 |
| `rgba(245, 158, 11, 0.12)` | 2179 |
| `rgba(168, 85, 247, 0.12)` | 2179 |
| `rgba(245, 158, 11, 0.4)` | 2180 |
| `#b45309` | 2181 |
| `rgba(14, 165, 233, 0.12)` | 2185 |
| `rgba(14, 165, 233, 0.35)` | 2186 |
| `#4338ca` | 2193 |
| `rgba(16, 185, 129, 0.12)` | 2204 |
| `rgba(16, 185, 129, 0.35)` | 2205 |
| `#047857` | 2206 |
| `#dc2626` | 2214, 2307 |
| `#9333ea` | 2221 |
| `#fbbf24` | 2225 |
| `#2563eb` | 2235 |
| `#34d399` | 2239 |
| `#059669` | 2242 |
| `rgba(0, 0, 0, 0.06)` | 2255 |
| `rgba(0, 0, 0, 0.02)` | 2285 |
| `rgba(245, 158, 11, 0.15)` | 2312 |
| `rgba(245, 158, 11, 0.35)` | 2314 |
| `rgba(245, 158, 11, 0.3)` | 2320 |
| `rgba(23, 23, 23, 0.7)` | 2353 |

</details>

<details>
<summary>src/utils/modals/bulkModals.ts — 7 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/utils/modals/bulkModals.ts)

| Literal | Baris |
|---|---|
| `rgba(56, 189, 248, 0.06)` | 36, 190 |
| `rgba(56, 189, 248, 0.25)` | 36, 190 |
| `#d97706` | 183 |
| `rgba(245, 158, 11, 0.1)` | 183 |
| `rgba(245, 158, 11, 0.25)` | 183 |

</details>

<details>
<summary>src/utils/modals/busInput/busModalEventListeners.ts — 3 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/utils/modals/busInput/busModalEventListeners.ts)

| Literal | Baris |
|---|---|
| `#ef4444` | 163, 165 |
| `#22c55e` | 167 |

</details>

<details>
<summary>src/utils/modals/busInput/busModalTemplate.ts — 1 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/utils/modals/busInput/busModalTemplate.ts)

| Literal | Baris |
|---|---|
| `currentColor` | 20 |

</details>

<details>
<summary>src/utils/modals/busInput/busModalTemplateFull.ts — 11 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/utils/modals/busInput/busModalTemplateFull.ts)

| Literal | Baris |
|---|---|
| `rgba(56, 189, 248, 0.06)` | 29, 84 |
| `rgba(56, 189, 248, 0.25)` | 29, 84 |
| `#38bdf8` | 30 |
| `rgba(192, 132, 252, 0.06)` | 54 |
| `rgba(192, 132, 252, 0.25)` | 54 |
| `#c084fc` | 55 |
| `rgba(245, 158, 11, 0.06)` | 105 |
| `rgba(245, 158, 11, 0.25)` | 105 |
| `#f59e0b` | 106 |

</details>

<details>
<summary>src/utils/modals/busInput/busModalTemplateSpecific.ts — 18 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/utils/modals/busInput/busModalTemplateSpecific.ts)

| Literal | Baris |
|---|---|
| `#38bdf8` | 27, 38, 43, 73, 84, 187, 190 |
| `#c084fc` | 89, 199, 202 |
| `rgba(56, 189, 248, 0.06)` | 118 |
| `rgba(56, 189, 248, 0.25)` | 118, 185 |
| `rgba(56, 189, 248, 0.08)` | 185 |
| `currentColor` | 187, 199 |
| `rgba(192, 132, 252, 0.08)` | 197 |
| `rgba(192, 132, 252, 0.25)` | 197 |

</details>

<details>
<summary>src/utils/modals/regionalSyncModal.ts — 11 literal</summary>

[Sumber pada commit audit](https://github.com/biiCode37/ss-pdo/blob/158590fc9b2f60546d9cae65d6aae0884d660ffa/src/utils/modals/regionalSyncModal.ts)

| Literal | Baris |
|---|---|
| `#a3a3a3` | 48 |
| `rgba(62, 207, 142, 0.06)` | 52 |
| `rgba(62, 207, 142, 0.25)` | 52 |
| `#8b8b8b` | 54, 67 |
| `rgba(255,255,255,0.15)` | 62, 75 |
| `rgba(0,0,0,0.25)` | 62, 75 |
| `#ededed` | 62, 75 |

</details>


## Lampiran C — Sumber warna di luar regex produksi

| Sumber | Nilai / lokasi | Keputusan audit |
|---|---|---|
| `src/utils/sheetColorUtils.ts:25` | RGB (0.53,0.81,0.98) untuk BA.01–04/NP1/NP2 | Warna export eksternal; pertahankan kontrak bisnis sampai ada instruksi terpisah. |
| `src/utils/sheetColorUtils.ts:30` | RGB (0.95,0.35,0.35) untuk TO EVDAL | Sama; bukan semantic UI Dark/Light. |
| `src/utils/sheetColorUtils.ts:35` | RGB (1,0.95,0.3) untuk OFF | Berbeda dari badge UI; dokumentasikan label/kode sebagai jangkar pemahaman. |
| `src/utils/sheetColorUtils.ts:39` | RGB (0.56,0.93,0.56) untuk catatan lain | Jangan ganti melalui global replace palette UI. |
| `src/services/googleSheets/mutations.ts:111,332` | RGB (1,1,1) fallback reset sel | Nilai putih adalah format spreadsheet; jangan ubah menjadi canvas tema. |
| `src/index.css:324` | SVG data URI memakai currentColor | Warna image SVG eksternal/data URI tidak otomatis mewarisi currentColor dari parent seperti inline SVG; uji arrow select kedua tema. Gunakan mask + background token bila perlu. |
| `src/index.css:1737` | `%2394a3b8` pada data URI arrow select | Literal ter-encode tidak tertangkap regex hex; icon pada Light harus diuji 3:1 bila dibutuhkan. |
| `index.html:11,12` | #0b0f19, #f8fafc | Browser chrome berbasis media OS; sinkronkan preferensi aktual. |
| `vite.config.ts:55,56` | #0f172a | PWA static startup color; pengecualian terkontrol. |
| `public/app-logo.png`, `pwa-192x192.png`, `pwa-512x512.png` | Raster hijau/neon; detail ilustrasi dan glow | Aset aktif, terinspeksi visual; jadwalkan redesign biru datar, tidak dapat diperbaiki CSS token saja. |
| `public/favicon.svg` | Purple #863bff dengan display-p3 dan filter | Dipakai index.html; pisahkan identitas aplikasi dari sisa aset template. |
| `public/icons.svg` | Fixed fill dan mask pada symbol | Termasuk PWA assets; tidak ditemukan pemakaian src langsung. Verifikasi sebelum menghapus; warna mask bukan foreground UI. |
| SweetAlert / browser native controls | Warna bawaan dependensi/UA | Tidak dihitung sebagai hardcode src; verifikasi computed style, pseudo-element dan color-scheme saat QA. |
| `scripts/`, `supabase/` | Tidak ditemukan literal warna CSS yang relevan dalam scan teks aktif | Token backend bukan target refactor UI; pertahankan auth/RLS/payload. |

Nilai HEX literal pada SVG publik (termasuk mask, definisi filter, dan fallback; bukan semuanya warna tampilan):

- `public/favicon.svg`: `#863bff` ×2, `#000` ×2, `#ede6ff` ×6, `#7e14ff` ×20, `#47bfff` ×4.
- `public/icons.svg`: `#08060d` ×4, `#fff` ×1, `#aa3bff` ×5.

Catatan dokumen historis: spesifikasi lama memang meminta electric-blue chart, glow Satset, dan role multiwarna. Itu menjelaskan asal fragmentasi, tetapi komentar “high contrast”/“premium” tidak membuktikan rasio. Gunakan hasil perhitungan dan kontrak baru sebagai acceptance criteria, bukan deskripsi estetika lama.
