# REPAIR REPORT: REFACTOR 213
**Modul:** Indikator fokus input (CSS global form, input fokus tunggal, dialog SweetAlert, input inline)
**Tanggal:** 07 November 2026
**Status:** Selesai — 4 quality gate lulus

---

## 1. Implementasi Perbaikan

### A. Aturan cincin fokus tunggal untuk kolom teks (`src/styles/components/forms.css`)
- Menambah aturan `:is(input:not([type="checkbox"], [type="radio"], [type="range"], [type="button"], [type="submit"], [type="reset"], [type="file"], [type="color"]), select, textarea):focus-visible` dengan `outline: 2px solid var(--color-focus-ring)` dan `outline-offset: -2px`. Outline digambar di dalam tepi kotak sehingga menutupi border: hanya satu cincin.
- Memakai `:is()` (spesifisitas 0,2,1) agar mengalahkan aturan global `:where(...):focus-visible` (0,1,0) di `actions.css` tanpa `!important`.
- Menambah `.ui-input-group:focus-within` untuk pola kolom tanpa border di dalam pembungkus berbingkai.
- Menambah dukungan `forced-colors` (warna `Highlight`) untuk kedua aturan.
- Menghapus `.ui-input:focus { border-color }`.

### B. Aturan fokus global (`src/styles/components/actions.css`)
- Selektor tetap mencakup tombol, tautan, checkbox/radio, dan elemen ber-`tabindex` (outline berjarak 2px). Kolom teks kini ditimpa aturan A; komentar diperbarui.

### C. Pembersihan aturan lama (`src/index.css`)
- Menghapus `.input-field:focus` (border biru + outline berjarak 1px).
- Mengganti `.pdo-swal-input:focus, .pdo-swal-select:focus` (border + outline + box-shadow 3px) dengan satu override `div:where(.swal2-container) :is(input…, select, textarea):focus` yang mematikan glow bawaan SweetAlert2 (`box-shadow: none !important`) dan memakai cincin tunggal yang sama.
- Menghapus `.swal-bus-input-container input:focus` (glow hijau `rgba(62, 207, 142, 0.25)`).

### D. Input fokus tunggal (`src/components/busCard/modal/singleFocus/singleFocusStyles.ts`)
- Border `singleFocusPrimaryInputStyle` dari `1.5px solid var(--accent-color, #38bdf8)` menjadi `1.5px solid var(--color-border-control)`.

### E. Penghapusan `outline: none` yang menghilangkan fokus
- `MonthlySyncModal.tsx` (2 input), `MonitoringRoutesTab.tsx` (pencarian rute), `UserManagementFilters.tsx` (pencarian pengguna), `UserCardItem.tsx` (tombol switch status).

### F. Pola kolom dalam pembungkus
- `UserPickerModal.tsx`: pembungkus pencarian diberi `className="ui-input-group"`.
- `AddRouteModal.tsx`: pembungkus prefiks "JAK." diberi `className="ui-input-group"`, kolom di dalamnya `outline: 'none'`.

### G. Test kontrak (`src/styles/components/focus-ring.test.ts`, baru)
- 7 test: keberadaan aturan cincin tunggal, aturan global tetap menjaga tombol/checkbox, aturan lama sudah dihapus, override SweetAlert, border netral input fokus tunggal, larangan `outline: none` di TSX kecuali `ModalShell.tsx` (wadah dialog `tabIndex=-1`) dan dua file berpola `.ui-input-group`.

## 2. Before vs After

| Aspek | Before | After |
|---|---|---|
| `.input-field` saat fokus | Border biru + outline biru berjarak 1px (2 cincin) | 1 cincin 2px menimpa border |
| `.ui-input` saat fokus | Border biru + outline global berjarak 2px (2 cincin) | 1 cincin 2px menimpa border |
| Input fokus tunggal (KM/TOA/Trip) | Border biru selalu + outline berjarak 2px saat fokus | Border netral; 1 cincin biru hanya saat fokus |
| `.pdo-swal-input` saat fokus | Border + outline + box-shadow 3px (3 lapis) | 1 cincin, tanpa glow |
| Input di `.swal-bus-input-container` | Glow hijau `#3ECF8E` 25% | 1 cincin biru token fokus |
| `swal2-input` bawaan SweetAlert | `outline: none` + glow box-shadow bawaan | 1 cincin, glow dimatikan |
| Input sinkron bulanan, pencarian rute, pencarian pengguna, switch status | Tidak ada indikator fokus (`outline: none`) | Cincin fokus standar |
| Pencarian UserPickerModal | Tidak ada indikator fokus | Cincin di pembungkus via `:focus-within` |
| Kolom "JAK." AddRouteModal | (Dengan aturan baru) cincin di dalam bingkai pembungkus | Cincin di pembungkus via `:focus-within` |
| Penjaga regresi | Tidak ada | `focus-ring.test.ts` (7 test) |

## 3. Case: Skenario Lapangan

### Case BUG-FOCUS-213-01: Form tambah rute dan akumulasi
- **Situasi:** Korlap membuka form tambah rute atau pemilih periode akumulasi lalu mengetuk kolom.
- **Before:** Kolom tampil dengan dua garis biru sejajar berjarak; di mode gelap tampak seperti bingkai neon ganda.
- **After:** Kolom tampil dengan satu bingkai biru 2px yang rapi.

### Case BUG-FOCUS-213-02: Mengisi KM akhir di mode fokus tunggal
- **Situasi:** PDO mengisi KM akhir shift 1 lewat mode fokus tunggal di HP, malam hari dengan mode gelap.
- **Before:** Kolom KM selalu berbingkai biru; saat diketuk muncul bingkai biru kedua di luarnya (dua cincin `#7DD3FC`).
- **After:** Kolom berbingkai abu netral; saat diketuk hanya satu bingkai biru, sehingga jelas kolom mana yang aktif.

### Case BUG-FOCUS-213-03: Dialog SweetAlert (tambah pengguna, input bus massal)
- **Situasi:** Admin menambah pengguna lewat dialog, atau korlap mengisi data massal di dialog input bus.
- **Before:** Kolom fokus tampil tiga lapis (border, outline, bayangan) atau dengan glow hijau yang berbeda dari form lain.
- **After:** Semua kolom dialog memakai cincin tunggal yang sama dengan form lain.

### Case BUG-FOCUS-213-04: Navigasi keyboard di modal sinkron bulanan & manajemen pengguna
- **Situasi:** Superadmin memakai laptop dan berpindah kolom dengan tombol Tab saat menempel URL spreadsheet bulanan, atau menyalakan/mematikan status pengguna.
- **Before:** Tidak ada penanda kolom/tombol yang aktif; teks bisa terketik ke kolom yang salah tanpa disadari.
- **After:** Kolom dan switch yang aktif menampilkan cincin fokus.

### Case BUG-FOCUS-213-05: Mencari pengguna dan mengetik kode rute "JAK."
- **Situasi:** Superadmin mencari pengguna di pemilih pengguna halaman, atau admin mengetik akhiran kode rute setelah prefiks "JAK.".
- **Before:** Pencarian pengguna tanpa penanda fokus; kolom kode rute berisiko menampilkan bingkai di dalam bingkai.
- **After:** Seluruh pembungkus (ikon cari/prefiks + kolom) menampilkan satu cincin fokus.

## 4. Verifikasi

1. `pnpm vitest run src/styles/tokens/color-contract.test.ts` — 1 file, **158/158 test lulus**.
2. `pnpm vitest run src/` — **141 file, 1343/1343 test lulus** (termasuk `focus-ring.test.ts` 7/7; sebelum perbaikan 7/7 gagal).
3. `pnpm run build` — `tsc -b` + Vite build **exit 0**; PWA precache 446 entri (hanya peringatan ukuran chunk yang sudah ada sebelumnya).
4. `graphify update .` — graf diperbarui: 7903 node, 13501 edge, 646 komunitas.

Verifikasi visual (dev server, halaman uji sementara yang disuntik lewat browser, dihapus setelahnya):
- Mode gelap: `.input-field`, input fokus tunggal, dan pembungkus `.ui-input-group` diklik — masing-masing satu cincin `rgb(125, 211, 252)`, `outline-offset: -2px`, `box-shadow: none`.
- Mode terang: dialog SweetAlert dengan `swal2-input` bawaan, `.pdo-swal-input`, dan input di `.swal-bus-input-container` — masing-masing satu cincin `rgb(3, 105, 161)`, `outline-offset: -2px`; glow bawaan SweetAlert bertransisi ke transparan.
- Belum diverifikasi di layar aplikasi sungguhan (butuh login Google) dan di perangkat iOS/Android fisik.
