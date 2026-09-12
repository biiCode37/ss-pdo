# REPAIR REPORT — Refactor 34: Isolasi Pemicu Pemuatan Data pada Form Route Selector

## 1. Implementasi & Before vs After

### Masalah 1: Auto-Load Prematur saat Pemilihan Tanggal di Dropdown (BUG-34-01)
- **Lokasi**: `src/components/RouteSelectorCard.tsx`
- **Before**:
```ts
const handleTabChange = (tab: string) => {
  setSelectedTab(tab);
  if (tab && tab !== 'AKUMULASI') {
    if (onExitAccumulation) {
      onExitAccumulation(tab);
    } else {
      onLoadData(tab, sheetUrl);
    }
  }
};
```
- **After**:
```ts
const handleTabChange = (tab: string) => {
  setSelectedTab(tab);
};
```
Dan pada delegasi handler tombol "Load Data Unit" di `RouteSelectorSheet`:
```ts
onLoadData={(tab, targetUrl) => {
  if (isAccumulation && tab && tab !== 'AKUMULASI' && onExitAccumulation) {
    onExitAccumulation(tab);
  } else {
    onLoadData(tab, targetUrl);
  }
  setIsSheetOpen(false);
}}
```

---

## 2. Case: Skenario Lapangan

### Skenario Lapangan A: Petugas Mengganti Pilihan Tanggal Sebelum Mengonfirmasi Pemuatan
- **Kondisi**: Petugas membuka form route selector, lalu memilih tanggal lain (misal tanggal 10).
- **Sebelum Perbaikan**: Begitu dropdown tanggal dipilih, aplikasi langsung melakukan request fetch Google Sheets ke tab 10 di latar belakang, memicu indikator loading, dan mengubah data dashboard di balik drawer sebelum petugas menekan tombol *"Load Data Unit"*. Tombol *"Load Data Unit"* menjadi redundan.
- **Sesudah Perbaikan**: Memilih tanggal di dropdown hanya mengubah state input tanggal sementara. Pemuatan data Google Sheets dan penutupan drawer HANYA dieksekusi ketika petugas secara sadar dan sengaja menekan tombol *"Load Data Unit"*.

---

## 3. Hasil Verifikasi & Quality Gates
1. **Unit Testing**:
   - `src/components/RouteSelectorCard.test.tsx` (9 tests passed).
   - Total test suite: `pnpm vitest run src/` ➔ **41 files passed, 326 tests passed (100%)**.
2. **Build Testing**: `pnpm run build` ➔ `tsc -b && vite build` lulus 0 error.
3. **Graphify Knowledge Graph**: `graphify update .` ➔ 3008 nodes, 4110 edges diperbarui.
