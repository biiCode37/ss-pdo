# Audit Temuan Refact 54: Dekomposisi Root Orchestrator Dashboard `Dashboard.tsx` (~514 baris)

Dokumen audit ini mencatat analisis arsitektural dan dekomposisi terhadap komponen orkestrator utama aplikasi `src/components/Dashboard.tsx` yang memuat logika state UI sistem global, pendengar event jendela (window listeners), pengendali tombol kembali perangkat mobile (hardware back navigation), navigasi tab swipeable, pengalih tema aplikasi, serta pengendali aksi sinkronisasi dan reautentikasi.

---

## 1. Daftar Temuan Masalah & Risiko Arsitektur

### REF54-ARCH-001: God File Root Component `src/components/Dashboard.tsx` (514 baris)

- **Lokasi Kode**: `src/components/Dashboard.tsx` (514 baris)
- **Tingkat Keparahan**: **MEDIUM-HIGH** (Maintainability, Separation of Concerns & Testability)
- **Deskripsi Masalah**:
  Komponen `Dashboard.tsx` bertindak sebagai root orchestrator aplikasi, namun masih memikul terlalu banyak tanggung jawab logika stateful internal:
  1. **Konektivitas & Otentikasi Global**: State `isOnline`, `isAuthExpired`, dan `isReauthenticating` beserta efek pendengar event jendela (`online`, `offline`, `google-auth-expired`, `google-login-success`).
  2. **Visibilitas Modal & Bottom Sheet**: Mengelola state buka-tutup untuk 3 lembar kerja modal (`isQueueModalOpen`, `isAccSheetOpen`, `isProfileMenuOpen`).
  3. **Navigasi Tampilan Tingkat Atas**: Mengelola percabangan tampilan `currentView` (`"dashboard" | "user_management" | "regional_monitoring"`) serta tanggal filter monitoring wilayah (`monitoringDate`).
  4. **Navigasi Tab Utama & Gestur Swipe**: State tab aktif `mainTab` (`input`, `analytics`, `units`) beserta fungsi transisi rotasi geser maju (`handleSwipeNextTab`) dan mundur (`handleSwipePrevTab`).
  5. **Pengendali Tema Aplikasi**: State `theme` (`light` / `dark`), sinkronisasi atribut DOM `data-theme`, dan persistensi penyimpanan lokal `PDO_THEME`.
  6. **Interseptor Tombol Kembali Fisik Ponsel (Hardware Back Navigation)**: Registrasi 5 `useMobileBackHandler` terpisah di dalam berkas komponen yang sama.
  7. **Penanganan Aksi Sinkronisasi & Reautentikasi**: Logika konfirmasi hapus antrean offline (`handleDeleteQueueItem`), reautentikasi sesi token Google beserta sinkronisasi ulang antrean tertunda (`handleReauthenticate`), rute selektor monitoring wilayah (`handleSelectMonitoringRoute`), dan format massal spreadsheet (`handleFormatWholeSheet`).
  8. **Sorotan Kartu Bus (Target Glowing Pulse)**: Logika scrolling halus dan penambahan efek glowing pulse 6 detik pada elemen kartu bodi unit (`handleSelectUnit`).

- **Dampak User & Pengembang**:
  - Berkas komponen terlalu panjang dan padat (514 baris), menyulitkan pemahaman alur data dan isolasi bug.
  - State UI dan logika handler bercampur baur dengan JSX antarmuka, menyebabkan komponen sulit diuji secara unit test mandiri tanpa me-mount seluruh pohon komponen.
  - Potensi regresi saat menambahkan fitur navigasi atau modal baru di tingkat dashboard.

- **Mitigasi**:
  Dekomposisi ke dalam hook-hook modular terdedikasi di `src/components/dashboard/`:
  1. **`useDashboardUiState.ts`**:
     - Mengisolasi seluruh state sistem (`isOnline`, `isAuthExpired`, `isReauthenticating`), modal toggle (`isQueueModalOpen`, `isAccSheetOpen`, `isProfileMenuOpen`), navigasi view & tab (`currentView`, `monitoringDate`, `mainTab`, swipe tab handlers), tema (`theme`, `toggleTheme`), scrolling dan highlight pulse kartu unit 6 detik (`handleSelectUnit`).
     - Mengisolasi 5 pemanggilan `useMobileBackHandler`.
     - Mengisolasi listener event window (`online`, `offline`, `google-auth-expired`, `google-login-success`).
  2. **`useDashboardSyncHandlers.ts`**:
     - Mengisolasi seluruh callback aksi sinkronisasi offline (`handleDeleteQueueItem`), reautentikasi sesi Google (`handleReauthenticate`), pemilihan rute monitoring (`handleSelectMonitoringRoute`), dan format massal spreadsheet (`handleFormatWholeSheet`).
  3. **`index.ts`**:
     - Mengekspor modul dan tipe baru secara bersih.
  4. **`Dashboard.tsx`**:
     - Dirampingkan dari 514 baris menjadi **290 baris** (penurunan -224 baris kode / 44%) murni sebagai orchestrator tata letak dan delegasi data.
  5. **Unit Tests Terdedikasi**:
     - `src/components/dashboard/useDashboardUiState.test.tsx` (5 skenario pengujian).
     - `src/components/dashboard/useDashboardSyncHandlers.test.tsx` (5 skenario pengujian).
