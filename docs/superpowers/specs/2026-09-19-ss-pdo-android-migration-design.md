# Design Document: Migrasi Penuh SS_PDO ke Android Native (React Native + Expo)

## Metadata
- **Tanggal**: 19 September 2026
- **Topik**: Migrasi Total Web PWA ke Aplikasi Android Mobile (Expo SDK, Expo Router, NativeWind)
- **Status**: Approved (Brainstorming Selesai)
- **Branch**: `devmode`

---

## 1. Konteks & Latar Belakang

Aplikasi **SS_PDO** saat ini beroperasi sebagai Web Progressive Web App (PWA) berbasis React 18, Vite, TypeScript, dan Tailwind CSS. Aplikasi ini melayani operasional pencatatan harian 18 rute Mikrotrans Wilayah Jakarta Utara (pencatatan TOA, KM tempuh, ritase, penetapan status armada SGO/AP/TO/BA/OFF, monitoring wilayah, dan generator laporan dinas WhatsApp).

Berdasarkan kesepakatan strategis produk, **fokus pengembangan masa depan beralih 100% ke aplikasi Android** (menggantikan versi web sepenuhnya). 

### Pertimbangan Kritis & Analisis Kebutuhan:
1. **Penggunaan Dominan di Lapangan**:
   Seluruh interaksi pencatatan riil dilakukan oleh petugas pos rute dan pengawas lapangan menggunakan smartphone Android di lingkungan pos/terminal.
2. **Kebutuhan Performa & Kenyamanan Mobile Native**:
   Animasi transisi fluid 60–120 FPS, gestur swipe alami, haptic feedback pada penekanan tombol operasional, dan integrasi instan dengan aplikasi WhatsApp (`expo-linking`).
3. **Penyimpanan Lokal & Sinkronisasi Offline**:
   Penyimpanan berbasis MMKV / `expo-sqlite` yang jauh lebih stabil dan kencang dibandingkan IndexedDB pada browser mobile.
4. **Distribusi Tanpa Hambatan (*Over-The-Air Updates*)**:
   Menggunakan Expo EAS Update agar perbaikan formula sheet, pembaruan rute, atau bugfix dapat langsung diterapkan ke ponsel petugas tanpa mewajibkan mereka mengunduh ulang berkas APK secara manual.

---

## 2. Keputusan Arsitektur Utama

### Keputusan 1: Pemilihan Framework React Native (Expo) vs Flutter / Kotlin Native
- **Keputusan**: Menggunakan **React Native dengan Expo**.
- **Rasional**:
  - Logika bisnis yang sudah matang di `SS_PDO` (termasuk 401 unit test yang lulus 100%) ditulis dalam **TypeScript**.
  - Sekitar **80% logika bisnis inti** dapat langsung digunakan kembali (*reused*) tanpa perlu ditulis ulang ke bahasa lain (seperti Dart pada Flutter atau Kotlin pada Android Native).
  - Menghindari risiko *logic drift* (perbedaan rumus/kalkulasi angka antara web dan mobile).
  - Mendukung ekosistem modern Expo Router dan integrasi OTA (*Over-The-Air*) Updates.

### Keputusan 2: Repositori Terpisah Bersih (*Clean Slate New Repo*)
- **Keputusan**: Aplikasi Android dibangun di repositori baru terpisah bernama **`ss-pdo-mobile`**.
- **Rasional**:
  - Memisahkan codebase mobile dari file-file konfigurasi Web/Vite/PWA lama yang tidak diperlukan.
  - Memastikan *dependency tree* mobile ramping, modern, dan tidak terdistorsi oleh paket DOM web.
  - Modul logika teruji disalin secara bersih ke dalam direktori `src/` repositori baru.

### Keputusan 3: Navigasi Modern Expo Router (File-Based Routing)
- **Keputusan**: Menggunakan **Expo Router v3+**.
- **Rasional**:
  - Standar industri resmi Expo yang intuitif dan berbasis struktur folder.
  - Mendukung deep-linking, typed routes, dan transisi layar berbasis tumpukan (*stack*) dan tab bawah (*bottom tabs*) native.

### Keputusan 4: Styling NativeWind v4 (Tailwind CSS) & Dual Theming
- **Keputusan**: Menggunakan **NativeWind v4**.
- **Rasional**:
  - Mempertahankan konsistensi desain yang sudah ada (Light Mode & Dark Mode).
  - Kelas styling utility-first yang mudah dibaca, compile-time performance tanpa overhead runtime JS.

### Keputusan 5: Penggunaan Ulang Penuh Kamus Teks Sentral (`src/constants/texts/`)
- **Keputusan**: Seluruh kamus teks UI (`TEXT_DASHBOARD`, `TEXT_FLEET_STATUS`, `TEXT_ALERTS`, `TEXT_WA_REPORT`, `TEXT_MONITORING`, dll.) dipindahkan 100% ke repositori baru.
- **Rasional**:
  - Menjaga aturan emas *Zero Hardcoded UI Strings*.
  - Menjamin konsistensi istilah operasional Transjakarta yang sudah diuji dan dipahami oleh petugas pos di lapangan.

---

## 3. Struktur Repositori Baru (`ss-pdo-mobile`)

```text
ss-pdo-mobile/
├── app/                          # Expo Router (File-based routes)
│   ├── _layout.tsx               # Root Layout: ThemeProvider & Global Providers
│   ├── index.tsx                 # Redirect / Splash router
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   └── login.tsx             # Layar Login permanen
│   ├── (tabs)/                   # Bottom Tab Bar Utama
│   │   ├── _layout.tsx           # Konfigurasi Bottom Navigation Tabs
│   │   ├── index.tsx             # Tab 1: Dashboard Operasional Bus (BusCard list)
│   │   ├── monitoring.tsx        # Tab 2: Monitoring Wilayah 18 Rute
│   │   ├── wa-report.tsx         # Tab 3: Generator Laporan WhatsApp Dinas
│   │   └── settings.tsx          # Tab 4: Pengaturan Rute & Akun Petugas
│   └── modal/                    # Modal Layar Native (Presentation Modal)
│       ├── bus-input.tsx         # Modal input TOA/KM/Ritase per unit
│       ├── fleet-status.tsx      # Modal penetapan status armada (SGO/AP/TO/BA/OFF)
│       ├── bulk-trip.tsx         # Modal set trip operasional massal
│       └── global-sync.tsx       # Modal sinkronisasi spreadsheet global 18 rute
├── src/
│   ├── constants/
│   │   ├── texts/                # Kamus teks sentral (100% reuse dari SS_PDO)
│   │   └── operators.ts          # Konfigurasi operator & rute
│   ├── services/
│   │   ├── googleSheets/         # Parser sheet, header mapper, Edge Function proxy
│   │   ├── supabase.ts           # Klien database Supabase & Auth
│   │   ├── dailyRouteReportService.ts
│   │   └── allRouteMonitoringService.ts
│   ├── utils/
│   │   ├── numberUtils.ts        # Parsing format angka desimal/ribuan Indonesia
│   │   ├── keteranganUtils.ts    # Pemisah status Shift 1/2
│   │   ├── unitAnalytics.ts      # Deteksi target trip operasional
│   │   ├── waReportGenerator.ts  # Generator monospace laporan WA Format 1, 2, 3
│   │   └── conflictMerge.ts      # Resolusi konflik offline-online
│   ├── components/
│   │   ├── busCard/              # Komponen Kartu Bus Native & Summary
│   │   ├── busList/              # Header bar, search filter, soft reminder banner
│   │   ├── fleetStatus/          # Segmented tabs status armada & alert bar
│   │   ├── monitoring/           # KPI cards & list progress 18 rute
│   │   └── common/               # Tombol aksi, badge, input text native
│   └── hooks/
│       ├── useOfflineSync.ts     # Antrean sinkronisasi lokal SQLite
│       ├── useNetworkStatus.ts   # Deteksi status online/offline
│       └── useTheme.ts           # State tema Light/Dark
├── app.json                      # Konfigurasi Expo & EAS Build
├── tailwind.config.js            # Konfigurasi NativeWind
├── tsconfig.json                 # TypeScript strict configuration
└── package.json                  # PNPM package manager
```

---

## 4. Pemetaan Komponen (Web JSX vs React Native)

| Modul / Komponen Web | Komponen Pengganti di React Native (Expo) |
| :--- | :--- |
| `<div>`, `<section>` | `<View className="...">` |
| `<span>`, `<p>`, `<h1>` | `<Text className="...">` |
| `<input type="number\|text">` | `<TextInput keyboardType="numeric\|default" ... />` |
| `<button>` | `<Pressable>` / `<TouchableOpacity>` dengan feedback sentuhan |
| Animasi CSS Spring Apple | `react-native-reanimated` (Pegas fisik `withSpring`) |
| SweetAlert2 (`pdoSwal`) | Native Modal (`<Modal animationType="slide">`) atau `@gorhom/bottom-sheet` |
| `navigator.clipboard` | `expo-clipboard` |
| Buka WhatsApp (`window.open`) | `expo-linking` (`Linking.openURL('whatsapp://send?text=...')`) |
| Lucide React (`lucide-react`) | `lucide-react-native` |
| IndexedDB Queue | `expo-sqlite` atau MMKV storage queue |
| Sesi Login Permanen | `expo-secure-store` / AsyncStorage (tanpa timeout) |

---

## 5. Rencana Tahapan Eksekusi (*Implementation Phases*)

### Fase 1: Inisialisasi Proyek Baru & Tooling
- Inisialisasi proyek Expo baru menggunakan `pnpm dlx create-expo-app@latest ss-pdo-mobile --template tabs`.
- Konfigurasi TypeScript `strict: true`.
- Setup NativeWind v4 (Tailwind) dan konfigurasi skema warna Dark & Light mode.

### Fase 2: Migrasi Logika Inti & Kamus Teks
- Salin direktori `src/constants/texts/` secara menyeluruh.
- Salin fungsi utilitas: `numberUtils.ts`, `keteranganUtils.ts`, `unitAnalytics.ts`, `waReportGenerator.ts`, `conflictMerge.ts`.
- Salin lapisan servis Google Sheets & Supabase.
- Jalankan unit tests (Jest/Vitest) di repo baru untuk menjamin 100% logika berfungsi presisi.

### Fase 3: Pembangunan Komponen UI Dashboard & Input
- Bangun komponen `BusCard` native dengan badge `⚠️ Belum Konfirmasi` dan aksen batas amber.
- Bangun `BusListShiftLockBanner` (soft reminder konfirmasi status armada).
- Bangun `BusInputModal` sebagai native modal/bottom-sheet untuk pengisian TOA, KM, Trip, dan Keterangan.
- Bangun `FleetStatusModal` untuk penetapan status armada Shift 1 & Shift 2.

### Fase 4: Pembangunan Fitur Monitoring & Generator WA
- Bangun layar `monitoring.tsx` untuk pantauan capaian 18 rute.
- Bangun modal `global-sync.tsx` untuk sinkronisasi spreadsheet global 18 rute 1-klik.
- Bangun layar `wa-report.tsx` dengan pemilih format (Format 1, 2, 3) dan tombol kirim langsung ke WhatsApp.

### Fase 5: Offline Sync, Build APK & Konfigurasi OTA Updates
- Implementasikan antrean sinkronisasi lokal menggunakan `expo-sqlite`.
- Setup EAS Build untuk mencetak berkas APK Android (`eas build -p android --profile preview`).
- Setup EAS Update untuk pembaruan fitur instan over-the-air.

---

## 6. Verifikasi & Tolok Ukur Keberhasilan

1. **Paritas Fitur 100%**:
   Seluruh kapabilitas pencatatan, kalkulasi ritase, pemisahan shift, validasi KM, dan laporan WA berfungsi identik dengan versi web.
2. **Kepatuhan Golden Rules**:
   - Mobile-First dan responsive di semua dimensi layar Android.
   - Presisi angka murni Google Sheets SSOT (tanpa pemotongan atau pembulatan sepihak).
   - Zero hardcoded UI strings (100% dari kamus teks sentral).
   - Sesi login permanen tanpa batas waktu.
3. **Performa & Distribusi**:
   - Aplikasi berjalan lancar pada 60 FPS di ponsel entry-level Android.
   - Berkas APK dapat diinstal langsung dan mendukung pembaruan OTA.
