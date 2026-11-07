# AUDIT TEMUAN INDIKATOR FOKUS INPUT: REFACTOR 213
**Modul:** Gaya global form (`src/styles/components/actions.css`, `src/styles/components/forms.css`, `src/index.css`), input fokus tunggal (`singleFocusStyles.ts`), dan input inline di beberapa komponen.
**Fokus Masalah:** Kolom input menampilkan dua cincin biru menyala sekaligus saat kursor aktif (border biru + outline biru berjarak), sebagian bahkan tiga lapis atau memakai glow hijau di luar palet; di sisi lain beberapa kolom kehilangan indikator fokus sama sekali karena `outline: none` inline.

---

### ID Temuan: BUG-FOCUS-213-01
- **Lokasi Kode:** `src/index.css` (`.input-field:focus`), `src/styles/components/forms.css` (`.ui-input:focus`), `src/styles/components/actions.css` (`:where(... input, select, textarea ...):focus-visible`)
- **Keparahan:** Medium (cacat visual di semua form yang memakai kelas bersama; tidak merusak data)
- **Deskripsi:** Saat fokus, border kolom diganti warna `--color-focus-ring` dan pada saat yang sama outline 2px warna yang sama digambar di luar border dengan jarak 1px (`.input-field`) atau 2px (aturan global untuk `.ui-input`). Hasilnya dua garis biru sejajar dengan celah di antaranya.
- **Dampak User:** Kolom aktif terlihat berbingkai ganda "neon", terutama di mode gelap (`#7DD3FC`); tampilan terasa tidak rapi dan tidak konsisten antar halaman.
- **Mitigasi:** Satu aturan fokus khusus kolom teks di `forms.css`: `outline: 2px` dengan `outline-offset: -2px` sehingga cincin menimpa border (satu cincin). Aturan `:focus` lama yang mengubah border dihapus.

### ID Temuan: BUG-FOCUS-213-02
- **Lokasi Kode:** `src/components/busCard/modal/singleFocus/singleFocusStyles.ts` (`singleFocusPrimaryInputStyle`)
- **Keparahan:** Medium (terjadi di alur input utama petugas: mode fokus tunggal KM/TOA/Trip)
- **Deskripsi:** Input utama mode fokus tunggal selalu berborder `1.5px solid var(--accent-color)` (biru), baik fokus maupun tidak. Ketika fokus, outline global 2px berjarak 2px ditambahkan sehingga muncul dua cincin biru. Karena border sudah biru sebelum fokus, perubahan status fokus juga tidak tegas.
- **Dampak User:** Petugas melihat dua bingkai biru menyala saat mengetik KM; sulit membedakan kolom yang sedang aktif dari yang tidak.
- **Mitigasi:** Border saat tidak fokus memakai `var(--color-border-control)` (netral); biru hanya muncul dari cincin fokus tunggal.

### ID Temuan: BUG-FOCUS-213-03
- **Lokasi Kode:** `src/index.css` (`.pdo-swal-input:focus, .pdo-swal-select:focus`, `.swal-bus-input-container input:focus`)
- **Keparahan:** Medium (dialog SweetAlert untuk manajemen pengguna dan input bus massal)
- **Deskripsi:** `.pdo-swal-input:focus` memasang border biru + outline berjarak 1px + `box-shadow` 3px (tiga lapis). `.swal-bus-input-container input:focus` memasang glow `rgba(62, 207, 142, 0.25)` (hijau Supabase, di luar palet brand). Selain itu SweetAlert2 bawaan mematikan outline dan memasang glow `box-shadow` sendiri pada kolom fokus.
- **Dampak User:** Indikator fokus di dialog berbeda-beda (biru tiga lapis, hijau, atau glow abu-biru SweetAlert) dibanding form lain.
- **Mitigasi:** Satu override `div:where(.swal2-container) :is(input…, select, textarea):focus` dengan `box-shadow: none` dan cincin tunggal yang sama (`outline-offset: -2px`). Kedua aturan lama dihapus.

### ID Temuan: BUG-FOCUS-213-04
- **Lokasi Kode:** `src/components/monitoring/MonthlySyncModal.tsx` (input URL & nama tab), `src/components/monitoring/tabs/MonitoringRoutesTab.tsx` (input pencarian rute), `src/components/userManagement/UserManagementFilters.tsx` (input pencarian pengguna), `src/components/userManagement/UserCardItem.tsx` (tombol switch status aktif)
- **Keparahan:** High (pelanggaran WCAG 2.4.7 — fokus tidak terlihat sama sekali)
- **Deskripsi:** Style inline `outline: 'none'` mengalahkan aturan fokus global, sehingga kolom/tombol tersebut tidak punya indikator fokus apa pun (border juga tidak berubah).
- **Dampak User:** Pengguna keyboard/pembaca layar dan petugas yang memakai keyboard eksternal tidak tahu elemen mana yang aktif; risiko salah ketik ke kolom yang salah.
- **Mitigasi:** Hapus `outline: 'none'` inline sehingga cincin fokus standar berlaku. Tambah test kontrak yang melarang `outline: none` di TSX kecuali file yang dikecualikan dengan alasan jelas.

### ID Temuan: BUG-FOCUS-213-05
- **Lokasi Kode:** `src/components/pageManagement/UserPickerModal.tsx` (pencarian pengguna), `src/components/routeSelector/AddRouteModal.tsx` (kolom kode rute berprefiks "JAK.")
- **Keparahan:** Low (pola kolom-dalam-pembungkus; satu tanpa indikator, satu berpotensi cincin di dalam bingkai)
- **Deskripsi:** Kolom tanpa border berada di dalam pembungkus berbingkai. Di UserPickerModal kolom memakai `outline: none` tanpa pengganti (tidak ada indikator fokus). Di AddRouteModal, setelah aturan baru, cincin akan tergambar di dalam bingkai pembungkus (bingkai di dalam bingkai).
- **Dampak User:** Fokus tidak terlihat (UserPickerModal) atau terlihat sebagai dua bingkai bertumpuk (AddRouteModal).
- **Mitigasi:** Kelas `.ui-input-group` dengan `:focus-within` menggambar cincin tunggal pada pembungkus; kolom di dalamnya tetap `outline: none`.
