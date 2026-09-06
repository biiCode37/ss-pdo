# REPAIR REPORT: PERBAIKAN BUG INTERAKSI GANDA ROUTE SELECTOR (REFACTOR 12)

Dokumen ini mendokumentasikan implementasi teknis perbaikan bug **ROUTE-12-01** pada komponen Route Selector dan sinkronisasi data sheet rute di aplikasi SS_PDO.

---

## 1. Ringkasan Implementasi Perbaikan

### Akar Masalah:
Sebelumnya, ketika pengguna memilih rute pada dropdown:
1. `handleRouteCodeChange` di `RouteSelectorCard.tsx` memanggil `setSelectedTab(defaultDay)`. Karena prop `setSelectedTab` dioper dari `handleSelectTab` di `Dashboard.tsx`, terjadi pemanggilan `handleLoadData` prematur secara otomatis sebelum pengguna menekan tombol *"Load Data Unit"*.
2. Pada pemanggilan prematur tersebut, `sheetUrlRef.current` masih menyimpan URL rute lama karena `useEffect` sinkronisasi ref berjalan lambat (1 cycle render berikutnya).
3. Efek sinkronisasi dropdown di `RouteSelectorCard.tsx` yang memantau `[routes, sheetUrl, currentSheetId, selectedTab]` langsung dieksekusi dengan `currentSheetId` lama yang masih aktif, sehingga secara sepihak memanggil `setSelectedRouteCode(active.routeCode)` yang menimpa kembali (*revert*) rute pilihan pengguna ke rute sebelumnya.
4. Akibatnya, data rute baru gagal dimuat dan pengguna harus mengulangi pemilihan rute untuk kedua kalinya.

### Langkah-langkah Perbaikan yang Telah Diterapkan:
1. **Pemisahan Modul Murni (`src/utils/routeHelpers.ts`):**
   - Mengekstrak fungsi `flattenRoutes` dan tipe `FlatRouteSheet` ke file utilitas murni tanpa dependensi eksternal (DOM/gapi), lengkap dengan unit test komprehensif di `src/utils/routeHelpers.test.ts`.
2. **Eliminasi Auto-Load Prematur (`src/components/Dashboard.tsx`):**
   - Membuat setter murni `handleSetSelectedTab` khusus untuk `RouteSelectorCard` yang hanya mengupdate state tab dan ref seketika tanpa memicu `handleLoadData`.
   - Membuat wrapper `handleSetSheetUrl` yang langsung menyinkronkan `sheetUrlRef.current` secara instan tanpa menunggu siklus render berikutnya.
   - Mengubah `handleLoadData` agar dapat menerima parameter eksplisit `(isRefresh = false, targetTab?: string, targetSheetUrl?: string)`.
3. **Pemberhentian Circular Reset Dropdown (`src/components/RouteSelectorCard.tsx`):**
   - Menghapus dependency `sheetUrl` dan `selectedTab` dari efek sinkronisasi dropdown.
   - Menggunakan ref pelacak `prevLoadedSheetIdRef.current` sehingga sinkronisasi state dropdown HANYA berjalan ketika data sheet rute baru telah selesai dimuat (`currentSheetId` berganti) dari backend/spreadsheet.
   - Tombol *"Load Data Unit"* kini secara eksplisit meneruskan parameter rute dan tab saat ini via `onLoadData(selectedTab, sheetUrl)` langsung ke loader data.

---

## 2. Before vs After

### A. Aliran Pemilihan Dropdown Rute

#### Before:
```
User Memilih Rute Baru (JAK.118)
   │
   ├─► handleRouteCodeChange memanggil setSelectedTab(defaultDay)
   │     └─► handleSelectTab memicu handleLoadData prematur!
   │           └─► Menggunakan sheetUrlRef.current (MASIH RUTE LAMA JAK.117)
   │
   └─► useEffect sync mendeteksi currentSheetId (MASIH JAK.117)
         └─► setSelectedRouteCode("JAK.117") ➔ PILIHAN USER TERTIMPA BALIK KE LAMA!
```

#### After:
```
User Memilih Rute Baru (JAK.118)
   │
   ├─► handleRouteCodeChange mengupdate state lokal & setSheetUrl
   │     └─► handleSetSheetUrl langsung mengupdate sheetUrl & sheetUrlRef.current secara instan
   │     └─► handleSetSelectedTab murni mengupdate state tab (TIDAK ADA auto-load prematur)
   │
   ├─► Dropdown tetap konsisten pada rute pilihan user (JAK.118) tanpa revert
   │
   └─► User menekan "Load Data Unit"
         └─► onLoadData(selectedTab, sheetUrl) memuat data JAK.118 pada interaksi pertama (1x klik)
```

---

### B. Potongan Kode Kunci

#### 1. `src/components/Dashboard.tsx`
```diff
- <RouteSelectorCard
-   sheetUrl={sheetUrl}
-   setSheetUrl={setSheetUrl}
-   selectedTab={selectedTab}
-   setSelectedTab={handleSelectTab}
-   currentSheetId={currentSheetId}
-   isLoading={loading}
-   isDataLoaded={busData.length > 0}
-   onLoadData={() => handleLoadData(true)}
- />
+ <RouteSelectorCard
+   sheetUrl={sheetUrl}
+   setSheetUrl={handleSetSheetUrl}
+   selectedTab={selectedTab}
+   setSelectedTab={handleSetSelectedTab}
+   currentSheetId={currentSheetId}
+   isLoading={loading}
+   isDataLoaded={busData.length > 0}
+   onLoadData={(tab, targetUrl) => handleLoadData(true, tab, targetUrl)}
+ />
```

#### 2. `src/components/RouteSelectorCard.tsx`
```diff
- useEffect(() => {
-   if (flatSheets.length === 0) return;
-   const targetId = currentSheetId || extractSpreadsheetId(sheetUrl);
-   if (!targetId) return;
-   const active = flatSheets.find(f => {
-     const fId = extractSpreadsheetId(f.sheet.sheet_url) || extractSpreadsheetId(f.sheet.spreadsheet_id);
-     return fId === targetId;
-   });
-   if (active) {
-     setSelectedYear(active.sheet.year);
-     setSelectedMonth(active.sheet.month);
-     setSelectedRouteCode(active.routeCode);
-   }
- }, [flatSheets, sheetUrl, currentSheetId, selectedTab]);
+ const prevLoadedSheetIdRef = useRef<string | undefined>(currentSheetId);
+ useEffect(() => {
+   if (flatSheets.length === 0 || !currentSheetId) return;
+   if (prevLoadedSheetIdRef.current === currentSheetId) return;
+   prevLoadedSheetIdRef.current = currentSheetId;
+
+   const active = flatSheets.find(f => {
+     const fId = extractSpreadsheetId(f.sheet.sheet_url) || extractSpreadsheetId(f.sheet.spreadsheet_id);
+     return fId === currentSheetId;
+   });
+   if (active) {
+     setSelectedYear(active.sheet.year);
+     setSelectedMonth(active.sheet.month);
+     setSelectedRouteCode(active.routeCode);
+   }
+ }, [flatSheets, currentSheetId, selectedTab]);
```

---

## 3. Case: Skenario Lapangan

### Skenario: Pergantian Monitoring Rute oleh Petugas Pengendali di Lapangan
- **Kondisi Awal:**
  Petugas operasional sedang memonitor rute `JAK.117` pada tanggal berjalan. Petugas ingin beralih memeriksa performa ritase bus di rute `JAK.118`.
- **Sebelum Perbaikan:**
  1. Petugas membuka selector rute dan memilih `JAK.118`.
  2. Sistem di latar belakang langsung memicu fetch ke URL `JAK.117` (stale ref).
  3. Dropdown seketika berkedip dan kembali menampilkan `JAK.117`.
  4. Petugas menekan "Load Data Unit" namun tabel tetap menyajikan data unit bus `JAK.117`.
  5. Petugas bingung, lalu memilih ulang `JAK.118` untuk kedua kalinya. Baru pada kali kedua data `JAK.118` berhasil muncul.
- **Setelah Perbaikan:**
  1. Petugas memilih rute `JAK.118`. Label dropdown tetap teguh menampilkan `JAK.118` tanpa revert.
  2. Tidak ada request data liar/prematur yang membebani jaringan kuota ponsel petugas.
  3. Petugas menekan tombol "Load Data Unit" satu kali (1x klik).
  4. Data ritase unit rute `JAK.118` langsung dimuat dengan tepat, presisi, dan kartu selector menciut (*morphing*) menjadi kapsul elegan.

---

## 4. Status Quality Gates

- Unit Test: `pnpm vitest run src/` ➔ **24/24 Test Files PASSED, 207/207 Tests PASSED (100%)**.
- TypeScript & Build: `pnpm run build` ➔ **0 Error, Build Selesai dalam 1.48 detik**.
- Knowledge Graph: `graphify update .` ➔ **Sinkron & Terbarukan**.
