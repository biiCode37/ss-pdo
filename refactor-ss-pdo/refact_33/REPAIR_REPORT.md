# REPAIR REPORT — Refactor 33: Perbaikan Sinkronisasi Tanggal Selector Rute & Pill Header

## 1. Implementasi & Before vs After

### Masalah 1: Pemulihan Tanggal Lama yang Mengesampingkan Tanggal Hari Ini (BUG-33-01)
- **Lokasi**: `src/components/RouteSelectorCard.tsx`
- **Before**:
```ts
if (savedMatch && parsed.year && parsed.month && parsed.routeCode) {
  setSelectedYear(parsed.year);
  setSelectedMonth(parsed.month);
  setSelectedRouteCode(parsed.routeCode);
  setSheetUrl(savedMatch.sheet.sheet_url);
  setSelectedTab(parsed.selectedTab || String(new Date().getDate()));
  return;
}
```
- **After**:
```ts
if (savedMatch && parsed.year && parsed.month && parsed.routeCode) {
  setSelectedYear(parsed.year);
  setSelectedMonth(parsed.month);
  setSelectedRouteCode(parsed.routeCode);
  setSheetUrl(savedMatch.sheet.sheet_url);

  // BUG-FIX: Sinkronisasi tanggal saat membuka aplikasi.
  // Jika rute tersimpan adalah periode bulan & tahun saat ini, tanggal HARUS selalu hari ini (today).
  // Tanggal tersimpan (parsed.selectedTab) hanya digunakan jika membuka arsip periode lampau.
  const now = new Date();
  const isCurrentPeriod = parsed.year === now.getFullYear() && parsed.month === (now.getMonth() + 1);
  const todayDay = String(now.getDate());
  const restoredTab = isCurrentPeriod ? todayDay : (parsed.selectedTab || todayDay);
  setSelectedTab(restoredTab);
  return;
}
```

---

### Masalah 2: Sinkronisasi Reaktif dan Pemicu Pembuka Form Drawer (BUG-33-02)
- **Lokasi**: `src/components/RouteSelectorCard.tsx`
- **Before**:
```ts
useEffect(() => {
  if (externalOpenTrigger && externalOpenTrigger > 0) {
    setIsSheetOpen(true);
  }
}, [externalOpenTrigger]);
```
- **After**:
```ts
// Selalu jaga agar selectedTab sinkron dengan data yang sedang aktif di dashboard (currentTabName)
useEffect(() => {
  if (currentTabName && currentTabName !== selectedTab && !isAccumulation) {
    setSelectedTab(currentTabName);
  }
}, [currentTabName, isAccumulation]);

useEffect(() => {
  if (externalOpenTrigger && externalOpenTrigger > 0) {
    if (currentTabName && currentTabName !== selectedTab && !isAccumulation) {
      setSelectedTab(currentTabName);
    }
    setIsSheetOpen(true);
  }
}, [externalOpenTrigger, currentTabName, selectedTab, isAccumulation]);
```

---

### Masalah 3: Konsistensi State Tab Aktif di Parent Dashboard (BUG-33-03)
- **Lokasi**: `src/components/Dashboard.tsx`
- **Before**:
```ts
setBusData(data);
setHeaderMap(headerMap);
setCurrentSheetId(sheetId);
setCurrentTabName(activeTab);
setMissingColumns(missing);
setSheetSummary(summary || {});
```
- **After**:
```ts
setBusData(data);
setHeaderMap(headerMap);
setCurrentSheetId(sheetId);
setCurrentTabName(activeTab);
handleSetSelectedTab(activeTab);
setMissingColumns(missing);
setSheetSummary(summary || {});
```

---

## 2. Case: Skenario Lapangan

### Skenario Lapangan A: Petugas Membuka Aplikasi di Hari Kerja Baru
- **Kondisi Awal**: Kemarin atau beberapa hari lalu, petugas membuka data tanggal 2 (misal untuk koreksi ritase tanggal 2). Akibatnya `localStorage` menyimpan `{"selectedTab": "2", ...}`.
- **Sebelum Perbaikan**:
  1. Hari ini (tanggal 12), petugas membuka aplikasi.
  2. Dashboard memuat data tanggal 12 secara otomatis. Pill tanggal atas menampilkan: *"Sabtu, 12 Sep 2026"*.
  3. Namun `loadRoutes()` di `RouteSelectorCard` memulihkan `parsed.selectedTab = "2"`.
  4. Ketika petugas men-tap badge rute di kanan atas, drawer form terbuka dan dropdown Tanggal menunjukkan *"Tgl 2"*.
  5. Terjadi ketidaksinkronan antara header atas ("12") dan form selector ("2"). Jika petugas tidak cermat dan menekan "Muat Data", aplikasi akan memuat data tanggal 2 kembali.
- **Sesudah Perbaikan**:
  1. Karena rute tersimpan adalah bulan & tahun berjalan (September 2026), sistem otomatis memprioritaskan tanggal hari ini ("12").
  2. Pill tanggal menampilkan *"Sabtu, 12 Sep 2026"* dan form selector langsung menampilkan *"Tgl 12"*.
  3. 100% selaras dan konsisten.

### Skenario Lapangan B: Petugas Berpindah Tanggal dari Grafik / Tabel, lalu Membuka Selector Rute
- **Kondisi**: Petugas berpindah dari tanggal 12 ke tanggal 5 melalui tab analitik atau tombol tanggal lain.
- **Sebelum Perbaikan**: `currentTabName` berganti menjadi "5", namun bila ada kondisi balapan (race condition), `selectedTab` di form selector belum tentu merefleksikan tanggal 5.
- **Sesudah Perbaikan**: Efek reaktif menyelaraskan `selectedTab` dengan `currentTabName`, dan trigger pembukaan drawer (`externalOpenTrigger`) menjamin sinkronisasi instan saat drawer dibuka.

---

## 3. Hasil Verifikasi & Quality Gates
1. **Unit Test**: `pnpm vitest run src/` ➔ 41 test files passed, 325 tests passed (100% pass).
2. **Build Test**: `pnpm run build` ➔ `tsc -b && vite build` sukses 0 error.
3. **Graphify Knowledge Graph**: `graphify update .` ➔ 2994 nodes, 4098 edges diperbarui.
