# Repair Report - Refact 147: Pembersihan Komponen Usang Status Armada (Dead Component Cleanup)

## 1. Ringkasan Perbaikan
Refaktor 147 menghapus seluruh berkas komponen usang (*dead components*), banner tanpa pemanggil, *zombie state*, serta *prop drilling* yang sebelumnya terkait dengan `FleetStatusModal`. Arsitektur kini bersih, ramping, dan modular (*zero dead code*), sementara komponen aktif seperti `QuickKorlapFleetModal` dan `A2ReportModal` tetap berfungsi normal 100%.

---

## 2. Rincian Implementasi Perbaikan

### A. Berkas yang Dihapus (Dead Files Removal)
1. `src/components/fleetStatus/FleetStatusModal.tsx`
2. `src/components/fleetStatus/FleetStatusModal.test.tsx`
3. `src/components/fleetStatus/FleetStatusHeader.tsx`
4. `src/components/fleetStatus/FleetStatusToolbar.tsx`
5. `src/components/fleetStatus/FleetStatusGrid.tsx`
6. `src/components/fleetStatus/FleetStatusFooter.tsx`
7. `src/components/fleetStatus/useFleetStatusData.ts`
8. `src/components/fleetStatus/ShiftConfirmationAlertBar.tsx`
9. `src/components/fleetStatus/ShiftConfirmationAlertBar.test.tsx`
10. `src/components/busList/BusListShiftLockBanner.tsx`

### B. Pembersihan Modul & Barrel Export
1. `src/components/fleetStatus/index.ts`: Hanya mengekspor `QuickKorlapFleetModal` yang aktif digunakan.
2. `src/components/fleetStatus/types.ts`: Dihapus tipe-tipe usang (`BrushMode`, `StatusMap`, `FleetStatusConfirmationPayload`, `FleetStatusModalProps`).
3. `src/components/busList/index.ts`: Menghapus ekspor `BusListShiftLockBanner`.

### C. Pembersihan State & Prop Drilling
1. `src/components/dashboard/useDashboardFleet.ts`: Menghapus state `isFleetModalOpen`, `setIsFleetModalOpen`, dan fungsi `handleConfirmFleetStatus`.
2. `src/components/dashboard/DashboardModals.tsx`: Menghapus `isFleetModalOpen`, `onCloseFleetModal`, `onConfirmFleetStatus` dari `DashboardModalsProps`.
3. `src/components/dashboard/DashboardContentTabs.tsx`, `src/components/busList/BusList.tsx`, `src/components/busList/BusListHeader.tsx`, `src/components/busList/useBulkOperations.ts`, `src/components/busCard/BusCard.tsx`, `src/components/busCard/types.ts`, `src/components/busCard/useBusCardModal.ts`: Menghapus prop `onOpenFleetStatus`.

### D. Perbaikan Responsivitas & Anti-Overflow Form Laporan A2 (`A2ReportModal.tsx`)
1. **Pencegahan Horizontal Overflow:**
   - Menambahkan `minWidth: 0` pada elemen `<input>` flex catatan unit. Tanpa `min-width: 0`, elemen input browser menolak menciut di bawah ukuran intrinsiknya (~150px) sehingga mendorong tombol hapus keluar dari kartu modal.
   - Mengoptimalkan lebar select unit menjadi `width: 115px`, `maxWidth: 120px`, `minWidth: 95px`, `flexShrink: 0`.
   - Mengganti teks tombol `"Hapus"` (~65px) dengan tombol ikon ramping `<Trash2 size={15} />` (32x32px, `flexShrink: 0`), menghemat 33px ruang horizontal.
2. **Pencegahan Vertical Overflow & Floating Overlap:**
   - Menambahkan `flex: 1` dan `minHeight: 0` pada kontainer body content modal sehingga daftar catatan unit dapat scroll mandiri di dalam area konten tanpa menabrak atau terpotong di bawah footer.
   - Memberikan `flexShrink: 0` dan `backgroundColor: 'var(--color-bg-elevated, #1e293b)'` pada bilah footer dan header agar solid dan tidak tembus pandang saat item di-scroll di belakangnya.
   - Menambahkan guard `if (!isOpen) return null;` dan integrasi `useMobileBackHandler`.

### E. Penyederhanaan Label Form A2 (Clean & Concise UI)
1. `src/constants/texts/text_pdo_form.ts`:
   - `RENOPS_TARGET_LABEL`: Diubah dari `'Target Renops (Unit)'` menjadi `'Renops'`.
   - `REALOPS_LABEL`: Diubah dari `'Realisasi Operasi (Realops)'` menjadi `'Realops'`.
2. `src/constants/texts/texts.test.ts`:
   - Menambahkan unit test integritas untuk kamus `TEXT_PDO_FORM` guna memverifikasi token teks `A2_REPORT.RENOPS_TARGET_LABEL` dan `REALOPS_LABEL`.

---

## 3. Before vs After Comparison

| Bagian Kode | Sebelum Refactor 147 | Sesudah Refactor 147 |
|---|---|---|
| **Komponen Fleet Status** | Terdapat `FleetStatusModal`, 4 subkomponen grid/toolbar, hook `useFleetStatusData`, dan `ShiftConfirmationAlertBar` yang tidak pernah di-mount di aplikasi. | Seluruh file usang dihapus. Direktori `fleetStatus/` kini hanya berfokus pada `QuickKorlapFleetModal` yang aktif. |
| **State `useDashboardFleet`** | Memuat `isFleetModalOpen`, `setIsFleetModalOpen`, dan `handleConfirmFleetStatus` yang tidak pernah dipanggil. | State dan handler usang dihapus; hanya mempertahankan `confirmedShifts`, `confirmedInfo`, `operationalReportStatus`, dan `activeShift`. |
| **Prop `onOpenFleetStatus`** | Dioper melintasi 4 level komponen (`DashboardContentTabs` -> `BusList` -> `BusCard` -> `useBusCardModal`) sebagai prop kosong. | Prop dieliminasi total dari seluruh antarmuka dan komponen. |
| **Banner Shift Lock** | `BusListShiftLockBanner.tsx` ada di codebase tapi tidak dipakai di manapun. | Berkas dihapus dan barrel export dibersihkan. |
| **Layout Baris Unit A2 Modal** | Dropdown (135px) + input tanpa `minWidth: 0` (~160px) + tombol teks Hapus (~65px) = 376px, meluap melebihi lebar modal HP (268px). Tombol Hapus terdorong keluar layar. | Dropdown (115px) + input flex dengan `minWidth: 0` + tombol ikon Trash2 (32px). 100% pas dan proporsional di seluruh lebar layar HP (mobile-first). |
| **Scroll & Footer A2 Modal** | Body content tanpa `flex: 1; minHeight: 0;`, footer transparan tanpa `flexShrink: 0`. Baris terbawah bertabrakan di balik tombol footer. | Body content memiliki `flex: 1; minHeight: 0; overflow-y: auto;`. Footer solid (`#1e293b`) dan `flexShrink: 0`. Konten ter-scroll rapi dan tidak tumpang tindih. |
| **Label Renops & Realops Form A2** | Label panjang `"Target Renops (Unit)"` dan `"Realisasi Operasi (Realops)"` memakan ruang horizontal dan terlihat padat di layar mobile. | Label ringkas & elegan: `"Renops"` dan `"Realops"` yang bersih (*clean*), serasi dengan desain mobile-first. |

---

## 4. Case: Skenario Lapangan

### Skenario 1: Korlap Menginput Realops & Laporan WA
* **Kondisi:** Korlap/Korwil ingin memperbarui status Renops/Realops untuk keperluan Laporan WA (Format 3) atau Monitoring Wilayah.
* **Perilaku:** Korlap menggunakan modal aktif `QuickKorlapFleetModal` (via tombol di modal WA atau tab Monitoring) dan `A2ReportModal` untuk laporan harian resmi. Tidak ada kebingungan dengan adanya modal ganda atau modal yang tidak berfungsi.

### Skenario 2: Petugas Membuka Form Laporan A2 di Ponsel
* **Kondisi:** Petugas PDO di lapangan membuka modal Laporan Harian A2 Armada pada ponsel berlayar 360px–390px dan memiliki banyak armada berkendala (OFF / TO).
* **Perilaku:** Setiap baris nomor bodi dan catatan muat sempurna di dalam batas kartu modal, tombol hapus terlihat jelas dan mudah di-tap, serta daftar unit dapat di-scroll lancar tanpa ada elemen yang terpotong atau keluar dari parent-nya.

### Skenario 3: Kejelasan & Kerapian Visual Form Input A2
* **Kondisi:** Petugas mengisi data ringkas Renops dan Realops di awal pergantian shift.
* **Perilaku:** Label tampil bersih satu baris sebagai `"Renops"` dan `"Realops"` tanpa tanda kurung panjang yang memecah konsentrasi atau memicu baris bertumpuk di layar kecil.

