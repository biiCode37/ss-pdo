# Audit Bugs: Revisi Kontras & Errata Single Focus (Fase 3 Batch 3.4)

Dokumen ini mencatat audit temuan teknis dan kepatuhan WCAG pada modul Single Focus (`refactor-ss-pdo/refact_119`).

---

## Daftar Temuan

### 1. ID: R118-01
- **Lokasi Kode:**
  - `src/index.css` (`:root` dan `[data-theme="light"]`)
  - `src/components/busCard/modal/singleFocus/singleFocusStyles.ts` (`getSingleFocusChipStyle`, `singleFocusCopyBtnStyle`)
  - `src/components/busCard/modal/singleFocus/SingleFocusKmRolloverBanner.tsx`
  - `src/components/busCard/modal/singleFocus/SingleFocusKmShift1.tsx`
- **Keparahan:** Medium (Aksesibilitas & UI/UX Kontras Rendah)
- **Deskripsi:**
  1. Tombol aksi pada banner rollover (`SingleFocusKmRolloverBanner`) sebelumnya menggunakan warna teks default atau pewarnaan yang kurang kontras di atas latar belakang peringatan `--warning-color` (`#d97706` pada Light Mode dan `#f59e0b` pada Dark Mode).
  2. Chip aktif dan tombol salin Shift 1 pada `singleFocusStyles.ts` sebelumnya di-hardcode dengan warna `#0284c7`. Di atas permukaan terang/putih komposit (`rgba(2, 132, 199, 0.12)` di atas `#ffffff` $\approx$ `rgb(225, 240, 248)`), warna `#0284c7` hanya menghasilkan rasio kontras **3.51:1** (dan **4.10:1** pada putih murni), yang berada di bawah ambang batas minimum WCAG AA sebesar **4.5:1** untuk teks ukuran kecil/normal.
- **Dampak User:**
  - Pengawas dan petugas operasional di lapangan yang menggunakan perangkat ponsel di bawah sinar matahari langsung (lingkungan lapangan terang) kesulitan membaca teks tombol salin dan chip aktif Shift 1, serta tombol terapkan saran rollover.
- **Mitigasi:**
  - Tambahkan token semantik terdedikasi di `src/index.css`:
    - `--warning-btn-text`: bernilai `#0f172a` (gelap dengan kontras tinggi) baik pada Light Mode maupun Dark Mode, menghasilkan rasio kontras **5.60:1** pada Light Mode (`#d97706`) dan **8.31:1** pada Dark Mode (`#f59e0b`).
    - `--shift1-action-text`: bernilai `#0369a1` pada `[data-theme="light"]` (menghasilkan kontras **5.09:1** di atas background komposit dan **5.93:1** di atas putih) serta `#38bdf8` pada Dark Mode (menghasilkan kontras **6.76:1** pada background komposit gelap dan **8.33:1** pada dark mode murni).
  - Terapkan token semantik ini ke `singleFocusStyles.ts`, `SingleFocusKmRolloverBanner.tsx`, dan `SingleFocusKmShift1.tsx`.

---

### 2. ID: R116-04 (Koreksi Narasi & Batasan Perilaku)
- **Lokasi Kode:**
  - Laporan revisi sebelumnya (`refact_117/REPAIR_REPORT.md`)
  - `src/components/busCard/modal/useBusInputForm.ts` (`handleCopyKmAkhir1ToAwal2`)
- **Keparahan:** Low (Errata Dokumentasi & Klarifikasi Semantik Interaksi)
- **Deskripsi:**
  - Pada laporan revisi `refact_117`, terdapat klaim bahwa interaksi klik tombol salin Shift 1 (`Salin KM S1`) pasti mempertahankan fokus aktif pada input target `kmAwal2` sehingga pengguna dapat langsung menekan tombol *Enter* pada keyboard fisik/virtual untuk menyimpan data (*Enter-to-Save*).
  - Faktanya, implementasi `handleCopyKmAkhir1ToAwal2` hanya menyalin nilai state React (`setKmAwal2(kmAkhir1)`). Ketika tombol `[Salin KM S1]` di-klik, fokus browser berpindah ke elemen tombol itu sendiri, bukan ke elemen input `kmAwal2`. Oleh karena itu, Enter-to-Save otomatis setelah klik tombol tidak dijamin kecuali input di-tap kembali secara eksplisit oleh pengguna.
  - Selain itu, narasi sebelumnya menyebut "screenshot visual" padahal verifikasi dilakukan melalui analisis DOM render Vitest/headless script tanpa snapshot rendering browser perangkat riil.
- **Dampak User:**
  - Potensi kesalahpahaman ekspektasi interaksi keyboard bagi pengguna atau tim pengembang yang mengira input langsung siap menerima ketukan tombol Enter tanpa penekanan input lanjutan.
- **Mitigasi:**
  - Buat errata formal dan koreksi narasi di laporan `refact_119/REPAIR_REPORT.md`.
  - Catat batasan teknis perilaku aktual secara transparan: tombol salin bertindak sebagai pemutakhiran state cepat (_one-tap state updater_), dan pengguna tetap memegang kendali fokus tanpa pemaksaan fokus DOM tiruan yang dapat memicu keyboard virtual berguncang pada peranti sentuh mobile.
  - Dokumentasikan ukuran baris fisik file secara presisi dari eksekusi script file system.
