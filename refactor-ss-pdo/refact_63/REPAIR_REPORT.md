# REPAIR REPORT — REFACTOR 63: RESTORASI FITUR SPEED-RUN INPUT SS, VALIDASI RELASIONAL, & ERGONOMI MOBILE

Dokumen implementasi perbaikan komprehensif untuk halaman Input SS (Spreadsheet / Bus Card Input) pasca-modernisasi, merestorasi seluruh kemampuan *speed-run* satset, validasi relasional, dan ergonomi mobile tanpa mengorbankan peningkatan positif desain yang telah dicapai.

---

## 📋 Ringkasan Implementasi

1. **Restorasi Mode Single-Column Focus Speed-Run:**
   - Memanfaatkan `SINGLE_COLUMN_META` (`toaShift1`, `totalToa`, `kmAwal1`, `kmAkhir1`, `kmAwal2`, `kmAkhir2`).
   - Menyediakan tombol toggle `[Semua Kolom]` / `[Mode Fokus]` di header modal untuk fleksibilitas pengguna.
   - Menyediakan tombol *quick copy* KM Akhir S1 ke KM Awal S2.
   - Menyediakan *progressive disclosure chips* (`+ Manual S1/S2`, `+ Catatan`) agar input sekunder tidak memenuhi layar namun siap digunakan dalam 1 tap.
2. **Autofocus & Autoselect Instan:**
   - Menambahkan hook timer 60ms yang secara otomatis memfokuskan elemen input utama dan menyeleksi seluruh teks (`.focus()`, `.select()`).
   - Berfungsi mulus di Android Chrome, iOS Safari, dan desktop browser.
3. **Fitur Enter-to-Save:**
   - Menghubungkan event `onKeyDown` (key: `Enter`) pada input teks/angka ke `form.requestSubmit()`.
   - Mengizinkan penyimpanan instan melalui tombol Done/Enter keyboard virtual maupun Enter keyboard fisik.
4. **Smart Viewport Auto-Scroll:**
   - Mengaktifkan `e.target.scrollIntoView({ behavior: "smooth", block: "center" })` pada event `onFocus` seluruh input.
5. **Validasi Relasional Relasional & Batas Angka:**
   - Mengintegrasikan `validateToaPair(toaShift1, effectiveTotalToa)` pada proses validasi submit formulir.
   - Memastikan Total TOA tidak boleh lebih kecil dari TOA Shift 1.
6. **Pembersihan Banner Duplikat di Header List:**
   - Menghapus banner shift lock yang redundan dari `BusListHeader.tsx`, memusatkan reminder shift pada `DashboardStatusBanners.tsx`.
   - Memastikan `BusListProgressBar` (Hairline 3px) selalu tampil persisten.
7. **Standar Kamus Teks Sentral (`src/constants/texts/`):**
   - Menambahkan kunci kamus baru (`SWITCH_TO_FULL_FORM`, `SWITCH_TO_SINGLE_FOCUS`, `REF_KM_AWAL`) ke `text_alerts.ts` tanpa string antarmuka hardcoded.
8. **Dekomposisi God-File (`BusInputModal.tsx` 1.084 Baris ➔ 269 Baris):**
   - Memecah monolit menjadi subfolder `src/components/busCard/modal/`:
     - `useBusInputForm.ts` (UX state, live calculation, validasi, dan submit)
     - `BusInputModalHeader.tsx` (header bar, badge, toggle alih mode)
     - `BusInputModalTabs.tsx` (4 segmented navigation tabs)
     - `BusInputModalSingleFocus.tsx` (tampilan single focus speed-run)
     - `BusInputModalShift1.tsx`, `BusInputModalShift2.tsx`, `BusInputModalTrip.tsx`, `BusInputModalNotes.tsx` (tab presentational)
     - `BusInputModalFooter.tsx` (footer buttons)
   - Seluruh sub-komponen dirancang ramping dan hanya menerima objek `form`, menjaga `BusInputModal.tsx` tetap sangat bersih dan deklaratif (hanya 269 baris).

---

## 🔄 Perbandingan Before vs After

| Aspek | Sebelum Perbaikan (Before) | Sesudah Perbaikan (After) |
|---|---|---|
| **Arsitektur File Modal** | `BusInputModal.tsx` monolitik sebesar 1.084 baris (God-File). | Dipecah bersih menjadi `modal/` + orkestrator ramping hanya 269 baris. |
| **Filter Kategori Tertentu** | Selalu membuka modal 4 tab penuh terlepas dari kolom yang difilter. | Membuka mode Single-Column Focus yang ringkas, dengan opsi toggle `[Semua Kolom]` di header. |
| **Fokus & Seleksi Input** | Kotak input tidak fokus otomatis; angka lama harus dihapus manual tombol backspace. | Autofocus langsung aktif dalam 60ms dan angka lama terblok terseleksi; ketikan angka baru langsung menimpa. |
| **Menyimpan Formulir** | Wajib tap tombol "Simpan Data" di bagian bawah layar. | Cukup tekan "Enter" atau "Done" di keyboard virtual/fisik, form langsung tersimpan. |
| **Visibilitas saat Keyboard Terbuka** | Input sering terhalang keyboard virtual di layar kecil 360–400px. | Smart Auto-Scroll memusatkan input ke tengah viewport saat fokus didapatkan. |
| **Validasi Relasional TOA** | `validateToaPair` tidak dipanggil, Total TOA bisa lebih kecil dari TOA S1. | Terintegrasi penuh; form memblokir submit jika Total TOA < TOA S1 dengan peringatan ramah. |
| **Banner Shift Lock** | Tampil ganda (di dashboard dan di header list bus), menutupi ruang vertikal. | Hanya 1 banner terpusat di dashboard; header list bersih dan progress bar selalu tampil. |

---

## 🎯 Case: Skenario Lapangan

### Skenario 1: Operator Melakukan Speed-Run Pengisian TOA Shift 1 untuk 20 Bus
- **Kondisi:** Operator di pool mengaktifkan filter kolom `TOA S1` dan menyalakan Mode Satset.
- **Alur Sebelumnya:** Modal terbuka dalam formulir 4 tab penuh, operator harus tap kotak TOA S1, backspace angka lama, ketik angka baru, lalu scroll ke bawah untuk tap tombol "Simpan Data", menunggu modal menutup, lalu tap bus berikutnya.
- **Alur Sesudah Perbaikan:**
  1. Operator tap bus pertama.
  2. Modal terbuka langsung dalam mode Single-Column `TOA Shift 1`, keyboard virtual langsung muncul dengan angka lama terseleksi.
  3. Operator mengetik angka baru (misal: `165`) dan langsung menekan tombol "Enter" di keyboard.
  4. Data tersimpan, modal tertutup, dan Mode Satset langsung membuka modal bus berikutnya dengan keyboard tetap siap menerima input. Proses pengisian 20 bus selesai dalam waktu kurang dari 1 menit.

### Skenario 2: Operator Memasukkan Unit yang Memiliki Tiket Manual atau Catatan
- **Kondisi:** Saat sedang speed-run, bus memiliki tiket manual darurat.
- **Alur:** Operator cukup tap chip `+ Manual S1` tanpa perlu beralih ke form penuh. Kotak tiket manual muncul di bawahnya, operator memasukkan angka, lalu tekan Enter untuk menyimpan.

### Skenario 3: Pencegahan Salah Input Angka TOA
- **Kondisi:** Operator salah memasukkan angka Total TOA `120`, padahal TOA Shift 1 bernilai `150`.
- **Alur:** Sistem langsung menampilkan kotak peringatan merah *"Total TOA (120) tidak boleh lebih kecil dari TOA Shift 1 (150)"* dan memblokir pengiriman ke spreadsheet, menjaga integritas SSOT.

---

## 🛡️ Status Verifikasi & Quality Gates

1. **Unit Test Suite:**
   - Perintah: `pnpm vitest run src/`
   - Hasil: **54 test files passed, 406 tests passed (100% lulus)**
2. **Typecheck & Production Build:**
   - Perintah: `pnpm run build` (`tsc -b && vite build`)
   - Hasil: **Lulus 0 error (Vite build 672ms, PWA dist verified)**
3. **Graf Pengetahuan:**
   - Perintah: `graphify update .`
   - Hasil: **Rebuilt: 3765 nodes, 4880 edges terbarukan**
