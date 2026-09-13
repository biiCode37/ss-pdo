# Audit Arsitektur & God Files Refact 39: Dekomposisi Modular God Files & Path Aliasing

Dokumen audit ini mencatat analisis struktural terhadap *god files* (> 1.200 baris) dan struktur dependensi dalam codebase SS_PDO, yang mempersulit pemeliharaan jangka panjang (*maintainability*), meningkatkan risiko regresi, dan memperlambat *developer experience* (DX).

---

## 1. Daftar Temuan Masalah & Risiko Arsitektur

### REF39-ARCH-001: God File `src/utils/modals/busInputModal.ts` (~1.494 baris)

- **Lokasi Kode**: `src/utils/modals/busInputModal.ts` (1.494 baris)
- **Tingkat Keparahan**: **HIGH** (Technical Debt & Maintainability Risk)
- **Deskripsi Masalah**:
  Satu file menangani terlalu banyak domain tanggung jawab sekaligus (pelanggaran *Single Responsibility Principle*):
  1. Definisi antarmuka TypeScript dan konfigurasi batasan input operasional (`BusModalOptions`, `SINGLE_COLUMN_META`, konstanta batas KM/TOA/ritase).
  2. Pengelolaan persistensi state lokal *Mode Satset* (`getSatsetMode`, `setSatsetMode`).
  3. Aturan validasi input relasional numerik dan keamanan escaping Anti-XSS (`validateKmPair`, `validateToaValue`, `validateToaPair`, `validateTripCount`, `escapeHtml`).
  4. Penyusunan string template HTML mentah untuk SweetAlert2 (`renderSatsetToggle`, `renderSmartKeteranganSection`, form mode ALL, mode TOA, mode Trip, mode KM).
  5. Pengikatan event listeners DOM (`didOpen`), logika chips prefix, dropdown BA.02, live diff KM, dan handler `preConfirm`.
  6. Eksekusi orchestrator modal SweetAlert2 (`showBusInputModal`).
- **Dampak User & Pengembang**:
  - Ukuran file yang membengkak membuat peninjauan kode (*code review*) dan debugging menjadi sangat sulit.
  - Perubahan kecil pada satu mode (misal perbaikan layout BA.02) berisiko merusak mode input lain secara tidak sengaja (*coupling* tinggi).
  - Sulit diuji secara modular per fungsi validasi dan rendering.
- **Mitigasi**:
  Dekomposisi menjadi 4 submodul domain terisolasi di folder `src/utils/modals/busInput/`:
  - `busModalTypes.ts`: Interface, metadata kolom tunggal, dan konstanta domain batas operasional.
  - `busModalValidation.ts`: Fungsi-fungsi validator murni dan sanitasi anti-XSS `escapeHtml`.
  - `busModalTemplate.ts`: Fungsi penyusun template HTML untuk modal ALL dan modal spesifik.
  - `busModalHandlers.ts`: Event listeners DOM (`didOpen`), chips interactive behavior, dan ekstraksi form data (`preConfirm`).
  File `busInputModal.ts` dijadikan *facade orchestrator* ramping (~120 baris) dengan re-export publik penuh untuk menjamin *Zero Breaking Change* ke call-site yang ada.

---

### REF39-ARCH-002: God File `src/components/Dashboard.tsx` (~1.393 baris)

- **Lokasi Kode**: `src/components/Dashboard.tsx` (1.393 baris)
- **Tingkat Keparahan**: **HIGH** (Technical Debt & Cognitive Load)
- **Deskripsi Masalah**:
  Komponen `Dashboard.tsx` memuat logika orchestration sekaligus tampilan visual dari berbagai komponen besar:
  1. Manajemen sticky top block header, profil pengguna, badge kode rute, indikator antrean sinkronisasi, dan selector rute/tanggal.
  2. Berbagai macam status banner: pull-to-refresh spinner, offline indicator, session expired banner, reauth button, missing columns alert, shift confirmation alert bar, dan skeletons loader.
  3. Tiga panel utama dalam container gestur swipe (Input Bus, Analytics Dashboard, Unit Summary Dashboard).
  4. Lima modal/sheet dialog level global (Laporan Operasional Rute, Status Armada, Antrean Sinkronisasi, Sheet Akumulasi, Sheet Menu Profil).
- **Dampak User & Pengembang**:
  - Render tree komponen menjadi sangat dalam dan sulit dilacak.
  - Setiap kali ada penambahan atau pengubahan modal, file raksasa ini harus disentuh, memperbesar risiko konflik Git (*merge conflict*).
- **Mitigasi**:
  Ekstraksi tampilan dan interaksi ke dalam 4 subkomponen terdedikasi di `src/components/dashboard/`:
  - `DashboardHeader.tsx`: Sticky container, UserProfileHeader, active route badge, status antrean, dan RouteSelectorCard.
  - `DashboardStatusBanners.tsx`: Indikator pull-to-refresh, status offline, auth expired alert, shift confirmation bar, missing columns warning, dan skeletons loading.
  - `DashboardContentTabs.tsx`: SwipeableContainer yang merangkum BusList, AnalyticsDashboard, dan UnitSummaryDashboard.
  - `DashboardModals.tsx`: Wadah modular untuk RouteOperationalReportCard, FleetStatusModal, QueueModal, AccumulationSheet, dan ProfileMenuSheet.
  Komponen `Dashboard.tsx` berkurang drastis menjadi orchestrator bersih yang hanya fokus pada pengelolaan state aplikasi dan data fetching.

---

### REF39-DX-001: Relative Import Depth Hell (`../../..`)

- **Lokasi Kode**: Berbagai file di `src/components/` dan `src/utils/`
- **Tingkat Keparahan**: **MEDIUM** (Developer Experience & Fragile Paths)
- **Deskripsi Masalah**:
  Banyak komponen menggunakan path relatif bertingkat (misal: `../../services/googleSheets`, `../utils/modals/busInputModal`, `../../constants/texts`). Jika struktur file dipindahkan atau di-refactor, path relatif ini mudah rusak.
- **Dampak Pengembang**:
  Proses refactor dan pemindahan file modular menjadi lambat dan rentan error import.
- **Mitigasi**:
  Konfigurasi TypeScript dan bundler Vite dengan path alias `@/*` mengarah ke `./src/*` pada `tsconfig.app.json` dan `vite.config.ts`.
