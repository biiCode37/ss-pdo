# REPAIR REPORT — Refactor 35: Isolasi Penuh State Form Tanggal dan Pencegahan Kedipan Refresh

## 1. Implementasi & Before vs After

### Masalah 1: Tanggal Form Menjadi State Lokal Mandiri (`formTab`)
- **Lokasi**: `src/components/RouteSelectorCard.tsx`
- **Before**: Dropdown tanggal di `RouteSelectorSheet` memakai `selectedTab` dan `setSelectedTab` langsung dari props parent `Dashboard.tsx`.
- **After**: Menambahkan `formTab` sebagai level ke-4 dari cascade state internal:
```ts
const [formTab, setFormTab] = useState<string>(() => currentTabName || selectedTab || String(new Date().getDate()));
```
Dan `handleTabChange` hanya memperbarui `formTab`:
```ts
const handleTabChange = (tab: string) => {
  setFormTab(tab);
};
```
Dropdown menerima `selectedTab={formTab}` dan komit ke parent HANYA saat tombol "Load Data Unit" ditekan:
```tsx
onLoadData={(tab, targetUrl) => {
  const finalTab = tab || formTab;
  setSelectedTab(finalTab);
  if (isAccumulation && finalTab && finalTab !== 'AKUMULASI' && onExitAccumulation) {
    onExitAccumulation(finalTab);
  } else {
    onLoadData(finalTab, targetUrl);
  }
  setIsSheetOpen(false);
}}
```

---

### Masalah 2: Penghapusan `useEffect` Destruktif yang Mengembalikan Tanggal ke Hari Ini
- **Lokasi**: `src/components/RouteSelectorCard.tsx`
- **Before**:
```ts
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
- **After**:
```ts
// Sinkronkan pilihan form dengan tab data yang sedang aktif saat data baru dimuat
useEffect(() => {
  if (currentTabName) {
    setFormTab(currentTabName);
  }
}, [currentTabName]);

// Buka drawer sheet dan inisialisasi formTab dengan tanggal aktif saat tombol pill ditekan
useEffect(() => {
  if (externalOpenTrigger && externalOpenTrigger > 0) {
    setFormTab(currentTabName || selectedTab || String(new Date().getDate()));
    setIsSheetOpen(true);
  }
}, [externalOpenTrigger]);
```

---

### Masalah 3: Stabilisasi `operationalReportDate` di Dashboard
- **Lokasi**: `src/components/Dashboard.tsx`
- **Before**:
```ts
const operationalReportDate = useMemo(() => {
  const dayNum = parseInt(selectedTab, 10);
...
}, [selectedTab, activeYear, activeMonth]);
```
- **After**:
```ts
const operationalReportDate = useMemo(() => {
  const rawTab = currentTabName || selectedTab;
  const dayNum = parseInt(rawTab, 10);
...
}, [currentTabName, selectedTab, activeYear, activeMonth]);
```

---

## 2. Case: Skenario Lapangan

### Skenario Lapangan: Petugas Membuka Form dan Memilih Tanggal Lain Sebelum Memuat Data
- **Kondisi**: Petugas sedang melihat data operasional hari ini (tanggal 12), lalu menekan badge rute untuk membuka form drawer, dan memilih tanggal 5 di dropdown tanggal.
- **Sebelum Perbaikan**:
  1. Memilih tanggal 5 langsung mengubah `selectedTab` di Dashboard.
  2. `operationalReportDate` di Dashboard langsung berubah dan memicu `fetchDailyRouteReport`.
  3. Effect sinkronisasi mendeteksi `selectedTab !== currentTabName` dan langsung memaksa `selectedTab` kembali ke 12.
  4. Pengguna melihat tanggal di dropdown mental kembali ke 12, dan layar berkedip seolah melakukan refresh dua kali.
- **Sesudah Perbaikan**:
  1. Memilih tanggal 5 hanya mengubah `formTab` lokal di dalam drawer.
  2. Dashboard parent tidak berubah sama sekali, tidak ada fetch jaringan, dan layar tidak berkedip.
  3. Pilihan tanggal di dropdown tetap stabil di tanggal 5.
  4. Ketika petugas menekan tombol *"Load Data Unit"*, barulah data tanggal 5 dimuat ke dashboard, drawer ditutup, dan seluruh tampilan diperbarui secara bersih.

---

## 3. Hasil Verifikasi & Quality Gates
1. **Unit Testing**: `pnpm vitest run src/` ➔ **41 test files passed, 325 tests passed (100%)**.
2. **Build Testing**: `pnpm run build` ➔ `tsc -b && vite build` lulus 0 error.
3. **Graphify Knowledge Graph**: `graphify update .` ➔ 3019 nodes, 4119 edges diperbarui.
